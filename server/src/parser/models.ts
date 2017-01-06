import * as _ from "lodash";

export class Import {
  private name: string;
  private target: string;
  private arguments: string[];

  constructor(name: string, target: string, args: string[] = []) {
    this.name = name;
    this.target = target;
    this.arguments = args;
  }
}

export class Setting {
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
    this.name = name;

    if (_.isArray[args[0]]) {
      this.values = args[0];
    } else {
      this.values = args;
    }
  }
}

export class Table {

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
export class Variable {
  private type: VariableType;
  private name: string;

  constructor(type: VariableType, name: string) {
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
export class Step {
  public name: string;
  public arguments: string[];

  constructor(name: string, args: string[]) {
    this.name = name;
    this.arguments = args;
  }
}

/**
 * Keyword
 */
export class Keyword {
  constructor(public name: string, public steps: Step[] = []) {
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

export class TestDataFile {
  public settingsTable:  SettingsTable;
  public variablesTable: VariablesTable;
  public keywordsTable:  KeywordsTable;

  constructor() {
    // TODO
  }
}
