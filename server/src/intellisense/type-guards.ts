import {
  Node,
  Step,
  Identifier,
  NamespacedIdentifier,
  Literal,
  TemplateLiteral,
  VariableExpression,
  CallExpression,
  VariableDeclaration,
  ScalarDeclaration,
  ListDeclaration,
  DictionaryDeclaration,
  UserKeyword,
  TestCase,
  FunctionDeclaration,
  VariablesTable,
  SettingsTable,
  Documentation,
  SuiteSetting,
  Tags,
  Arguments,
  Timeout,
  Return,
  Teardown,
  Setup,
  Template,
  SettingDeclaration,
} from "../parser/models";

function isOfType(node: Node, typeName: string) {
  return node && node.type === typeName;
}

export function isIdentifier(node: Node): node is Identifier {
  return isNamespacedIdentifier(node) || isOfType(node, "Identifier");
}

export function isNamespacedIdentifier(
  node: Node
): node is NamespacedIdentifier {
  return isOfType(node, "NamespacedIdentifier");
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

export function isDictionaryDeclaration(
  node: Node
): node is DictionaryDeclaration {
  return isOfType(node, "DictionaryDeclaration");
}

export function isVariableDeclaration(node: Node): node is VariableDeclaration {
  return (
    isScalarDeclaration(node) ||
    isListDeclaration(node) ||
    isDictionaryDeclaration(node)
  );
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

export function isLiteral(node: Node): node is Literal {
  return isOfType(node, "Literal");
}

export function isTemplateLiteral(node: Node): node is TemplateLiteral {
  return isOfType(node, "TemplateLiteral");
}

export function isSettingsTable(node: Node): node is SettingsTable {
  return isOfType(node, "SettingsTable");
}

export function isDocumentation(node: Node): node is Documentation {
  return isOfType(node, "Documentation");
}

export function isSuiteSetting(node: Node): node is SuiteSetting {
  return isOfType(node, "SuiteSetting");
}

export function isTags(node: Node): node is Tags {
  return isOfType(node, "Tags");
}

export function isArguments(node: Node): node is Arguments {
  return isOfType(node, "Arguments");
}

export function isTimeout(node: Node): node is Timeout {
  return isOfType(node, "Timeout");
}

export function isReturn(node: Node): node is Return {
  return isOfType(node, "Return");
}

export function isSetup(node: Node): node is Setup {
  return isOfType(node, "Setup");
}

export function isTeardown(node: Node): node is Teardown {
  return isOfType(node, "Teardown");
}

export function isTemplate(node: Node): node is Template {
  return isOfType(node, "Template");
}

export function isSettingDeclaration(node: Node): node is SettingDeclaration {
  return (
    isDocumentation(node) ||
    isArguments(node) ||
    isReturn(node) ||
    isTimeout(node) ||
    isTags(node) ||
    isTeardown(node) ||
    isSetup(node) ||
    isTemplate(node)
  );
}
