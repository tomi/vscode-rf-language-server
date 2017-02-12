import * as _ from "lodash";
import * as chai from "chai";

import { parseValueExpression } from "../primitive-parsers";

import {
  SourceLocation,
  DataTable,
  DataRow,
  DataCell,
} from "../table-models";

import {
  Literal,
  Identifier,
  VariableExpression
} from "../models";

import {
  location,
  table,
  row,
} from "./test-helper";

function header(text) {
  return row(location(0, 0, 0, text.length), [
    new DataCell(text, location(0, 0, 0, text.length))
  ]);
}

describe.only("parseValueExpression", () => {
  it("should parse literals", () => {
    const shouldParseLiteral = cellContent => {
      const loc = location(0, 0, 0, cellContent.length);
      const cell = new DataCell(cellContent, loc);

      const parsed = parseValueExpression(cell);
      const expected = new Literal(cellContent, loc);

      chai.assert.deepEqual(parsed, expected);
    };

    shouldParseLiteral("Just some text");
  });

  describe("should parse variable expressions", () => {
    it("should parse scalar variable expressions", () => {
      const expected = new VariableExpression(
        new Identifier("VAR", location(0, 2, 0, 5)),
        "Scalar",
        location(0, 0, 0, 6)
      );

      const actual = parseValueExpression(new DataCell("${VAR}", location(0, 0, 0, 6)));

      chai.assert.deepEqual(actual, expected);
    });
  });
});
