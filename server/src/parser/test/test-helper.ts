import * as _ from "lodash";

import { SourceLocation, DataTable, DataRow, DataCell } from "../table-models";
export {
  position as createPosition,
  location as createLocation,
} from "../position-helper";

// export const position = createPosition;

// export const createLocation = location;

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
