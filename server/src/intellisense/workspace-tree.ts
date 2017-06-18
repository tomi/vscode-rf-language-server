import { TestSuite } from "../parser/models";
import { SearchTrees, removeFileSearchTrees, copyFromTreeToTree } from "./search-tree";
import Uri from "vscode-uri";

export class WorkspaceFile {
  constructor(
    // Absolute path of the file in the file system
    public filePath: string,

    // File's relative path to workspace root
    public relativePath: string,

    // AST of the file
    public fileTree: TestSuite,

    // A ternary search tree for all the symbols in the file
    public searchTree: SearchTrees
  ) {}

  public get uri() {
    return Uri.file(this.filePath).toString();
  }
}

export class WorkspaceTree {
  // Search trees for the entire workspace
  public searchTree = new SearchTrees();
  // Mapping from filename: string -> file
  private fileTreeMap: Map<string, WorkspaceFile> = new Map();

  public addFile(file: WorkspaceFile) {
    // Remove file first so its search tree is removed from global tree
    this.removeFileByPath(file.filePath);
    copyFromTreeToTree(file.searchTree, this.searchTree);

    this.fileTreeMap.set(file.filePath, file);
  }

  public removeFileByPath(filePath: string) {
    const existingFile = this.fileTreeMap.get(filePath);
    if (existingFile) {
      removeFileSearchTrees(this.searchTree, existingFile.fileTree);
    }

    this.fileTreeMap.delete(filePath);
  }

  public getFile(filename) {
    return this.fileTreeMap.get(filename);
  }

  public getFiles() {
    return this.fileTreeMap.values();
  }

  public clear() {
    this.searchTree = new SearchTrees();
    this.fileTreeMap.clear();
  }
}
