import * as _ from "lodash";
import { Node, UserKeyword } from "../parser/models";
import { traverse, VisitorOption } from "../traverse/traverse";
import { findKeywordDefinition } from "./definition-finder";
import Workspace from "./workspace/workspace";
import WorkspaceFile from "./workspace/workspace-file";
import { Location } from "../utils/position";
import { findNodeInPos } from "./node-locator";
import { nodeLocationToRange } from "../utils/position";
import {
  identifierMatchesKeyword,
  identifierMatchesIdentifier,
} from "./keyword-matcher";
import { isIdentifier, isCallExpression, isUserKeyword } from "./type-guards";

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
 * @param workspace
 */
export function findReferences(
  location: Location,
  workspace: Workspace
): VscodeLocation[] {
  const file = workspace.getFile(location.filePath);
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

    return findWorkspaceKeywordReferences(isSearchedKeyword, workspace).concat([
      {
        uri: nodeInPos.file.uri,
        range: nodeLocationToRange(searchedKeyword),
      },
    ]);
  } else if (isCallExpression(parentOfNode)) {
    const keywordDefinition = findKeywordDefinition(
      parentOfNode.callee,
      nodeInPos.file,
      workspace
    );
    if (keywordDefinition) {
      const isSearchedKeyword = createNodeKeywordMatcherFn(
        keywordDefinition.node
      );

      return findWorkspaceKeywordReferences(
        isSearchedKeyword,
        workspace
      ).concat([
        {
          uri: keywordDefinition.uri,
          range: keywordDefinition.range,
        },
      ]);
    } else {
      const isSearchedKeyword = (node: Node) =>
        (isCallExpression(node) &&
          identifierMatchesIdentifier(node.callee, parentOfNode.callee)) ||
        (isUserKeyword(node) &&
          identifierMatchesIdentifier(node.id, parentOfNode.callee));

      return findWorkspaceKeywordReferences(isSearchedKeyword, workspace);
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
  return (node: Node) =>
    isCallExpression(node) &&
    identifierMatchesKeyword(node.callee, keywordToMatch);
}

function findWorkspaceKeywordReferences(
  isSearchedKeywordFn: (node: Node) => boolean,
  workspace: Workspace
): VscodeLocation[] {
  let references: VscodeLocation[] = [];

  for (const file of workspace.getFiles()) {
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
    "TestSuite",
    "TestCasesTable",
    "TestCase",
    "Step",
    "Teardown",
    "Setup",
    "KeywordsTable",
    "UserKeyword",
    "ScalarDeclaration",
    "ListDeclaration",
    "DictionaryDeclaration",
    "SettingsTable",
    "SuiteSetting",
  ]);

  const references: VscodeLocation[] = [];

  traverse(file.ast, {
    enter: (node: Node, parent: Node) => {
      if (isSearchedKeywordFn(node)) {
        references.push({
          uri: file.uri,
          range: nodeLocationToRange(node),
        });

        return VisitorOption.Skip;
      } else if (!nodesToEnter.has(node.type)) {
        return VisitorOption.Skip;
      }

      return VisitorOption.Continue;
    },
  });

  return references;
}
