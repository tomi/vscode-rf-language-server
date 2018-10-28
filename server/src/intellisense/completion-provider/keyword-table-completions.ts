import Workspace from "../workspace/workspace";
import { TestSuite } from "../../parser/models";
import { CompletionItem } from "vscode-languageserver";
import { Location } from "../../utils/position";

import * as functionCompletions from "./functions-table-completions";

const SETTINGS = [
  "Documentation",
  "Tags",
  "Arguments",
  "Return",
  "Teardown",
  "Timeout",
];

export function getCompletions(
  location: Location,
  locationInfo,
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
