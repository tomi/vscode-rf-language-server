import * as _ from "lodash";

import {
  Position,
  SourceLocation,
  DataTable,
  DataRow,
  DataCell
} from "../table-models";

export function position(line, column) {
  return {
    line,
    column
  };
}

export function location(startLine, startColumn, endLine?, endColumn?): SourceLocation {
  if (_.isObject(startLine) && _.isObject(startColumn)) {
    return {
      start: startLine,
      end: startColumn
    };
  }

  return {
    start: { line: startLine, column: startColumn },
    end:   { line: endLine, column:   endColumn },
  };
}

export function table(name: string, content: { header: DataRow, rows?: DataRow[] }) {
  const table = new DataTable(name, content.header);

  return content.rows ? Object.assign(table, { rows: content.rows }) : table;
}

export function row(location: SourceLocation, cells?: DataCell[]): DataRow {
  const row = new DataRow(location);

  return cells ? Object.assign(row, { cells }) : row;
}

export function cell(location: SourceLocation, content: string) {
  return new DataCell(content, location);
}
