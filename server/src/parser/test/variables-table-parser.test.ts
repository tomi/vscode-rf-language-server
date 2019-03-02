import * as _ from "lodash";
import * as chai from "chai";

import { parseVariablesTable } from "../variables-table-parser";
import { VariablesTable, VariableDeclaration } from "../models";

import { createLocation, table, row, createCell } from "./test-helper";
import { SourceLocation, DataTable } from "../table-models";

function parseAndAssert(tableDefinition: DataTable, expected: VariablesTable) {
  const actual = parseVariablesTable(tableDefinition);

  chai.assert.deepEqual(actual, expected);
}

function variablesTable(
  location: SourceLocation,
  variables: VariableDeclaration[]
) {
  return Object.assign(new VariablesTable(location), { variables });
}

describe("Parsing Variables table", () => {
  it("should skip invalid data", () => {
    const tableDefinition = table("Variables", {
      header: row(createLocation(0, 0, 0, 10)),
      rows: [
        row(createLocation(1, 0, 1, 10), [
          createCell(createLocation(1, 0, 1, 10), "not a variable"),
          createCell(createLocation(1, 0, 1, 10), "cell2"),
        ]),
        row(createLocation(2, 0, 2, 10), [
          createCell(createLocation(2, 0, 2, 10), "!another invalid"),
          createCell(createLocation(2, 0, 2, 10), "data"),
        ]),
      ],
    });

    const expected = variablesTable(createLocation(0, 0, 2, 10), []);

    parseAndAssert(tableDefinition, expected);
  });

  // it("should parse scalar variables", () => {
  //   const tableDefinition = table("Variables", {
  //     header: row(location(0, 0, 0, 10)),
  //     rows: [
  //       row(location(1, 0, 1, 10), [
  //         cell(location(1, 0, 1, 10), "${var1}"),
  //         cell(location(1, 0, 1, 10), "value")
  //       ]),
  //       row(location(2, 0, 2, 10), [
  //         cell(location(2, 0, 2, 10), "${var2}"),
  //         cell(location(2, 0, 2, 10), "More complex ${variable}")
  //       ]),
  //     ]
  //   });

  //   const expected = variablesTable(location(0, 0, 2, 10), [
  //     new ScalarDeclaration("var1", "value", location(1, 0, 1, 10)),
  //     new ScalarDeclaration("var2", "More complex ${variable}", location(2, 0, 2, 10))
  //   ]);

  //   parseAndAssert(tableDefinition, expected);
  // });

  it("should parse list variables", () => {
    // TODO
  });

  it("should parse dictionary variables", () => {
    // TODO
  });

  it("should parse environment variables", () => {
    // TODO
  });
});
