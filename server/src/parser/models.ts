import * as _ from "lodash";

import { SourceLocation, Position } from "./table-models";

export interface Node {
  type: string;
  location: SourceLocation;
}

// tslint:disable-next-line:no-empty-interface
export interface Expression extends Node {}

// tslint:disable-next-line:no-empty-interface
export interface ValueExpression extends Expression {}

export class Identifier implements Node {
  public type = "Identifier";

  constructor(public name: string, public location: SourceLocation) {}
}

export class NamespacedIdentifier extends Identifier {
  public type = "NamespacedIdentifier";

  public get fullName(): string {
    return `${this.namespace}.${this.name}`;
  }

  constructor(
    public namespace: string,
    public name: string,
    public location: SourceLocation
  ) {
    super(name, location);
  }
}

export type VariableKind = "Scalar" | "List" | "Dictionary";

export type SettingKind =
  | "Documentation"
  | "Arguments"
  | "Return"
  | "Timeout"
  | "Teardown"
  | "Tags"
  | "Setup"
  | "Template";

export class VariableExpression implements ValueExpression {
  public type = "VariableExpression";

  constructor(
    public id: Identifier,
    public kind: VariableKind,
    public location: SourceLocation
  ) {}
}

export class Literal implements ValueExpression {
  public type = "Literal";

  constructor(public value: string, public location: SourceLocation) {}
}

export class KeyValueLiteral extends Literal {
  public type = "KeyValueLiteral";

  /**
   *
   */
  constructor(public name: string, value: string, location: SourceLocation) {
    super(value, location);
  }
}

export class TemplateElement implements Node {
  public type = "TemplateElement";

  constructor(public value: string, public location: SourceLocation) {}
}

export class TemplateLiteral implements ValueExpression {
  public type = "TemplateLiteral";

  constructor(
    public quasis: TemplateElement[],
    public expressions: VariableExpression[],
    public location: SourceLocation
  ) {}
}

export class CallExpression implements Expression {
  public type = "CallExpression";

  constructor(
    public callee: Identifier,
    public args: Expression[],
    public location: SourceLocation
  ) {}
}

export class EmptyNode implements Node {
  public type = "EmptyNode";

  public location: SourceLocation;

  constructor(position: Position) {
    this.location = {
      start: position,
      end: position,
    };
  }
}

export interface Import extends Node {
  target: ValueExpression;
}

export class LibraryImport implements Import {
  public type = "LibraryImport";

  /**
   *
   */
  constructor(
    public target: ValueExpression,
    public args: ValueExpression[],
    public location: SourceLocation
  ) {}
}

export class ResourceImport implements Import {
  public type = "ResourceImport";

  /**
   *
   */
  constructor(
    public target: ValueExpression,
    public location: SourceLocation
  ) {}
}

export class VariableImport implements Import {
  public type = "VariableImport";

  /**
   *
   */
  constructor(
    public target: ValueExpression,
    public location: SourceLocation
  ) {}
}

export class SuiteSetting implements Node {
  public type = "SuiteSetting";

  constructor(
    public name: Identifier,
    public value: CallExpression | EmptyNode,
    public location: SourceLocation
  ) {}
}

/**
 *
 */
export class SettingsTable implements Node {
  public type = "SettingsTable";

  public suiteSetup: SuiteSetting;
  public suiteTeardown: SuiteSetting;

  public testSetup: SuiteSetting;
  public testTeardown: SuiteSetting;

  public libraryImports: LibraryImport[] = [];
  public resourceImports: ResourceImport[] = [];
  public variableImports: VariableImport[] = [];

  public documentation: Documentation;

  // TODO:
  // Metadata
  // Force tags
  // Default tags
  // Test template
  // Test timeout

  constructor(public location: SourceLocation) {}

  public addLibraryImport(importToAdd: LibraryImport) {
    this.libraryImports.push(importToAdd);
  }

  public addResourceImport(importToAdd: ResourceImport) {
    this.resourceImports.push(importToAdd);
  }

  public addVariableImport(importToAdd: VariableImport) {
    this.variableImports.push(importToAdd);
  }
}

/**
 *
 */
interface Declaration extends Node {
  id: Identifier;
}

export interface SettingDeclaration extends Declaration {
  kind: SettingKind;
}

/**
 *
 */
export class Documentation implements SettingDeclaration {
  public type = "Documentation";
  public kind: SettingKind = "Documentation";

  /**
   *
   */
  constructor(
    public id: Identifier,
    public value: Literal,
    public location: SourceLocation
  ) {}
}

/**
 *
 */
export class Arguments implements SettingDeclaration {
  public type = "Arguments";
  public kind: SettingKind = "Arguments";

  /**
   *
   */
  constructor(
    public id: Identifier,
    public values: VariableDeclaration[] = [],
    public location: SourceLocation
  ) {}
}

/**
 *
 */
export class Return implements SettingDeclaration {
  public type = "Return";
  public kind: SettingKind = "Return";

  /**
   *
   */
  constructor(
    public id: Identifier,
    public values: ValueExpression[] = [],
    public location: SourceLocation
  ) {}
}

/**
 *
 */
export class Timeout implements SettingDeclaration {
  public type = "Timeout";
  public kind: SettingKind = "Timeout";

  /**
   *
   */
  constructor(
    public id: Identifier,
    public value: Literal,
    public message: Literal,
    public location: SourceLocation
  ) {}
}

/**
 *
 */
export class Tags implements SettingDeclaration {
  public type = "Tags";
  public kind: SettingKind = "Tags";

  /**
   *
   */
  constructor(
    public id: Identifier,
    public values: Literal[] = [],
    public location: SourceLocation
  ) {}
}

/**
 *
 */
export class Teardown implements SettingDeclaration {
  public type = "Teardown";
  public kind: SettingKind = "Teardown";

  /**
   *
   */
  constructor(
    public id: Identifier,
    public keyword: CallExpression,
    public location: SourceLocation
  ) {}
}

/**
 *
 */
export class Setup implements SettingDeclaration {
  public type = "Setup";
  public kind: SettingKind = "Setup";

  /**
   *
   */
  constructor(
    public id: Identifier,
    public keyword: CallExpression,
    public location: SourceLocation
  ) {}
}

/**
 *
 */
export class Template implements SettingDeclaration {
  public type = "Template";
  public kind: SettingKind = "Template";

  /**
   *
   */
  constructor(
    public id: Identifier,
    public keyword: CallExpression,
    public location: SourceLocation
  ) {}
}

export interface VariableDeclaration extends Declaration {
  kind: VariableKind;
}

export interface FunctionDeclaration extends Declaration {
  steps: Step[];
  tags: Tags;
  timeout: Timeout;
  teardown: Teardown;
  documentation: Documentation;
}

/**
 *
 */
export class ScalarDeclaration implements VariableDeclaration {
  public type = "ScalarDeclaration";
  public kind: VariableKind = "Scalar";

  /**
   *
   */
  constructor(
    public id: Identifier,
    public value: Expression,
    public location: SourceLocation
  ) {}
}

/**
 *
 */
export class ListDeclaration implements VariableDeclaration {
  public type = "ListDeclaration";
  public kind: VariableKind = "List";

  /**
   *
   */
  constructor(
    public id: Identifier,
    public values: Expression[],
    public location: SourceLocation
  ) {}
}

export class DictionaryDeclaration implements VariableDeclaration {
  public type = "DictionaryDeclaration";
  public kind: VariableKind = "Dictionary";

  /**
   *
   */
  constructor(
    public id: Identifier,
    public values: Identifier[] | KeyValueLiteral[],
    public location: SourceLocation
  ) {}
}

/**
 * VariablesTable
 */
export class VariablesTable implements Node {
  public type = "VariablesTable";

  public variables: VariableDeclaration[] = [];

  constructor(public location: SourceLocation) {}

  public addVariable(variable: VariableDeclaration) {
    this.variables.push(variable);
  }
}

/**
 * Step
 */
export class Step implements Node {
  public type = "Step";

  constructor(
    public body: VariableDeclaration | CallExpression,
    public location: SourceLocation
  ) {}
}

/**
 *
 */
export class UserKeyword implements FunctionDeclaration {
  public type = "UserKeyword";
  public steps: Step[] = [];
  public arguments: Arguments;
  public return: Return;
  public documentation: Documentation;
  public timeout: Timeout;
  public teardown: Teardown;
  public tags: Tags;
  public location: SourceLocation;

  constructor(public id: NamespacedIdentifier, startPosition?: Position) {
    this.location = {
      start: startPosition,
      end: startPosition,
    };
  }

  public addStep(step: Step) {
    this.steps.push(step);
  }
}

/**
 * KeywordsTable
 */
export class KeywordsTable implements Node {
  public type = "KeywordsTable";

  public keywords: UserKeyword[] = [];

  constructor(public location: SourceLocation) {}

  public addKeyword(keyword: UserKeyword) {
    this.keywords.push(keyword);
  }
}

/**
 *
 */
export class TestCase implements FunctionDeclaration {
  public type = "TestCase";
  public steps: Step[] = [];
  public tags: Tags;
  public timeout: Timeout;
  public setup: Setup;
  public teardown: Teardown;
  public documentation: Documentation;
  public location: SourceLocation;
  // TODO: Template

  constructor(public id: Identifier, startPosition: Position) {
    this.location = {
      start: startPosition,
      end: startPosition,
    };
  }

  public addStep(step: Step) {
    this.steps.push(step);
  }
}

/**
 *
 */
export class TestCasesTable implements Node {
  public type = "TestCasesTable";
  public testCases: TestCase[] = [];

  constructor(public location: SourceLocation) {}

  public addTestCase(testCase: TestCase) {
    this.testCases.push(testCase);
  }
}

export class TestSuite implements Node {
  public type = "TestSuite";

  public settingsTable: SettingsTable;
  public variablesTable: VariablesTable;
  public keywordsTable: KeywordsTable;
  public testCasesTable: TestCasesTable;

  /**
   *
   */
  constructor(public location: SourceLocation) {}
}
