import * as _ from "lodash";

import {
  DataTable,
  DataRow
} from "./table-models";

import {
  Identifier,
  ValueExpression,
  VariablesTable,
  ScalarDeclaration,
  ListDeclaration,
} from "./models";

import {
  parseValueExpression
} from "./primitive-parsers";

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

  const values = row.getCellsByRange(1).map(parseValueExpression);
  variableParserFn(variablesTable, name, values, row.location);
}

function parseTypeAndName(row: DataRow) {
  // Matches the type ($, @, % or &) and name
  // For example:
  // ${var} --> ["${var}", "$", "var"]
  // @{var2} = --> ["${var2}", "@", "var2"]
  const typeAndNameRegex = /([$,@,%,&]){([^}]+)}/;
  const typeNameCell = row.first();
  const typeAndName = typeNameCell.content;

  if (!typeAndNameRegex.test(typeAndName)) {
    return null;
  }

  const result = typeAndName.match(typeAndNameRegex);
  return {
    type: result[1],
    name: new Identifier(result[2], typeNameCell.location)
  };
}

function getVariableParserFn(type: string) {
  const parser = variableMapping.get(type);

  return parser || _.noop;
}

function parseScalar(variablesTable: VariablesTable, name: Identifier, values: ValueExpression[], location) {
  const value = _.first(values);

  const variable = new ScalarDeclaration(name, value, location);

  variablesTable.addVariable(variable);
}

function parseList(variablesTable: VariablesTable, name: Identifier, values: ValueExpression[], location) {
  const variable = new ListDeclaration(name, values, location);

  variablesTable.addVariable(variable);
}

function parseDictionary(variablesTable: VariablesTable, name: Identifier, values: ValueExpression[], location) {
  // TODO
}

function parseEnvironment(variablesTable: VariablesTable, name: Identifier, values: ValueExpression[], location) {
  // TODO
}
