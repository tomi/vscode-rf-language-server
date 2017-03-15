import * as _ from "lodash";

import {
  DataTable,
  DataRow
} from "./table-models";

import {
  CallExpression,
  KeywordsTable,
  UserKeyword,
  Step,
  SettingDeclaration
} from "./models";

import * as SettingParser from "./setting-parser";

import {
  parseIdentifier,
  parseValueExpression,
} from "./primitive-parsers";

import { parseStep } from "./function-parsers";

const keywordSettings = new Set([
  "[Documentation]", "[Arguments]", "[Return]",
  "[Teardown]", "[Tags]", "[Timeout]"
]);

export function parseKeywordsTable(dataTable: DataTable): KeywordsTable {
  const keywordsTable = new KeywordsTable(dataTable.location);
  let currentKeyword: UserKeyword;

  dataTable.rows.forEach(row => {
    if (row.isEmpty()) {
      return;
    }

    if (startsKeyword(row)) {
      const identifier = parseIdentifier(row.first());

      currentKeyword = new UserKeyword(identifier, row.location.start);
      keywordsTable.addKeyword(currentKeyword);
    } else if (currentKeyword) {
      const firstDataCell = row.getCellByIdx(1);

      if (keywordSettings.has(firstDataCell.content)) {
        const otherDataCells = row.getCellsByRange(2);
        const setting = SettingParser.parseSetting(firstDataCell, otherDataCells);

        setKeywordSetting(currentKeyword, setting);
        currentKeyword.location.end = setting.location.end;
      } else {
        const step = parseStep(row);
        currentKeyword.addStep(step);
        currentKeyword.location.end = step.location.end;
      }

    }
  });

  return keywordsTable;
}

function startsKeyword(row: DataRow) {
  return !row.first().isEmpty();
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
