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
  constructor(public name: string, public header: DataRow) {}

  public get location(): SourceLocation {
    if (_.isEmpty(this.rows)) {
      return this.header.location;
    }

    const lastRow = _.last(this.rows);

    return {
      start: this.header.location.start,
      end: lastRow.location.end,
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

  constructor(public location: SourceLocation) {}

  /**
   * Returns the first cell
   */
  public first() {
    return _.first(this.cells);
  }

  /**
   * Returns the last cell
   */
  public last() {
    return _.last(this.cells);
  }

  /**
   * Returns the (0 based) index of given cell or -1 if not found
   *
   * @param cell  Cell to find
   */
  public indexOf(cell: DataCell) {
    return this.cells.indexOf(cell);
  }

  /**
   * Is the row empty. Row is empty if all its cells are empty
   */
  public isEmpty() {
    return _.every(this.cells, cell => cell.isEmpty());
  }

  /**
   * Tests if row begins with empty cells and ...
   *
   * @param requireFirstEmpty - Is at least one empty cell required
   */
  public isRowContinuation({ requireFirstEmpty = false } = {}) {
    if (requireFirstEmpty && !this.first().isEmpty()) {
      return false;
    }

    for (const cell of this.cells) {
      if (cell.isRowContinuation()) {
        return true;
      } else if (!cell.isEmpty()) {
        return false;
      }
    }

    return false;
  }

  /**
   * Returns the cell with given index
   */
  public getCellByIdx(index: number): DataCell {
    return this.cells[index];
  }

  /**
   * Returns a range of cells
   */
  public getCellsByRange(startIdx: number, endIdx?: number): DataCell[] {
    return this.cells.slice(startIdx, endIdx);
  }

  /**
   * Add a cell
   */
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
  constructor(public content: string, public location: SourceLocation) {}

  /**
   * Is the cell empty. Cell is empty if it's only whitespace or
   * only a single backslash
   */
  public isEmpty() {
    return /^(\s*|\\)$/.test(this.content);
  }

  public isRowContinuation() {
    return /^\.\.\.$/.test(this.content);
  }
}
