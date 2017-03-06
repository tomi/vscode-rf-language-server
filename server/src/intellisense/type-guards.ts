import {
  Node,
  Step,
  Identifier,
  VariableExpression,
  CallExpression,
  VariableDeclaration,
  ScalarDeclaration,
  ListDeclaration,
  DictionaryDeclaration,
  UserKeyword,
  TestCase,
  FunctionDeclaration,
  VariablesTable
} from "../parser/models";

export function isIdentifier(node: Node): node is Identifier {
  return node && (<Identifier>node).type === "Identifier";
}

export function isVariableExpression(node: Node): node is VariableExpression {
  return node && (<VariableExpression>node).type === "VariableExpression";
}

export function isCallExpression(node: Node): node is CallExpression {
  return node && (<CallExpression>node).type === "CallExpression";
}

export function isScalarDeclaration(node: Node): node is ScalarDeclaration {
  return node && (<ScalarDeclaration>node).type === "ScalarDeclaration";
}

export function isListDeclaration(node: Node): node is ListDeclaration {
  return node && (<ListDeclaration>node).type === "ListDeclaration";
}

export function isDictionaryDeclaration(node: Node): node is DictionaryDeclaration {
  return node && (<DictionaryDeclaration>node).type === "DictionaryDeclaration";
}

export function isVariableDeclaration(node: Node): node is VariableDeclaration {
    return node && isScalarDeclaration(node) ||
      isListDeclaration(node) ||
      isDictionaryDeclaration(node);
}

export function isStep(node: Node): node is Step {
  return node && (<Step>node).type === "Step";
}

export function isUserKeyword(node: Node): node is UserKeyword {
  return node && (<UserKeyword>node).type === "UserKeyword";
}

export function isTestCase(node: Node): node is TestCase {
  return node && (<TestCase>node).type === "TestCase";
}

export function isFunctionDeclaration(node: Node): node is FunctionDeclaration {
  return node && isUserKeyword(node) || isTestCase(node);
}

export function isVariablesTable(node: Node): node is VariablesTable {
  return node && (<VariablesTable>node).type === "VariablesTable";
}
