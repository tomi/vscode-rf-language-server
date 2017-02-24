import { TestSuite } from "../parser/models";

export class WorkspaceFile {
  constructor(public filePath: string, public fileTree: TestSuite) {
  }
}

export class WorkspaceTree {
  // Mapping from filename: string -> file
  private fileTreeMap: Map<string, WorkspaceFile> = new Map();

  public addFile(file: WorkspaceFile) {
    this.fileTreeMap.set(file.filePath, file);
  }

  public getFile(filename) {
    return this.fileTreeMap.get(filename);
  }

  public getFiles() {
    return this.fileTreeMap.values();
  }

  public clear() {
    this.fileTreeMap.clear();
  }
}
