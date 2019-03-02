import * as _ from "lodash";

import { DataCell, SourceLocation } from "./table-models";

import {
  Identifier,
  Expression,
  VariableDeclaration,
  ScalarDeclaration,
  ListDeclaration,
  DictionaryDeclaration,
} from "./models";

const variableMapping = new Map([
  ["$", parseScalar],
  ["@", parseList],
  ["&", parseDictionary],
  ["%", parseEnvironment],
]);

function getRegex() {
  // Matches the type ($, @, % or &) and name
  // For example:
  // ${var} --> ["${var}", "$", "var"]
  // @{var2} = --> ["${var2}", "@", "var2"]
  return /^([$,@,%,&]){([^}]*)}/;
}

export function isVariable(cell: DataCell) {
  const typeAndNameRegex = getRegex();
  const possibleTypeAndName = cell.content;

  return typeAndNameRegex.test(possibleTypeAndName);
}

export function parseTypeAndName(cell: DataCell) {
  const typeAndNameRegex = getRegex();
  const typeAndName = cell.content;

  const result = typeAndName.match(typeAndNameRegex);
  return {
    type: result[1],
    name: new Identifier(result[2], cell.location),
  };
}

export function parseVariableDeclaration(
  typeAndName: {
    type: string;
    name: Identifier;
  },
  values: Expression[],
  location: SourceLocation
): VariableDeclaration {
  const { type, name } = typeAndName;

  const variableParserFn = getVariableParserFn(type);
  if (!variableParserFn) {
    throw new Error(`Invalid variable type ${type}`);
  }

  return variableParserFn(name, values, location);
}

function getVariableParserFn(type: string): Function {
  const parser = variableMapping.get(type);

  return parser;
}

function parseScalar(
  name: Identifier,
  values: Expression[],
  location: SourceLocation
): VariableDeclaration {
  const value = _.first(values);

  return new ScalarDeclaration(name, value, location);
}

function parseList(
  name: Identifier,
  values: Expression[],
  location: SourceLocation
): VariableDeclaration {
  return new ListDeclaration(name, values, location);
}

function parseDictionary(
  name: Identifier,
  values: Expression[],
  location: SourceLocation
): VariableDeclaration {
  // TODO
  return new DictionaryDeclaration(name, null, location);
}

function parseEnvironment(
  name: Identifier,
  values: Expression[],
  location: SourceLocation
): VariableDeclaration {
  // TODO
  return undefined;
}
