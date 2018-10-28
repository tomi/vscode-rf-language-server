import * as path from "path";
import { TestSuite } from "../../parser/models";
import { DataTable } from "../../parser/table-models";
import { FileParser as RobotParser } from "../../parser/parser";
import WorkspaceFile from "./workspace-file";

const robotParser = new RobotParser();

export class RobotFile extends WorkspaceFile {
  constructor(
    // The namespace for this file is based on the filename.
    namespace: string,
    // Absolute path of the file in the file system
    filePath: string,
    // File's relative path to workspace root
    relativePath: string,
    // AST of the file
    fileAst: TestSuite,
    // Tables read from the robot file
    public tables: DataTable[]
  ) {
    super(namespace, filePath, relativePath, fileAst);
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
  relativePath: string
): RobotFile {
  const tables = robotParser.readTables(contents);

  // Set the namespace for all keywords to the file name.
  // Robot docs:
  //    Resource files are specified in the full keyword name, similarly as library names.
  //    The name of the resource is derived from the basename of the resource file without the file extension.
  // http://robotframework.org/robotframework/latest/RobotFrameworkUserGuide.html#handling-keywords-with-same-names
  const namespace = path.parse(relativePath).name;

  const ast = robotParser.parseFile(tables, namespace);

  return new RobotFile(namespace, absolutePath, relativePath, ast, tables);
}
