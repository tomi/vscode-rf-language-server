import * as _ from "lodash";
import Workspace from "../workspace/workspace";
import { Node, TestSuite, FunctionDeclaration } from "../../parser/models";
import * as typeGuards from "../type-guards";
import { findLocalVariables, LocationInfo } from "../node-locator";
import { CompletionItem } from "vscode-languageserver";
import { traverse, VisitorOption } from "../../traverse/traverse";
import { Location, isOnLine } from "../../utils/position";
import {
  getSyntaxCompletions,
  getKeywordCompletions,
  getVariableCompletions,
} from "./completion-helper";
import { VariableContainer } from "../search-tree";

const VARIABLE_CHARS = new Set(["$", "@", "&", "%"]);

export function getCompletions(
  location: Location,
  locationInfo: LocationInfo,
  fileAst: TestSuite,
  workspace: Workspace,
  settings: string[]
): CompletionItem[] {
  const { row, cell, textBefore } = locationInfo;

  const cellIndex = row.indexOf(cell);
  const line = location.position.line;

  if (cellIndex === 0 || !row.first().isEmpty()) {
    return [];
  } else if (cellIndex === 1) {
    if (_startsSetting(textBefore)) {
      // Setting, e.g. [Arguments]
      return getSyntaxCompletions(textBefore.substring(1), settings);
    } else if (_startsVariable(textBefore)) {
      // Variable declaration, e.g. ${var}
      return [];
    }
    // else: It's a call expression

    const functionNode = _findFunction(line, fileAst);
    const localVariables = functionNode
      ? findLocalVariables(functionNode, line)
      : VariableContainer.Empty;
    return getKeywordCompletions(textBefore, workspace, localVariables);
  } else {
    const functionNode = _findFunction(line, fileAst);
    const nodeOnLine = _findNodeOnLine(line, functionNode);
    if (!nodeOnLine) {
      return [];
    }

    const noCompletions = [
      typeGuards.isDocumentation,
      typeGuards.isTags,
      typeGuards.isArguments,
      typeGuards.isTimeout,
    ];
    if (_.some(noCompletions, f => f(nodeOnLine))) {
      return [];
    }

    const localVariables = findLocalVariables(functionNode, line);
    const keywordCompletions = [
      typeGuards.isSetup,
      typeGuards.isTeardown,
      typeGuards.isTemplate,
    ];
    if (cellIndex === 2 && _.some(keywordCompletions, f => f(nodeOnLine))) {
      return getKeywordCompletions(textBefore, workspace, localVariables);
    } else if (
      typeGuards.isStep(nodeOnLine) &&
      typeGuards.isVariableDeclaration(nodeOnLine.body)
    ) {
      return getKeywordCompletions(textBefore, workspace, localVariables);
    }

    return getVariableCompletions(
      textBefore,
      workspace.variables,
      localVariables
    );
  }
}

function _startsSetting(text: string) {
  return text.startsWith("[");
}

function _startsVariable(text: string) {
  return VARIABLE_CHARS.has(text.charAt(0));
}

function _findFunction(line: number, ast: TestSuite) {
  const isNodeOnLine = (node: Node) => isOnLine(line, node);

  if (isNodeOnLine(ast.keywordsTable)) {
    return ast.keywordsTable.keywords.find(isNodeOnLine);
  } else if (isNodeOnLine(ast.testCasesTable)) {
    return ast.testCasesTable.testCases.find(isNodeOnLine);
  } else {
    return null;
  }
}

function _findNodeOnLine(line: number, functionNode: FunctionDeclaration) {
  if (!functionNode) {
    return null;
  }
  let foundNode: Node;

  const isNodeOnLine = (node: Node) => isOnLine(line, node);

  traverse(functionNode, {
    enter: (node: Node, parent: Node) => {
      if (foundNode) {
        return VisitorOption.Break;
      }

      if (parent === functionNode && isNodeOnLine(node)) {
        foundNode = node;
        return VisitorOption.Break;
      }

      return VisitorOption.Continue;
    },
  });

  return foundNode;
}
