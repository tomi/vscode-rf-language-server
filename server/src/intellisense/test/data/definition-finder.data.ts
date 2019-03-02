export const keywords = {
  filePath: "keywords.robot",
  relativePath: "keywords.robot",
  content: `
*** Settings ***
Documentation  Keywords for definition finder tests

*** Keywords ***
Simple Keyword
  [Documentation]  Simple keyword

Another Keyword
  [Documentation]  Just another keyword
`,
};

export const tests = {
  filePath: "tests.robot",
  relativePath: "tests.robot",
  content: `
*** Settings ***
[Documentation]  Demonstrates keyword definition finding.
Resource  keywords.robot

*** Test Cases ***
Test cases for findinging keyword definition
  Simple Keyword
  Another Keyword

Test cases for findinging gherking style keyword definition
  Given Simple Keyword
  When Simple Keyword
  Then Simple Keyword
  and Simple Keyword
  but Simple Keyword

Test cases for not existing keywords
  Non Existing Keyword
  Given Non Existing Gherkin Keyword
`,
};
