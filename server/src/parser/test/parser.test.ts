import { FileParser } from "../parser";
import {
  TestDataFile,
  SettingsTable,
  SingleValueSetting,
  Import
} from "../models";

import * as chai from "chai";

const settings = `
*** Settings ***
Resource            resources/\${ENVIRONMENT}.robot
Resource            resources/smoke_resources.robot
Suite Setup         Open Default Browser
Suite Teardown      Close Browser
Test Setup          Navigate To Frontpage
`;

const parser = new FileParser();

describe("RF Parser", () => {
  it("should parse settings table", () => {
    const settingsTable = new SettingsTable();

    settingsTable.suiteSetup    = new SingleValueSetting("Suite Setup", "Open Default Browser");
    settingsTable.suiteTeardown = new SingleValueSetting("Suite Teardown", "Close Browser");
    settingsTable.testSetup     = new SingleValueSetting("Test Setup", "Navigate To Frontpage");

    settingsTable.imports = [
      new Import("Resource", "resources/\${ENVIRONMENT}.robot"),
      new Import("Resource", "resources/smoke_resources.robot"),
    ]

    const expected = new TestDataFile();
    expected.settingsTable = settingsTable;

    const actual = parser.parse(settings);

    chai.assert.deepEqual(actual, expected);
  })
});
