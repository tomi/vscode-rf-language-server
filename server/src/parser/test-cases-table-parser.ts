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

function parseStep(row: DataRow) {
  // TODO: Variable parsing. Now assumes all are call expressions
  const identifier = parseIdentifier(row.getCellByIdx(1));
  const valueExpressions = row.getCellsByRange(2).map(parseValueExpression);

  return new Step(
    new CallExpression(identifier, valueExpressions, row.location),
    row.location
  );
}
