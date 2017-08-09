import * as _ from "lodash";
import * as Trie from "node-ternary-search-trie";
import WorkspaceFile from "./workspace-file";
import {
  KeywordContainer,
  VariableContainer,
  removeFileSymbols
} from "../search-tree";

/**
 * A class that represents a workspace (=folder) open in VSCode
 */
class Workspace {
  // A tree of all global keywords in the workspace
  public keywords = new KeywordContainer();

  // A tree of all global variables in the workspace
  public variables = new VariableContainer();

  // Mapping from filename: string -> file
  private filesByPath: Map<string, WorkspaceFile> = new Map();

  /**
   * Adds a file to the workspace
   *
   * @param file
   */
  public addFile(file: WorkspaceFile) {
    // Remove file first so its search tree is removed from global tree
    this.removeFileByPath(file.filePath);

    this.keywords.copyFrom(file.keywords);
    this.variables.copyFrom(file.variables);

    this.filesByPath.set(file.filePath, file);
  }

  /**
   *
   * @param filePath
   */
  public removeFileByPath(filePath: string) {
    const existingFile = this.filesByPath.get(filePath);
    if (existingFile) {
      removeFileSymbols(this, existingFile.ast);
    }

    this.filesByPath.delete(filePath);
  }

  /**
   * Removes all files
   */
  public clear() {
    this.filesByPath = new Map();
    this.keywords    = new KeywordContainer();
    this.variables   = new VariableContainer();
  }

  public getFile(filename) {
    return this.filesByPath.get(filename);
  }

  public getFiles() {
    return this.filesByPath.values();
  }
}

export default Workspace;
