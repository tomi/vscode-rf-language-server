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
  NamespacedIdentifier,
  Literal,
  VariableExpression,
  ScalarDeclaration,
  ListDeclaration,
  Documentation,
  Arguments,
} from "../models";

import { createLocation } from "./test-helper";
import { SourceLocation } from "../table-models";

const NAMESPACE = "";

function parseAndAssert(tableDefinition: string, expected: KeywordsTable) {
  const actual = parser.parseFile(tableDefinition, NAMESPACE).keywordsTable;

  chai.assert.deepEqual(actual, expected);
}

function keywordsTable(location: SourceLocation, keywords: UserKeyword[]) {
  return Object.assign(new KeywordsTable(location), { keywords });
}

function keyword(
  location: SourceLocation,
  name: Identifier,
  steps: Step[],
  settings: any = {}
) {
  return Object.assign(
    new UserKeyword(
      new NamespacedIdentifier(NAMESPACE, name.name, name.location),
      location.start
    ),
    { location },
    { steps },
    settings
  );
}

describe("Parsing Keywords table", () => {
  it("should skip invalid data", () => {
    const data = `*** Keywords ***
    not a keyword   cell2
      !another invalid    data
`;
    const expected = keywordsTable(createLocation(0, 0, 3, 0), []);

    parseAndAssert(data, expected);
  });

  it("should parse steps", () => {
    const data = `*** Keywords ***
Keyword Name
    Step 1    arg1      arg2
    Step 2    \${VAR}    a longer arg2
`;

    const expected = keywordsTable(createLocation(0, 0, 4, 0), [
      keyword(
        createLocation(1, 0, 3, 37),
        new Identifier("Keyword Name", createLocation(1, 0, 1, 12)),
        [
          new Step(
            new CallExpression(
              new Identifier("Step 1", createLocation(2, 4, 2, 10)),
              [
                new Literal("arg1", createLocation(2, 14, 2, 18)),
                new Literal("arg2", createLocation(2, 24, 2, 28)),
              ],
              createLocation(2, 4, 2, 28)
            ),
            createLocation(2, 4, 2, 28)
          ),
          new Step(
            new CallExpression(
              new Identifier("Step 2", createLocation(3, 4, 3, 10)),
              [
                new VariableExpression(
                  new Identifier("VAR", createLocation(3, 16, 3, 19)),
                  "Scalar",
                  createLocation(3, 14, 3, 20)
                ),
                new Literal("a longer arg2", createLocation(3, 24, 3, 37)),
              ],
              createLocation(3, 4, 3, 37)
            ),
            createLocation(3, 4, 3, 37)
          ),
        ]
      ),
    ]);

    parseAndAssert(data, expected);
  });

  it("should parse step from multiple lines", () => {
    const data = `*** Keywords ***
Keyword Name
    Step 1    arg1
    ...       arg2
`;

    const expected = keywordsTable(createLocation(0, 0, 4, 0), [
      keyword(
        createLocation(1, 0, 3, 18),
        new Identifier("Keyword Name", createLocation(1, 0, 1, 12)),
        [
          new Step(
            new CallExpression(
              new Identifier("Step 1", createLocation(2, 4, 2, 10)),
              [
                new Literal("arg1", createLocation(2, 14, 2, 18)),
                new Literal("arg2", createLocation(3, 14, 3, 18)),
              ],
              createLocation(2, 4, 3, 18)
            ),
            createLocation(2, 4, 3, 18)
          ),
        ]
      ),
    ]);

    parseAndAssert(data, expected);
  });

  it("should parse steps with explicit keywords", () => {
    const data = `*** Keywords ***
Keyword Name
    MyLibrary.Step 1    arg1      arg2
    Deep.Library.Step 1    \${VAR}    a longer arg2
`;

    const expected = keywordsTable(createLocation(0, 0, 4, 0), [
      keyword(
        createLocation(1, 0, 3, 50),
        new Identifier("Keyword Name", createLocation(1, 0, 1, 12)),
        [
          new Step(
            new CallExpression(
              new NamespacedIdentifier(
                "MyLibrary",
                "Step 1",
                createLocation(2, 4, 2, 20)
              ),
              [
                new Literal("arg1", createLocation(2, 24, 2, 28)),
                new Literal("arg2", createLocation(2, 34, 2, 38)),
              ],
              createLocation(2, 4, 2, 38)
            ),
            createLocation(2, 4, 2, 38)
          ),
          new Step(
            new CallExpression(
              new NamespacedIdentifier(
                "Deep.Library",
                "Step 1",
                createLocation(3, 4, 3, 23)
              ),
              [
                new VariableExpression(
                  new Identifier("VAR", createLocation(3, 29, 3, 32)),
                  "Scalar",
                  createLocation(3, 27, 3, 33)
                ),
                new Literal("a longer arg2", createLocation(3, 37, 3, 50)),
              ],
              createLocation(3, 4, 3, 50)
            ),
            createLocation(3, 4, 3, 50)
          ),
        ]
      ),
    ]);

    parseAndAssert(data, expected);
  });

  it("should parse documentation", () => {
    const data = `*** Keywords ***
Keyword Name
    [Documentation]   Here stands documentation
`;

    const expected = keywordsTable(createLocation(0, 0, 3, 0), [
      keyword(
        createLocation(1, 0, 2, 47),
        new Identifier("Keyword Name", createLocation(1, 0, 1, 12)),
        [],
        {
          documentation: new Documentation(
            new Identifier("[Documentation]", createLocation(2, 4, 2, 19)),
            new Literal(
              "Here stands documentation",
              createLocation(2, 22, 2, 47)
            ),
            createLocation(2, 4, 2, 47)
          ),
        }
      ),
    ]);

    parseAndAssert(data, expected);
  });

  it("should parse arguments", () => {
    const data = `*** Keywords ***
Keyword Name
    [Arguments]   \${arg1}    @{arg2}
`;

    const expected = keywordsTable(createLocation(0, 0, 3, 0), [
      keyword(
        createLocation(1, 0, 2, 36),
        new Identifier("Keyword Name", createLocation(1, 0, 1, 12)),
        [],
        {
          arguments: new Arguments(
            new Identifier("[Arguments]", createLocation(2, 4, 2, 15)),
            [
              new ScalarDeclaration(
                new Identifier("arg1", createLocation(2, 18, 2, 25)),
                undefined,
                createLocation(2, 18, 2, 25)
              ),
              new ListDeclaration(
                new Identifier("arg2", createLocation(2, 29, 2, 36)),
                [],
                createLocation(2, 29, 2, 36)
              ),
            ],
            createLocation(2, 4, 2, 36)
          ),
        }
      ),
    ]);

    parseAndAssert(data, expected);
  });
});
