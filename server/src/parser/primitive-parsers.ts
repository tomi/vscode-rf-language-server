import * as _ from "lodash";

import {
  DataTable,
  DataRow,
  DataCell
} from "./table-models";

import {
  location
} from "./position-helper";

import {
  Identifier,
  Literal,
  ValueExpression,
  CallExpression,
  VariableExpression,
  VariableKind,
  TemplateLiteral,
  TemplateElement
} from "./models";

const VARIABLE_KINDS = new Map([
  ["$", "Scalar"],
  ["@", "List"],
  ["&", "Dictionary"],
  ["%", "Environment"]
]);

export type StringParseResultKind = "string" | "var";

export interface StringParseResult {
  name:  string;
  type:  string;
  start: number;
  end:   number;
  kind:  string;
  value: string;
}

function getTemplateElement(parseResult: StringParseResult, cell: DataCell): TemplateElement {
  const { value, start, end } = parseResult;

  const loc = location(
    cell.location.start.line,
    cell.location.start.column + start,
    cell.location.start.line,
    cell.location.start.column + end
  );

  return new TemplateElement(value, loc);
}

function getVariableExpression(parseResult: StringParseResult, cell: DataCell): VariableExpression {
  const { type, name, start, end } = parseResult;

  return new VariableExpression(
    new Identifier(name, location(
        cell.location.start.line,
        cell.location.start.column + start + 2,
        cell.location.start.line,
        cell.location.start.column + end - 1
    )),
    VARIABLE_KINDS.get(type) as VariableKind,
    location(
        cell.location.start.line,
        cell.location.start.column + start,
        cell.location.start.line,
        cell.location.start.column + end
    )
  );
}

function getTemplateLiteral(parseResult: StringParseResult[], cell: DataCell): TemplateLiteral {
    const [quasisParts, expressionParts] =
      _.partition(parseResult, r => r.kind === "string");

    const quasis = quasisParts.map(part => getTemplateElement(part, cell));
    const expressions = expressionParts.map(part => getVariableExpression(part, cell));

    return new TemplateLiteral(quasis, expressions, cell.location);
}

export function parseVariableString(stringToParse: string): StringParseResult[] {
  const typeAndNameRegex = /([$,@,%,&]){([^}]+)}/g;
  let parts = [];

  let index = 0;
  let match = typeAndNameRegex.exec(stringToParse);
  while (match) {
    if (index < match.index) {
      parts.push({
        name:  null,
        type:  null,
        start: index,
        end:   match.index,
        kind:  "string",
        value: stringToParse.substring(index, match.index),
      });
    }

    const [matchedStr, type, name] = match;
    parts.push({
      name,
      type,
      value: matchedStr,
      start: match.index,
      end:   typeAndNameRegex.lastIndex,
      kind:  "var",
    });

    index = typeAndNameRegex.lastIndex;
    match = typeAndNameRegex.exec(stringToParse);
  }

  if (index < stringToParse.length) {
    parts.push({
      name:  null,
      type:  null,
      start: index,
      end:   stringToParse.length,
      kind:  "string",
      value: stringToParse.substring(index, stringToParse.length),
    });
  }

  return parts;
}

export function parseIdentifier(cell: DataCell): Identifier {
  return new Identifier(cell.content, cell.location);
}

export function parseValueExpression(cell: DataCell): ValueExpression {
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

export function parseCallExpression(cells: DataCell[]): CallExpression {
  if (cells.length === 0) {
    return null;
  }

  const firstCell = _.first(cells);
  const lastCell = _.last(cells);

  const callee = parseIdentifier(firstCell);
  const args = _.drop(cells, 1).map(parseValueExpression);

  return new CallExpression(callee, args, {
    start: firstCell.location.start,
    end: lastCell.location.end,
  });
}
