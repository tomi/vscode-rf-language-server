import * as _ from "lodash";
import * as chai from "chai";

import { parseVariablesTable } from "../variables-table-parser";
import {
  VariablesTable,
  ScalarVariable,
  ListVariable
} from "../models";

import {
  location,
  table,
  row,
  cell
} from "./test-helper";

function parseAndAssert(tableDefinition, expected) {
  const actual = parseVariablesTable(tableDefinition);

  chai.assert.deepEqual(actual, expected);
}

function variablesTable(location, variables) {
  return Object.assign(new VariablesTable(location), { variables });
}

describe("Parsing Variables table", () => {

  it("should skip invalid data", () => {
    const tableDefinition = table("Variables", {
      header: row(location(0, 0, 0, 10)),
      rows: [
        row(location(1, 0, 1, 10), [
          cell(location(1, 0, 1, 10), "not a variable"),
          cell(location(1, 0, 1, 10), "cell2")
        ]),
        row(location(2, 0, 2, 10), [
          cell(location(2, 0, 2, 10), "!another invalid"),
          cell(location(2, 0, 2, 10), "data")
        ]),
      ]
    });

    const expected = variablesTable(location(0, 0, 2, 10), []);

    parseAndAssert(tableDefinition, expected);
  });

  it("should parse scalar variables", () => {
    const tableDefinition = table("Variables", {
      header: row(location(0, 0, 0, 10)),
      rows: [
        row(location(1, 0, 1, 10), [
          cell(location(1, 0, 1, 10), "${var1}"),
          cell(location(1, 0, 1, 10), "value")
        ]),
        row(location(2, 0, 2, 10), [
          cell(location(2, 0, 2, 10), "${var2}"),
          cell(location(2, 0, 2, 10), "More complex ${variable}")
        ]),
      ]
    });

    const expected = variablesTable(location(0, 0, 2, 10), [
      new ScalarVariable("var1", "value", location(1, 0, 1, 10)),
      new ScalarVariable("var2", "More complex ${variable}", location(2, 0, 2, 10))
    ]);

    parseAndAssert(tableDefinition, expected);
  });

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
