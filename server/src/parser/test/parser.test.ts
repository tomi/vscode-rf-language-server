import * as _ from "lodash";
import * as chai from "chai";

import { FileParser } from "../parser";
import {
  TestDataFile,
  SettingsTable,
  ResourceFileImport
} from "../models";

import {
  location,
  table,
  row,
} from "./test-helper";

const parser = new FileParser();

function parseAndAssert(stringToParse: string, expected: any) {
  const actual = parser.parseFile(stringToParse);

  chai.assert.deepEqual(actual, expected);
}

function shouldRecogniseTable(tableDef, tableProperty) {
  const parsed = parser.parseFile(tableDef);

  chai.assert.isObject(parsed[tableProperty]);
}

function testDataFile(location, content) {
  return Object.assign(new TestDataFile(location), content);
}

function settingsTable(location, content) {
  return Object.assign(new SettingsTable(location), content);
}

describe("RF Parser", () => {

  describe("Parsing Settings table", () => {

    it("should recognise a settings table", () => {
      shouldRecogniseTable("*Settings", "settingsTable");
    });

    it("should parse resource imports", () => {

      const tableDefinition = `*** Settings ***

Resource   resources/\${ENVIRONMENT}.robot
Resource   resources/smoke_resources.robot
`;

      const expected = testDataFile(location(0, 0, 4, 0), {
        settingsTable: settingsTable(location(0, 0, 4, 0), {
          resourceImports: [
            new ResourceFileImport("resources/\${ENVIRONMENT}.robot", location(2, 0, 2, 41)),
            new ResourceFileImport("resources/smoke_resources.robot", location(3, 0, 3, 42)),
          ]
        })
      });

      parseAndAssert(tableDefinition, expected);
    });

//     it("should parse suite setup", () => {
//       generateSettingsTableTest(
//         `Suite Setup         Open Default Browser`,
//         { suiteSetup: new Setting("Suite Setup", "Open Default Browser") }
//       );
//     });

//     it("should parse suite teardown", () => {
//       generateSettingsTableTest(
//         `Suite Teardown         Open Default Browser`,
//         { suiteTeardown: new Setting("Suite Teardown", "Open Default Browser") }
//       );
//     });

//     it("should parse test setup", () => {
//       generateSettingsTableTest(
//         `Test Setup         Open Default Browser`,
//         { testSetup: new Setting("Test Setup", "Open Default Browser") }
//       );
//     });

//     it("should parse test teardown", () => {
//       generateSettingsTableTest(
//         `Test Teardown         Open Default Browser`,
//         { testTeardown: new Setting("Test Teardown", "Open Default Browser") }
//       );
//     });

  });

  describe("Parsing Variables table", () => {

    it("should recognise variables table", () => {
      shouldRecogniseTable("*Variables", "variablesTable");
    });

    // it("should parse scalar variables", () => {
    //   generateVariablesTableTest("${lol}    123", [new ScalarVariable("lol", "123")]);
    //   generateVariablesTableTest("${lol}=   123", [new ScalarVariable("lol", "123")]);
    //   generateVariablesTableTest("${lol} =  123", [new ScalarVariable("lol", "123")]);
    // });

  });

  describe("Parsing Keywords table", () => {

    it("should recognise keywords table", () => {
      shouldRecogniseTable("*Keywords", "keywordsTable");
    });

//     it("should parse empty keyword", () => {
//       const keywordName = "Keyword Name";

//       generateKeywordsTableTest(keywordName, [new Keyword(keywordName)]);
//     });

//     it("should parse keyword with steps", () => {
//       const keyword = `
// Keyword Name
//     Step1   Arg11
//     Step2   arg21   arg22
// `;

//       generateKeywordsTableTest(keyword, [
//         new Keyword("Keyword Name", [
//           new Step("Step1", ["Arg11"]),
//           new Step("Step2", ["arg21", "arg22"])
//         ])
//       ]);
//     });

//     it("should parse multiple keywords with steps", () => {
//       const keyword = `
// Keyword Name1
//     Step1   Arg11
//     Step2   arg21   arg22
// Keyword Name2
//     Step1   Arg11

// Keyword Name3
//     Step1   Arg11
// `;

//       generateKeywordsTableTest(keyword, [
//         new Keyword("Keyword Name1", [
//           new Step("Step1", ["Arg11"]),
//           new Step("Step2", ["arg21", "arg22"])
//         ]),
//         new Keyword("Keyword Name2", [
//           new Step("Step1", ["Arg11"]),
//         ]),
//         new Keyword("Keyword Name3", [
//           new Step("Step1", ["Arg11"]),
//         ]),
//       ]);
//     });
  });

  describe("Parsing test cases table", () => {

    it("should recognise test cases table", () => {
      shouldRecogniseTable("*Test Cases", "testCasesTable");
    });

//     it("should parse empty test case", () => {
//       const testCaseName = "Empty Test Case";

//       generateTestCasesTableTest(testCaseName, [new TestCase(testCaseName)]);
//     });

//     it("should parse test case with steps", () => {
//       const testCase = `
// Test Case
//   Step  arg1  arg2
// `;

//       generateTestCasesTableTest(testCase, [
//         new TestCase("Test Case", [
//           new Step("Step", ["arg1", "arg2"])
//         ])
//       ]);
//     });

  });

});
