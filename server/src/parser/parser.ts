import _ from "lodash";

class DataRow {
  private cells: string[];

  constructor(cells: string[]) {
    this.cells = cells;
  }
}

class DataTable {
  private rows: DataRow[];

  constructor(private name: string) {
    this.rows = [];
  }

  addRow(row: DataRow) {
    this.rows.push(row);
  }
}

/**
 * Parses plain text format tables
 */
class TextFormatReader {
  constructor(private populator: IPopulator) {

  }

  parse(data: string) {
    const tables: DataTable[] = [];
    const lines = data.match(/[^\r\n]+/g);
    let currentTable : DataTable;

    lines.forEach(line => {
      const cells = this.parseLine(line);

      if (this.isNameRow(cells)) {
        const tableName = this.parseTableName(cells);

        currentTable = new DataTable(tableName);
      } else {
        this.populator.addRow(cells);
      }
    });
  }

  private parseLine(line: string) {
    line = line.replace(/\t/g, "  ");

    const cells = line.split(/ {2,}/);

    return cells;
  }

  private isNameRow(cells: string[]) {
    return cells[0].startsWith("*");
  }

  private parseTableName(cells: string[]) {
    const nonStarCells = cells.map(cell => cell.replace(/\*/g, ""))
      .filter(cell => !_.isEmpty(cell));

      return _.first(nonStarCells);
  }
}

interface IPopulator {
  startTable(type: string),

  addRow(cells: string[])
};

interface IReader {

};

class NullPopulator implements IPopulator {
  startTable(type: string) {

  }

  addRow(cells: string[]) {

  }
}

class FileParser implements IPopulator {
  private populator : IPopulator;
  private reader : IReader;

  constructor() {

  }

  parse(data: string) {
    const reader = new TextFormatReader(this);
  }

  startTable(type: string) {

  }

  addRow(cells: string[]) {

  }
}

class SettingTablePopulator {
  constructor() {

  }
}
