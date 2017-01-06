
export class Import {
  constructor(private name: string, private target: string) {
  }
}

export class SingleValueSetting {
  constructor(private name: string, private value: string) {
  }

}

export class Setting {
  constructor(private name: string, private values: string[]) {
  }
}

export class Table {

}

export class SettingsTable extends Table {
  public suiteSetup:    SingleValueSetting;
  public suiteTeardown: SingleValueSetting;

  public testSetup:    SingleValueSetting;
  public testTeardown: SingleValueSetting;

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

export class TestDataFile {
  public settingsTable: SettingsTable;

  constructor(other?: TestDataFile) {
    if (other !== undefined) {
      this.settingsTable = other.settingsTable;
    }
  }
}
