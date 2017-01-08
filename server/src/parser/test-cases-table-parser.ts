import * as _ from "lodash";

import {
  DataTable,
  DataRow
} from "./table-models";

import {
  TestCasesTable,
  TestCase,
  Step
} from "./models";

export function parseTestCasesTable(dataTable: DataTable): TestCasesTable {
  const testCasesTable = new TestCasesTable(dataTable.location);
  let currentTestCase: TestCase;

  dataTable.rows.forEach(row => {
    if (row.isEmpty()) {
      return;
    }

    if (startsTestCase(row)) {
      const keywordName = row.first().content;

      currentTestCase = new TestCase(keywordName, row.location.start);
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
  const stepName = row.getCellByIdx(1).content;
  const stepArgs = row.getCellsByRange(2).map(cell => cell.content);

  return new Step(stepName, stepArgs, row.location);
}
