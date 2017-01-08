import * as _ from "lodash";

import {
  DataTable,
  DataRow
} from "./table-models";

import {
  VariablesTable,
  VariableDefinition,
  ScalarVariable,
  ListVariable,
} from "./models";

const variableMapping = new Map([
  ["$", parseScalar],
  ["@", parseList],
  ["&", parseDictionary],
  ["%", parseEnvironment]
]);

export function parseVariablesTable(dataTable: DataTable): VariablesTable {
  const variablesTable = new VariablesTable(dataTable.location);

  dataTable.rows.forEach(row => parseRow(variablesTable, row));

  return variablesTable;
}

function parseRow(variablesTable: VariablesTable, row: DataRow) {
  if (row.isEmpty()) {
    return;
  }

  const typeAndName = parseTypeAndName(row);
  if (!typeAndName) {
    return;
  }

  const { type, name } = typeAndName;

  const variableParserFn = getVariableParserFn(type);

  const values = row.getCellsByRange(1).map(cell => cell.content);
  variableParserFn(variablesTable, name, values, row.location);
}

function parseTypeAndName(row: DataRow) {
  // Matches the type ($, @, % or &) and name
  // For example:
  // ${var} --> ["${var}", "$", "var"]
  // @{var2} = --> ["${var2}", "@", "var2"]
  const typeAndNameRegex = /([$,@,%,&]){([^}]+)}/;
  const typeNameCell = row.first().content;

  if (!typeAndNameRegex.test(typeNameCell)) {
    return null;
  }

  const result = typeNameCell.match(typeAndNameRegex);
  return {
    type: result[1],
    name: result[2]
  };
}

function getVariableParserFn(type: string) {
  const parser = variableMapping.get(type);

  return parser || _.noop;
}

function parseScalar(variablesTable: VariablesTable, name: string, values: string[], location) {
  const value = _.first(values);

  const variable = new ScalarVariable(name, value, location);

  variablesTable.addVariable(variable);
}

function parseList(variablesTable: VariablesTable, name: string, values: string[], location) {
  const variable = new ListVariable(name, values, location);

  variablesTable.addVariable(variable);
}

function parseDictionary(variablesTable: VariablesTable, name: string, values: string[], location) {
  // TODO
}

function parseEnvironment(variablesTable: VariablesTable, name: string, values: string[], location) {
  // TODO
}
