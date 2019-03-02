import * as _ from "lodash";
import * as chai from "chai";

import { isVariable, parseTypeAndName } from "../variable-parsers";
import { DataCell } from "../table-models";

import { Identifier } from "../models";

import { createLocation } from "./test-helper";

const DUMMY_LOC = createLocation(0, 0, 0, 0);

function assertIsVariable(cellData: string) {
  const cell = new DataCell(cellData, DUMMY_LOC);
  const actual = isVariable(cell);

  chai.assert.isTrue(actual);
}

function assertParseResult(
  cellData: string,
  expectedType: string,
  expectedName: string
) {
  const cell = new DataCell(cellData, DUMMY_LOC);
  const expected = {
    type: expectedType,
    name: new Identifier(expectedName, DUMMY_LOC),
  };

  const actual = parseTypeAndName(cell);

  chai.assert.deepEqual(actual, expected);
}

describe("Variable parsing", () => {
  describe("isVariable", () => {
    it("should recognize an empty scalar", () => {
      assertIsVariable("${}");
    });

    it("should recognize an empty list", () => {
      assertIsVariable("${}");
    });

    it("should recognize scalar", () => {
      assertIsVariable("${var}");
    });

    it("should recognize scalar", () => {
      assertIsVariable("${var}");
    });
  });

  describe("parseTypeAndName", () => {
    it("should parse empty scalar", () => {
      assertParseResult("${}", "$", "");
    });
  });
});
