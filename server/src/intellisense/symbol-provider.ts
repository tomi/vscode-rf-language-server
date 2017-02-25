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
namespace SymbolKind {
    export const File = 1;
    export const Module = 2;
    export const Namespace = 3;
    export const Package = 4;
    export const Class = 5;
    export const Method = 6;
    export const Property = 7;
    export const Field = 8;
    export const Constructor = 9;
    export const Enum = 10;
    export const Interface = 11;
    export const Function = 12;
    export const Variable = 13;
    export const Constant = 14;
    export const String = 15;
    export const Number = 16;
    export const Boolean = 17;
    export const Array = 18;
}

export function getFileSymbols(filePath: string, workspaceTree: WorkspaceTree) {
  const file = workspaceTree.getFile(filePath);
  if (!file) {
    return [];
  }

  const fileSymbols = [];

  traverse(null, file.fileTree, {
    enter: (node: Node, parent: Node) => {
      let symbol;
      if (isVariableDeclaration(node)) {
        symbol = getVariableSymbol(node, parent);
      } else if (isTestCase(node)) {
        symbol = getTestCaseSymbol(node, parent);
      } else if (isUserKeyword(node)) {
        symbol = getUserKeywordSymbol(node, parent);
      }

      if (symbol) {
        fileSymbols.push(symbol);
      }
    }
  });

  return fileSymbols;
}

function getVariableSymbol(node: VariableDeclaration, parent: Node) {
  let containerName = undefined;
  if (isUserKeyword(parent)) {
    containerName = parent.id.name;
  } else if (isTestCase(parent)) {
    containerName = parent.id.name;
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
    location: node.location
  };
}

function getUserKeywordSymbol(node: UserKeyword, parent: Node) {
  return {
    name: node.id.name,
    kind: SymbolKind.Function,
    location: node.location
  }
}
