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
  FunctionDeclaration
} from "../parser/models";

export function isIdentifier(node: Node): node is Identifier {
  return (<Identifier>node).type === "Identifier";
}

export function isVariableExpression(node: Node): node is VariableExpression {
  return (<VariableExpression>node).type === "VariableExpression";
}

export function isCallExpression(node: Node): node is CallExpression {
  return (<CallExpression>node).type === "CallExpression";
}

export function isScalarDeclaration(node: Node): node is ScalarDeclaration {
  return (<ScalarDeclaration>node).type === "ScalarDeclaration";
}

export function isListDeclaration(node: Node): node is ListDeclaration {
  return (<ListDeclaration>node).type === "ListDeclaration";
}

export function isDictionaryDeclaration(node: Node): node is DictionaryDeclaration {
  return (<DictionaryDeclaration>node).type === "DictionaryDeclaration";
}

export function isVariableDeclaration(node: Node): node is VariableDeclaration {
    return isScalarDeclaration(node) ||
      isListDeclaration(node) ||
      isDictionaryDeclaration(node);
}

export function isStep(node: Node): node is Step {
  return (<Step>node).type === "Step";
}

export function isUserKeyword(node: Node): node is UserKeyword {
  return (<UserKeyword>node).type === "UserKeyword";
}

export function isTestCase(node: Node): node is TestCase {
  return (<TestCase>node).type === "TestCase";
}

export function isFunctionDeclaration(node: Node): node is FunctionDeclaration {
  return isUserKeyword(node) || isTestCase(node);
}
