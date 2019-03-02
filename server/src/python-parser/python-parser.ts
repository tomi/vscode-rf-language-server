import * as _ from "lodash";

import {
  Identifier,
  Literal,
  Arguments,
  ScalarDeclaration,
  UserKeyword,
  KeywordsTable,
  TestSuite,
  NamespacedIdentifier,
} from "../parser/models";
import { Range } from "../utils/position";

/**
 * Parser for python files
 */
export class PythonParser {
  /**
   * Parses function as keywords from given python file contents
   *
   * @param data python file contents
   * @param filePath
   */
  public parseFile(data: string, namespace: string): TestSuite {
    const lineIndexes = getLineIndexes(data);
    const suiteRange = createRange(_.first(lineIndexes), _.last(lineIndexes));

    const keywords = findKeywords(namespace, data, lineIndexes);

    return Object.assign(new TestSuite(suiteRange), {
      keywordsTable: Object.assign(new KeywordsTable(suiteRange), {
        keywords,
      }),
    });
  }
}

const REQUIRED_WS = "(?:\\s+)";
const OPTIONAL_WS = "(?:\\s*)";
const FUNCTION_NAME = "(\\S+?)";
const ARGS = "(.*?)";
const FUNCTION_DECLARATION_REGEX =
  "(?:^|\\s)" +
  "def" +
  REQUIRED_WS +
  FUNCTION_NAME +
  OPTIONAL_WS +
  "\\(" +
  ARGS +
  "\\):";

function isCommentedOut(data: string, startIdx: number) {
  const earlierLineBreak = data.lastIndexOf("\n", startIdx);
  const earlierComment = data.lastIndexOf("#", startIdx);

  return earlierComment > earlierLineBreak;
}

interface LineInfo {
  line: number;
  start: number;
  end: number;
}

/**
 * Returns the start and end index of each line
 *
 * @param data
 */
function getLineIndexes(data: string): LineInfo[] {
  const lines = [];
  const regex = /\n|\r\n/g;
  let lineNumber = 0;
  let lastIndex = 0;

  findMatches(
    () => regex.exec(data),
    (result: RegExpExecArray) => {
      lines.push({
        line: lineNumber++,
        start: lastIndex,
        end: result.index,
      });

      lastIndex = result.index + result[0].length;
    }
  );

  lines.push({
    line: lineNumber++,
    start: lastIndex,
    end: data.length,
  });

  return lines;
}

/**
 * Calls 'getMatchFn' to get a result and calls 'cb' with
 * the result until 'getMatchFn' returns null
 *
 * @param getMatchFn
 * @param cb
 */
function findMatches(getMatchFn: Function, cb: Function) {
  let result = getMatchFn();

  while (result !== null) {
    cb(result);

    result = getMatchFn();
  }
}

function createPosition(line: number, column: number) {
  return {
    line,
    column,
  };
}

function createRange(startLine: LineInfo, endLine: LineInfo) {
  return {
    start: createPosition(startLine.line, startLine.start),
    end: createPosition(endLine.line, endLine.end - endLine.start),
  };
}

function findRange(lineIndexes: LineInfo[], startIdx: number, endIdx: number) {
  let start;

  const isIndexOnLine = (line: LineInfo, idx: number) =>
    line.start <= idx && idx <= line.end;

  for (const lineInfo of lineIndexes) {
    if (isIndexOnLine(lineInfo, startIdx)) {
      start = createPosition(lineInfo.line, startIdx - lineInfo.start);
    }
    if (isIndexOnLine(lineInfo, endIdx)) {
      const end = createPosition(lineInfo.line, endIdx - lineInfo.start);

      return {
        start,
        end,
      };
    }
  }

  return null;
}

/**
 * Should function with given name be excluded
 *
 * @param keywordName
 */
function excludeKeyword(keywordName: string) {
  // Exclude private keywords
  return keywordName.startsWith("_");
}

function startsWithWs(str: string) {
  return (
    str.startsWith(" ") ||
    str.startsWith("\t") ||
    str.startsWith("\n") ||
    str.startsWith("\r")
  );
}

function findKeywords(
  namespace: string,
  data: string,
  lineIndexes: LineInfo[]
) {
  const keywords: UserKeyword[] = [];
  const regex = new RegExp(FUNCTION_DECLARATION_REGEX, "mg");

  const matcherFn = () => regex.exec(data);
  findMatches(matcherFn, (result: RegExpExecArray) => {
    const [fullMatch, name, argsStr] = result;

    if (excludeKeyword(name)) {
      return;
    }

    if (isCommentedOut(data, result.index)) {
      return;
    }

    let startIdx = result.index;
    const endIdx = startIdx + fullMatch.length;
    if (startsWithWs(fullMatch)) {
      startIdx++;
    }

    const keywordRange = findRange(lineIndexes, startIdx, endIdx);

    const args = parseArguments(argsStr, keywordRange);

    const keyword = Object.assign(
      new UserKeyword(new NamespacedIdentifier(namespace, name, keywordRange)),
      { location: keywordRange }
    );

    if (!_.isEmpty(args)) {
      keyword.arguments = args;
    }

    keywords.push(keyword);
  });

  return keywords;
}

/**
 * Parses arguments from given string
 *
 * @param args   Argument names comma separated
 * @param range
 */
function parseArguments(args: string, range: Range) {
  // Python class instance args are ignore
  const isSelfArg = (arg: string, idx: number) => arg === "self" && idx === 0;

  const argumentDeclarations = args
    .split(",")
    .map(arg => arg.trim())
    .filter((arg, idx) => !_.isEmpty(arg) && !isSelfArg(arg, idx))
    .map(argumentName => {
      let value: string;

      if (argumentName.includes("=")) {
        const nameAndValue = argumentName.split("=");

        argumentName = nameAndValue[0];
        value = nameAndValue[1];
      }

      // Assume all arguments are scalars with lack of better knowledge
      return new ScalarDeclaration(
        new Identifier(argumentName, range),
        new Literal(value, range),
        range
      );
    });

  if (argumentDeclarations.length === 0) {
    return undefined;
  }

  return new Arguments(new Identifier("", range), argumentDeclarations, range);
}
