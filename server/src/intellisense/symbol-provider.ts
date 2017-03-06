import { WorkspaceFile, WorkspaceTree } from "./workspace-tree";
import { traverse } from "../traverse/traverse";

import {
  isVariableDeclaration,
  isTestCase,
  isUserKeyword,
  isVariablesTable
} from "./type-guards";

import {
  Node,
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

export function getFileSymbols(filePath: string, workspaceTree: WorkspaceTree) {
  const file = workspaceTree.getFile(filePath);
  if (!file) {
    return [];
  }

  const fileSymbols = [];

  traverse(null, file.fileTree, {
    enter: (node: Node, parent: Node) => {
      let symbol;
      if (isVariableDeclaration(node) && isVariablesTable(parent)) {
        symbol = getVariableSymbol(node);
      } else if (isTestCase(node)) {
        symbol = getTestCaseSymbol(node);
      } else if (isUserKeyword(node)) {
        symbol = getUserKeywordSymbol(node);
      }

      if (symbol) {
        fileSymbols.push(symbol);
      }
    }
  });

  return fileSymbols;
}

function getVariableSymbol(node: VariableDeclaration) {
  return {
    name: node.id.name,
    kind: SymbolKind.Variable,
    location: node.location
  };
}

function getTestCaseSymbol(node: TestCase) {
  return {
    name: node.id.name,
    kind: SymbolKind.Function,
    location: node.location,
    containerName: "<test case>"
  };
}

function getUserKeywordSymbol(node: UserKeyword) {
  return {
    name: node.id.name,
    kind: SymbolKind.Function,
    location: node.location,
    containerName: "<keyword>"
  };
}
