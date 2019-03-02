import * as _ from "lodash";
import { Position, SourceLocation } from "./table-models";

export function position(line: number, column: number) {
  return {
    line,
    column,
  };
}

export function location(
  startLine: number,
  startColumn: number,
  endLine: number,
  endColumn: number
): SourceLocation {
  return {
    start: position(startLine, startColumn),
    end: position(endLine, endColumn),
  };
}

export function locationFromStartEnd(
  start: SourceLocation,
  end: SourceLocation
) {
  return {
    start: start.start,
    end: end.end,
  };
}

export function locationFromPositions(start: Position, end: Position) {
  return { start, end };
}
