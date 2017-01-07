import * as _ from "lodash";

export interface Position {
  line: number;
  column: number;
}

export interface SourceLocation {
  start: Position;
  end: Position;
}

export class BaseModel {
  private location: SourceLocation;

  constructor() {
    this.location = {
      start: null,
      end: null
    };
  }

  public setStartPosition(position: Position) {
    this.location.start = position;
  }

  public setEndPosition(position: Position) {
    this.location.end = position;
  }
}

export class Import extends BaseModel {
  private name: string;
  private target: string;
  private arguments: string[];

  constructor(name: string, target: string, args: string[] = []) {
    super();

    this.name = name;
    this.target = target;
    this.arguments = args;
  }
}

export class Setting extends BaseModel {
  private name: string;
  private values: string[];

  /**
   * @example
   * new Setting("name", ["arg1", "arg2"])
   *
   * @example
   * new Setting("name", "arg1", "arg2")
   */
  constructor(name: string, ...args) {
    super();

    this.name = name;
    this.values = args;
  }
}

export class Table extends BaseModel {
}

/**
 *
 */
export class SettingsTable extends Table {
  public suiteSetup:    Setting;
  public suiteTeardown: Setting;

  public testSetup:    Setting;
  public testTeardown: Setting;

  public imports: Import[];

  constructor(options?) {
    super();

    this.imports = [];
  }

  /**
   * addImport
   */
  public addImport(importToAdd: Import) {
    this.imports.push(importToAdd);
  }
}

export enum VariableType {
  Scalar = 1,
  List,
  Dictionary,
  Environment
};

/**
 * VariableDefinition
 */
export class Variable extends BaseModel {
  private type: VariableType;
  private name: string;

  constructor(type: VariableType, name: string) {
    super();

    this.type = type;
    this.name = name;
  }
}

/**
 * ScalarVariable
 */
export class ScalarVariable extends Variable {
  private value: string;

  /**
   *
   */
  constructor(name: string, value: string) {
    super(VariableType.Scalar, name);

    this.value = value;
  }
}

/**
 * ListVariable
 */
export class ListVariable extends Variable {
  private values: string[];

  constructor(name: string, values: string[]) {
    super(VariableType.List, name);

    this.values = values;
  }
}

/**
 * VariablesTable
 */
export class VariablesTable extends Table {
  public variables: Variable[];

  /**
   *
   */
  constructor() {
    super();

    this.variables = [];
  }

  public addVariable(variable: Variable) {
    this.variables.push(variable);
  }
}

/**
 * Step
 */
export class Step extends BaseModel {
  public name: string;
  public arguments: string[];

  constructor(name: string, args: string[]) {
    super();

    this.name = name;
    this.arguments = args;
  }
}

/**
 * Keyword
 */
export class Keyword extends BaseModel {
  constructor(public name: string, public steps: Step[] = []) {
    super();
  }

  public addStep(step: Step) {
    this.steps.push(step);
  }
}

/**
 * KeywordsTable
 */
export class KeywordsTable extends Table {
  public keywords: Keyword[];

  constructor() {
    super();

    this.keywords = [];
  }

  public addKeyword(keyword: Keyword) {
    this.keywords.push(keyword);
  }
}

/**
 * TestCase
 */
export class TestCase extends BaseModel {
  constructor(public name: string, public steps: Step[] = []) {
    super();
  }

  public addStep(step: Step) {
    this.steps.push(step);
  }
}

/**
 * TestCasesTable
 */
export class TestCasesTable extends Table {
  public testCases: TestCase[];

  constructor() {
    super();

    this.testCases = [];
  }

  public addTestCase(testCase: TestCase) {
    this.testCases.push(testCase);
  }
}

export class TestDataFile extends Table {
  public settingsTable:  SettingsTable;
  public variablesTable: VariablesTable;
  public keywordsTable:  KeywordsTable;
  public testCasesTable: TestCasesTable;
}
