import * as _ from "lodash";
import * as chai from "chai";

import { parseKeywordsTable } from "../keywords-table-parser";
import {
  KeywordsTable,
  Keyword,
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
  const actual = parseKeywordsTable(tableDefinition);

  chai.assert.deepEqual(actual, expected);
}

function keywordsTable(location, keywords) {
  return Object.assign(new KeywordsTable(location), { keywords });
}

function keyword(startPosition, name, steps) {
  return Object.assign(new Keyword(name, startPosition), { steps });
}

describe("Parsing Keywords table", () => {

  it("should skip invalid data", () => {
    const tableDefinition = table("Keywords", {
      header: row(location(0, 0, 0, 10)),
      rows: [
        row(location(1, 0, 1, 10), [
          cell(location(2, 0, 2, 10), ""),
          cell(location(1, 0, 1, 10), "not a keyword"),
          cell(location(1, 0, 1, 10), "cell2")
        ]),
        row(location(2, 0, 2, 10), [
          cell(location(2, 0, 2, 10), ""),
          cell(location(2, 0, 2, 10), "!another invalid"),
          cell(location(2, 0, 2, 10), "data")
        ]),
      ]
    });

    const expected = keywordsTable(location(0, 0, 2, 10), []);

    parseAndAssert(tableDefinition, expected);
  });

  it("should parse keyword", () => {
    const tableDefinition = table("Keywords", {
      header: row(location(0, 0, 0, 10)),
      rows: [
        row(location(1, 0, 1, 10), [cell(location(1, 0, 1, 10), "Keyword Name")]),
        row(location(2, 0, 2, 10), [
          cell(location(2, 0, 2, 10), ""),
          cell(location(2, 0, 2, 10), "Step 1"),
          cell(location(2, 0, 2, 10), "arg1"),
          cell(location(2, 0, 2, 10), "arg2"),
        ]),
        row(location(3, 0, 3, 10), [
          cell(location(3, 0, 3, 10), ""),
          cell(location(3, 0, 3, 10), "Step 2"),
          cell(location(3, 0, 3, 10), "${VAR}"),
          cell(location(3, 0, 3, 10), "more complex arg"),
        ]),
      ]
    });

    const expected = keywordsTable(location(0, 0, 3, 10), [
      keyword(position(1, 0), "Keyword Name", [
        new Step("Step 1", ["arg1", "arg2"], location(2, 0, 2, 10)),
        new Step("Step 2", ["${VAR}", "more complex arg"], location(3, 0, 3, 10)),
      ])
    ]);

    parseAndAssert(tableDefinition, expected);
  });

});
