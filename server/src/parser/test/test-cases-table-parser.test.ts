import * as _ from "lodash";
import * as chai from "chai";

import { parseTestCasesTable } from "../test-cases-table-parser";
import {
  TestCasesTable,
  TestCase,
  Step
} from "../models";

import {
  position,
  location,
  table,
  row,
  cell
} from "./test-helper";

function parseAndAssert(tableDefinition, expected) {
  const actual = parseTestCasesTable(tableDefinition);

  chai.assert.deepEqual(actual, expected);
}

function testCasesTable(location, testCases) {
  return Object.assign(new TestCasesTable(location), { testCases });
}

function testCase(startPosition, name, steps) {
  return Object.assign(new TestCase(name, startPosition), { steps });
}

describe("Parsing Test Cases table", () => {

  it("should skip invalid data", () => {
    const tableDefinition = table("Test Cases", {
      header: row(location(0, 0, 0, 10)),
      rows: [
        row(location(1, 0, 1, 10), [
          cell(location(2, 0, 2, 10), ""),
          cell(location(1, 0, 1, 10), "not a test case"),
          cell(location(1, 0, 1, 10), "cell2")
        ]),
        row(location(2, 0, 2, 10), [
          cell(location(2, 0, 2, 10), ""),
          cell(location(2, 0, 2, 10), "!another invalid"),
          cell(location(2, 0, 2, 10), "data")
        ]),
      ]
    });

    const expected = testCasesTable(location(0, 0, 2, 10), []);

    parseAndAssert(tableDefinition, expected);
  });

  // it("should parse test case", () => {
  //   const tableDefinition = table("Test Cases", {
  //     header: row(location(0, 0, 0, 10)),
  //     rows: [
  //       row(location(1, 0, 1, 10), [cell(location(1, 0, 1, 10), "Test Case Name")]),
  //       row(location(2, 0, 2, 10), [
  //         cell(location(2, 0, 2, 10), ""),
  //         cell(location(2, 0, 2, 10), "Step 1"),
  //         cell(location(2, 0, 2, 10), "arg1"),
  //         cell(location(2, 0, 2, 10), "arg2"),
  //       ]),
  //       row(location(3, 0, 3, 10), [
  //         cell(location(3, 0, 3, 10), ""),
  //         cell(location(3, 0, 3, 10), "Step 2"),
  //         cell(location(3, 0, 3, 10), "${VAR}"),
  //         cell(location(3, 0, 3, 10), "more complex arg"),
  //       ]),
  //     ]
  //   });

  //   const expected = testCasesTable(location(0, 0, 3, 10), [
  //     testCase(position(1, 0), "Test Case Name", [
  //       new Step("Step 1", ["arg1", "arg2"], location(2, 0, 2, 10)),
  //       new Step("Step 2", ["${VAR}", "more complex arg"], location(3, 0, 3, 10)),
  //     ])
  //   ]);

  //   parseAndAssert(tableDefinition, expected);
  // });

});
