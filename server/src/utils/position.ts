/**
 * A position in a text
 */
export interface Position {
  line: number;
  column: number;
}

export interface Location {
  filePath: string;
  position: Position;
}

export interface Range {
  start: Position;
  end: Position;
}

export function createPosition(line: number, column: number) {
  return {
    line,
    column
  };
}

export function createLocation(filePath: string, position: Position) {
  return {
    filePath,
    position
  };
}

export function createRange(start: Position, end: Position) {
  return {
    start,
    end
  };
}
