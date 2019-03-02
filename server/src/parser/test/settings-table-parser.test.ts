import * as _ from "lodash";
import * as chai from "chai";

import { FileParser } from "../parser";
const parser = new FileParser();

import {
  SettingsTable,
  SuiteSetting,
  LibraryImport,
  ResourceImport,
  TemplateLiteral,
  Literal,
  TemplateElement,
  VariableExpression,
  Identifier,
  CallExpression,
  Documentation,
} from "../models";

import { createLocation } from "./test-helper";
import { SourceLocation } from "../table-models";

const NAMESPACE = "";

function parseAndAssert(tableDefinition: string, expected: SettingsTable) {
  const actual = parser.parseFile(tableDefinition, NAMESPACE).settingsTable;

  chai.assert.deepEqual(actual, expected);
}

function settingsTable(location: SourceLocation, content: any) {
  return Object.assign(new SettingsTable(location), content);
}

describe("Parsing Settings table", () => {
  it("should parse empty resource import", () => {
    const data = `* Settings
Resource
`;

    const expected = settingsTable(createLocation(0, 0, 2, 0), {
      resourceImports: [new ResourceImport(null, createLocation(1, 0, 1, 8))],
    });

    parseAndAssert(data, expected);
  });

  it("should parse resource imports", () => {
    const data = `* Settings
Resource    resources/\${ENVIRONMENT}.robot
Resource    resources/smoke_resources.robot
`;

    const expected = settingsTable(createLocation(0, 0, 3, 0), {
      resourceImports: [
        new ResourceImport(
          new TemplateLiteral(
            [
              new TemplateElement("resources/", createLocation(1, 12, 1, 22)),
              new TemplateElement(".robot", createLocation(1, 36, 1, 42)),
            ],
            [
              new VariableExpression(
                new Identifier("ENVIRONMENT", createLocation(1, 24, 1, 35)),
                "Scalar",
                createLocation(1, 22, 1, 36)
              ),
            ],
            createLocation(1, 12, 1, 42)
          ),
          createLocation(1, 0, 1, 42)
        ),
        new ResourceImport(
          new Literal(
            "resources/smoke_resources.robot",
            createLocation(2, 12, 2, 43)
          ),
          createLocation(2, 0, 2, 43)
        ),
      ],
    });

    parseAndAssert(data, expected);
  });

  it("should parse empty library import", () => {
    const data = `* Settings
Library
`;

    const expected = settingsTable(createLocation(0, 0, 2, 0), {
      libraryImports: [new LibraryImport(null, [], createLocation(1, 0, 1, 7))],
    });

    parseAndAssert(data, expected);
  });

  it("should parse library imports", () => {
    const data = `* Settings
Library    libs/\${ENVIRONMENT}.robot
Library    lib  arg1  arg2
`;

    const expected = settingsTable(createLocation(0, 0, 3, 0), {
      libraryImports: [
        new LibraryImport(
          new TemplateLiteral(
            [
              new TemplateElement("libs/", createLocation(1, 11, 1, 16)),
              new TemplateElement(".robot", createLocation(1, 30, 1, 36)),
            ],
            [
              new VariableExpression(
                new Identifier("ENVIRONMENT", createLocation(1, 18, 1, 29)),
                "Scalar",
                createLocation(1, 16, 1, 30)
              ),
            ],
            createLocation(1, 11, 1, 36)
          ),
          [],
          createLocation(1, 0, 1, 36)
        ),
        new LibraryImport(
          new Literal("lib", createLocation(2, 11, 2, 14)),
          [
            new Literal("arg1", createLocation(2, 16, 2, 20)),
            new Literal("arg2", createLocation(2, 22, 2, 26)),
          ],
          createLocation(2, 0, 2, 26)
        ),
      ],
    });

    parseAndAssert(data, expected);
  });

  //   it("should parse variable imports", () => {
  //     const tableDefinition = table("Settings", {
  //       header: row(location(0, 0, 0, 10)),
  //       rows: [
  //         row(location(1, 0, 1, 10), [
  //           cell(location(1, 0, 1, 10), "Variables"),
  //           cell(location(1, 0, 1, 10), "vars/\${ENVIRONMENT}.robot"),
  //         ]),
  //         row(location(2, 0, 2, 10), [
  //           cell(location(2, 0, 2, 10), "Variables"),
  //           cell(location(2, 0, 2, 10), "vars/vars.robot"),
  //         ]),
  //       ]
  //     });

  //     const expected = settingsTable(location(0, 0, 2, 10), {
  //       variableImports: [
  //         new VariableImport("vars/\${ENVIRONMENT}.robot", location(1, 0, 1, 10)),
  //         new VariableImport("vars/vars.robot", location(2, 0, 2, 10)),
  //       ]
  //     });

  //     parseAndAssert(tableDefinition, expected);
  //   });

  it("should parse suite setup and teardown", () => {
    const data = `* Settings
Suite Setup       suiteSetup       arg1    arg2
Suite Teardown    suiteTeardown    arg1    arg2
`;

    const expected = settingsTable(createLocation(0, 0, 3, 0), {
      suiteSetup: new SuiteSetting(
        new Identifier("Suite Setup", createLocation(1, 0, 1, 11)),
        new CallExpression(
          new Identifier("suiteSetup", createLocation(1, 18, 1, 28)),
          [
            new Literal("arg1", createLocation(1, 35, 1, 39)),
            new Literal("arg2", createLocation(1, 43, 1, 47)),
          ],
          createLocation(1, 18, 1, 47)
        ),
        createLocation(1, 0, 1, 47)
      ),
      suiteTeardown: new SuiteSetting(
        new Identifier("Suite Teardown", createLocation(2, 0, 2, 14)),
        new CallExpression(
          new Identifier("suiteTeardown", createLocation(2, 18, 2, 31)),
          [
            new Literal("arg1", createLocation(2, 35, 2, 39)),
            new Literal("arg2", createLocation(2, 43, 2, 47)),
          ],
          createLocation(2, 18, 2, 47)
        ),
        createLocation(2, 0, 2, 47)
      ),
    });

    parseAndAssert(data, expected);
  });

  it("should parse test setup and teardown", () => {
    const data = `* Settings
Test Setup        testSetup        arg1    arg2
Test Teardown     testTeardown     arg1    arg2
`;

    const expected = settingsTable(createLocation(0, 0, 3, 0), {
      testSetup: new SuiteSetting(
        new Identifier("Test Setup", createLocation(1, 0, 1, 10)),
        new CallExpression(
          new Identifier("testSetup", createLocation(1, 18, 1, 27)),
          [
            new Literal("arg1", createLocation(1, 35, 1, 39)),
            new Literal("arg2", createLocation(1, 43, 1, 47)),
          ],
          createLocation(1, 18, 1, 47)
        ),
        createLocation(1, 0, 1, 47)
      ),
      testTeardown: new SuiteSetting(
        new Identifier("Test Teardown", createLocation(2, 0, 2, 13)),
        new CallExpression(
          new Identifier("testTeardown", createLocation(2, 18, 2, 30)),
          [
            new Literal("arg1", createLocation(2, 35, 2, 39)),
            new Literal("arg2", createLocation(2, 43, 2, 47)),
          ],
          createLocation(2, 18, 2, 47)
        ),
        createLocation(2, 0, 2, 47)
      ),
    });

    parseAndAssert(data, expected);
  });

  it("should parse test setup split on multiple lines", () => {
    const data = `* Settings
Test Setup        testSetup
...               arg1
...               arg2
`;

    const expected = settingsTable(createLocation(0, 0, 4, 0), {
      testSetup: new SuiteSetting(
        new Identifier("Test Setup", createLocation(1, 0, 1, 10)),
        new CallExpression(
          new Identifier("testSetup", createLocation(1, 18, 1, 27)),
          [
            new Literal("arg1", createLocation(2, 18, 2, 22)),
            new Literal("arg2", createLocation(3, 18, 3, 22)),
          ],
          createLocation(1, 18, 3, 22)
        ),
        createLocation(1, 0, 3, 22)
      ),
    });

    parseAndAssert(data, expected);
  });

  it("should parse documentation", () => {
    const data = `* Settings
Documentation  Documentation string
`;

    const expected = settingsTable(createLocation(0, 0, 2, 0), {
      documentation: new Documentation(
        new Identifier("Documentation", createLocation(1, 0, 1, 13)),
        new Literal("Documentation string", createLocation(1, 15, 1, 35)),
        createLocation(1, 0, 1, 35)
      ),
    });

    parseAndAssert(data, expected);
  });
});
