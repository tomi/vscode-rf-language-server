import * as _ from "lodash";

import { TableRowIterator } from "./row-iterator";
import { DataTable, DataRow, DataCell } from "./table-models";

import { TestCasesTable, TestCase, SettingDeclaration } from "./models";

import * as SettingParser from "./setting-parser";

import { parseIdentifier } from "./primitive-parsers";

import { parseStep } from "./function-parsers";

const testCaseSettings = new Set([
  "[Documentation]",
  "[Teardown]",
  "[Tags]",
  "[Timeout]",
  "[Setup]",
  // TODO: Not implemented yet "[Template]"
]);

export function parseTestCasesTable(dataTable: DataTable): TestCasesTable {
  const testCasesTable = new TestCasesTable(dataTable.location);
  let currentTestCase: TestCase;

  const iterator = new TableRowIterator(dataTable);
  while (!iterator.isDone()) {
    const row = iterator.takeRow();
    if (row.isEmpty()) {
      continue;
    }

    if (startsTestCase(row)) {
      const identifier = parseIdentifier(row.first());

      currentTestCase = new TestCase(identifier, row.location.start);
      testCasesTable.addTestCase(currentTestCase);
    } else if (currentTestCase) {
      const firstRowDataCells = row.getCellsByRange(1);
      const continuedRows = iterator.takeRowWhile(rowContinues);
      const continuedCells = joinRows(continuedRows);
      const [firstCell, ...restCells] = firstRowDataCells.concat(
        continuedCells
      );

      if (testCaseSettings.has(firstCell.content)) {
        const setting = SettingParser.parseSetting(firstCell, restCells);

        setTestCaseSetting(currentTestCase, setting);
        currentTestCase.location.end = setting.location.end;
      } else {
        const step = parseStep(firstCell, restCells);
        currentTestCase.addStep(step);
        currentTestCase.location.end = step.location.end;
      }
    }
  }

  return testCasesTable;
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

function setTestCaseSetting(testCase: TestCase, setting: SettingDeclaration) {
  if (SettingParser.isDocumentation(setting)) {
    testCase.documentation = setting;
  } else if (SettingParser.isTimeout(setting)) {
    testCase.timeout = setting;
  } else if (SettingParser.isSetup(setting)) {
    testCase.setup = setting;
  } else if (SettingParser.isTeardown(setting)) {
    testCase.teardown = setting;
  } else if (SettingParser.isTags(setting)) {
    testCase.tags = setting;
  }
}

function startsTestCase(row: DataRow) {
  return !row.first().isEmpty();
}
