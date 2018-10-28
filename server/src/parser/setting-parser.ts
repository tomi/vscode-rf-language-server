import * as _ from "lodash";

import { DataCell } from "./table-models";

import {
  Identifier,
  Literal,
  SettingDeclaration,
  Documentation,
  Arguments,
  Return,
  Setup,
  Teardown,
  Tags,
  Timeout,
} from "./models";

import { parseValueExpression, parseCallExpression } from "./primitive-parsers";

import {
  isVariable,
  parseTypeAndName,
  parseVariableDeclaration,
} from "./variable-parsers";

import { locationFromStartEnd } from "./position-helper";

type SettingParser = (id: Identifier, values: DataCell[]) => SettingDeclaration;

const settingMapping = new Map([
  ["[Documentation]", parseDocumentation],
  ["[Arguments]", parseArguments],
  ["[Return]", parseReturn],
  ["[Setup]", parseSetup],
  ["[Teardown]", parseTeardown],
  ["[Tags]", parseTags],
  ["[Timeout]", parseTimeout],
]);

/**
 * Checks if given cell is a supported setting
 *
 * @param cell
 */
export function isSetting(cell: DataCell) {
  return settingMapping.has(cell.content);
}

/**
 * Parses setting declaration
 *
 * @param nameCell
 * @param restCells
 */
export function parseSetting(
  nameCell: DataCell,
  restCells: DataCell[]
): SettingDeclaration {
  const settingParseFn = getParserFn(nameCell.content);

  const id = new Identifier(nameCell.content, nameCell.location);

  return settingParseFn(id, restCells);
}

export function isDocumentation(
  node: SettingDeclaration
): node is Documentation {
  return isOfType(node, "Documentation");
}

export function isArguments(node: SettingDeclaration): node is Arguments {
  return isOfType(node, "Arguments");
}

export function isReturn(node: SettingDeclaration): node is Return {
  return isOfType(node, "Return");
}

export function isSetup(node: SettingDeclaration): node is Setup {
  return isOfType(node, "Setup");
}

export function isTeardown(node: SettingDeclaration): node is Teardown {
  return isOfType(node, "Teardown");
}

export function isTags(node: SettingDeclaration): node is Tags {
  return isOfType(node, "Tags");
}

export function isTimeout(node: SettingDeclaration): node is Timeout {
  return isOfType(node, "Timeout");
}

function isOfType(node: SettingDeclaration, typeName: string) {
  return node && node.kind === typeName;
}

/**
 * Returns a parser function for given setting
 *
 * @param name
 */
function getParserFn(name: string): SettingParser {
  const settingParseFn = settingMapping.get(name);
  if (!settingParseFn) {
    throw new Error("Invalid setting " + name);
  }

  return settingParseFn;
}

/**
 *
 *
 * @param id
 * @param values
 */
export function parseDocumentation(
  id: Identifier,
  values: DataCell[]
): Documentation {
  if (_.isEmpty(values)) {
    return new Documentation(id, undefined, id.location);
  }

  const stringValue = values.map(cell => cell.content).join(" ");
  const firstCell = _.head(values);
  const lastCell = _.last(values);

  const literal = new Literal(
    stringValue,
    locationFromStartEnd(firstCell.location, lastCell.location)
  );

  return new Documentation(
    id,
    literal,
    locationFromStartEnd(id.location, literal.location)
  );
}

/**
 * Parses Arguments
 *
 * @param id
 * @param values
 */
function parseArguments(
  id: Identifier,
  values: DataCell[]
): SettingDeclaration {
  const parsedValues = values.filter(isVariable).map(cell => {
    const typeAndName = parseTypeAndName(cell);

    // We might want to parse the default value as value at some point.
    // Now just ignore any values
    return parseVariableDeclaration(typeAndName, [], cell.location);
  });

  const loc = _.isEmpty(parsedValues)
    ? id.location
    : locationFromStartEnd(id.location, _.last(parsedValues).location);

  return new Arguments(id, parsedValues, loc);
}

/**
 * Parses Return statement
 * @param id
 * @param values
 */
function parseReturn(id: Identifier, values: DataCell[]): SettingDeclaration {
  const parsedValues = values.map(parseValueExpression);

  const loc = _.isEmpty(parsedValues)
    ? id.location
    : locationFromStartEnd(id.location, _.last(parsedValues).location);

  return new Return(id, parsedValues, loc);
}

/**
 * Parses Setup
 *
 * @param id
 * @param values
 */
function parseSetup(id: Identifier, values: DataCell[]): SettingDeclaration {
  if (_.isEmpty(values)) {
    return new Setup(id, undefined, id.location);
  }

  const callExpression = parseCallExpression(values);
  const location = locationFromStartEnd(id.location, callExpression.location);

  return new Setup(id, callExpression, location);
}

/**
 * Parses Teardown
 *
 * @param id
 * @param values
 */
function parseTeardown(id: Identifier, values: DataCell[]): SettingDeclaration {
  if (_.isEmpty(values)) {
    return new Teardown(id, undefined, id.location);
  }

  const callExpression = parseCallExpression(values);
  const location = locationFromStartEnd(id.location, callExpression.location);

  return new Teardown(id, callExpression, location);
}

function parseTags(id: Identifier, values: DataCell[]): SettingDeclaration {
  const tags = values.map(cell => {
    return new Literal(cell.content, cell.location);
  });

  const loc = _.isEmpty(tags)
    ? id.location
    : locationFromStartEnd(id.location, _.last(tags).location);

  return new Tags(id, tags, loc);
}

function parseTimeout(id: Identifier, values: DataCell[]): SettingDeclaration {
  const [valueCell, messageCell] = values;

  const value = valueCell
    ? new Literal(valueCell.content, valueCell.location)
    : undefined;
  const message = messageCell
    ? new Literal(messageCell.content, messageCell.location)
    : undefined;

  const loc = locationFromStartEnd(
    id.location,
    (message || value || id).location
  );

  return new Timeout(id, value, message, loc);
}
