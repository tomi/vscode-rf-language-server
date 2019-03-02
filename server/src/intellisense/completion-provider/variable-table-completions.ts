import * as _ from "lodash";
import Workspace from "../workspace/workspace";
import { TestSuite } from "../../parser/models";
import { Location } from "../../utils/position";
import { getVariableCompletions } from "./completion-helper";
import { CompletionItem } from "vscode-languageserver";
import { LocationInfo } from "../node-locator";

export function getCompletions(
  location: Location,
  locationInfo: LocationInfo,
  fileAst: TestSuite,
  workspace: Workspace
): CompletionItem[] {
  const { row, cell, textBefore } = locationInfo;

  const isFirstCell = row.indexOf(cell) === 0;
  if (isFirstCell) {
    return [];
  }

  return getVariableCompletions(textBefore, workspace.variables);
}
