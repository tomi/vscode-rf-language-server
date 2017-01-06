import * as _ from "lodash";
import {
  Import,
  Setting,
  TestDataFile,
  SettingsTable,
  Variable,
  ScalarVariable,
  ListVariable,
  VariableType,
  VariablesTable,
  Step,
  Keyword,
  KeywordsTable,
} from "./models";

class DataRow {
  public cells: string[];

  constructor(cells: string[]) {
    this.cells = cells;
  }

  public head() {
    return this.cells[0];
  }

  public getCellByIdx(idx) {
    return this.cells[idx];
  }

  public drop(n = 1) {
    return _.drop(this.cells, n);
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

      this.model[propertyName] = new Setting(name, value);
    };
  }
}

class VariableTablePopulator implements ModelPopulator {
  public model: VariablesTable;

  /**
   *
   */
  constructor() {
    this.model = new VariablesTable();
  }

  public populateRow(row: DataRow) {
    const variable = this.parseVariable(row);

    if (variable) {
      this.model.addVariable(variable);
    }
  }

  private parseVariable(row: DataRow): Variable {
    const typeNameCell = row.head();
    if (_.isEmpty(typeNameCell)) {
      return null;
    }

    // Matches the type ($, @, % or &) and name
    // For example:
    // ${var} --> ["${var}", "$", "var"]
    // @{var2} = --> ["${var2}", "@", "var2"]
    const [, type, name] = typeNameCell.match(/([$,@,%,&]){([^}]+)}/);

    const typeMapping = {
      "$": ScalarVariable,
      "@": ListVariable,
      // "&": DictionaryVariable,
      // "%": EnvironmentVariable,
    };

    if (type === "$") {
      const value = row.getCellByIdx(1) || "";

      return new ScalarVariable(name, value);
    }
  }
}

class KeywordPopulator implements ModelPopulator {
  public model: Keyword;

  /**
   *
   */
  constructor(name: string) {
    this.model = new Keyword(name);
  }

  public populateRow(row: DataRow) {
    const stepName = row.getCellByIdx(1);
    const args = row.drop(2);

    this.model.addStep(new Step(stepName, args));
  }
}

class KeywordTablePopulator implements ModelPopulator {
  public model: KeywordsTable;
  private keywordPopulator: KeywordPopulator;

  /**
   *
   */
  constructor() {
    this.model = new KeywordsTable();
  }

  public populateRow(row: DataRow) {
    if (this.startsKeyword(row)) {
      const keywordName = row.head();

      this.keywordPopulator = new KeywordPopulator(keywordName);

      this.model.addKeyword(this.keywordPopulator.model);
    } else if (this.keywordPopulator) {
      this.keywordPopulator.populateRow(row);
    }
  }

  private startsKeyword(row: DataRow) {
    return !_.isEmpty(row.head());
  }
}

/**
 *
 */
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
    keywords: {
      name: "keywordsTable",
      PopulatorCtor: KeywordTablePopulator,
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
