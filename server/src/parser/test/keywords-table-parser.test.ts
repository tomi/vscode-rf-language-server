import * as _ from "lodash";
import * as chai from "chai";

import { FileParser } from "../parser";
const parser = new FileParser();

import {
  KeywordsTable,
  UserKeyword,
  Step,
  CallExpression,
  Identifier,
  Literal,
  VariableExpression,
  VariableKind
} from "../models";

import {
  position,
  location,
  table,
  row,
  cell
} from "./test-helper";

function parseAndAssert(tableDefinition: string, expected: KeywordsTable) {
  const actual = parser.parseFile(tableDefinition).keywordsTable;

  chai.assert.deepEqual(actual, expected);
}

function keywordsTable(location, keywords) {
  return Object.assign(new KeywordsTable(location), { keywords });
}

function keyword(startPosition, name: Identifier, steps: Step[]) {
  return Object.assign(new UserKeyword(name, startPosition), { steps });
}

describe("Parsing Keywords table", () => {

  it("should skip invalid data", () => {
    const data =
`*** Keywords ***
    not a keyword   cell2
      !another invalid    data
`;
    const expected = keywordsTable(location(0, 0, 3, 0), []);

    parseAndAssert(data, expected);
  });

  it("should parse keyword", () => {
    const data =
`*** Keywords ***
Keyword Name
    Step 1    arg1      arg2
    Step 2    \${VAR}    a longer arg2
`;

    const expected = keywordsTable(location(0, 0, 4, 0), [
      keyword(
        position(1, 0),
        new Identifier("Keyword Name", location(1, 0, 1, 12)),
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
            location(2, 0, 2, 28)
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
            location(3, 0, 3, 37)
          ),
        ]
      )
    ]);

    parseAndAssert(data, expected);
  });

});
