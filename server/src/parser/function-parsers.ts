import * as _ from "lodash";

import * as positionHelper from "./position-helper";
import { DataCell } from "./table-models";
import { Step } from "./models";
import { parseCallExpression } from "./primitive-parsers";

import {
  isVariable,
  parseTypeAndName,
  parseVariableDeclaration,
} from "./variable-parsers";

export function parseStep(
  firstDataCell: DataCell,
  restDataCells: DataCell[]
): Step {
  let stepContent;

  const lastCell = _.last(restDataCells) || firstDataCell;
  const stepLocation = positionHelper.locationFromStartEnd(
    firstDataCell.location,
    lastCell.location
  );

  if (isVariable(firstDataCell)) {
    const typeAndName = parseTypeAndName(firstDataCell);
    const callExpression = parseCallExpression(restDataCells);

    stepContent = parseVariableDeclaration(
      typeAndName,
      [callExpression],
      stepLocation
    );
  } else {
    stepContent = parseCallExpression([firstDataCell, ...restDataCells]);
  }

  return new Step(stepContent, stepLocation);
}
