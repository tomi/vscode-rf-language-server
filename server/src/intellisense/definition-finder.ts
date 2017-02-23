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
import { WorkspaceTree } from "./workspace-tree";
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
  isVariableDeclaration
} from "./type-guards";

function isInRange(position: Position, range: Node) {
  const location = range.location;

  return (location.start.line < position.line ||
    (location.start.line === position.line && location.start.column <= position.column)) &&
    (position.line < location.end.line ||
    (position.line === location.end.line && position.column <= location.end.column));
}

function findNodeInPos(pos: Position, data: TestSuite) {
  let foundNode: { node: Node, parent: Node };

  traverse(null, data, {
    enter: (node: Node, parent: Node) => {
      if (!isInRange(pos, node)) {
        return VisitorOption.Skip;
      }

      foundNode = {
        node,
        parent
      };
    }
  });

  return foundNode;
}

function findVariableDefinition(
  variable: VariableExpression,
  initialLocation: Location,
  workspaceTree: WorkspaceTree
) {
  const fileTree = workspaceTree.getTreeForFile(initialLocation.filePath);

  const foundVariableDefinition = findVariableDefinitionFromFile(variable, fileTree);

  return foundVariableDefinition ? {
    filePath: initialLocation.filePath,
    location: foundVariableDefinition.location
  } : null;
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
  const fileTree = workspaceTree.getTreeForFile(location.filePath);
  if (!fileTree) {
    return null;
  }

  const foundNode = findNodeInPos(location.position, fileTree);
  if (!foundNode || !isIdentifier(foundNode.node)) {
    return;
  }

  const { parent } = foundNode;
  let foundDefinition = null;
  if (isVariableExpression(parent)) {
    foundDefinition = findVariableDefinition(parent, location, workspaceTree);
  } else if (isCallExpression(parent)) {
    foundDefinition = findKeywordDefinition(parent, location, workspaceTree);
  }

  return foundDefinition;
}
