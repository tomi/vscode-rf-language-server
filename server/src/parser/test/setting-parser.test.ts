import * as _ from "lodash";
import * as chai from "chai";

import { isSetting, parseSetting } from "../setting-parser";

import { DataCell } from "../table-models";

import {
  KeywordsTable,
  UserKeyword,
  Step,
  CallExpression,
  Identifier,
  Literal,
  VariableExpression,
  ScalarDeclaration,
  ListDeclaration,
  VariableKind,
  Documentation,
  Arguments,
  Return,
  Teardown,
  Tags,
  Timeout
} from "../models";

import {
  position,
  location,
  table,
  row,
  cell
} from "./test-helper";

import {
  locationFromStartEnd
} from "../position-helper";

describe("Setting parser", () => {
  const dummyLoc = location(0, 0, 0, 0);
  const FIRST_CELL_LOC = location(0, 5, 0, 10);

  const shouldReturnTrue = cellValue => {
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
      const docLoc = location(0, 20, 0, 30);

      const nameCell = new DataCell("[Documentation]", FIRST_CELL_LOC);
      const dataCell = new DataCell(docValue, docLoc);

      const expected = new Documentation(
        new Identifier("[Documentation]", FIRST_CELL_LOC),
        new Literal(docValue, docLoc),
        location(
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
      const arg1Loc = location(0, 20, 0, 27);
      const arg2Val = "@{arg2}";
      const arg2Loc = location(0, 30, 0, 37);

      const nameCell = new DataCell("[Arguments]", FIRST_CELL_LOC);
      const arg1Cell = new DataCell(arg1Val, arg1Loc);
      const arg2Cell = new DataCell(arg2Val, arg2Loc);

      const expected = new Arguments(
        new Identifier("[Arguments]", FIRST_CELL_LOC),
        [
          new ScalarDeclaration(
            new Identifier("arg1", location(0, 20, 0, 27)),
            undefined,
            arg1Loc
          ),
          new ListDeclaration(
            new Identifier("arg2", location(0, 30, 0, 37)),
            [],
            arg2Loc
          )
        ],
        location(
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
      const arg1Loc = location(0, 20, 0, 27);
      const arg2Val = "@{arg2}=${DEFAULT VALUE}";
      const arg2Loc = location(0, 30, 0, 37);

      const nameCell = new DataCell("[Arguments]", FIRST_CELL_LOC);
      const arg1Cell = new DataCell(arg1Val, arg1Loc);
      const arg2Cell = new DataCell(arg2Val, arg2Loc);

      const expected = new Arguments(
        new Identifier("[Arguments]", FIRST_CELL_LOC),
        [
          new ScalarDeclaration(
            new Identifier("arg1", location(0, 20, 0, 27)),
            undefined,
            arg1Loc
          ),
          new ListDeclaration(
            new Identifier("arg2", location(0, 30, 0, 37)),
            [],
            arg2Loc
          )
        ],
        location(
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
      const arg1Loc = location(0, 20, 0, 27);
      const arg2Val = "another not argument";
      const arg2Loc = location(0, 30, 0, 37);

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
      const varLoc = location(0, 20, 0, 31);

      const nameCell = new DataCell("[Return]", FIRST_CELL_LOC);
      const dataCell = new DataCell(varValue, varLoc);

      const expected = new Return(
        new Identifier("[Return]", FIRST_CELL_LOC),
        [
          new VariableExpression(
            new Identifier("VARIABLE", location(0, 22, 0, 30)),
            "Scalar",
            varLoc
          )
        ],
        location(
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
      const varLoc = location(0, 20, 0, 30);

      const nameCell = new DataCell("[Teardown]", FIRST_CELL_LOC);
      const dataCell = new DataCell(varValue, varLoc);

      const expected = new Teardown(
        new Identifier("[Teardown]", FIRST_CELL_LOC),
        new CallExpression(
          new Identifier(varValue, varLoc),
          [],
          varLoc
        ),
        location(
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
      const varLoc = location(0, 20, 0, 30);
      const argValue = "Argument1";
      const argLoc = location(0, 35, 0, 40);

      const nameCell = new DataCell("[Teardown]", FIRST_CELL_LOC);
      const dataCell = new DataCell(varValue, varLoc);
      const argCell = new DataCell(argValue, argLoc);

      const expected = new Teardown(
        new Identifier("[Teardown]", FIRST_CELL_LOC),
        new CallExpression(
          new Identifier(varValue, varLoc),
          [
            new Literal(argValue, argLoc)
          ],
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
