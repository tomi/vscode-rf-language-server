import * as _ from "lodash";

import {
  // SourceBlock,
  SourceLocation,
  Position
} from "./table-models";

export interface Node {
  type: string;
  location: SourceLocation;
}

export interface Expression extends Node {
}

export interface ValueExpression extends Expression {
}

export class Identifier implements Node, Expression {
  public type = "Identifier";

  constructor(
    public name: string,
    public location: SourceLocation
  ) { }
}

export class Literal implements ValueExpression {
  public type = "Literal";

  constructor(
    public value: string,
    public location: SourceLocation
  ) { }
}

export class KeyValueLiteral extends Literal {
  public type = "KeyValueLiteral";

  /**
   *
   */
  constructor(
    public name: string,
    value: string,
    location: SourceLocation
  ) {
    super(value, location);
  }
}

export interface TemplateElement extends Node {
  value: string;
}

export interface TemplateLiteral extends ValueExpression {
  quasis: TemplateElement[];
  identifiers: Identifier[];
}

export class CallExpression implements Expression {
  public type = "CallExpression";

  constructor(
    public callee: Identifier,
    public args: ValueExpression[],
    public location: SourceLocation,
  ) { }
}

export class EmptyNode implements Node {
  public type = "EmptyNode";

  public location: SourceLocation;

  constructor(
    public position: Position,
  ) {
    this.location = {
      start: position,
      end: position
    };
  }
}

export interface Import extends Node {
  target: Identifier;
}

export class LibraryImport implements Import {
  public type = "LibraryImport";

  /**
   *
   */
  constructor(
    public target: Identifier,
    public args: ValueExpression[],
    public location: SourceLocation
  ) { }
}

export class ResourceImport implements Import {
  public type = "ResourceImport";

  /**
   *
   */
  constructor(
    public target: Identifier,
    public location: SourceLocation
  ) { }
}

export class VariableImport implements Import {
  public type = "VariableImport";

  /**
   *
   */
  constructor(
    public target: Identifier,
    public location: SourceLocation
  ) { }
}

export class SuiteSetting implements Node {
  public type = "SuiteSetting";

  constructor(
    public name: Identifier,
    public value: CallExpression | EmptyNode,
    public location: SourceLocation
  ) { }
}

/**
 *
 */
export class SettingsTable implements Node {
  public type = "SettingsTable";

  public suiteSetup:    SuiteSetting;
  public suiteTeardown: SuiteSetting;

  public testSetup:    SuiteSetting;
  public testTeardown: SuiteSetting;

  public libraryImports: LibraryImport[] = [];
  public resourceImports: ResourceImport[] = [];
  public variableImports: VariableImport[] = [];

  constructor(public location: SourceLocation) {
  }

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

// export enum VariableType {
//   Scalar = "1",
//   List,
//   Dictionary,
//   Environment
// };

/**
 *
 */
interface Declaration extends Node {
  name: Identifier;
}

interface FunctionDeclaration extends Declaration {
  steps: Step[];
}

/**
 *
 */
export class ScalarDeclaration implements Declaration {
  public type = "ScalarDeclaration";

  /**
   *
   */
  constructor(
    public name: Identifier,
    public value: Expression,
    public location: SourceLocation
  ) { }
}

/**
 *
 */
export class ListDeclaration implements Declaration {
  public type = "ListDeclaration";

  /**
   *
   */
  constructor(
    public name: Identifier,
    public values: Expression[],
    public location: SourceLocation
  ) { }
}

export class DictionaryDeclaration implements Declaration {
  public type = "DictionaryDeclaration";

  /**
   *
   */
  constructor(
    public name: Identifier,
    public values: Identifier[] | KeyValueLiteral[],
    public location: SourceLocation
  ) { }
}

/**
 * VariablesTable
 */
export class VariablesTable implements Node {
  public type = "VariablesTable";

  public variables: Declaration[] = [];

  constructor(
    public location: SourceLocation
  ) { }

  public addVariable(variable: Declaration) {
    this.variables.push(variable);
  }
}

/**
 * Step
 */
export class Step implements Node {
  public type = "Step";

  constructor(
    public body: Declaration | CallExpression,
    public location: SourceLocation
  ) { }
}

/**
 *
 */
export class UserKeyword implements FunctionDeclaration {
  public type = "UserKeyword";
  public steps: Step[] = [];

  constructor(
    public name: Identifier,
    private startPosition: Position
  ) {}

  public addStep(step: Step) {
    this.steps.push(step);
  }

  public get location(): SourceLocation {
    if (_.isEmpty(this.steps)) {
      return {
        start: this.startPosition,
        end: {
          line: this.startPosition.line,
          column: this.startPosition.column + this.name.name.length
        }
      };
    }

    return {
      start: this.startPosition,
      end: _.last(this.steps).location.end
    };
  }
}

/**
 * KeywordsTable
 */
export class KeywordsTable implements Node {
  public type = "KeywordsTable";

  public keywords: UserKeyword[] = [];

  constructor(
    public location: SourceLocation
  ) { }

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

  constructor(
    public name: Identifier,
    private startPosition: Position
  ) { }

  public addStep(step: Step) {
    this.steps.push(step);
  }

  public get location(): SourceLocation {
    if (_.isEmpty(this.steps)) {
      return {
        start: this.startPosition,
        end: {
          line: this.startPosition.line,
          column: this.startPosition.column + this.name.name.length
        }
      };
    }

    return {
      start: this.startPosition,
      end: _.last(this.steps).location.end
    };
  }
}

/**
 *
 */
export class TestCasesTable implements Node {
  public type = "TestCaseTable";
  public testCases: TestCase[] = [];

  constructor(
    public location: SourceLocation
  ) { }

  public addTestCase(testCase: TestCase) {
    this.testCases.push(testCase);
  }
}

export class TestSuite implements Node {
  public type = "Suite";

  public settingsTable:  SettingsTable;
  public variablesTable: VariablesTable;
  public keywordsTable:  KeywordsTable;
  public testCasesTable: TestCasesTable;

  /**
   *
   */
  constructor(
    public location: SourceLocation
  ) { }
}
