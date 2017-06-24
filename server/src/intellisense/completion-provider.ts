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
import { createRange } from "../utils/position";

import { Range } from "./models";

export function findCompletionItems(
  location: Location,
  workspaceTree: WorkspaceTree
) {
  const file = workspaceTree.getFile(location.filePath);
  const { searchTree } = workspaceTree;

  const nodeInPos = findNodeInPos(location.position, file);

  const variableCompletions = tryFindVariableCompletions(nodeInPos, searchTree);
  if (!_.isEmpty(variableCompletions)) {
    return variableCompletions;
  }

  const keywordCompletions = tryFindKeywordCompletions(nodeInPos, searchTree);
  if (keywordCompletions) {
    return keywordCompletions;
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
    // The cursor is inside the variable declaration (${})
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

  return SearchTree.findVariablesWithPrefix(node.name, searchTree)
    .map(variable => {
      const variableName = formatVariable(variable);

      return {
        label:      variableName,
        insertText: removeFromBeginning(variableName, node.name),
        kind:       CompletionItemKind.Variable
      };
    });
}

function tryFindKeywordCompletions(nodeInPos: FileNode, searchTree) {
  const { node } = nodeInPos;

  if (isIdentifier(node)) {
    return SearchTree.findKeywords(node.name, searchTree)
      .map(keyword => ({
        label:      keyword.id.name,
        // insertText: removeFromBeginning(keyword.id.name, node.name),
        // textEdit: {
        //   range: createRange(node.location.end, node.location.end),
        //   newText: removeFromBeginning(keyword.id.name, node.name)
        // },
        kind: CompletionItemKind.Function
      }));
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

function removeFromBeginning(toCheck: string, partToRemove: string) {
  const regex = new RegExp(`^${ _.escapeRegExp(partToRemove) }`, "i");
  return toCheck.replace(regex, "");
}
