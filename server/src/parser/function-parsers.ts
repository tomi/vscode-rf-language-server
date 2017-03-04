import * as _ from "lodash";

import {
  DataTable,
  DataRow
} from "./table-models";

import {
  Step,
  CallExpression
} from "./models";

import {
  parseIdentifier,
  parseValueExpression,
} from "./primitive-parsers";

import {
  isVariable,
  parseTypeAndName,
  parseVariableDeclaration
} from "./variable-parsers";

export function parseStep(row: DataRow) {
  const firstDataCell = row.getCellByIdx(1);
  const valueExpressions = row.getCellsByRange(2).map(parseValueExpression);

  let stepContent;

  if (isVariable(firstDataCell)) {
    const typeAndName = parseTypeAndName(firstDataCell);
    stepContent =
      parseVariableDeclaration(typeAndName, valueExpressions, row.location);
  } else {
    const identifier = parseIdentifier(row.getCellByIdx(1));

    stepContent = new CallExpression(identifier, valueExpressions, row.location);
  }

  return new Step(stepContent, row.location);
}
