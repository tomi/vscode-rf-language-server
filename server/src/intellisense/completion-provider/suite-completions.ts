import * as _ from "lodash";
import { TestSuite } from "../../parser/models";
import { Location } from "../../utils/position";
import { CompletionItem } from "vscode-languageserver";
import { getSyntaxCompletions } from "./completion-helper";
import { LocationInfo } from "../node-locator";

/**
 * Return the completions for data tables
 */
export function getCompletions(
  location: Location,
  locationInfo: LocationInfo,
  fileAst: TestSuite
): CompletionItem[] {
  const { row, cell, textBefore: text } = locationInfo;

  if (row.indexOf(cell) !== 0 || !text.startsWith("*")) {
    return [];
  }

  const missingTables = _getMissingTables(fileAst);
  const sanitizedText = text.replace(/\*/g, "").replace(/ /g, "");
  return getSyntaxCompletions(sanitizedText, missingTables);
}

function _getMissingTables(ast: TestSuite) {
  const tables = [];

  if (!ast.settingsTable) {
    tables.push("Settings");
  }
  if (!ast.variablesTable) {
    tables.push("Variables");
  }
  if (!ast.keywordsTable) {
    tables.push("Keywords");
  }
  if (!ast.testCasesTable) {
    tables.push("Test Cases");
  }

  return tables;
}
