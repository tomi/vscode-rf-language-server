import * as _ from "lodash";

import {
  DataTable,
  DataRow
} from "./table-models";

import {
  TestCasesTable,
  TestCase,
  Step,
  CallExpression
} from "./models";

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
      const step = parseStep(row);
      currentTestCase.addStep(step);
    }
  });

  return testCasesTable;
}

function startsTestCase(row: DataRow) {
  return !row.first().isEmpty();
}
