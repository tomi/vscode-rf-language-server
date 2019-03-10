import * as _ from "lodash";
import * as chai from "chai";

import {
  parseValueExpression,
  parseCallExpression,
} from "../primitive-parsers";

import { DataCell } from "../table-models";

import {
  Literal,
  Identifier,
  VariableExpression,
  TemplateElement,
  TemplateLiteral,
  CallExpression,
} from "../models";

import { createLocation } from "./test-helper";

describe("parseValueExpression", () => {
  describe("should parse single literals", () => {
    function shouldParseLiteral(cellContent: string) {
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

      const actual = parseValueExpression(
        new DataCell("${VAR}", createLocation(0, 0, 0, 6))
      );

      chai.assert.deepEqual(actual, expected);
    });

    it("should parse list variable expressions", () => {
      const expected = new VariableExpression(
        new Identifier("VAR", createLocation(0, 2, 0, 5)),
        "List",
        createLocation(0, 0, 0, 6)
      );

      const actual = parseValueExpression(
        new DataCell("@{VAR}", createLocation(0, 0, 0, 6))
      );

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

describe("parseCallExpression", () => {
  describe("values as parameters", () => {
    it("should parse call expression with only callee", () => {
      const callee = "Keyword To Call";
      const loc = createLocation(0, 0, 0, callee.length);
      const cell = new DataCell(callee, loc);

      const actual = parseCallExpression([cell]);

      chai.assert.deepEqual(
        actual,
        new CallExpression(new Identifier(callee, loc), [], loc)
      );
    });

    it("should parse call expression with identifier param", () => {
      const callee = "Keyword To Call";
      const param = "param";

      const cells = [
        new DataCell(callee, createLocation(0, 0, 0, 15)),
        new DataCell(param, createLocation(0, 17, 0, 22)),
      ];

      const actual = parseCallExpression(cells);

      chai.assert.deepEqual(
        actual,
        new CallExpression(
          new Identifier(callee, createLocation(0, 0, 0, 15)),
          [new Literal(param, createLocation(0, 17, 0, 22))],
          createLocation(0, 0, 0, 22)
        )
      );
    });
  });

  describe("keyword call as the first parameter", () => {
    it("Run Keyword  Keyword To Call", () => {
      const shouldParseCorrectly = (callee: string) => {
        const param = "Keyword To Call";
        const calleeLoc = createLocation(0, 0, 0, callee.length);
        const argLoc = createLocation(
          0,
          callee.length + 2,
          0,
          callee.length + 17
        );

        const cells = [
          new DataCell(callee, calleeLoc),
          new DataCell(param, argLoc),
        ];

        const actual = parseCallExpression(cells);

        chai.assert.deepEqual(
          actual,
          new CallExpression(
            new Identifier(callee, calleeLoc),
            [new CallExpression(new Identifier(param, argLoc), [], argLoc)],
            createLocation(0, 0, 0, argLoc.end.column)
          )
        );
      };

      shouldParseCorrectly("Run Keyword");
      shouldParseCorrectly("run keyword");
      shouldParseCorrectly("RUN KEYWORD");
    });
  });

  describe("keyword call as the second parameter", () => {
    it("Run Keyword If  dummy  Keyword To Call", () => {
      const callee = "Run Keyword If";
      const arg1 = "dummy";
      const arg2 = "Keyword To Call";
      const calleeLoc = createLocation(0, 0, 0, callee.length);
      const arg1Loc = createLocation(
        0,
        callee.length + 2,
        0,
        callee.length + 2 + arg1.length
      );
      const arg2Loc = createLocation(
        0,
        callee.length + 2 + arg1.length + 2,
        0,
        callee.length + 2 + arg1.length + 2 + arg2.length
      );

      const cells = [
        new DataCell(callee, calleeLoc),
        new DataCell(arg1, arg1Loc),
        new DataCell(arg2, arg2Loc),
      ];

      const actual = parseCallExpression(cells);

      chai.assert.deepEqual(
        actual,
        new CallExpression(
          new Identifier(callee, calleeLoc),
          [
            new Literal(arg1, arg1Loc),
            new CallExpression(new Identifier(arg2, arg2Loc), [], arg2Loc),
          ],
          createLocation(0, 0, 0, arg2Loc.end.column)
        )
      );
    });
  });

  describe("keyword call as the third parameter", () => {
    it("Wait until keyword succeeds  dummy1  dummy2  Keyword To Call", () => {
      const callee = "Wait until keyword succeeds";
      const arg1 = "dummy1";
      const arg2 = "dummy2";
      const arg3 = "Keyword To Call";
      const calleeLoc = createLocation(0, 0, 0, callee.length);
      const arg1Loc = createLocation(
        0,
        callee.length + 2,
        0,
        callee.length + 2 + arg1.length
      );
      const arg2Loc = createLocation(
        0,
        callee.length + 2 + arg1.length + 2,
        0,
        callee.length + 2 + arg1.length + 2 + arg2.length
      );
      const arg3Loc = createLocation(
        0,
        callee.length + 2 + arg1.length + 2 + arg2.length + 2,
        0,
        callee.length + 2 + arg1.length + 2 + arg2.length + 2 + arg3.length
      );

      const cells = [
        new DataCell(callee, calleeLoc),
        new DataCell(arg1, arg1Loc),
        new DataCell(arg2, arg2Loc),
        new DataCell(arg3, arg3Loc),
      ];

      const actual = parseCallExpression(cells);

      chai.assert.deepEqual(
        actual,
        new CallExpression(
          new Identifier(callee, calleeLoc),
          [
            new Literal(arg1, arg1Loc),
            new Literal(arg2, arg2Loc),
            new CallExpression(new Identifier(arg3, arg3Loc), [], arg3Loc),
          ],
          createLocation(0, 0, 0, arg3Loc.end.column)
        )
      );
    });
  });

  describe("multiple keywords as parameters", () => {
    it("Run Keywords  Keyword To Call  Another To Call", () => {
      const callee = "Run Keywords";
      const arg1 = "Keyword To Call";
      const arg2 = "Another To Call";
      const calleeLoc = createLocation(0, 0, 0, callee.length);
      const arg1Loc = createLocation(
        0,
        callee.length + 2,
        0,
        callee.length + 2 + arg1.length
      );
      const arg2Loc = createLocation(
        0,
        callee.length + 2 + arg1.length + 2,
        0,
        callee.length + 2 + arg1.length + 2 + arg2.length
      );

      const cells = [
        new DataCell(callee, calleeLoc),
        new DataCell(arg1, arg1Loc),
        new DataCell(arg2, arg2Loc),
      ];

      const actual = parseCallExpression(cells);

      chai.assert.deepEqual(
        actual,
        new CallExpression(
          new Identifier(callee, calleeLoc),
          [
            new CallExpression(new Identifier(arg1, arg1Loc), [], arg1Loc),
            new CallExpression(new Identifier(arg2, arg2Loc), [], arg2Loc),
          ],
          createLocation(0, 0, 0, arg2Loc.end.column)
        )
      );
    });

    it("Run Keywords  Keyword1  param1  AND  Keyword2  param2", () => {
      const calleeLoc = createLocation(0, 0, 0, 12);
      const kw1Loc = createLocation(0, 14, 0, 22);
      const param1Loc = createLocation(0, 24, 0, 29);
      const andLoc = createLocation(0, 31, 0, 34);
      const kw2Loc = createLocation(0, 36, 0, 44);
      const param2Loc = createLocation(0, 46, 0, 51);

      const cells = [
        new DataCell("Run Keywords", calleeLoc),
        new DataCell("Keyword1", kw1Loc),
        new DataCell("param1", param1Loc),
        new DataCell("AND", andLoc),
        new DataCell("Keyword2", kw2Loc),
        new DataCell("param2", param2Loc),
      ];

      const actual = parseCallExpression(cells);

      chai.assert.deepEqual(
        actual,
        new CallExpression(
          new Identifier("Run Keywords", calleeLoc),
          [
            new CallExpression(
              new Identifier("Keyword1", kw1Loc),
              [new Literal("param1", param1Loc)],
              createLocation(
                kw1Loc.start.line,
                kw1Loc.start.column,
                param1Loc.end.line,
                param1Loc.end.column
              )
            ),
            new Literal("AND", andLoc),
            new CallExpression(
              new Identifier("Keyword2", kw2Loc),
              [new Literal("param2", param2Loc)],
              createLocation(
                kw2Loc.start.line,
                kw2Loc.start.column,
                param2Loc.end.line,
                param2Loc.end.column
              )
            ),
          ],
          createLocation(0, 0, 0, param2Loc.end.column)
        )
      );
    });
  });
});
