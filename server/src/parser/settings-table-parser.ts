import * as _ from "lodash";

import {
  DataTable,
  DataRow
} from "./table-models";

import {
  Identifier,
  EmptyNode,
  SettingsTable,
  LibraryImport,
  ResourceImport,
  VariableImport,
  SuiteSetting
} from "./models";

import {
  parseIdentifier,
  parseValueExpression,
  parseCallExpression,
} from "./primitive-parsers";

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
  const target = parseValueExpression(row.getCellByIdx(1));
  const args   = row.getCellsByRange(2).map(parseValueExpression);

  // TODO: WITH NAME keyword

  const libImport = new LibraryImport(target, args, row.location);
  settingsTable.addLibraryImport(libImport);
}

function parseResourceImport(settingsTable: SettingsTable, row: DataRow) {
  const target = parseValueExpression(row.getCellByIdx(1));

  const resourceImport = new ResourceImport(target, row.location);
  settingsTable.addResourceImport(resourceImport);
}

function parseVariableImport(settingsTable: SettingsTable, row: DataRow) {
  const target = parseValueExpression(row.getCellByIdx(1));

  const variableImport = new VariableImport(target, row.location);
  settingsTable.addVariableImport(variableImport);
}

function createParseSettingFn(propertyName) {
  return (settingsTable: SettingsTable, row: DataRow) => {
    const nameCell = row.first();
    const name = parseIdentifier(nameCell);
    const valueCells = row.getCellsByRange(1);

    const value = _.isEmpty(valueCells) ?
      new EmptyNode(nameCell.location.end) :
      parseCallExpression(valueCells);

    const setting = new SuiteSetting(name, value, row.location);
    settingsTable[propertyName] = setting;
  };
}
