import * as _ from "lodash";
import { Node } from "../parser/models";
import { WorkspaceFile } from "./workspace-tree";
import { traverse, VisitorOption } from "../traverse/traverse";
import { Position } from "../utils/position";

export interface FileNode {
  file: WorkspaceFile;
  path: Node[];
  node: Node;
}

/**
 * Find the most specific node in the given document position
 *
 * @param pos
 * @param fileToSearch
 */
export function findNodeInPos(pos: Position, fileToSearch: WorkspaceFile): FileNode {
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

function isInRange(position: Position, range: Node) {
  const location = range.location;

  return (location.start.line < position.line ||
    (location.start.line === position.line && location.start.column <= position.column)) &&
    (position.line < location.end.line ||
      (position.line === location.end.line && position.column <= location.end.column));
}
