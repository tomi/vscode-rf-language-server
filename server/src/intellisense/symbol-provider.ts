import { WorkspaceFile, WorkspaceTree } from "./workspace-tree";
import { traverse } from "../traverse/traverse";
import { nodeLocationToRange } from "../utils/position";

import {
  isVariableDeclaration,
  isTestCase,
  isUserKeyword,
  isVariablesTable
} from "./type-guards";

import {
  Node,
  Identifier,
  VariableDeclaration,
  TestCase,
  UserKeyword,
} from "../parser/models";

/**
 * A symbol kind.
 */
const SymbolKind = {
    File:        1,
    Module:      2,
    Namespace:   3,
    Package:     4,
    Class:       5,
    Method:      6,
    Property:    7,
    Field:       8,
    Constructor: 9,
    Enum:        10,
    Interface:   11,
    Function:    12,
    Variable:    13,
    Constant:    14,
    String:      15,
    Number:      16,
    Boolean:     17,
    Array:       18,
};

/**
 * Returns all symbols for given file
 *
 * @param filePath
 * @param workspaceTree
 */
export function getFileSymbols(
  workspaceFile: WorkspaceFile,
  useFileNameAsContainer: boolean = false,
  query: string = ""
) {
  const fileSymbols = [];
  const idMatches = createIdMatcherFn(query);

  traverse(null, workspaceFile.fileTree, {
    enter: (node: Node, parent: Node) => {
      let symbol;
      if (isVariableDeclaration(node) && isVariablesTable(parent) &&
        idMatches(node.id)) {
        symbol = getVariableSymbol(node, workspaceFile, useFileNameAsContainer);
      }
      else if (isTestCase(node) && idMatches(node.id)) {
        symbol = getTestCaseSymbol(node, workspaceFile, useFileNameAsContainer);
      }
      else if (isUserKeyword(node) && idMatches(node.id)) {
        symbol = getUserKeywordSymbol(node, workspaceFile, useFileNameAsContainer);
      }

      if (symbol) {
        fileSymbols.push(symbol);
      }
    }
  });

  return fileSymbols;
}

/**
 * Returns all symbols in the workspace that match the given search string
 *
 * @param workspace
 */
export function getWorkspaceSymbols(
  workspace: WorkspaceTree,
  query: string
) {
  return Array.from(workspace.getFiles())
    .map(fileTree => getFileSymbols(fileTree, true, query))
    .reduce((fileSymbols, allSymbols) => {
      return allSymbols.concat(fileSymbols);
    }, []);
}

/**
 * Creates a function that checks if given identifier is
 * a match to given query string. Comparison is done
 * case insensitive.
 *
 * @param query
 *
 * @returns {function}
 */
function createIdMatcherFn(query: string) {
  const lowerQuery = query.toLowerCase();

  return (identifier: Identifier) => {
    return identifier.name.toLowerCase().includes(lowerQuery);
  };
}

function getVariableSymbol(
  node: VariableDeclaration,
  file: WorkspaceFile,
  useFileNameAsContainer: boolean
) {
  return {
    name: node.id.name,
    kind: SymbolKind.Variable,
    location: {
      uri: file.uri,
      range: nodeLocationToRange(node)
    },
    containerName: useFileNameAsContainer ? file.relativePath : undefined
  };
}

function getTestCaseSymbol(
  node: TestCase,
  file: WorkspaceFile,
  useFileNameAsContainer: boolean
) {
  return {
    name: node.id.name,
    kind: SymbolKind.Function,
    location: {
      uri: file.uri,
      range: nodeLocationToRange(node)
    },
    containerName: useFileNameAsContainer ? file.relativePath : "<test case>"
 };
}

function getUserKeywordSymbol(
  node: UserKeyword,
  file: WorkspaceFile,
  useFileNameAsContainer: boolean
) {
  return {
    name: node.id.name,
    kind: SymbolKind.Function,
    location: {
      uri: file.uri,
      range: nodeLocationToRange(node)
    },
    containerName: useFileNameAsContainer ? file.relativePath : "<keyword>"
  };
}
