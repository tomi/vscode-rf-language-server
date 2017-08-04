import * as _ from "lodash";
import * as chai from "chai";

import { TableReader } from "../table-reader";

import {
  SourceLocation,
  DataTable,
  DataRow,
  DataCell,
} from "../table-models";

import {
  location,
  table,
  row,
} from "./test-helper";

const reader = new TableReader();

function header(text) {
  return row(location(0, 0, 0, text.length), [
    new DataCell(text, location(0, 0, 0, text.length))
  ]);
}

describe("TableReader", () => {
  it("should recognise table name", () => {
    const name = "Table Name";

    const shouldReadName = tableString => {
      const [actual] = reader.read(tableString);

      chai.assert.equal(actual.name, name);
    };

    shouldReadName(`***${ name }***`);
    shouldReadName(`*** ${ name } ***`);
    shouldReadName(`***${ name }`);
    shouldReadName(`*** ${ name }`);
    shouldReadName(`*${ name }`);
    shouldReadName(`* ${ name }`);
  });

  it("should read empty table", () => {
    const data = `*** Table`;

    const actual = reader.read(data);
    const expected = [
      table("Table", {
        header: header(`*** Table`)
      })
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
          row(location(1, 0, 1, 9), [
            new DataCell("", location(1, 0, 1, 0)),
            new DataCell("cell1", location(1, 4, 1, 9))
          ])
        ]
      })
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
          row(location(1, 0, 1, 14), [
            new DataCell("cell1", location(1, 0, 1, 5)),
            new DataCell("cell2", location(1, 9, 1, 14))
          ])
        ]
      })
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
          row(location(1, 0, 1, 9), [
            new DataCell("cell1", location(1, 0, 1, 5)),
          ])
        ]
      })
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
          row(location(1, 0, 1, 0), [
            new DataCell("", location(1, 0, 1, 0))
          ]),
          row(location(2, 0, 2, 14), [
            new DataCell("cell1", location(2, 0, 2, 5)),
            new DataCell("cell2", location(2, 9, 2, 14))
          ]),
        ]
      })
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
