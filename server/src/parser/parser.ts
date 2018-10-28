import * as _ from "lodash";

import { TestSuite } from "./models";
import { DataTable } from "./table-models";

import { TableReader } from "./table-reader";
import { parseSettingsTable } from "./settings-table-parser";
import { parseKeywordsTable } from "./keywords-table-parser";
import { parseVariablesTable } from "./variables-table-parser";
import { parseTestCasesTable } from "./test-cases-table-parser";

const SETTINGS_TABLES = new Set(["setting", "settings"]);
const VARIABLES_TABLES = new Set(["variable", "variables"]);
const KEYWORDS_TABLES = new Set(["keyword", "keywords"]);
const TEST_CASES_TABLES = new Set(["test case", "test cases"]);

export class FileParser {
  public readTables(data: string) {
    const tableReader = new TableReader();

    return tableReader.read(data);
  }

  public parseFile(data: string | DataTable[], namespace: string) {
    let fileTables: DataTable[];
    if (typeof data === "string") {
      fileTables = this.readTables(data);
    } else {
      fileTables = data;
    }

    if (_.isEmpty(fileTables)) {
      return new TestSuite({
        start: { line: 0, column: 0 },
        end: { line: 0, column: 0 },
      });
    }

    const firstTable = _.first(fileTables);
    const lastTable = _.last(fileTables);

    const testDataFile = new TestSuite({
      start: firstTable.location.start,
      end: lastTable.location.end,
    });

    fileTables.forEach(dataTable => {
      const lowerCaseTableName = dataTable.name.toLowerCase();

      if (SETTINGS_TABLES.has(lowerCaseTableName)) {
        const parsedTable = parseSettingsTable(dataTable);

        testDataFile.settingsTable = parsedTable;
      } else if (VARIABLES_TABLES.has(lowerCaseTableName)) {
        const parsedTable = parseVariablesTable(dataTable);

        testDataFile.variablesTable = parsedTable;
      } else if (KEYWORDS_TABLES.has(lowerCaseTableName)) {
        const parsedTable = parseKeywordsTable(dataTable, namespace);

        testDataFile.keywordsTable = parsedTable;
      } else if (TEST_CASES_TABLES.has(lowerCaseTableName)) {
        const parsedTable = parseTestCasesTable(dataTable);

        testDataFile.testCasesTable = parsedTable;
      }
    });

    return testDataFile;
  }
}
