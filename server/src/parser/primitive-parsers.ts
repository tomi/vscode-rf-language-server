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
  CallExpression,
  VariableExpression,
  VariableKind
} from "./models";

const VARIABLE_KINDS = new Map([
  ["$", "Scalar"],
  ["@", "List"],
  ["&", "Dictionary"],
  ["%", "Environment"]
]);

export function parseIdentifier(cell: DataCell): Identifier {
  return new Identifier(cell.content, cell.location);
}

export function parseValueExpression(cell: DataCell): ValueExpression {
  const typeAndNameRegex = /([$,@,%,&]){([^}]+)}/;

  if (!typeAndNameRegex.test(cell.content)) {
    return new Literal(cell.content, cell.location);
  }

  const result = cell.content.match(typeAndNameRegex);
  if (result[0] === result.input) {
    const [__, type, name] = result;

    return new VariableExpression(
      new Identifier(name, {
        start: {
          line: cell.location.start.line,
          column: cell.location.start.column + 2
        },
        end: {
          line: cell.location.start.line,
          column: cell.location.start.column + 2 + name.length
        }
      }),
      VARIABLE_KINDS.get(type) as VariableKind,
      cell.location
    );
  } else {
    // TODO: Parse TemplateLiteral
  }
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
