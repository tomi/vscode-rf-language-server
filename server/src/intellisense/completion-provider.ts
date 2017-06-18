import * as _ from "lodash";
import {
  Node,
  Identifier,
  CallExpression,
  VariableKind,
  VariableExpression,
  VariableDeclaration,
  ScalarDeclaration,
  ListDeclaration,
  DictionaryDeclaration,
  UserKeyword,
} from "../parser/models";
import * as SearchTree from "./search-tree";
import { WorkspaceFile, WorkspaceTree } from "./workspace-tree";
import { Location, Position } from "../utils/position";
import { FileNode, findNodeInPos } from "./node-locator";
import {
  isIdentifier,
  isVariableExpression,
  isVariableDeclaration,
  isFunctionDeclaration,
} from "./type-guards";
import {
  CompletionItem, CompletionItemKind
} from "vscode-languageserver";

import { Range } from "./models";

export function findCompletionItems(
  location: Location,
  workspaceTree: WorkspaceTree
) {
  const file = workspaceTree.getFile(location.filePath);
  const { searchTree } = workspaceTree;

  const nodeInPos = findNodeInPos(location.position, file);

  const variableCompletions = tryFindVariableCompletions(nodeInPos, searchTree);
  if (variableCompletions) {
    return variableCompletions;
  }

  const keywordCompletions = tryFindKeywordCompletions(nodeInPos, searchTree);
  if (keywordCompletions) {
    return keywordCompletions.map(keyword => ({
      label: keyword.id.name,
      kind: CompletionItemKind.Function
    }));
  }

  return [];
}

function tryFindVariableCompletions(nodeInPos: FileNode, searchTree) {
  const { node } = nodeInPos;

  if (!isIdentifier(node)) {
    return null;
  }

  const parentNode = _.last(nodeInPos.path);
  if (isVariableDeclaration(parentNode)) {
    return SearchTree.findVariablesWithKindAndPrefix(
      parentNode.kind,
      node.name,
      searchTree
    ).map(variable => ({
      label:      formatVariable(variable),
      insertText: variable.id.name,
      kind:       CompletionItemKind.Variable
    }));
  }

  const firstChar = node.name[0];
  if (firstChar === "$") {
    return SearchTree.findVariablesWithPrefix(node.name, searchTree)
      .map(variable => ({
        label: formatVariable(variable),
        kind:  CompletionItemKind.Variable
      }));
  }

  return null;
}

function tryFindKeywordCompletions(nodeInPos: FileNode, searchTree) {
  const { node } = nodeInPos;

  if (isIdentifier(node)) {
    return SearchTree.findKeywords(node.name, searchTree);
  } else {
    return null;
  }
}

export function formatVariable(variable: VariableDeclaration) {
  return `${ variableKindToIdentifier(variable.kind) }{${ variable.id.name }}`;
}

function variableKindToIdentifier(kind: VariableKind) {
  switch (kind) {
    case "Scalar":     return "$";
    case "List":       return "@";
    case "Dictionary": return "&";
    default:           return null;
  }
}
