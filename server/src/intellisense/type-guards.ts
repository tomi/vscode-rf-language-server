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

function isOfType(node: Node, typeName: string) {
  return node && node.type === typeName;
}

export function isIdentifier(node: Node): node is Identifier {
  return isOfType(node, "Identifier");
}

export function isVariableExpression(node: Node): node is VariableExpression {
  return isOfType(node, "VariableExpression");
}

export function isCallExpression(node: Node): node is CallExpression {
  return isOfType(node, "CallExpression");
}

export function isScalarDeclaration(node: Node): node is ScalarDeclaration {
  return isOfType(node, "ScalarDeclaration");
}

export function isListDeclaration(node: Node): node is ListDeclaration {
  return isOfType(node, "ListDeclaration");
}

export function isDictionaryDeclaration(node: Node): node is DictionaryDeclaration {
  return isOfType(node, "DictionaryDeclaration");
}

export function isVariableDeclaration(node: Node): node is VariableDeclaration {
    return isScalarDeclaration(node) ||
      isListDeclaration(node) ||
      isDictionaryDeclaration(node);
}

export function isStep(node: Node): node is Step {
  return isOfType(node, "Step");
}

export function isUserKeyword(node: Node): node is UserKeyword {
  return isOfType(node, "UserKeyword");
}

export function isTestCase(node: Node): node is TestCase {
  return isOfType(node, "TestCase");
}

export function isFunctionDeclaration(node: Node): node is FunctionDeclaration {
  return isUserKeyword(node) || isTestCase(node);
}

export function isVariablesTable(node: Node): node is VariablesTable {
  return isOfType(node, "VariablesTable");
}
