
import {
  Position,
  SourceLocation,
  SourceBlock
} from "./table-models";

export function isInRange(position: Position, range: SourceBlock) {
  const location = range.location;

  return (location.start.line < position.line ||
    (location.start.line === position.line && location.start.column <= position.column)) &&
    (position.line < location.end.line ||
    (position.line === location.end.line && position.column <= location.end.column));
}
