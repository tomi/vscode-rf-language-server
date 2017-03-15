import * as _ from "lodash";

import {
  Position,
  SourceLocation
} from "./table-models";

import {
  Node
} from "./models";

export function position(line, column) {
  return {
    line,
    column
  };
}

export function location(startLine, startColumn, endLine?, endColumn?): SourceLocation {
  if (_.isObject(startLine) && _.isObject(startColumn)) {
    return {
      start: startLine,
      end: startColumn
    };
  }

  return {
    start: { line: startLine, column: startColumn },
    end:   { line: endLine, column:   endColumn },
  };
}

export function locationFromStartEnd(start: SourceLocation, end: SourceLocation) {
  return {
    start: start.start,
    end: end.end
  };
}

export function locationFromPositions(start: Position, end: Position) {
  return { start, end };
}

export function isInRange(position: Position, range: Node) {
  const location = range.location;

  return (location.start.line < position.line ||
    (location.start.line === position.line && location.start.column <= position.column)) &&
    (position.line < location.end.line ||
    (position.line === location.end.line && position.column <= location.end.column));
}
