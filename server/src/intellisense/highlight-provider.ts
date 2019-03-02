import * as _ from "lodash";
import * as typeGuards from "./type-guards";
import Workspace from "./workspace/workspace";
import { ConsoleLogger as logger } from "../logger";
import { DocumentHighlight } from "vscode-languageserver";
import { Location, nodeLocationToRange } from "../utils/position";
import { filter } from "../utils/ast-util";
import { findLocalVariables, findNodeInPos, FileNode } from "./node-locator";
import {
  Node,
  VariableDeclaration,
  VariableExpression,
  FunctionDeclaration,
  SettingDeclaration,
} from "../parser/models";

/**
 *
 * @param location
 * @param workspace
 */
export function findFileHighlights(location: Location, workspace: Workspace) {
  const file = workspace.getFile(location.filePath);
  if (!file) {
    logger.info(`Definition not found. File '${location.filePath}' not parsed`);
    return [];
  }

  const nodeInPos = findNodeInPos(location.position, file);

  const variableHighlights = _tryFindVariableHighlights(nodeInPos);
  if (variableHighlights) {
    return variableHighlights;
  }

  const keywordHighlights = _tryFindKeywordHighlights(nodeInPos);
  if (keywordHighlights) {
    return keywordHighlights;
  }

  const settingHighlights = _tryFindSettingHighlights(nodeInPos);
  if (settingHighlights) {
    return settingHighlights;
  }
  // if (_isSettingDeclaration(nodeInPos)) {

  // }
  return [];
}

/**
 * Tries to find highlights for variables
 *
 * @param nodeInPos
 *
 * @return null if there isn't a variable in the position,
 * otherwise highlights for the variables
 */
function _tryFindVariableHighlights(nodeInPos: FileNode): DocumentHighlight[] {
  const lastNode = nodeInPos.node;
  const secondLast = _.last(nodeInPos.path);

  let variable: VariableDeclaration | VariableExpression;
  if (typeGuards.isVariableDeclaration(lastNode)) {
    variable = lastNode;
  } else if (typeGuards.isIdentifier(lastNode)) {
    if (typeGuards.isVariableDeclaration(secondLast)) {
      variable = secondLast;
    } else if (typeGuards.isVariableExpression(secondLast)) {
      variable = secondLast;
    } else {
      return null;
    }
  } else {
    return null;
  }

  const functionNode = _tryFindFunctionDeclaration(nodeInPos);
  let searchScope: Node = nodeInPos.file.ast;
  if (functionNode) {
    // Might be a local variable
    const locals = findLocalVariables(functionNode);
    const localVariable = locals.findVariable(variable.kind, variable.id.name);
    if (localVariable) {
      // Search only within the function
      searchScope = functionNode;
    }
  }

  return filter(searchScope, node => {
    if (
      typeGuards.isVariableDeclaration(node) ||
      typeGuards.isVariableExpression(node)
    ) {
      return (
        node.kind === variable.kind &&
        node.id.name.toLowerCase() === variable.id.name.toLowerCase()
      );
    } else {
      return false;
    }
  }).map(node => {
    const highlightFor = typeGuards.isVariableDeclaration(node)
      ? node.id
      : node;
    return _createSymbolHighlight(highlightFor);
  });
}

/**
 * Tries to find highlights for user keywords
 *
 * @param nodeInPos
 *
 * @return null if there isn't a variable in the position,
 * otherwise highlights for the variables
 */
function _tryFindKeywordHighlights(nodeInPos: FileNode): DocumentHighlight[] {
  const lastNode = nodeInPos.node;
  const secondLast = _.last(nodeInPos.path);

  let keywordName: string;
  if (!typeGuards.isIdentifier(lastNode)) {
    return null;
  }

  if (typeGuards.isCallExpression(secondLast)) {
    keywordName = secondLast.callee.name;
  } else if (typeGuards.isUserKeyword(secondLast)) {
    keywordName = secondLast.id.name;
  } else {
    return null;
  }

  // TODO: Support keywords with embedded arguments
  return filter(nodeInPos.file.ast, node => {
    if (typeGuards.isCallExpression(node)) {
      return node.callee.name.toLowerCase() === keywordName.toLowerCase();
    } else if (typeGuards.isUserKeyword(node)) {
      return node.id.name.toLowerCase() === keywordName.toLowerCase();
    } else {
      return false;
    }
  }).map(node => {
    if (typeGuards.isCallExpression(node)) {
      return _createSymbolHighlight(node.callee);
    } else if (typeGuards.isUserKeyword(node)) {
      return _createSymbolHighlight(node.id);
    } else {
      return undefined;
    }
  });
}

function _tryFindSettingHighlights(nodeInPos: FileNode): DocumentHighlight[] {
  const lastNode = nodeInPos.node;
  const secondLast = _.last(nodeInPos.path);

  if (
    !typeGuards.isIdentifier(lastNode) ||
    !typeGuards.isSettingDeclaration(secondLast)
  ) {
    return null;
  }

  const settings = filter(
    nodeInPos.file.ast,
    node =>
      typeGuards.isSettingDeclaration(node) && node.kind === secondLast.kind
  ) as SettingDeclaration[];

  return settings.map(node => _createSymbolHighlight(node.id));
}

function _tryFindFunctionDeclaration(nodeInPos: FileNode): FunctionDeclaration {
  return [nodeInPos.node, ...nodeInPos.path].find(
    typeGuards.isFunctionDeclaration
  ) as FunctionDeclaration;
}

function _createSymbolHighlight(node: Node): DocumentHighlight {
  return {
    range: nodeLocationToRange(node),
  };
}
