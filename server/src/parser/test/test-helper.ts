import * as _ from "lodash";

import { SourceLocation, DataTable, DataRow, DataCell } from "../table-models";

export function position(line, column) {
  return {
    line,
    column,
  };
}

export function createLocation(
  startLine,
  startColumn,
  endLine?,
  endColumn?
): SourceLocation {
  if (_.isObject(startLine) && _.isObject(startColumn)) {
    return {
      start: startLine,
      end: startColumn,
    };
  }

  return {
    start: { line: startLine, column: startColumn },
    end: { line: endLine, column: endColumn },
  };
}

export function table(
  name: string,
  content: { header: DataRow; rows?: DataRow[] }
) {
  const theTable = new DataTable(name, content.header);

  return content.rows
    ? Object.assign(theTable, { rows: content.rows })
    : theTable;
}

export function row(location: SourceLocation, cells?: DataCell[]): DataRow {
  const theRow = new DataRow(location);

  return cells ? Object.assign(theRow, { cells }) : theRow;
}

export function createCell(location: SourceLocation, content: string) {
  return new DataCell(content, location);
}
