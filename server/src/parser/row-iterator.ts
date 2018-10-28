import * as _ from "lodash";

import { DataTable, DataRow } from "./table-models";

export class TableRowIterator {
  private rowIdx: number = 0;

  constructor(private table: DataTable) {}

  public isDone(): boolean {
    return this.rowIdx >= this.table.rows.length;
  }

  public advance(): boolean {
    this.rowIdx++;

    return this.isDone();
  }

  /**
   * Takes one row and advances the iterator
   */
  public takeRow(): DataRow {
    return this.table.rows[this.rowIdx++];
  }

  /**
   * Takes one row without advancing the iterator
   */
  public peekRow(): DataRow {
    return this.table.rows[this.rowIdx];
  }

  /**
   * Takes current row and as many rows until predicateFn
   * returns false for some row
   *
   * @param predicateFn
   */
  public takeRowWhile(predicateFn: (row: DataRow) => boolean): DataRow[] {
    const rows = [];

    let row = this.peekRow();
    while (row && predicateFn(row)) {
      this.rowIdx++;
      rows.push(row);

      row = this.peekRow();
    }

    return rows;
  }
}
