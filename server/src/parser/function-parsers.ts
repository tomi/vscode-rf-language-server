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
  parseCallExpression,
  parseIdentifier,
} from "./primitive-parsers";

import {
  isVariable,
  parseTypeAndName,
  parseVariableDeclaration
} from "./variable-parsers";

export function parseStep(row: DataRow) {
  const firstDataCell = row.getCellByIdx(1);

  let stepContent;

  if (isVariable(firstDataCell)) {
    const typeAndName = parseTypeAndName(firstDataCell);
    const callExpression = parseCallExpression(row.getCellsByRange(2));

    stepContent =
      parseVariableDeclaration(typeAndName, [callExpression], row.location);
  } else {
    stepContent = parseCallExpression(row.getCellsByRange(1));
  }

  return new Step(stepContent, row.location);
}
