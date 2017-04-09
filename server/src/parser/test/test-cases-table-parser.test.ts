import * as _ from "lodash";
import * as chai from "chai";

import { FileParser } from "../parser";
const parser = new FileParser();

import {
  Identifier,
  CallExpression,
  Literal,
  TestCasesTable,
  VariableExpression,
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

function parseAndAssert(tableDefinition: string, expected: TestCasesTable) {
  const actual = parser.parseFile(tableDefinition).testCasesTable;

  chai.assert.deepEqual(actual, expected);
}

function testCasesTable(location, testCases) {
  return Object.assign(new TestCasesTable(location), { testCases });
}

function testCase(
  location,
  name: Identifier,
  steps: Step[],
  settings: any = {}
) {
  return Object.assign(
    new TestCase(name, location.start),
    { location },
    { steps },
    settings
  );
}

describe("Parsing Test Cases table", () => {

  it("should skip invalid data", () => {
    const data =
`*** Test Cases ***
    not a test case    cell2
    !another invalid   data
`;

    const expected = testCasesTable(location(0, 0, 3, 0), []);

    parseAndAssert(data, expected);
  });

  it("should parse steps", () => {
    const data =
`*** Test Cases ***
TestCas Name
    Step 1    arg1      arg2
    Step 2    \${VAR}    a longer arg2
`;

    const expected = testCasesTable(location(0, 0, 4, 0), [
      testCase(
        location(1, 0, 3, 37),
        new Identifier("TestCas Name", location(1, 0, 1, 12)),
        [
          new Step(
            new CallExpression(
              new Identifier("Step 1", location(2, 4, 2, 10)),
              [
                new Literal("arg1", location(2, 14, 2, 18)),
                new Literal("arg2", location(2, 24, 2, 28)),
              ],
              location(2, 4, 2, 28)
            ),
            location(2, 4, 2, 28)
          ),
          new Step(
            new CallExpression(
              new Identifier("Step 2", location(3, 4, 3, 10)),
              [
                new VariableExpression(
                  new Identifier("VAR", location(3, 16, 3, 19)),
                  "Scalar",
                  location(3, 14, 3, 20)
                ),
                new Literal("a longer arg2", location(3, 24, 3, 37)),
              ],
              location(3, 4, 3, 37)
            ),
            location(3, 4, 3, 37)
          ),
        ]
      )
    ]);

    parseAndAssert(data, expected);
  });

  it("should parse step from multiple lines", () => {
    const data =
`*** Test Cases ***
TestCas Name
    Step 1    arg1
    ...       arg2
`;

    const expected = testCasesTable(location(0, 0, 4, 0), [
      testCase(
        location(1, 0, 3, 18),
        new Identifier("TestCas Name", location(1, 0, 1, 12)),
        [
          new Step(
            new CallExpression(
              new Identifier("Step 1", location(2, 4, 2, 10)),
              [
                new Literal("arg1", location(2, 14, 2, 18)),
                new Literal("arg2", location(3, 14, 3, 18)),
              ],
              location(2, 4, 3, 18)
            ),
            location(2, 4, 3, 18)
          ),
        ]
      )
    ]);

    parseAndAssert(data, expected);
  });

});
