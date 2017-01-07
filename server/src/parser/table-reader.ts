import * as _ from "lodash";

/**
 * A position in a text
 */
export interface Position {
  line: number;
  column: number;
}

/**
 * A range with start and end position in a text
 */
export interface SourceLocation {
  start: Position;
  end: Position;
}

/**
 * Represents a table with rows
 */
export class DataTable {
  public rows: DataRow[] = [];

  /**
   *
   */
  constructor(
    public name: string,
    private header: DataRow
  ) { }

  public get location(): SourceLocation {
    if (_.isEmpty(this.rows)) {
      return this.header.location;
    }

    const lastRow = _.last(this.rows);

    return {
      start: this.header.location.start,
      end: lastRow.location.end
    };
  }

  public addRow(row: DataRow) {
    this.rows.push(row);
  }
}

/**
 * Represents a row with zero or more cells
 */
export class DataRow {
  public cells: DataCell[] = [];

  constructor(
    public location: SourceLocation
  ) { }

  public first() {
    return _.first(this.cells);
  }

  public last() {
    return _.last(this.cells);
  }

  public isEmpty() {
    return _.every(this.cells, cell => cell.isEmpty());
  }

  public addCell(cell: DataCell) {
    this.cells.push(cell);
  }
}

/**
 * Represents a single cell in a table
 */
export class DataCell {
  /**
   *
   */
  constructor(
    public content: string,
    public location: SourceLocation
  ) { }

  public isEmpty() {
    return /\s/.test(this.content);
  }
};

/**
 * Parses a string of text into data tables
 */
export class TableReader {
  private lineReader: LineReader = new LineReader();

  /**
   *
   */
  public read(data: string) {
    const readTables: DataTable[] = [];
    const lines = data.split(/\r\n|\n|\r/);
    let currentTable: DataTable = null;

    lines.forEach((line, index) => {
      const row = this.lineReader.readLine(index, line);

      if (this.startsTable(row)) {
        const name = this.readTableName(row);
        currentTable = new DataTable(name, row);

        readTables.push(currentTable);
      } else if (currentTable) {
        currentTable.addRow(row);
      }
    });

    return readTables;
  }

  private startsTable(row: DataRow) {
    return row.first().content.trim().startsWith("*");
  }

  private readTableName(row: DataRow) {
    return row.first().content.replace(/\*/g, "").trim();
  }
}

/**
 * Parses a line into a row with cells
 */
class LineReader {
  private position: number = 0;
  private line: string;
  private lineNumber: number;

  public readLine(lineNumber: number, line: string) {
    this.lineNumber = lineNumber;
    this.line       = this.trimComments(line);
    this.position   = 0;

    const row = new DataRow({
      start: {
        line: lineNumber,
        column: 0
      },
      end: {
        line: lineNumber,
        column: this.line.length
      }
    });

    do {
      const cell = this.readCell();

      row.addCell(cell);

      this.readWhitespace();
    } while (!this.isEnd());

    return row;
  }

  private trimComments(line: string) {
    const startOfCommentIdx = this.findStartOfCommentIdx(line);

    if (startOfCommentIdx > -1) {
      return line.substring(0, startOfCommentIdx);
    } else {
      return line;
    }
  }

  private findStartOfCommentIdx(line: string) {
    let possibleStartIdx = line.indexOf("#", 0);

    while (possibleStartIdx > -1) {
      if (line.charAt(possibleStartIdx - 1) !== "\\") {
        return possibleStartIdx;
      }

      possibleStartIdx = line.indexOf("#", possibleStartIdx);
    }

    return -1;
  }

  private endOfCellIdx() {
    const cellSeparators = ["  ", " \t", "\t"];

    const separatorIndexes = cellSeparators
      .map(sep => this.line.indexOf(sep, this.position))
      .filter(index => index !== -1);

    return _.min(separatorIndexes) || this.line.length;
  }

  private readCell() {
    const endOfCellIdx = this.endOfCellIdx();

    const cellContent = this.line.substring(this.position, endOfCellIdx);
    const cell = new DataCell(cellContent, {
      start: {
        line: this.lineNumber,
        column: this.position
      },
      end: {
        line: this.lineNumber,
        column: endOfCellIdx
      }
    });

    this.position = endOfCellIdx;

    return cell;
  }

  private readWhitespace() {
    while (!this.isEnd() && /\s/.test(this.line.charAt(this.position))) {
      this.position = this.position + 1;
    }
  }

  private isEnd() {
    return this.position >= this.line.length;
  }
}
