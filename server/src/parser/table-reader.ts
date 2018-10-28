import * as _ from "lodash";

import { DataTable, DataRow, DataCell } from "./table-models";

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
    return row
      .first()
      .content.trim()
      .startsWith("*");
  }

  private readTableName(row: DataRow) {
    return row
      .first()
      .content.replace(/\*/g, "")
      .trim();
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
    this.line = this.trimComments(line);
    this.position = 0;

    const row = new DataRow({
      start: {
        line: lineNumber,
        column: 0,
      },
      end: {
        line: lineNumber,
        column: this.line.length,
      },
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
      // Escaped number sign doesn't start a comment
      if (line.charAt(possibleStartIdx - 1) !== "\\") {
        return possibleStartIdx;
      }

      possibleStartIdx = line.indexOf("#", possibleStartIdx + 1);
    }

    return -1;
  }

  private endOfCellIdx() {
    const cellSeparators = ["  ", " \t", "\t"];

    const separatorIndexes = cellSeparators
      .map(sep => this.line.indexOf(sep, this.position))
      .filter(index => index !== -1);
    const smallestIdx = _.min(separatorIndexes);

    return smallestIdx !== undefined ? smallestIdx : this.line.length;
  }

  /**
   * Reads a cell starting from current position and
   * advances the position.
   */
  private readCell() {
    const endOfCellIdx = this.endOfCellIdx();

    const cellContent = this.line.substring(this.position, endOfCellIdx);
    const cell = new DataCell(cellContent, {
      start: {
        line: this.lineNumber,
        column: this.position,
      },
      end: {
        line: this.lineNumber,
        column: endOfCellIdx,
      },
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
