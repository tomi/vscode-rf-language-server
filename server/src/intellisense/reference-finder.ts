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
import { findKeywordDefinition, KeywordDefinition } from "./definition-finder";
import { WorkspaceFile, WorkspaceTree } from "./workspace-tree";
import { Location, Position } from "../utils/position";
import { FileNode, findNodeInPos } from "./node-locator";
import { identifierMatchesKeyword } from "./keyword-matcher";
import { nodeLocationToRange } from "../utils/position";
import {
  isIdentifier,
  isVariableExpression,
  isCallExpression,
  isVariableDeclaration,
  isFunctionDeclaration,
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
    return findWorkspaceKeywordReferences({
      node:  parentOfNode,
      uri:   nodeInPos.file.uri,
      range: nodeLocationToRange(parentOfNode)
    }, workspaceTree);
  } else if (isCallExpression(parentOfNode)) {
    const keywordDefinition = findKeywordDefinition(parentOfNode, nodeInPos, workspaceTree);
    if (!keywordDefinition) {
      return [];
    }

    return findWorkspaceKeywordReferences(keywordDefinition, workspaceTree);
  }

  return [];
}

function findWorkspaceKeywordReferences(
  keywordDefinition: KeywordDefinition,
  workspaceTree: WorkspaceTree
): VscodeLocation[] {
  let references = [];
  references.push({
    uri: keywordDefinition.uri,
    range: keywordDefinition.range
  });

  for (const file of workspaceTree.getFiles()) {
    const fileReferences = findFileKeywordReferences(keywordDefinition.node, file);

    references = references.concat(fileReferences);
  }

  return references;
}

function findFileKeywordReferences(
  searchedKeyword: UserKeyword,
  file: WorkspaceFile
) {
  // Optimize traversal by limiting which nodes to enter
  const nodesToEnter = new Set([
    "TestSuite", "TestCasesTable", "TestCase", "Step", "Teardown",
    "KeywordsTable", "UserKeyword", "ScalarDeclaration", "ListDeclaration",
    "DictionaryDeclaration"
  ]);

  const references: VscodeLocation[] = [];
  const isSearchedKeyword = node =>
    isCallExpression(node) &&
    identifierMatchesKeyword(node.callee, searchedKeyword);

  traverse(null, file.fileTree, {
    enter: (node: Node, parent: Node) => {
      if (isSearchedKeyword(node)) {
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
