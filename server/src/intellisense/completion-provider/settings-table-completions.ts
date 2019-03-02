import * as _ from "lodash";
import * as typeGuards from "../type-guards";
import Workspace from "../workspace/workspace";
import { Node, TestSuite, SuiteSetting } from "../../parser/models";
import { CompletionItem } from "vscode-languageserver";
import { traverse, VisitorOption } from "../../traverse/traverse";
import { Location, isOnLine } from "../../utils/position";
import {
  getSyntaxCompletions,
  getKeywordCompletions,
  getVariableCompletions,
} from "./completion-helper";
import { LocationInfo } from "../node-locator";

const KEYWORDS = [
  "Default Tags",
  "Documentation",
  "Force Tags",
  "Library",
  "Metadata",
  "Resource",
  "Suite Setup",
  "Suite Teardown",
  "Test Setup",
  "Test Teardown",
  "Test Template",
  "Test Timeout",
];

export function getCompletions(
  location: Location,
  locationInfo: LocationInfo,
  fileAst: TestSuite,
  workspace: Workspace
): CompletionItem[] {
  const { row, cell, textBefore } = locationInfo;

  const cellIndex = row.indexOf(cell);
  const isFirstCell = cellIndex === 0;
  if (isFirstCell) {
    return getSyntaxCompletions(textBefore, KEYWORDS);
  }

  const nodeOnLine = _findNodeOnLine(location.position.line, fileAst);
  if (!nodeOnLine) {
    return [];
  }

  if (typeGuards.isDocumentation(nodeOnLine)) {
    return [];
  }
  if (typeGuards.isSuiteSetting(nodeOnLine)) {
    return _getSuiteSettingCompletions(
      textBefore,
      nodeOnLine,
      cellIndex,
      workspace
    );
  }

  return getVariableCompletions(textBefore, workspace.variables);
}

function _getSuiteSettingCompletions(
  textBefore: string,
  suiteSetting: SuiteSetting,
  cellIndex: number,
  workspace: Workspace
) {
  if (_isSetupOrTeardown(suiteSetting) && cellIndex === 1) {
    return getKeywordCompletions(textBefore, workspace);
  } else {
    return getVariableCompletions(textBefore, workspace.variables);
  }
}

function _isSetupOrTeardown(setting: SuiteSetting) {
  const settingName = setting.name.name.toLowerCase();

  return [
    "suite setup",
    "suite teardown",
    "test setup",
    "test teardown",
  ].includes(settingName);
}

function _findNodeOnLine(line: number, ast: TestSuite) {
  let foundNode: Node;

  traverse(ast.settingsTable, {
    enter: (node: Node) => {
      if (foundNode) {
        return VisitorOption.Break;
      }
      if (typeGuards.isSettingsTable(node)) {
        return VisitorOption.Continue;
      }
      if (isOnLine(line, node)) {
        foundNode = node;

        return VisitorOption.Break;
      }

      return VisitorOption.Continue;
    },
  });

  return foundNode;
}
