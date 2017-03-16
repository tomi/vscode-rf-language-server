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
import { WorkspaceFile, WorkspaceTree } from "./workspace-tree";
import { traverse, VisitorOption } from "../traverse/traverse";
import { Location, Position } from "../utils/position";
import { identifierMatchesKeyword } from "./keyword-matcher";
import {
  isIdentifier,
  isVariableExpression,
  isCallExpression,
  isVariableDeclaration,
  isFunctionDeclaration,
  isUserKeyword
} from "./type-guards";

function isInRange(position: Position, range: Node) {
  const location = range.location;

  return (location.start.line < position.line ||
    (location.start.line === position.line && location.start.column <= position.column)) &&
    (position.line < location.end.line ||
      (position.line === location.end.line && position.column <= location.end.column));
}

interface FileNode {
  file: WorkspaceFile;
  path: Node[];
  node: Node;
}

function findNodeInPos(pos: Position, fileToSearch: WorkspaceFile): FileNode {
  const pathToNode = [];
  let leafNode = null;

  traverse(null, fileToSearch.fileTree, {
    enter: (node: Node, parent: Node) => {
      if (!isInRange(pos, node)) {
        return VisitorOption.Skip;
      } else {
        if (leafNode) {
          pathToNode.push(leafNode);
        }

        leafNode = node;
      }
    }
  });

  return {
    file: fileToSearch,
    path: pathToNode,
    node: leafNode
  };
}

function tryFindVarDefStartingFromNode(
  variable: VariableExpression, location: FileNode
): VariableDeclaration {
  let foundVariableDefinition = null;

  _.reverse(location.path).find(node => {
    if (!isFunctionDeclaration(node)) {
      return false;
    }

    // Try to find from steps
    const foundInSteps = node.steps.find(nodeInStep => {
      const { body } = nodeInStep;

      if (isVariableDeclaration(body) &&
        body.kind === variable.kind &&
        body.id.name === variable.id.name) {
        foundVariableDefinition = body;
        return true;
      } else {
        return false;
      }
    }) !== undefined;

    if (foundInSteps) {
      return true;
    }

    if (!isUserKeyword(node) || !node.arguments) {
      return false;
    }

    // Try to find from keyword arguments
    return node.arguments.values.find(arg => {
      if (arg.kind === variable.kind &&
          arg.id.name === variable.id.name) {
        foundVariableDefinition = arg;
        return true;
      } else {
        return false;
      }
    }) !== undefined;
  });

  if (foundVariableDefinition) {
    return foundVariableDefinition;
  }

  if (location.file.fileTree.variablesTable) {
    location.file.fileTree.variablesTable.variables.find(varTableVar => {
      if (varTableVar.kind === variable.kind &&
        varTableVar.id.name === variable.id.name) {
        foundVariableDefinition = varTableVar;
        return true;
      } else {
        return false;
      }
    });
  }

  return foundVariableDefinition;
}

function findVariableDefinition(
  variable: VariableExpression,
  variableLocation: FileNode,
  workspaceTree: WorkspaceTree
) {
  let foundVariableDefinition =
    tryFindVarDefStartingFromNode(variable, variableLocation);

  if (foundVariableDefinition) {
    return {
      filePath: variableLocation.file.filePath,
      location: foundVariableDefinition.location
    };
  }

  // TODO: iterate in import order
  for (const file of workspaceTree.getFiles()) {
    foundVariableDefinition = findVariableDefinitionFromFile(variable, file.fileTree);
    if (foundVariableDefinition) {
      return {
        filePath: file.filePath,
        location: foundVariableDefinition.location
      };
    }
  }

  return null;
}

function findVariableDefinitionFromFile(variable: VariableExpression, file: TestSuite): VariableDeclaration {
  const nodesToEnter = new Set([
    "TestSuite", "VariablesTable"
  ]);

  let foundVariable = null;
  const isNodeSearchedVar = node =>
    isVariableDeclaration(node) &&
    node.kind === variable.kind &&
    node.id.name === variable.id.name;

  traverse(null, file, {
    enter: (node: Node, parent: Node) => {
      if (isNodeSearchedVar(node)) {
        foundVariable = node;

        return VisitorOption.Break;
      } else if (!nodesToEnter.has(node.type)) {
        return VisitorOption.Skip;
      }
    }
  });

  return foundVariable;
}

function findKeywordDefinition(
  callExpression: CallExpression,
  keywordLocation: FileNode,
  workspaceTree: WorkspaceTree
) {
  const identifier = callExpression.callee;

  let foundDefinition = findKeywordDefinitionFromFile(callExpression, keywordLocation.file.fileTree);
  if (foundDefinition) {
    return {
      filePath: keywordLocation.file.filePath,
      location: foundDefinition.location
    };
  }

  // TODO: iterate in import order
  for (const file of workspaceTree.getFiles()) {
    if (file.filePath === keywordLocation.file.filePath) {
      continue;
    }

    foundDefinition = findKeywordDefinitionFromFile(callExpression, file.fileTree);
    if (foundDefinition) {
      return {
        filePath: file.filePath,
        location: foundDefinition.location
      };
    }
  }

  return null;
}

function findKeywordDefinitionFromFile(callExpression: CallExpression, file: TestSuite): UserKeyword {
  const nodesToEnter = new Set([
    "TestSuite", "KeywordsTable"
  ]);

  let foundKeyword = null;
  const isNodeSearchedKeyword = node =>
    isUserKeyword(node) &&
    identifierMatchesKeyword(callExpression.callee, node);

  traverse(null, file, {
    enter: (node: Node, parent: Node) => {
      if (isNodeSearchedKeyword(node)) {
        foundKeyword = node;

        return VisitorOption.Break;
      } else if (!nodesToEnter.has(node.type)) {
        return VisitorOption.Skip;
      }
    }
  });

  return foundKeyword;
}

export function findDefinition(location: Location, workspaceTree: WorkspaceTree) {
  const file = workspaceTree.getFile(location.filePath);
  if (!file) {
    return null;
  }

  const nodeInPos = findNodeInPos(location.position, file);
  if (!isIdentifier(nodeInPos.node)) {
    return;
  }

  const parentOfNode = _.last(nodeInPos.path);
  let foundDefinition = null;
  if (isVariableExpression(parentOfNode)) {
    foundDefinition = findVariableDefinition(parentOfNode, nodeInPos, workspaceTree);
  } else if (isCallExpression(parentOfNode)) {
    foundDefinition = findKeywordDefinition(parentOfNode, nodeInPos, workspaceTree);
  }

  return foundDefinition;
}
