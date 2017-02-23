import { TestSuite } from "../parser/models";

export class WorkspaceTree {
  // Mapping from filename: string -> file AST: TestSuite
  private fileTreeMap: Map<string, TestSuite> = new Map();

  public addFileTree(filename: string, fileTree: TestSuite) {
    this.fileTreeMap.set(filename, fileTree);
  }

  public getTreeForFile(filename) {
    return this.fileTreeMap.get(filename);
  }

  public getAll() {
    return this.fileTreeMap.entries();
  }

  public clear() {
    this.fileTreeMap.clear();
  }
}
