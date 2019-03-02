import * as _ from "lodash";

import { TableRowIterator } from "./row-iterator";
import { DataTable, DataRow, DataCell } from "./table-models";

import {
  KeywordsTable,
  UserKeyword,
  SettingDeclaration,
  NamespacedIdentifier,
} from "./models";

import * as SettingParser from "./setting-parser";

import { parseIdentifier } from "./primitive-parsers";

import { parseStep } from "./function-parsers";

const keywordSettings = new Set([
  "[Documentation]",
  "[Arguments]",
  "[Return]",
  "[Teardown]",
  "[Tags]",
  "[Timeout]",
]);

export function parseKeywordsTable(
  dataTable: DataTable,
  namespace: string
): KeywordsTable {
  const keywordsTable = new KeywordsTable(dataTable.location);
  let currentKeyword: UserKeyword;

  const iterator = new TableRowIterator(dataTable);
  while (!iterator.isDone()) {
    const row = iterator.takeRow();
    if (row.isEmpty()) {
      continue;
    }

    if (startsKeyword(row)) {
      const identifier = parseIdentifier(row.first());
      const namespacedIdentifier = new NamespacedIdentifier(
        namespace,
        identifier.name,
        identifier.location
      );

      currentKeyword = new UserKeyword(
        namespacedIdentifier,
        row.location.start
      );
      keywordsTable.addKeyword(currentKeyword);
    } else if (currentKeyword) {
      const firstRowDataCells = row.getCellsByRange(1);
      const continuedRows = iterator.takeRowWhile(rowContinues);
      const continuedCells = joinRows(continuedRows);
      const [firstCell, ...restCells] = firstRowDataCells.concat(
        continuedCells
      );

      if (keywordSettings.has(firstCell.content)) {
        const setting = SettingParser.parseSetting(firstCell, restCells);

        setKeywordSetting(currentKeyword, setting);
        currentKeyword.location.end = setting.location.end;
      } else {
        const step = parseStep(firstCell, restCells);
        currentKeyword.addStep(step);
        currentKeyword.location.end = step.location.end;
      }
    }
  }

  return keywordsTable;
}

function startsKeyword(row: DataRow) {
  return !row.first().isEmpty();
}

function rowContinues(row: DataRow) {
  return row.isRowContinuation({
    requireFirstEmpty: true,
  });
}

function joinRows(rows: DataRow[]): DataCell[] {
  const shouldTakeCell = (cell: DataCell) => !cell.isRowContinuation();

  return rows.reduce((allCells, row) => {
    const rowCells = _.takeRightWhile(row.cells, shouldTakeCell);

    return allCells.concat(rowCells);
  }, []);
}

function setKeywordSetting(keyword: UserKeyword, setting: SettingDeclaration) {
  if (SettingParser.isDocumentation(setting)) {
    keyword.documentation = setting;
  } else if (SettingParser.isArguments(setting)) {
    keyword.arguments = setting;
  } else if (SettingParser.isReturn(setting)) {
    keyword.return = setting;
  } else if (SettingParser.isTimeout(setting)) {
    keyword.timeout = setting;
  } else if (SettingParser.isTeardown(setting)) {
    keyword.teardown = setting;
  } else if (SettingParser.isTags(setting)) {
    keyword.tags = setting;
  }
}
