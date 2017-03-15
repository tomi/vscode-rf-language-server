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

function parseVariableExpression(cell: DataCell) {
  const type = cell.content[0];
  const name = cell.content.substring(2, cell.content.length - 1);

  return new VariableExpression(
    new Identifier(name, location(
        cell.location.start.line,
        cell.location.start.column + 2,
        cell.location.start.line,
        cell.location.start.column + 2 + name.length
    )),
    VARIABLE_KINDS.get(type) as VariableKind,
    cell.location
  );
}

function getTemplateElementFromRange(cell: DataCell, start: number, end: number) {
  const rangeContent = cell.content.substring(start, end);
  if (_.isEmpty(rangeContent)) {
    return null;
  }

  const loc = location(
    cell.location.start.line,
    cell.location.start.column + start,
    cell.location.start.line,
    cell.location.start.column + end
  );

  return new TemplateElement(rangeContent, loc);
}

function getVariableExpressionFromRange(cell: DataCell, start: number, end: number) {
  const type = cell.content.substr(start, 1);
  const name = cell.content.substring(start + 2, end - 1);

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

function parseTemplateLiteral(cell: DataCell): TemplateLiteral {
  const typeAndNameRegex = /([$,@,%,&]){([^}]+)}/g;
  let quasis = [];
  let expressions = [];

  let index = 0;
  let match = typeAndNameRegex.exec(cell.content);
  while (match) {
    const element = getTemplateElementFromRange(cell, index, match.index);
    if (element) {
      quasis.push(element);
    }

    const [matchedStr, type, name] = match;
    const variableExpression =
      getVariableExpressionFromRange(cell, match.index, typeAndNameRegex.lastIndex);

    expressions.push(variableExpression);

    index = typeAndNameRegex.lastIndex;
    match = typeAndNameRegex.exec(cell.content);
  }

  const endElement = getTemplateElementFromRange(cell, index, cell.content.length);
  if (endElement) {
    quasis.push(endElement);
  }

  return new TemplateLiteral(quasis, expressions, cell.location);
}

export function parseIdentifier(cell: DataCell): Identifier {
  return new Identifier(cell.content, cell.location);
}

export function parseValueExpression(cell: DataCell): ValueExpression {
  const templateLiteral = parseTemplateLiteral(cell);

  if (_.isEmpty(templateLiteral.expressions)) {
    // Single literal
    const value = _.first(templateLiteral.quasis).value;
    return new Literal(value, cell.location);
  } else if (_.isEmpty(templateLiteral.quasis) &&
    templateLiteral.expressions.length === 1) {
    // Single value expression
    return _.first(templateLiteral.expressions);
  } else {
    // Template literal
    return templateLiteral;
  }
}

export function parseCallExpression(cells: DataCell[]): CallExpression {
  const firstCell = _.first(cells);
  const lastCell = _.last(cells);

  const callee = parseIdentifier(firstCell);
  const args = _.drop(cells, 1).map(parseValueExpression);

  return new CallExpression(callee, args, {
    start: firstCell.location.start,
    end: lastCell.location.end,
  });
}
