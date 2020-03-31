import * as _ from "lodash";
import * as chai from "chai";

import { TableReader } from "../table-reader";

import { DataCell, DataTable } from "../table-models";

import { createLocation, table, row } from "./test-helper";

const reader = new TableReader();

function header(text: string) {
  return headerWithStartIndex(text, 0);
}

function headerWithStartIndex(text: string, start: number) {
  return row(createLocation(0, 0, 0, start + text.length), [
    new DataCell(text, createLocation(0, start, 0, start + text.length)),
  ]);
}

describe("TableReader", () => {
  it("should recognise table name", () => {
    const name = "Table Name";

    const shouldReadName = (tableString: string) => {
      const [actual] = reader.read(tableString);

      chai.assert.equal(actual.name, name);
    };

    shouldReadName(`***${name}***`);
    shouldReadName(`*** ${name} ***`);
    shouldReadName(`***${name}`);
    shouldReadName(`*** ${name}`);
    shouldReadName(`*${name}`);
    shouldReadName(`* ${name}`);
  });

  it("should read empty table", () => {
    const data = `*** Table`;

    const actual = reader.read(data);
    const expected = [
      table("Table", {
        header: header(`*** Table`),
      }),
    ];

    chai.assert.deepEqual(actual, expected);
  });

  it("should parse empty first cell", () => {
    const data = `*Table\n    cell1`;

    const actual = reader.read(data);

    const expected = [
      table("Table", {
        header: header("*Table"),
        rows: [
          row(createLocation(1, 0, 1, 9), [
            new DataCell("", createLocation(1, 0, 1, 0)),
            new DataCell("cell1", createLocation(1, 4, 1, 9)),
          ]),
        ],
      }),
    ];

    chai.assert.deepEqual(actual, expected);
  });

  it("should read single table", () => {
    const data = `*** Table\ncell1    cell2`;

    const actual = reader.read(data);

    const expected = [
      table("Table", {
        header: header("*** Table"),
        rows: [
          row(createLocation(1, 0, 1, 14), [
            new DataCell("cell1", createLocation(1, 0, 1, 5)),
            new DataCell("cell2", createLocation(1, 9, 1, 14)),
          ]),
        ],
      }),
    ];

    chai.assert.deepEqual(actual, expected);
  });

  it("should read single table with pipes", () => {
    const data = `| *** Table\n| cell1 | cell2 |`;

    const actual = reader.read(data);

    const expected = [
      table("Table", {
        header: headerWithStartIndex("*** Table", 2),
        rows: [
          row(createLocation(1, 0, 1, 15), [
            new DataCell("cell1", createLocation(1, 2, 1, 7)),
            new DataCell("cell2", createLocation(1, 10, 1, 15)),
          ]),
        ],
      }),
    ];

    chai.assert.deepEqual(actual, expected);
  });

  it("should parse empty first cell with pipes", () => {
    const data = `| *** Table\n| | cell1 | cell2`;

    const actual = reader.read(data);

    const expected = [
      table("Table", {
        header: headerWithStartIndex("*** Table", 2),
        rows: [
          row(createLocation(1, 0, 1, 17), [
            new DataCell("", createLocation(1, 1, 1, 1)),
            new DataCell("cell1", createLocation(1, 4, 1, 9)),
            new DataCell("cell2", createLocation(1, 12, 1, 17)),
          ]),
        ],
      }),
    ];

    chai.assert.deepEqual(actual, expected);
  });

  it("should not remove pipes from names", () => {
    const data = `| *** Table\n| |cell1 | cell2|\n| cell1| | |cell2`;

    const actual = reader.read(data);

    const expected = [
      table("Table", {
        header: headerWithStartIndex("*** Table", 2),
        rows: [
          row(createLocation(1, 0, 1, 17), [
            new DataCell("|cell1", createLocation(1, 2, 1, 8)),
            new DataCell("cell2|", createLocation(1, 11, 1, 17)),
          ]),
          row(createLocation(2, 0, 2, 17), [
            new DataCell("cell1|", createLocation(2, 2, 2, 8)),
            new DataCell("|cell2", createLocation(2, 11, 2, 17)),
          ]),
        ],
      }),
    ];

    chai.assert.deepEqual(actual, expected);
  });

  it("should ignore trailing whitespace", () => {
    const data = `*** Table\ncell1    `;

    const actual = reader.read(data);

    const expected = [
      table("Table", {
        header: header("*** Table"),
        rows: [
          row(createLocation(1, 0, 1, 9), [
            new DataCell("cell1", createLocation(1, 0, 1, 5)),
          ]),
        ],
      }),
    ];

    chai.assert.deepEqual(actual, expected);
  });

  it("should skip comments", () => {
    const data = `*** Table # Inline comment\n#Comment line\ncell1    cell2`;

    const actual = reader.read(data);

    const expected = [
      table("Table", {
        header: header("*** Table "),
        rows: [
          row(createLocation(1, 0, 1, 0), [
            new DataCell("", createLocation(1, 0, 1, 0)),
          ]),
          row(createLocation(2, 0, 2, 14), [
            new DataCell("cell1", createLocation(2, 0, 2, 5)),
            new DataCell("cell2", createLocation(2, 9, 2, 14)),
          ]),
        ],
      }),
    ];

    chai.assert.deepEqual(actual, expected);
  });

  it("should ignore lines outside table", () => {
    const data = `Not in a table\nAnother outside table`;

    const actual = reader.read(data);
    const expected: DataTable[] = [];

    chai.assert.deepEqual(actual, expected);
  });
});
