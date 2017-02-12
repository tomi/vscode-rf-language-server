import * as _ from "lodash";
import * as chai from "chai";

import { parseValueExpression } from "../primitive-parsers";

import {
  DataCell,
} from "../table-models";

import {
  Literal,
  Identifier,
  VariableExpression
} from "../models";

import {
  location
} from "./test-helper";

describe.only("parseValueExpression", () => {
  describe("should parse single literals", () => {
    function shouldParseLiteral(cellContent) {
      const loc = location(0, 0, 0, cellContent.length);
      const cell = new DataCell(cellContent, loc);

      const parsed = parseValueExpression(cell);
      const expected = new Literal(cellContent, loc);

      chai.assert.deepEqual(parsed, expected);
    }

    it("should parse simple literals", () => {
      shouldParseLiteral("Just some text");
      shouldParseLiteral("Another part of text");
    });
  });

  describe("should parse single variable expressions", () => {
    it("should parse scalar variable expressions", () => {
      const expected = new VariableExpression(
        new Identifier("VAR", location(0, 2, 0, 5)),
        "Scalar",
        location(0, 0, 0, 6)
      );

      const actual = parseValueExpression(new DataCell("${VAR}", location(0, 0, 0, 6)));

      chai.assert.deepEqual(actual, expected);
    });

    it("should parse list variable expressions", () => {
      const expected = new VariableExpression(
        new Identifier("VAR", location(0, 2, 0, 5)),
        "List",
        location(0, 0, 0, 6)
      );

      const actual = parseValueExpression(new DataCell("@{VAR}", location(0, 0, 0, 6)));

      chai.assert.deepEqual(actual, expected);
    });
  });
});
