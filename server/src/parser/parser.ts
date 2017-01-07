import * as _ from "lodash";
import {
  Import,
  Setting,
  Table,
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
  TestCase,
  TestCasesTable,
  Position
} from "./models";

class DataRow {
  public lineNumber: number;
  public cells: string[];
  public row: string;

  constructor(lineNumber: number, row: string, cells: string[]) {
    this.lineNumber = lineNumber;
    this.row = row;
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

  public toStartPosition(): Position {
    const firstNonWhitespaceCharIdx = this.row.search(/\S/);

    return {
      line: this.lineNumber,
      column: firstNonWhitespaceCharIdx < 0 ?
        0 : firstNonWhitespaceCharIdx
    };
  }

  public toEndPosition(): Position {
    return {
      line: this.lineNumber,
      // Not length - 1 because the column is the position after last char
      column: this.row.length === 0 ? 0 : this.row.length
    };
  }
}

/**
 * Parses plain text format tables
 */
class TextFormatReader {
  constructor(private populator: TablePopulator) {
  }

  public parse(data: string) {
    const lines = data.split(/\r\n|\n|\r/);

    lines.forEach((line, index) => {
      if (this.isWhitespace(line)) {
        return;
      }

      const row = this.parseLine(index, line);

      if (this.isTableNameRow(row)) {
        const tableName = this.parseTableName(row);

        this.populator.startTable(row, tableName);
      } else {
        this.populator.populateRow(row);
      }
    });

    const lastRow = this.parseLine(lines.length - 1, lines[lines.length - 1]);
    this.populator.endOfFile(lastRow);
  }

  private isWhitespace(line: string) {
    return /^\s*$/.test(line);
  }

  private parseLine(lineNumber: number, line: string) {
    const sanitizedLine = line.replace(/\t/g, "  ");

    const cells = line.split(/ {2,}/);

    return new DataRow(lineNumber, line, cells);
  }

  private isTableNameRow(row: DataRow) {
    return row.cells[0].trim().startsWith("*");
  }

  private parseTableName(row: DataRow) {
    const nonStarCells = row.cells.map(cell => cell.replace(/\*/g, "").trim())
      .filter(cell => !_.isEmpty(cell));

    return _.first(nonStarCells);
  }
}

interface ModelPopulator {
  model;

  populateRow(row: DataRow);
};

interface TablePopulator extends ModelPopulator {
  model: Table;

  startTable(row: DataRow, type: string);

  endOfFile(lastRow: DataRow);
}

interface Reader {

};

class NullPopulator implements TablePopulator {
  public model = null;

  public startTable(row: DataRow, type: string) {
    // Intentionally empty
  }

  public populateRow(cells: DataRow) {
    // Intentionally empty
  }

  public endOfFile() {
    // Intentionally empty
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

    const name = row.head();

    const parseMethod = parseTable.get(name);
    if (parseMethod) {
      parseMethod(row);
    }
  }

  private populateImport = (row: DataRow) => {
    const name = row.head();
    const values = row.cells.slice(1);

    const parsedImport = new Import(name, values[0]);

    parsedImport.setStartPosition(row.toStartPosition());
    parsedImport.setEndPosition(row.toEndPosition());

    this.model.addImport(parsedImport);
  }

  private populateSetting(propertyName) {
    return (row: DataRow) => {
      const [name, value] = row.cells;

      const setting = new Setting(name, value);
      setting.setStartPosition(row.toStartPosition());
      setting.setEndPosition(row.toEndPosition());

      this.model[propertyName] = setting;
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
class TestCasePopulator implements ModelPopulator {
  public model: TestCase;

  /**
   *
   */
  constructor(name: string) {
    this.model = new TestCase(name);
  }

  public populateRow(row: DataRow) {
    const stepName = row.getCellByIdx(1);
    const args = row.drop(2);

    this.model.addStep(new Step(stepName, args));
  }
}

/**
 *
 */
class TestCasesTablePopulator implements ModelPopulator {
  public model: TestCasesTable;
  private testCasePopulator: TestCasePopulator;

  /**
   *
   */
  constructor() {
    this.model = new TestCasesTable();
  }

  public populateRow(row: DataRow) {
    if (this.startsTestCase(row)) {
      const testCaseName = row.head();

      this.testCasePopulator = new TestCasePopulator(testCaseName);

      this.model.addTestCase(this.testCasePopulator.model);
    } else if (this.testCasePopulator) {
      this.testCasePopulator.populateRow(row);
    }
  }

  private startsTestCase(row: DataRow) {
    return !_.isEmpty(row.head());
  }
}

/**
 *
 */
export class FileParser implements TablePopulator {
  private static populatorsConfig = {
    "settings": {
      name: "settingsTable",
      PopulatorCtor: SettingTablePopulator,
    },
    "variables": {
      name: "variablesTable",
      PopulatorCtor: VariableTablePopulator,
    },
    "keywords": {
      name: "keywordsTable",
      PopulatorCtor: KeywordTablePopulator,
    },
    "test cases": {
      name: "testCasesTable",
      PopulatorCtor: TestCasesTablePopulator
    }
  };

  public name = "file";
  public model: TestDataFile;

  private populator: TablePopulator;

  constructor() {
    // this.populator = new NullPopulator();
  }

  public parse(data: string): TestDataFile {
    this.model = new TestDataFile();

    const reader = new TextFormatReader(this);

    reader.parse(data);

    return this.model;
  }

  public startTable(row: DataRow, tableType: string) {
    const populatorConfig = this.getPopulator(tableType);

    if (populatorConfig) {
      if (this.populator) {
        this.populator.model.setEndPosition(row.toEndPosition());
      }

      this.populator = new populatorConfig.PopulatorCtor();
      this.model[populatorConfig.name] = this.populator.model;
      this.populator.model.setStartPosition(row.toStartPosition());
    } else {
      this.populator = null;
    }
  }

  public populateRow(row: DataRow) {
    if (this.populator) {
      this.populator.populateRow(row);
    }
  }

  public endOfFile(lastRow: DataRow) {
    if (this.populator) {
      this.populator.model.setEndPosition(lastRow.toEndPosition());
    }
  }

  private getPopulator(tableType: string) {
    return FileParser.populatorsConfig[tableType.toLowerCase()];
  }
}
