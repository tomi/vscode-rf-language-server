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
  TestSuite
} from "../parser/models";
import { WorkspaceFile, WorkspaceTree } from "./workspace-tree";
// import { traverse as workspaceTraverse } from "./workspace-traverse";
import {
  traverse,
  VisitorOption
} from "../traverse/traverse";
import { Location, Position } from "../utils/position";
import {
  isIdentifier,
  isVariableExpression,
  isCallExpression,
  isVariableDeclaration,
  isFunctionDeclaration
} from "./type-guards";

function isInRange(position: Position, range: Node) {
  const location = range.location;

  return (location.start.line < position.line ||
    (location.start.line === position.line && location.start.column <= position.column)) &&
    (position.line < location.end.line ||
    (position.line === location.end.line && position.column <= location.end.column));
}

interface FileNode {
  file: WorkspaceFile,
  path: Node[],
  node: Node
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

    return node.steps.find(nodeInStep => {
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
    "TestSuite", "VariablesTable", "KeywordsTable", "TestCasesTable",
    "Step", "UserKeyword", "TestCase"
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
  keyword: CallExpression,
  initialLocation: Location,
  workspaceTree: WorkspaceTree
) {
  const identifier = keyword.callee;

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
    // foundDefinition = findKeywordDefinition(nodeInPos, location, workspaceTree);
  }

  return foundDefinition;
}
