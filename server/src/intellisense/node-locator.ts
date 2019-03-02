import * as _ from "lodash";
import WorkspaceFile from "./workspace/workspace-file";
import { Node, FunctionDeclaration } from "../parser/models";
import * as typeGuards from "./type-guards";
import { DataTable, DataRow, DataCell } from "../parser/table-models";
import { traverse, VisitorOption } from "../traverse/traverse";
import { Location, Position, isInRange, Range } from "../utils/position";
import { VariableContainer } from "./search-tree";

export interface FileNode {
  file: WorkspaceFile;
  path: Node[];
  node: Node;
}

export interface LocationInfo {
  row: DataRow;
  cell: DataCell;
  textBefore: string;
  textAfter: string;
}

/**
 * Find the most specific node in the given document position
 *
 * @param pos
 * @param fileToSearch
 */
export function findNodeInPos(
  pos: Position,
  fileToSearch: WorkspaceFile
): FileNode {
  const pathToNode: Node[] = [];
  let leafNode: Node | null = null;

  traverse(fileToSearch.ast, {
    enter: (node: Node, parent: Node) => {
      if (!isInRange(pos, node)) {
        return VisitorOption.Skip;
      } else {
        if (leafNode) {
          pathToNode.push(leafNode);
        }

        leafNode = node;
      }

      return VisitorOption.Continue;
    },
  });

  return {
    file: fileToSearch,
    path: pathToNode,
    node: leafNode,
  };
}

/**
 *
 * @param location
 * @param tables
 */
export function findLocationInfo(
  location: Location,
  tables: DataTable[]
): LocationInfo {
  const isOnLine = (loc: Range) =>
    loc.start.line <= location.position.line &&
    location.position.line <= loc.end.line;
  const isOnCell = (loc: Range) =>
    loc.start.column <= location.position.column &&
    location.position.column <= loc.end.column;

  const table = tables.find(t => isOnLine(t.location));
  if (!table) {
    return null;
  }

  const row = table.rows.find(r => isOnLine(r.location)) || table.header;

  const cell = row.cells.find(c => isOnCell(c.location));
  let textBefore = "";
  let textAfter = "";
  if (cell) {
    const columnRelativeToCell =
      location.position.column - cell.location.start.column;
    textBefore = cell.content.substring(0, columnRelativeToCell);
    textAfter = cell.content.substring(columnRelativeToCell);
  }

  return {
    row,
    cell,
    textBefore,
    textAfter,
  };
}

/**
 * Find local variables in a keyword or test case, including arguments.
 * If beforeLine is given, returns only those that are declared
 * before the given line.
 *
 * @param testCase
 * @param beforeLine
 */
export function findLocalVariables(
  functionNode: FunctionDeclaration,
  beforeLine?: number
) {
  const variables = new VariableContainer();
  const isBeforeLine = (node: Node) =>
    beforeLine === undefined || node.location.start.line < beforeLine;

  if (typeGuards.isUserKeyword(functionNode) && functionNode.arguments) {
    functionNode.arguments.values.forEach(arg => variables.add(arg));
  }

  functionNode.steps.forEach(step => {
    if (typeGuards.isVariableDeclaration(step.body) && isBeforeLine(step)) {
      variables.add(step.body);
    }
  });

  return variables;
}
