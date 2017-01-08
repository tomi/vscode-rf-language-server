import * as _ from "lodash";

import {
  SourceBlock,
  SourceLocation,
  Position
} from "./table-models";

export class LibraryImport implements SourceBlock {
  /**
   *
   */
  constructor(
    public target: string,
    public args: string[],
    public location: SourceLocation
  ) { }
}

export class ResourceFileImport implements SourceBlock {
  /**
   *
   */
  constructor(
    public target: string,
    public location: SourceLocation
  ) { }
}

export class VariableFileImport implements SourceBlock {
  /**
   *
   */
  constructor(
    public target: string,
    public location: SourceLocation
  ) { }
}

export class Setting implements SourceBlock {
  constructor(
    public name: string,
    public values: string[],
    public location: SourceLocation
  ) { }
}

/**
 *
 */
export class SettingsTable implements SourceBlock {
  public suiteSetup:    Setting;
  public suiteTeardown: Setting;

  public testSetup:    Setting;
  public testTeardown: Setting;

  public libraryImports: LibraryImport[] = [];
  public resourceImports: ResourceFileImport[] = [];
  public variableImports: VariableFileImport[] = [];

  constructor(public location: SourceLocation) {
  }

  public addLibraryImport(importToAdd: LibraryImport) {
    this.libraryImports.push(importToAdd);
  }

  public addResourceImport(importToAdd: ResourceFileImport) {
    this.resourceImports.push(importToAdd);
  }

  public addVariableImport(importToAdd: VariableFileImport) {
    this.variableImports.push(importToAdd);
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
export class VariableDefinition implements SourceBlock {

  constructor(
    public type: VariableType,
    public name: string,
    public location: SourceLocation
  ) { }
}

/**
 * ScalarVariable
 */
export class ScalarVariable extends VariableDefinition {
  /**
   *
   */
  constructor(
    name: string,
    public value: string,
    location: SourceLocation
  ) {
    super(VariableType.Scalar, name, location);

    this.value = value;
  }
}

/**
 * ListVariable
 */
export class ListVariable extends VariableDefinition {
  constructor(
    name: string,
    public values: string[],
    location: SourceLocation
  ) {
    super(VariableType.List, name, location);
  }
}

/**
 * VariablesTable
 */
export class VariablesTable implements SourceBlock {
  public variables: VariableDefinition[] = [];

  constructor(
    public location: SourceLocation
  ) { }

  public addVariable(variable: VariableDefinition) {
    this.variables.push(variable);
  }
}

/**
 * Step
 */
export class Step implements SourceBlock {
  constructor(
    public name: string,
    public args: string[],
    public location: SourceLocation
  ) { }
}

/**
 * Keyword
 */
export class Keyword implements SourceBlock {
  public steps: Step[] = [];

  constructor(
    public name: string,
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
          column: this.startPosition.column + this.name.length
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
export class KeywordsTable implements SourceBlock {
  public keywords: Keyword[] = [];

  constructor(
    public location: SourceLocation
  ) { }

  public addKeyword(keyword: Keyword) {
    this.keywords.push(keyword);
  }
}

/**
 * TestCase
 */
export class TestCase implements SourceBlock {
  public steps: Step[] = [];

  constructor(
    public name: string,
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
          column: this.startPosition.column + this.name.length
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
 * TestCasesTable
 */
export class TestCasesTable implements SourceBlock {
  public testCases: TestCase[] = [];

  constructor(
    public location: SourceLocation
  ) { }

  public addTestCase(testCase: TestCase) {
    this.testCases.push(testCase);
  }
}

export class TestDataFile implements SourceBlock {
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
