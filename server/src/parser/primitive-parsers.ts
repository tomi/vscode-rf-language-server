import * as _ from "lodash";

import {
  DataTable,
  DataRow,
  DataCell
} from "./table-models";

import {
  Identifier,
  Literal,
  ValueExpression,
  CallExpression
} from "./models";

export function parseIdentifier(cell: DataCell): Identifier {
  return new Identifier(cell.content, cell.location);
}

export function parseValueExpression(cell: DataCell): ValueExpression {
  // TODO: Parse identifiers and template literals
  return new Literal(cell.content, cell.location);
}

export function parseCallExpression(cells: DataCell[]): CallExpression {
  const firstCell = _.first(cells);
  const lastCell = _.last(cells);

  const callee = parseIdentifier(_.first(cells));
  const args = _.drop(cells, 1).map(parseValueExpression);

  return new CallExpression(callee, args, {
    start: firstCell.location.start,
    end: lastCell.location.end,
  });
}
