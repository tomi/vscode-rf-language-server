import * as _ from "lodash";
import * as chai from "chai";

import {
  SourceLocation,
  TableReader,
  DataTable,
  DataRow,
  DataCell
} from "../table-reader";

const reader = new TableReader();

function location(startLine, startColumn, endLine, endColumn): SourceLocation {
  return {
    start: { line: startLine, column: startColumn },
    end:   { line: endLine, column:   endColumn },
  };
}

function table(name: string, header: DataRow, rows?: DataRow[]) {
  const table = new DataTable(name, header);

  return rows ? Object.assign(table, { rows }) : table;
}

function row(location: SourceLocation, cells?: DataCell[]): DataRow {
  const row = new DataRow(location);

  return cells ? Object.assign(row, { cells }) : row;
}

describe.only("TableReader", () => {
  it("Should read empty table", () => {
    const data = `*** Table`;

    const actual = reader.read(data);
    const expected = [
      table("Table",
        row(location(0, 0, 0, 9), [
          new DataCell("*** Table", location(0, 0, 0, 9))
        ])
      )
    ];

    chai.assert.deepEqual(actual, expected);
  });

  it("should read single table", () => {
    const data = `*** Table\ncell1    cell2`;

    const actual = reader.read(data);

    const expected = [
      table("Table",
        row(location(0, 0, 0, 9), [new DataCell("*** Table", location(0, 0, 0, 9))]),
        [
          row(location(1, 0, 1, 14), [
            new DataCell("cell1", location(1, 0, 1, 5)),
            new DataCell("cell2", location(1, 9, 1, 14))
          ])
        ]
      )
    ];

    chai.assert.deepEqual(actual, expected);
  });

  it("should skip comments", () => {
    const data = `*** Table # Inline comment\n#Comment line\ncell1    cell2`;

    const actual = reader.read(data);

    const expected = [
      table("Table",
        row(location(0, 0, 0, 10), [
          new DataCell("*** Table ", location(0, 0, 0, 10))
        ]),
        [
          row(location(1, 0, 1, 0), [
            new DataCell("", location(1, 0, 1, 0))
          ]),
          row(location(2, 0, 2, 14), [
            new DataCell("cell1", location(2, 0, 2, 5)),
            new DataCell("cell2", location(2, 9, 2, 14))
          ]),
        ]
      )
    ];

    chai.assert.deepEqual(actual, expected);
  });

  it("should ignore lines outside table", () => {
    const data = `Not in a table\nAnother outside table`;

    const actual = reader.read(data);
    const expected = [];

    chai.assert.deepEqual(actual, expected);
  });
});
