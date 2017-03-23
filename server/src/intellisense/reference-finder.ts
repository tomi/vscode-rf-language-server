import * as _ from "lodash";
import {
  Node,
  Identifier,
  CallExpression,
  VariableExpression,
  VariableDeclaration,
  ScalarDeclaration,
  ListDeclaration,
  DictionaryDeclaration,
  UserKeyword,
  TestSuite
} from "../parser/models";
import { traverse, VisitorOption } from "../traverse/traverse";
import { findKeywordDefinition } from "./definition-finder";
import { WorkspaceFile, WorkspaceTree } from "./workspace-tree";
import { Location } from "../utils/position";
import { findNodeInPos } from "./node-locator";
import { nodeLocationToRange } from "../utils/position";
import {
  identifierMatchesKeyword,
  identifierMatchesIdentifier
} from "./keyword-matcher";
import {
  isIdentifier,
  isCallExpression,
  isUserKeyword
} from "./type-guards";

interface VscodePosition {
  line: number;
  character: number;
}

interface VscodeRange {
  start: VscodePosition;
  end: VscodePosition;
}

interface VscodeLocation {
  uri: string;
  range: VscodeRange;
}

/**
 * Finds all references for the symbol in given document position
 *
 * @param location
 * @param workspaceTree
 */
export function findReferences(location: Location, workspaceTree: WorkspaceTree): VscodeLocation[] {
  const file = workspaceTree.getFile(location.filePath);
  if (!file) {
    return [];
  }

  const nodeInPos = findNodeInPos(location.position, file);
  if (!isIdentifier(nodeInPos.node)) {
    return [];
  }

  const parentOfNode = _.last(nodeInPos.path);
  if (isUserKeyword(parentOfNode)) {
    const searchedKeyword = parentOfNode;
    const isSearchedKeyword = createNodeKeywordMatcherFn(searchedKeyword);

    return findWorkspaceKeywordReferences(isSearchedKeyword, workspaceTree)
      .concat([{
        uri:   nodeInPos.file.uri,
        range: nodeLocationToRange(searchedKeyword)
      }]);
  } else if (isCallExpression(parentOfNode)) {
    const keywordDefinition = findKeywordDefinition(parentOfNode, nodeInPos, workspaceTree);
    if (keywordDefinition) {
      const isSearchedKeyword = createNodeKeywordMatcherFn(keywordDefinition.node);

      return findWorkspaceKeywordReferences(isSearchedKeyword, workspaceTree)
        .concat([{
          uri:   keywordDefinition.uri,
          range: keywordDefinition.range
        }]);
    } else {
      const isSearchedKeyword = node =>
        (isCallExpression(node) && identifierMatchesIdentifier(node.callee, parentOfNode.callee)) ||
        (isUserKeyword(node) && identifierMatchesIdentifier(node.id, parentOfNode.callee));

      return findWorkspaceKeywordReferences(isSearchedKeyword, workspaceTree);
    }

  }

  return [];
}

/**
 * Returns a function that takes a node and checks if that
 * node is a call expression calling the given user keyword
 *
 * @param keywordToMatch
 */
function createNodeKeywordMatcherFn(keywordToMatch: UserKeyword) {
  return node =>
    isCallExpression(node) &&
    identifierMatchesKeyword(node.callee, keywordToMatch);
}

function findWorkspaceKeywordReferences(
  isSearchedKeywordFn: (node: Node) => boolean,
  workspaceTree: WorkspaceTree
): VscodeLocation[] {
  let references = [];

  for (const file of workspaceTree.getFiles()) {
    const fileReferences = findFileKeywordReferences(isSearchedKeywordFn, file);

    references = references.concat(fileReferences);
  }

  return references;
}

function findFileKeywordReferences(
  isSearchedKeywordFn: (node: Node) => boolean,
  file: WorkspaceFile
) {
  // Optimize traversal by limiting which nodes to enter
  const nodesToEnter = new Set([
    "TestSuite", "TestCasesTable", "TestCase", "Step", "Teardown", "Setup",
    "KeywordsTable", "UserKeyword", "ScalarDeclaration", "ListDeclaration",
    "DictionaryDeclaration", "SettingsTable", "SuiteSetting"
  ]);

  const references: VscodeLocation[] = [];

  traverse(null, file.fileTree, {
    enter: (node: Node, parent: Node) => {
      if (isSearchedKeywordFn(node)) {
        references.push({
          uri: file.uri,
          range: nodeLocationToRange(node)
        });

        return VisitorOption.Skip;
      } else if (!nodesToEnter.has(node.type)) {
        return VisitorOption.Skip;
      }
    }
  });

  return references;
}
