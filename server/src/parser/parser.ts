import * as _ from "lodash";
import {
  Import,
  Setting,
  SingleValueSetting,
  TestDataFile,
  SettingsTable,
} from "./models";

class DataRow {
  public cells: string[];

  constructor(cells: string[]) {
    this.cells = cells;
  }
}

/**
 * Parses plain text format tables
 */
class TextFormatReader {
  constructor(private populator: TablePopulator) {
  }

  public parse(data: string) {
    const lines = data.match(/[^\r\n]+/g);

    lines.forEach((line) => {
      const row = this.parseLine(line);

      if (this.isTableNameRow(row)) {
        const tableName = this.parseTableName(row);

        this.populator.startTable(tableName);
      } else {
        this.populator.populateRow(row);
      }
    });
  }

  private parseLine(line: string) {
    line = line.replace(/\t/g, "  ");

    const cells = line.split(/ {2,}/);

    return new DataRow(cells);
  }

  private isTableNameRow(row: DataRow) {
    return row.cells[0].startsWith("*");
  }

  private parseTableName(row: DataRow) {
    const nonStarCells = row.cells.map((cell) => cell.replace(/\*/g, "").trim())
      .filter((cell) => !_.isEmpty(cell));

    return _.first(nonStarCells);
  }
}

interface ModelPopulator {
  model;

  populateRow(row: DataRow);
};

interface TablePopulator extends ModelPopulator {
  startTable(type: string);

  endOfFile();
}

interface Reader {

};

class NullPopulator implements ModelPopulator {
  public model = null;

  public populateRow(cells: DataRow) {
    // TODO
  }
}

class SettingTablePopulator implements ModelPopulator {
  public name = "settingsTable";
  public model: SettingsTable;

  constructor() {
    this.model = new SettingsTable();
  }

  public populateRow(row: DataRow) {
    const parseTable = new Map([
      ["Resource",       this.populateImport],
      ["Suite Setup",    this.populateSetting("suiteSetup")],
      ["Suite Teardown", this.populateSetting("suiteTeardown")],
      ["Test Setup",     this.populateSetting("testSetup")],
      ["Test Teardown",  this.populateSetting("testTeardown")],
    ]);

    const [name, ...rest] = row.cells;

    const parseMethod = parseTable.get(name);
    if (parseMethod) {
      parseMethod(name, rest);
    }
  }

  private populateImport = (name: string, values: string[]) => {

    this.model.addImport(new Import(name, values[0]));
  }

  private populateSetting(propertyName) {
    return (name: string, values: string[]) => {
      const [value] = values;

      this.model[propertyName] = new SingleValueSetting(name, value);
    };
  }
}

class VariableTablePopulator implements ModelPopulator {
  public model: VariableTablePopulator;

  public populateRow(row: DataRow) {
    // TODO
  }
}

export class FileParser implements TablePopulator {
  private static populatorsConfig = {
    settings: {
      name: "settingsTable",
      PopulatorCtor: SettingTablePopulator,
    },
    variables: {
      name: "variablesTable",
      PopulatorCtor: VariableTablePopulator,
    },
  };

  public name = "file";
  public model: TestDataFile;

  private populator: ModelPopulator;

  constructor() {
    this.populator = new NullPopulator();
  }

  public parse(data: string): TestDataFile {
    this.model = new TestDataFile();

    const reader = new TextFormatReader(this);

    reader.parse(data);

    return this.model;
  }

  public startTable(tableType: string) {
    const populatorConfig = this.getPopulator(tableType);

    if (populatorConfig) {
      this.populator = new populatorConfig.PopulatorCtor();
      this.model[populatorConfig.name] = this.populator.model;
    } else {
      this.populator = null;
    }
  }

  public populateRow(row: DataRow) {
    if (this.populator) {
      this.populator.populateRow(row);
    }
  }

  public endOfFile() {
    // TODO
  }

  private getPopulator(tableType: string) {
    return FileParser.populatorsConfig[tableType.toLowerCase()];
  }
}
