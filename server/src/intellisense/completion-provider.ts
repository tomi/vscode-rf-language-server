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
  CompletionItem, CompletionItemKind, InsertTextFormat
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
    const textToSearch = node.name;

    return SearchTree.findKeywords(textToSearch, searchTree)
      .map(keyword => {
        let [insertText, insertTextFormat] = createKeywordSnippet(keyword);
        const detail        = getKeywordArgs(keyword);
        const documentation = getKeywordDocumentation(keyword);

        if (textToSearch.includes(" ")) {
          // VSCode completion handles only complete words and not spaces,
          // so everything before the last space needs to be trimmed
          // from the insert text for it to work correctly
          const textBeforeLastSpace =
            textToSearch.substr(0, textToSearch.lastIndexOf(" ") + 1);

          insertText = removeFromBeginning(insertText, textBeforeLastSpace);
        }

        return {
          label: keyword.id.name,
          kind:  CompletionItemKind.Function,
          insertText,
          insertTextFormat,
          detail,
          documentation
        };
      });
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

/**
 * Creates a signature from given keyword. If the keyword has arguments,
 * the signature is returned as a snippet
 *
 * @param keyword
 */
function createKeywordSnippet(
  keyword: UserKeyword
): [string, InsertTextFormat] {
  if (keyword.arguments) {
    const args = keyword.arguments.values
      .map((arg, idx) => `\${${ idx + 1 }:${ arg.id.name }}`)
      .join("  ");

    return [`${ keyword.id.name }  ${ args }`, InsertTextFormat.Snippet];
  } else {
    return [keyword.id.name, InsertTextFormat.PlainText];
  }
}

function getKeywordArgs(keyword: UserKeyword): string {
  if (keyword.arguments) {
    return keyword.arguments.values
      .map(arg => formatVariable(arg))
      .join("  ");
  } else {
    return undefined;
  }
}

function getKeywordDocumentation(keyword: UserKeyword): string {
  if (keyword.documentation) {
    return keyword.documentation.value.value;
  } else {
    return undefined;
  }
}

function removeFromBeginning(toCheck: string, partToRemove: string) {
  const regex = new RegExp(`^${ _.escapeRegExp(partToRemove) }`, "i");
  return toCheck.replace(regex, "");
}
