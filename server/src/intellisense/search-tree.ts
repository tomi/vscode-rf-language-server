import * as Trie from "node-ternary-search-trie";

import {
  Node,
  Identifier,
  UserKeyword,
  VariableKind,
  VariableDeclaration,
  FunctionDeclaration
} from "../parser/models";

import {
  isVariableDeclaration,
  isScalarDeclaration,
  isListDeclaration,
  isDictionaryDeclaration,
  isUserKeyword
} from "./type-guards";

import { TestSuite } from "../parser/models";
import { traverse, VisitorOption } from "../traverse/traverse";

export class SearchTrees {
  public keywordsTree = new Trie();
  public variablesTree = new Trie();
}

/**
 * Creates search trees for keywords and variables
 *
 * @param fileTree
 */
export function createFileSearchTrees(fileTree: TestSuite): SearchTrees {
  const keywordsTree  = new Trie();
  const variablesTree = new Trie();

  traverse(null, fileTree, {
    enter: (node: Node, parent: Node) => {
      if (isUserKeyword(node)) {
        const normalizedName = normalizeIdentifierName(node.id);

        keywordsTree.set(normalizedName, node);
      } else if (isVariableDeclaration(node)) {
        const normalizedName = normalizeVariableName(node);

        variablesTree.set(normalizedName, node);
      }
    }
  });

  return {
    keywordsTree,
    variablesTree
  };
}

/**
 * Removes keywords and variables in given fileTree from given search trees
 *
 * @param searchTrees
 * @param fileTree
 */
export function removeFileSearchTrees(searchTrees: SearchTrees, fileTree: TestSuite) {
  // TODO: Could use another search trees instead of fileTree
  const { keywordsTree, variablesTree } = searchTrees;

  traverse(null, fileTree, {
    enter: (node: Node, parent: Node) => {
      if (isUserKeyword(node)) {
        const normalizedName = normalizeIdentifierName(node.id);

        keywordsTree.del(normalizedName);
      } else if (isVariableDeclaration(node)) {
        const normalizedName = normalizeVariableName(node);

        variablesTree.del(normalizedName);
      }
    }
  });
}

/**
 * Copy search tree contents from tree to another
 * @param from
 * @param to
 */
export function copyFromTreeToTree(from: SearchTrees, to: SearchTrees) {
  _copyFromTreeToTree(from.keywordsTree, to.keywordsTree);
  _copyFromTreeToTree(from.variablesTree, to.variablesTree);
}

export function findKeywords(
  prefix: string,
  trees: SearchTrees
): UserKeyword[] {
  const foundKeywords: UserKeyword[] = [];

  const normalizedPrefix = normalizeName(prefix);
  const { keywordsTree } = trees;

  keywordsTree.searchWithPrefix(normalizedPrefix, (key, keyword: UserKeyword) => {
    foundKeywords.push(keyword);
  });

  return foundKeywords;
}

export function findVariablesWithKindAndPrefix(
  kind: VariableKind,
  prefix: string,
  trees: SearchTrees
): VariableDeclaration[] {
  const foundVariables: VariableDeclaration[] = [];

  const typeIdentifier    = variableKindToIdentifier(kind);
  const normalizedPrefix  = `${ typeIdentifier }{${ normalizeName(prefix) }`;
  const { variablesTree } = trees;

  variablesTree.searchWithPrefix(normalizedPrefix, (key, keyword: VariableDeclaration) => {
    foundVariables.push(keyword);
  });

  return foundVariables;
}

export function findVariablesWithPrefix(
  prefix: string,
  trees: SearchTrees
): VariableDeclaration[] {
  const foundVariables: VariableDeclaration[] = [];

  const normalizedPrefix  = normalizeName(prefix);
  const { variablesTree } = trees;

  variablesTree.searchWithPrefix(normalizedPrefix, (key, keyword: VariableDeclaration) => {
    foundVariables.push(keyword);
  });

  return foundVariables;
}

function _copyFromTreeToTree(from: Trie, to: Trie) {
  from.traverse((key, value) => {
    to.set(key, value);
  });
}

function normalizeIdentifierName(identifier: Identifier) {
  return normalizeName(identifier.name);
}

function normalizeName(name: string) {
  return name.toLowerCase();
}

function normalizeVariableName(node: VariableDeclaration) {
  let name = normalizeIdentifierName(node.id);

  const typeIdentifier = variableKindToIdentifier(node.kind);
  if (!typeIdentifier) {
    return name;
  } else {
    return `${ typeIdentifier }{${ name }}`;
  }
}

function variableKindToIdentifier(kind: VariableKind) {
  switch (kind) {
    case "Scalar":     return "$";
    case "List":       return "@";
    case "Dictionary": return "&";
    default:           return null;
  }
}
