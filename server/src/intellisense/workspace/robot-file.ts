import * as Trie from "node-ternary-search-trie";
import { TestSuite } from "../../parser/models";
import { DataTable } from "../../parser/table-models";
import { FileParser as RobotParser } from "../../parser/parser";
import WorkspaceFile from "./workspace-file";

const robotParser = new RobotParser();

export class RobotFile extends WorkspaceFile {
    constructor(
        // Absolute path of the file in the file system
        filePath: string,

        // File's relative path to workspace root
        relativePath: string,

        // AST of the file
        fileAst: TestSuite,

        // Tables read from the robot file
        public tables: DataTable[]
    ) {
        super(filePath, relativePath, fileAst);
    }
}

/**
 * Parses a robot file
 *
 * @param absolutePath
 * @param relativePath
 * @param contents
 */
export function createRobotFile(
  contents: string,
  absolutePath: string,
  relativePath: string,
): RobotFile {
  const tables = robotParser.readTables(contents);
  const ast    = robotParser.parseFile(tables);

  return new RobotFile(absolutePath, relativePath, ast, tables);
}
