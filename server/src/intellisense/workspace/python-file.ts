import * as path from "path";
import { TestSuite } from "../../parser/models";
import WorkspaceFile from "./workspace-file";

import { PythonParser } from "../../python-parser/python-parser";

const pythonParser = new PythonParser();

export class PythonFile extends WorkspaceFile {
  constructor(
    // The namespace for this file is based on the filename.
    namespace: string,
    // Absolute path of the file in the file system
    filePath: string,
    // File's relative path to workspace root
    relativePath: string,
    // AST of the file
    fileTree: TestSuite
  ) {
    super(namespace, filePath, relativePath, fileTree);
  }
}

/**
 * Parses a python file
 *
 * @param absolutePath
 * @param relativePath
 * @param contents
 */
export function createPythonFile(
  contents: string,
  absolutePath: string,
  relativePath: string
): PythonFile {
  // TODO: Is this how namespaces work for python files?
  const namespace = path.parse(absolutePath).name;
  const ast = pythonParser.parseFile(contents, namespace);

  return new PythonFile(namespace, absolutePath, relativePath, ast);
}
