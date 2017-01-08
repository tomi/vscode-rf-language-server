import * as _ from "lodash";

import {
  DataTable,
  DataRow
} from "./table-models";

import {
  SettingsTable,
  LibraryImport,
  ResourceFileImport,
  VariableFileImport,
  Setting
} from "./models";

const settingParserMap = new Map([
  ["Library",        parseLibraryImport],
  ["Resource",       parseResourceImport],
  ["Variables",      parseVariableImport],
  ["Suite Setup",    createParseSettingFn("suiteSetup")],
  ["Suite Teardown", createParseSettingFn("suiteTeardown")],
  ["Test Setup",     createParseSettingFn("testSetup")],
  ["Test Teardown",  createParseSettingFn("testTeardown")],
]);

/**
 * Parses given table as settings table
 */
export function parseSettingsTable(dataTable: DataTable): SettingsTable {
  const settingsTable = new SettingsTable(dataTable.location);

  dataTable.rows.forEach(row => {
    if (row.isEmpty()) {
      return;
    }

    const parseRowFn = getRowParserFn(row);

    parseRowFn(settingsTable, row);
  });

  return settingsTable;
}

function getRowParserFn(row: DataRow) {
  const name = row.first().content;

  const parser = settingParserMap.get(name);

  return parser || _.noop;
}

function parseLibraryImport(settingsTable: SettingsTable, row: DataRow) {
  const target = row.getCellByIdx(1).content;
  const args   = row.getCellsByRange(2).map(cell => cell.content);

  // TODO: WITH NAME keyword

  const libImport = new LibraryImport(target, args, row.location);
  settingsTable.addLibraryImport(libImport);
}

function parseResourceImport(settingsTable: SettingsTable, row: DataRow) {
  const target = row.getCellByIdx(1).content;

  const resourceImport = new ResourceFileImport(target, row.location);
  settingsTable.addResourceImport(resourceImport);
}

function parseVariableImport(settingsTable: SettingsTable, row: DataRow) {
  const target = row.getCellByIdx(1).content;

  const variableImport = new VariableFileImport(target, row.location);
  settingsTable.addVariableImport(variableImport);
}

function createParseSettingFn(propertyName) {
  return (settingsTable: SettingsTable, row: DataRow) => {
    const name   = row.first().content;
    const values = row.getCellsByRange(1).map(cell => cell.content);

    const setting = new Setting(name, values, row.location);
    settingsTable[propertyName] = setting;
  };
}
