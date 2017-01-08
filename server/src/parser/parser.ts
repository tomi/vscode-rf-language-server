import * as _ from "lodash";

import { TestSuite } from "./models";

import { TableReader } from "./table-reader";
import { parseSettingsTable } from "./settings-table-parser";
import { parseKeywordsTable } from "./keywords-table-parser";
import { parseVariablesTable } from "./variables-table-parser";
import { parseTestCasesTable } from "./test-cases-table-parser";

export class FileParser {
  public parseFile(data: string) {
    const tableReader = new TableReader();
    const fileTables = tableReader.read(data);

    if (_.isEmpty(fileTables)) {
      return new TestSuite({
        start: { line: 0, column: 0 },
        end: { line: 0, column: 0 }
      });
    }

    const firstTable = _.first(fileTables);
    const lastTable = _.last(fileTables);

    const testDataFile = new TestSuite({
      start: firstTable.location.start,
      end: lastTable.location.end
    });

    fileTables.forEach(dataTable => {
      if (dataTable.name === "Settings") {
        const parsedTable = parseSettingsTable(dataTable);

        testDataFile.settingsTable = parsedTable;
      } else if (dataTable.name === "Variables") {
        const parsedTable = parseVariablesTable(dataTable);

        testDataFile.variablesTable = parsedTable;
      } else if (dataTable.name === "Keywords") {
        const parsedTable = parseKeywordsTable(dataTable);

        testDataFile.keywordsTable = parsedTable;
      } else if (dataTable.name === "Test Cases") {
        const parsedTable = parseTestCasesTable(dataTable);

        testDataFile.testCasesTable = parsedTable;
      }
    });

    return testDataFile;
  }
}
