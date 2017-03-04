import { WorkspaceFile, WorkspaceTree } from "./workspace-tree";
import { traverse } from "../traverse/traverse";

import {
  isVariableDeclaration,
  isTestCase,
  isUserKeyword,
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
  let lastKeywordOrTestCase;

  traverse(null, file.fileTree, {
    enter: (node: Node, parent: Node) => {
      let symbol;
      if (isVariableDeclaration(node)) {
        symbol = getVariableSymbol(node, lastKeywordOrTestCase);
      } else if (isTestCase(node)) {
        lastKeywordOrTestCase = node;
        symbol = getTestCaseSymbol(node, parent);
      } else if (isUserKeyword(node)) {
        lastKeywordOrTestCase = node;
        symbol = getUserKeywordSymbol(node, parent);
      }

      if (symbol) {
        fileSymbols.push(symbol);
      }
    }
  });

  return fileSymbols;
}

function getVariableSymbol(node: VariableDeclaration, container: Node) {
  let containerName = undefined;
  if (isUserKeyword(container)) {
    containerName = container.id.name;
  } else if (isTestCase(container)) {
    containerName = container.id.name;
  }

  return {
    name: node.id.name,
    kind: SymbolKind.Variable,
    location: node.location,
    containerName
  };
}

function getTestCaseSymbol(node: TestCase, parent: Node) {
  return {
    name: node.id.name,
    kind: SymbolKind.Function,
    location: node.location,
    containerName: "<test case>"
  };
}

function getUserKeywordSymbol(node: UserKeyword, parent: Node) {
  return {
    name: node.id.name,
    kind: SymbolKind.Function,
    location: node.location,
    containerName: "<keyword>"
  };
}
