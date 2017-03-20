import * as _ from "lodash";

import {
  DataTable,
  DataRow
} from "./table-models";

import {
  TestCasesTable,
  TestCase,
  Step,
  CallExpression,
  SettingDeclaration
} from "./models";

import * as SettingParser from "./setting-parser";

import {
  parseIdentifier,
  parseValueExpression,
} from "./primitive-parsers";

import {
  isVariable,
  parseTypeAndName,
  parseVariableDeclaration
} from "./variable-parsers";

import { parseStep } from "./function-parsers";

const testCaseSettings = new Set([
  "[Documentation]", "[Teardown]", "[Tags]", "[Timeout]", "[Setup]"
  // TODO: Not implemented yet "[Template]"
]);

export function parseTestCasesTable(dataTable: DataTable): TestCasesTable {
  const testCasesTable = new TestCasesTable(dataTable.location);
  let currentTestCase: TestCase;

  dataTable.rows.forEach(row => {
    if (row.isEmpty()) {
      return;
    }

    if (startsTestCase(row)) {
      const identifier = parseIdentifier(row.first());

      currentTestCase = new TestCase(identifier, row.location.start);
      testCasesTable.addTestCase(currentTestCase);
    } else if (currentTestCase) {
      const firstDataCell = row.getCellByIdx(1);

      if (testCaseSettings.has(firstDataCell.content)) {
        const otherDataCells = row.getCellsByRange(2);
        const setting = SettingParser.parseSetting(firstDataCell, otherDataCells);

        setTestCaseSetting(currentTestCase, setting);
        currentTestCase.location.end = setting.location.end;
      } else {
        const step = parseStep(row);
        currentTestCase.addStep(step);
        currentTestCase.location.end = step.location.end;
      }
    }
  });

  return testCasesTable;
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
