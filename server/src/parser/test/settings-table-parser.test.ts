import * as _ from "lodash";
import * as chai from "chai";

import { parseSettingsTable } from "../settings-table-parser";
import {
  SettingsTable,
  Setting,
  LibraryImport,
  ResourceFileImport,
  VariableFileImport
} from "../models";

import {
  location,
  table,
  row,
  cell
} from "./test-helper";

function parseAndAssert(tableDefinition, expected) {
  const actual = parseSettingsTable(tableDefinition);

  chai.assert.deepEqual(actual, expected);
}

function settingsTable(location, content) {
  return Object.assign(new SettingsTable(location), content);
}

function createSettingTest(settingName, propertyName, values) {
  const tableDefinition = table("Settings", {
    header: row(location(0, 0, 0, 10)),
    rows: [
      row(location(1, 0, 1, 10), [
        cell(location(1, 0, 1, 10), settingName),
        ...values.map(val => cell(location(1, 0, 1, 10), val))
      ])
    ]
  });

  const expected = settingsTable(location(0, 0, 1, 10), {
    [propertyName]: new Setting(settingName, values, location(1, 0, 1, 10))
  });

  parseAndAssert(tableDefinition, expected);
}

describe("Parsing Settings table", () => {
  it("should parse resource imports", () => {
    const tableDefinition = table("Settings", {
      header: row(location(0, 0, 0, 10)),
      rows: [
        row(location(1, 0, 1, 10), [
          cell(location(1, 0, 1, 10), "Resource"),
          cell(location(1, 0, 1, 10), "resources/\${ENVIRONMENT}.robot"),
        ]),
        row(location(2, 0, 2, 10), [
          cell(location(2, 0, 2, 10), "Resource"),
          cell(location(2, 0, 2, 10), "resources/smoke_resources.robot"),
        ]),
      ]
    });

    const expected = settingsTable(location(0, 0, 2, 10), {
      resourceImports: [
        new ResourceFileImport("resources/\${ENVIRONMENT}.robot", location(1, 0, 1, 10)),
        new ResourceFileImport("resources/smoke_resources.robot", location(2, 0, 2, 10)),
      ]
    });

    parseAndAssert(tableDefinition, expected);
  });

  it("should parse library imports", () => {
    const tableDefinition = table("Settings", {
      header: row(location(0, 0, 0, 10)),
      rows: [
        row(location(1, 0, 1, 10), [
          cell(location(1, 0, 1, 10), "Library"),
          cell(location(1, 0, 1, 10), "libs/\${ENVIRONMENT}.robot"),
        ]),
        row(location(2, 0, 2, 10), [
          cell(location(2, 0, 2, 10), "Library"),
          cell(location(2, 0, 2, 10), "lib"),
          cell(location(2, 0, 2, 10), "arg1"),
          cell(location(2, 0, 2, 10), "arg2"),
        ]),
      ]
    });

    const expected = settingsTable(location(0, 0, 2, 10), {
      libraryImports: [
        new LibraryImport("libs/\${ENVIRONMENT}.robot", [], location(1, 0, 1, 10)),
        new LibraryImport("lib", ["arg1", "arg2"], location(2, 0, 2, 10)),
      ]
    });

    parseAndAssert(tableDefinition, expected);
  });

  it("should parse variable imports", () => {
    const tableDefinition = table("Settings", {
      header: row(location(0, 0, 0, 10)),
      rows: [
        row(location(1, 0, 1, 10), [
          cell(location(1, 0, 1, 10), "Variables"),
          cell(location(1, 0, 1, 10), "vars/\${ENVIRONMENT}.robot"),
        ]),
        row(location(2, 0, 2, 10), [
          cell(location(2, 0, 2, 10), "Variables"),
          cell(location(2, 0, 2, 10), "vars/vars.robot"),
        ]),
      ]
    });

    const expected = settingsTable(location(0, 0, 2, 10), {
      variableImports: [
        new VariableFileImport("vars/\${ENVIRONMENT}.robot", location(1, 0, 1, 10)),
        new VariableFileImport("vars/vars.robot", location(2, 0, 2, 10)),
      ]
    });

    parseAndAssert(tableDefinition, expected);
  });

  it("should parse suite setup", () => {
    createSettingTest("Suite Setup", "suiteSetup", ["arg1", "arg2"]);
  });

  it("should parse suite teardown", () => {
    createSettingTest("Suite Teardown", "suiteTeardown", ["arg1", "arg2"]);
  });

  it("should parse test setup", () => {
    createSettingTest("Test Setup", "testSetup", ["arg1", "arg2"]);
  });

  it("should parse test teardown", () => {
    createSettingTest("Test Teardown", "testTeardown", ["arg1", "arg2"]);
  });
});
