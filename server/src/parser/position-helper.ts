
import {
  Position,
  SourceLocation,
  SourceBlock
} from "./table-models";

export function isInRange(position: Position, range: SourceBlock) {
  const location = range.location;

  return location.start.line <= position.line &&
    position.line <= location.end.line &&
    location.start.column <= position.column &&
    position.column <= location.end.column;
}
