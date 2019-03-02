import * as _ from "lodash";

import * as positionHelper from "./position-helper";
import { TableRowIterator } from "./row-iterator";
import { DataCell, DataTable, DataRow } from "./table-models";

import {
  EmptyNode,
  SettingsTable,
  LibraryImport,
  ResourceImport,
  VariableImport,
  SuiteSetting,
} from "./models";

import {
  parseIdentifier,
  parseValueExpression,
  parseCallExpression,
} from "./primitive-parsers";
import * as settingsParser from "./setting-parser";

const settingParserMap = new Map([
  ["Documentation", parseDocumentation],
  ["Library", parseLibraryImport],
  ["Resource", parseResourceImport],
  ["Variables", parseVariableImport],
  ["Suite Setup", createParseSettingFn("suiteSetup")],
  ["Suite Teardown", createParseSettingFn("suiteTeardown")],
  ["Test Setup", createParseSettingFn("testSetup")],
  ["Test Teardown", createParseSettingFn("testTeardown")],
]);

/**
 * Parses given table as settings table
 */
export function parseSettingsTable(dataTable: DataTable): SettingsTable {
  const settingsTable = new SettingsTable(dataTable.location);

  const iterator = new TableRowIterator(dataTable);
  while (!iterator.isDone()) {
    const row = iterator.takeRow();
    if (row.isEmpty()) {
      continue;
    }

    const continuedRows = iterator.takeRowWhile(rowContinues);
    const continuedCells = joinRows(continuedRows);
    const [firstCell, ...restCells] = row.cells.concat(continuedCells);

    const parseRowFn = getParserFn(firstCell);
    parseRowFn(settingsTable, firstCell, restCells);
  }

  return settingsTable;
}

function rowContinues(row: DataRow) {
  return row.isRowContinuation({
    requireFirstEmpty: false,
  });
}

function joinRows(rows: DataRow[]): DataCell[] {
  const shouldTakeCell = (cell: DataCell) => !cell.isRowContinuation();

  return rows.reduce((allCells, row) => {
    const rowCells = _.takeRightWhile(row.cells, shouldTakeCell);

    return allCells.concat(rowCells);
  }, []);
}

function getParserFn(cell: DataCell) {
  const name = cell.content;

  const parser = settingParserMap.get(name);

  return parser || _.noop;
}

function parseDocumentation(
  settingsTable: SettingsTable,
  firstCell: DataCell,
  restCells: DataCell[]
) {
  const id = parseIdentifier(firstCell);
  const documentation = settingsParser.parseDocumentation(id, restCells);

  settingsTable.documentation = documentation;
}

function parseLibraryImport(
  settingsTable: SettingsTable,
  firstCell: DataCell,
  restCells: DataCell[]
) {
  const [firstDataCell, ...restDataCells] = restCells;
  const target = parseValueExpression(firstDataCell);
  const args = restDataCells.map(parseValueExpression);

  // TODO: WITH NAME keyword
  const lastCell = _.last(restCells) || firstCell;
  const location = positionHelper.locationFromStartEnd(
    firstCell.location,
    lastCell.location
  );

  const libImport = new LibraryImport(target, args, location);
  settingsTable.addLibraryImport(libImport);
}

function parseResourceImport(
  settingsTable: SettingsTable,
  firstCell: DataCell,
  restCells: DataCell[]
) {
  const [firstDataCell] = restCells;
  const target = parseValueExpression(firstDataCell);

  const lastCell = _.last(restCells) || firstCell;
  const location = positionHelper.locationFromStartEnd(
    firstCell.location,
    lastCell.location
  );

  const resourceImport = new ResourceImport(target, location);
  settingsTable.addResourceImport(resourceImport);
}

function parseVariableImport(
  settingsTable: SettingsTable,
  firstCell: DataCell,
  restCells: DataCell[]
) {
  const [firstDataCell] = restCells;
  const target = parseValueExpression(firstDataCell);

  const lastCell = _.last(restCells) || firstCell;
  const location = positionHelper.locationFromStartEnd(
    firstCell.location,
    lastCell.location
  );

  const variableImport = new VariableImport(target, location);
  settingsTable.addVariableImport(variableImport);
}

function createParseSettingFn(propertyName: keyof SettingsTable) {
  return (
    settingsTable: SettingsTable,
    nameCell: DataCell,
    valueCells: DataCell[]
  ) => {
    const name = parseIdentifier(nameCell);

    const value = _.isEmpty(valueCells)
      ? new EmptyNode(nameCell.location.end)
      : parseCallExpression(valueCells);

    const lastCell = _.last(valueCells) || nameCell;
    const location = positionHelper.locationFromStartEnd(
      nameCell.location,
      lastCell.location
    );
    const setting = new SuiteSetting(name, value, location);
    settingsTable[propertyName] = setting;
  };
}
