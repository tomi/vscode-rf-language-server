import * as _ from "lodash";

import { DataCell } from "./table-models";

import { location } from "./position-helper";

import {
  Identifier,
  NamespacedIdentifier,
  Literal,
  ValueExpression,
  CallExpression,
  VariableExpression,
  VariableKind,
  TemplateLiteral,
  TemplateElement,
  Expression,
} from "./models";

const VARIABLE_KINDS = new Map([
  ["$", "Scalar"],
  ["@", "List"],
  ["&", "Dictionary"],
  ["%", "Environment"],
]);

export type StringParseResultKind = "string" | "var";

export interface StringParseResult {
  name: string;
  type: string;
  start: number;
  end: number;
  kind: string;
  value: string;
}

const KWS_WITH_KW_AS_FIRST_ARG = new Set([
  "run keyword",
  "run keyword and continue on failure",
  "run keyword and ignore error",
  "run keyword and return",
  "run keyword and return status",
  "run keyword if all critical tests passed",
  "run keyword if all tests passed",
  "run keyword if any critical tests failed",
  "run keyword if any tests failed",
  "run keyword if test failed",
  "run keyword if test passed",
  "run keyword if timeout occurred",
]);

const KWS_WITH_KW_AS_SECOND_ARG = new Set([
  "run keyword and expect error",
  "run keyword and return if",
  "run keyword if",
  "run keyword unless",
]);

const KWS_WITH_KW_AS_THIRD_ARG = new Set(["wait until keyword succeeds"]);

const RUN_MULTIPLE_KWS_KW = "run keywords";

function getTemplateElement(
  parseResult: StringParseResult,
  cell: DataCell
): TemplateElement {
  const { value, start, end } = parseResult;

  const loc = location(
    cell.location.start.line,
    cell.location.start.column + start,
    cell.location.start.line,
    cell.location.start.column + end
  );

  return new TemplateElement(value, loc);
}

function getVariableExpression(
  parseResult: StringParseResult,
  cell: DataCell
): VariableExpression {
  const { type, name, start, end } = parseResult;

  return new VariableExpression(
    new Identifier(
      name,
      location(
        cell.location.start.line,
        cell.location.start.column + start + 2,
        cell.location.start.line,
        cell.location.start.column + end - 1
      )
    ),
    VARIABLE_KINDS.get(type) as VariableKind,
    location(
      cell.location.start.line,
      cell.location.start.column + start,
      cell.location.start.line,
      cell.location.start.column + end
    )
  );
}

function getTemplateLiteral(
  parseResult: StringParseResult[],
  cell: DataCell
): TemplateLiteral {
  const [quasisParts, expressionParts] = _.partition(
    parseResult,
    r => r.kind === "string"
  );

  const quasis = quasisParts.map(part => getTemplateElement(part, cell));
  const expressions = expressionParts.map(part =>
    getVariableExpression(part, cell)
  );

  return new TemplateLiteral(quasis, expressions, cell.location);
}

export function parseVariableString(
  stringToParse: string
): StringParseResult[] {
  const typeAndNameRegex = /([$,@,%,&]){([^}]+)}/g;
  const parts = [];

  let index = 0;
  let match = typeAndNameRegex.exec(stringToParse);
  while (match) {
    if (index < match.index) {
      parts.push({
        name: null,
        type: null,
        start: index,
        end: match.index,
        kind: "string",
        value: stringToParse.substring(index, match.index),
      });
    }

    const [matchedStr, type, name] = match;
    parts.push({
      name,
      type,
      value: matchedStr,
      start: match.index,
      end: typeAndNameRegex.lastIndex,
      kind: "var",
    });

    index = typeAndNameRegex.lastIndex;
    match = typeAndNameRegex.exec(stringToParse);
  }

  if (index < stringToParse.length) {
    parts.push({
      name: null,
      type: null,
      start: index,
      end: stringToParse.length,
      kind: "string",
      value: stringToParse.substring(index, stringToParse.length),
    });
  }

  return parts;
}

function getNamespaceAndName(value: string): [string, string] {
  // Matches explicitly namespaced keyword calls
  // For example:
  // BuiltIn.Run Keyword              --> ["BuiltIn",             "Run Keyword"]
  // com.company.Library.Some Keyword --> ["com.company.Library", "Some Keyword"]
  // See http://robotframework.org/robotframework/latest/RobotFrameworkUserGuide.html#handling-keywords-with-same-names
  const indexOfLastDot = value.lastIndexOf(".");

  return [value.slice(0, indexOfLastDot), value.slice(indexOfLastDot + 1)];
}

export function parseIdentifier(cell: DataCell): Identifier {
  return new Identifier(cell.content, cell.location);
}

export function parseNamespacedIdentifier(
  cell: DataCell
): NamespacedIdentifier {
  const [namespace, keyword] = getNamespaceAndName(cell.content);

  return new NamespacedIdentifier(namespace, keyword, cell.location);
}

export function parseNamespacedOrNormalIdentifier(
  cell: DataCell
): Identifier | NamespacedIdentifier {
  if (cell.content.includes(".")) {
    return parseNamespacedIdentifier(cell);
  } else {
    return parseIdentifier(cell);
  }
}

export function parseValueExpression(cell: DataCell): ValueExpression {
  if (!cell) {
    return null;
  }

  const parseResult = parseVariableString(cell.content);

  if (_.isEmpty(parseResult)) {
    return new Literal("", cell.location);
  } else if (parseResult.length === 1) {
    // Literal or VariableExpression
    const result = _.head(parseResult);
    if (result.kind === "var") {
      return getVariableExpression(result, cell);
    } else {
      return new Literal(result.value, cell.location);
    }
  } else {
    // Template literal
    return getTemplateLiteral(parseResult, cell);
  }
}

/**
 * Parses a call expression, such as:
 *
 * Keyword To Call  param1  param2
 */
export function parseCallExpression(cells: DataCell[]): CallExpression {
  if (cells.length === 0) {
    return null;
  }

  const [firstCell, ...argCells] = cells;
  const lastCell = cells[cells.length - 1];

  const callee = parseNamespacedOrNormalIdentifier(firstCell);
  const args = _parseCallExpressionArgs(callee.name, argCells);

  return new CallExpression(callee, args, {
    start: firstCell.location.start,
    end: lastCell.location.end,
  });
}

function _parseCallExpressionArgs(
  calleeName: string,
  argCells: DataCell[]
): Expression[] {
  if (argCells.length === 0) {
    return [];
  }

  const calleeNameInLower = calleeName.toLowerCase();

  if (KWS_WITH_KW_AS_FIRST_ARG.has(calleeNameInLower)) {
    return [parseCallExpression(argCells)];
  }

  if (KWS_WITH_KW_AS_SECOND_ARG.has(calleeNameInLower)) {
    const [firstArg, ...restArgs] = argCells;
    const parsedFirstArgs = parseValueExpression(firstArg);

    return restArgs.length === 0
      ? [parsedFirstArgs]
      : [parsedFirstArgs, parseCallExpression(restArgs)];
  }

  if (KWS_WITH_KW_AS_THIRD_ARG.has(calleeNameInLower)) {
    const [firstArg, secondArg, ...restArgs] = argCells;
    const parsedFirstArgs = parseValueExpression(firstArg);
    const parsedSecondArgs = parseValueExpression(secondArg);
    return restArgs.length === 0
      ? [parsedFirstArgs, parsedSecondArgs]
      : [parsedFirstArgs, parsedSecondArgs, parseCallExpression(restArgs)];
  }

  if (calleeNameInLower === RUN_MULTIPLE_KWS_KW) {
    return _parseMultiKeywordCall(argCells);
  }

  return argCells.map(parseValueExpression);
}

function _parseMultiKeywordCall(argCells: DataCell[]): Expression[] {
  if (argCells.every(cell => !_isKeywordSeparator(cell))) {
    // Not a single AND => All args are keywords (=call expressions)
    return argCells.map(argCell => parseCallExpression([argCell]));
  }

  // There's at least one AND => Parse keywords separated by them
  const args: Expression[] = [];
  let gatheredCells: DataCell[] = [];

  for (const cell of argCells) {
    if (_isKeywordSeparator(cell)) {
      if (gatheredCells.length > 0) {
        args.push(parseCallExpression(gatheredCells));
      }

      args.push(new Literal(cell.content, cell.location));
      gatheredCells = [];
    } else {
      gatheredCells.push(cell);
    }
  }

  if (gatheredCells.length > 0) {
    args.push(parseCallExpression(gatheredCells));
  }

  return args;
}

function _isKeywordSeparator(cell: DataCell) {
  return cell.content.toUpperCase() === "AND";
}
