import * as Trie from "node-ternary-search-trie";
import { TestSuite } from "../../parser/models";
import { DataTable } from "../../parser/table-models";
import WorkspaceFile from "./workspace-file";

import { PythonParser } from "../../python-parser/python-parser";
import WorkspaceFileParserFn from "./workspace-file-parser";

const pythonParser = new PythonParser();

export class PythonFile extends WorkspaceFile {
    constructor(
        // Absolute path of the file in the file system
        filePath: string,

        // File's relative path to workspace root
        relativePath: string,

        // AST of the file
        fileTree: TestSuite,
    ) {
        super(filePath, relativePath, fileTree);
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
  relativePath: string,
): PythonFile {
  const ast = pythonParser.parseFile(contents);

  return new PythonFile(absolutePath, relativePath, ast);
}
