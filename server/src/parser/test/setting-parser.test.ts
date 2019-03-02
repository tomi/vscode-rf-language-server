import * as _ from "lodash";
import * as chai from "chai";

import { isSetting, parseSetting } from "../setting-parser";

import { DataCell } from "../table-models";

import {
  CallExpression,
  Identifier,
  Literal,
  VariableExpression,
  ScalarDeclaration,
  ListDeclaration,
  Documentation,
  Arguments,
  Return,
  Teardown,
} from "../models";

import { createLocation } from "./test-helper";

import { locationFromStartEnd } from "../position-helper";

describe("Setting parser", () => {
  const dummyLoc = createLocation(0, 0, 0, 0);
  const FIRST_CELL_LOC = createLocation(0, 5, 0, 10);

  const shouldReturnTrue = (cellValue: string) => {
    const cell = new DataCell(cellValue, dummyLoc);
    const actual = isSetting(cell);

    chai.assert.isTrue(actual);
  };

  describe("[Documentation]", () => {
    it("should recognize", () => {
      shouldReturnTrue("[Documentation]");
    });

    it("should parse regular", () => {
      const docValue = "This is documentation";
      const docLoc = createLocation(0, 20, 0, 30);

      const nameCell = new DataCell("[Documentation]", FIRST_CELL_LOC);
      const dataCell = new DataCell(docValue, docLoc);

      const expected = new Documentation(
        new Identifier("[Documentation]", FIRST_CELL_LOC),
        new Literal(docValue, docLoc),
        createLocation(
          FIRST_CELL_LOC.start.line,
          FIRST_CELL_LOC.start.column,
          dataCell.location.end.line,
          dataCell.location.end.column
        )
      );

      const actual = parseSetting(nameCell, [dataCell]);

      chai.assert.deepEqual(actual, expected);
    });

    it("should parse empty", () => {
      const nameCell = new DataCell("[Documentation]", FIRST_CELL_LOC);

      const expected = new Documentation(
        new Identifier("[Documentation]", FIRST_CELL_LOC),
        undefined,
        FIRST_CELL_LOC
      );

      const actual = parseSetting(nameCell, []);

      chai.assert.deepEqual(actual, expected);
    });
  });

  describe("[Arguments]", () => {
    it("should recognize", () => {
      shouldReturnTrue("[Arguments]");
    });

    it("should parse regular", () => {
      const arg1Val = "${arg1}";
      const arg1Loc = createLocation(0, 20, 0, 27);
      const arg2Val = "@{arg2}";
      const arg2Loc = createLocation(0, 30, 0, 37);

      const nameCell = new DataCell("[Arguments]", FIRST_CELL_LOC);
      const arg1Cell = new DataCell(arg1Val, arg1Loc);
      const arg2Cell = new DataCell(arg2Val, arg2Loc);

      const expected = new Arguments(
        new Identifier("[Arguments]", FIRST_CELL_LOC),
        [
          new ScalarDeclaration(
            new Identifier("arg1", createLocation(0, 20, 0, 27)),
            undefined,
            arg1Loc
          ),
          new ListDeclaration(
            new Identifier("arg2", createLocation(0, 30, 0, 37)),
            [],
            arg2Loc
          ),
        ],
        createLocation(
          FIRST_CELL_LOC.start.line,
          FIRST_CELL_LOC.start.column,
          arg2Cell.location.end.line,
          arg2Cell.location.end.column
        )
      );

      const actual = parseSetting(nameCell, [arg1Cell, arg2Cell]);

      chai.assert.deepEqual(actual, expected);
    });

    it("should parse arguments with default values", () => {
      const arg1Val = "${arg1} = default value";
      const arg1Loc = createLocation(0, 20, 0, 27);
      const arg2Val = "@{arg2}=${DEFAULT VALUE}";
      const arg2Loc = createLocation(0, 30, 0, 37);

      const nameCell = new DataCell("[Arguments]", FIRST_CELL_LOC);
      const arg1Cell = new DataCell(arg1Val, arg1Loc);
      const arg2Cell = new DataCell(arg2Val, arg2Loc);

      const expected = new Arguments(
        new Identifier("[Arguments]", FIRST_CELL_LOC),
        [
          new ScalarDeclaration(
            new Identifier("arg1", createLocation(0, 20, 0, 27)),
            undefined,
            arg1Loc
          ),
          new ListDeclaration(
            new Identifier("arg2", createLocation(0, 30, 0, 37)),
            [],
            arg2Loc
          ),
        ],
        createLocation(
          FIRST_CELL_LOC.start.line,
          FIRST_CELL_LOC.start.column,
          arg2Cell.location.end.line,
          arg2Cell.location.end.column
        )
      );

      const actual = parseSetting(nameCell, [arg1Cell, arg2Cell]);

      chai.assert.deepEqual(actual, expected);
    });

    it("should parse empty", () => {
      const nameCell = new DataCell("[Arguments]", FIRST_CELL_LOC);

      const expected = new Arguments(
        new Identifier("[Arguments]", FIRST_CELL_LOC),
        [],
        FIRST_CELL_LOC
      );

      const actual = parseSetting(nameCell, []);

      chai.assert.deepEqual(actual, expected);
    });

    it("should ignore invalid values", () => {
      const arg1Val = "not an argument";
      const arg1Loc = createLocation(0, 20, 0, 27);
      const arg2Val = "another not argument";
      const arg2Loc = createLocation(0, 30, 0, 37);

      const nameCell = new DataCell("[Arguments]", FIRST_CELL_LOC);
      const arg1Cell = new DataCell(arg1Val, arg1Loc);
      const arg2Cell = new DataCell(arg2Val, arg2Loc);

      const expected = new Arguments(
        new Identifier("[Arguments]", FIRST_CELL_LOC),
        [],
        FIRST_CELL_LOC
      );

      const actual = parseSetting(nameCell, [arg1Cell, arg2Cell]);

      chai.assert.deepEqual(actual, expected);
    });
  });

  describe("[Return]", () => {
    it("should recognise", () => {
      shouldReturnTrue("[Return]");
    });

    it("should parse single variable", () => {
      const varValue = "${VARIABLE}";
      const varLoc = createLocation(0, 20, 0, 31);

      const nameCell = new DataCell("[Return]", FIRST_CELL_LOC);
      const dataCell = new DataCell(varValue, varLoc);

      const expected = new Return(
        new Identifier("[Return]", FIRST_CELL_LOC),
        [
          new VariableExpression(
            new Identifier("VARIABLE", createLocation(0, 22, 0, 30)),
            "Scalar",
            varLoc
          ),
        ],
        createLocation(
          FIRST_CELL_LOC.start.line,
          FIRST_CELL_LOC.start.column,
          varLoc.end.line,
          varLoc.end.column
        )
      );

      const actual = parseSetting(nameCell, [dataCell]);

      chai.assert.deepEqual(actual, expected);
    });
  });

  describe("[Teardown]", () => {
    it("should recognise", () => {
      shouldReturnTrue("[Teardown]");
    });

    it("should parse keyword without params", () => {
      const varValue = "Keyword To Call";
      const varLoc = createLocation(0, 20, 0, 30);

      const nameCell = new DataCell("[Teardown]", FIRST_CELL_LOC);
      const dataCell = new DataCell(varValue, varLoc);

      const expected = new Teardown(
        new Identifier("[Teardown]", FIRST_CELL_LOC),
        new CallExpression(new Identifier(varValue, varLoc), [], varLoc),
        createLocation(
          FIRST_CELL_LOC.start.line,
          FIRST_CELL_LOC.start.column,
          dataCell.location.end.line,
          dataCell.location.end.column
        )
      );

      const actual = parseSetting(nameCell, [dataCell]);

      chai.assert.deepEqual(actual, expected);
    });

    it("should parse keyword without params", () => {
      const varValue = "Keyword To Call";
      const varLoc = createLocation(0, 20, 0, 30);
      const argValue = "Argument1";
      const argLoc = createLocation(0, 35, 0, 40);

      const nameCell = new DataCell("[Teardown]", FIRST_CELL_LOC);
      const dataCell = new DataCell(varValue, varLoc);
      const argCell = new DataCell(argValue, argLoc);

      const expected = new Teardown(
        new Identifier("[Teardown]", FIRST_CELL_LOC),
        new CallExpression(
          new Identifier(varValue, varLoc),
          [new Literal(argValue, argLoc)],
          locationFromStartEnd(dataCell.location, argCell.location)
        ),
        locationFromStartEnd(FIRST_CELL_LOC, argCell.location)
      );

      const actual = parseSetting(nameCell, [dataCell, argCell]);

      chai.assert.deepEqual(actual, expected);
    });
  });

  describe("[Tags]", () => {
    // TODO
  });

  describe("[Timeout]", () => {
    // TODO
  });
});
