import * as _ from "lodash";
import * as chai from "chai";

import { parseValueExpression } from "../primitive-parsers";

import {
  DataCell,
} from "../table-models";

import {
  Literal,
  Identifier,
  VariableExpression,
  TemplateElement,
  TemplateLiteral
} from "../models";

import {
  createLocation
} from "./test-helper";

describe("parseValueExpression", () => {
  describe("should parse single literals", () => {
    function shouldParseLiteral(cellContent) {
      const loc = createLocation(0, 0, 0, cellContent.length);
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
        new Identifier("VAR", createLocation(0, 2, 0, 5)),
        "Scalar",
        createLocation(0, 0, 0, 6)
      );

      const actual = parseValueExpression(new DataCell("${VAR}", createLocation(0, 0, 0, 6)));

      chai.assert.deepEqual(actual, expected);
    });

    it("should parse list variable expressions", () => {
      const expected = new VariableExpression(
        new Identifier("VAR", createLocation(0, 2, 0, 5)),
        "List",
        createLocation(0, 0, 0, 6)
      );

      const actual = parseValueExpression(new DataCell("@{VAR}", createLocation(0, 0, 0, 6)));

      chai.assert.deepEqual(actual, expected);
    });
  });

  describe("should parse template literal", () => {
    it("should parse template with multiple expressions", () => {
      const input = "Template ${arg1} with @{arg2} multiple args";
      const loc = createLocation(0, 0, 0, input.length);
      const cell = new DataCell(input, loc);

      const expected = new TemplateLiteral(
        [
          new TemplateElement("Template ", createLocation(0, 0, 0, 9)),
          new TemplateElement(" with ", createLocation(0, 16, 0, 22)),
          new TemplateElement(" multiple args", createLocation(0, 29, 0, 43)),
        ],
        [
          new VariableExpression(
            new Identifier("arg1", createLocation(0, 11, 0, 15)),
            "Scalar",
            createLocation(0, 9, 0, 16)
          ),
          new VariableExpression(
            new Identifier("arg2", createLocation(0, 24, 0, 28)),
            "List",
            createLocation(0, 22, 0, 29)
          ),
        ],
        loc
      );

      const actual = parseValueExpression(cell);

      chai.assert.deepEqual(actual, expected);
    });

  });
});
