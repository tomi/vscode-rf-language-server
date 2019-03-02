import Workspace from "../workspace/workspace";
import { TestSuite } from "../../parser/models";
import { CompletionItem } from "vscode-languageserver";
import { Location } from "../../utils/position";

import * as functionCompletions from "./functions-table-completions";
import { LocationInfo } from "../node-locator";

const SETTINGS = [
  "Documentation",
  "Tags",
  "Setup",
  "Teardown",
  "Template",
  "Timeout",
];

/**
 * Returns the completions for test case table
 *
 */
export function getCompletions(
  location: Location,
  locationInfo: LocationInfo,
  fileAst: TestSuite,
  workspace: Workspace
): CompletionItem[] {
  return functionCompletions.getCompletions(
    location,
    locationInfo,
    fileAst,
    workspace,
    SETTINGS
  );
}
