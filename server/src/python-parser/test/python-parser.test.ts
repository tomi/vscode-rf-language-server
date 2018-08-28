import * as _ from "lodash";
import * as chai from "chai";

import { PythonParser } from "../python-parser";

import {
  TestSuite,
  KeywordsTable,
  UserKeyword,
  Identifier,
  Arguments,
  ScalarDeclaration,
  Literal
} from "../../parser/models";

export function location(startLine, startColumn, endLine?, endColumn?) {
  if (_.isObject(startLine) && _.isObject(startColumn)) {
    return {
      start: startLine,
      end: startColumn
    };
  }

  return {
    start: { line: startLine, column: startColumn },
    end:   { line: endLine, column:   endColumn },
  };
}

const parser = new PythonParser();

function parseAndAssert(data: string, expected: any) {
  const actual = parser.parseFile(data, undefined as string);

  chai.assert.deepEqual(actual, expected);
}

function createSuite(location, keywords) {
  return Object.assign(new TestSuite(location), {
    keywordsTable: Object.assign(new KeywordsTable(undefined, location), {
      keywords
    })
  });
}

function createKeyword(keywordName: string, location, args?: Array<[string, string]>) {
  const keyword = new UserKeyword(new Identifier(keywordName, location));
  keyword.location = location;

  if (args) {
    keyword.arguments = new Arguments(
      new Identifier("", location),
      args.map(([argName, value]) => new ScalarDeclaration(
          new Identifier(argName, location),
          new Literal(value, location),
          location
        )
      ),
      location
    );
  }

  return keyword;
}

describe("PythonParser", () => {
  it("should parse function without args", () => {
    const data = "def name():\n  print('hello')";

    const expected = createSuite(location(0, 0, 1, 16), [
      createKeyword("name", location(0, 0, 0, 11))
    ]);

    parseAndAssert(data, expected);
  });

  it("should parse function with one argument", () => {
    const data = "def name(arg1):\n  print('hello')";

    const expected = createSuite(location(0, 0, 1, 16), [
      createKeyword("name", location(0, 0, 0, 15), [["arg1", undefined]])
    ]);

    parseAndAssert(data, expected);
  });

  it("should parse argument default value", () => {
    const data = "def name(arg1=200):\n  print('hello')";

    const expected = createSuite(location(0, 0, 1, 16), [
      createKeyword("name", location(0, 0, 0, 19), [["arg1", "200"]])
    ]);

    parseAndAssert(data, expected);
  });

  it("should skip self argument", () => {
    const data = "def name(self):\n  print('hello')";

    const expected = createSuite(location(0, 0, 1, 16), [
      createKeyword("name", location(0, 0, 0, 15))
    ]);

    parseAndAssert(data, expected);
  });

  it("should skip commented out function", () => {
    const data = "# def name():\n  print('hello')";
    const expected = createSuite(location(0, 0, 1, 16), []);

    parseAndAssert(data, expected);
  });

  it("should skip private function", () => {
    const data = "def _private():\n  print('hello')";
    const expected = createSuite(location(0, 0, 1, 16), []);

    parseAndAssert(data, expected);
  });

  it("should ignore whitespace before the function", () => {
    const data = "   def name(arg1):\n  print('hello')";

    const expected = createSuite(location(0, 0, 1, 16), [
      createKeyword("name", location(0, 3, 0, 18), [["arg1", undefined]])
    ]);

    parseAndAssert(data, expected);
  });
});
