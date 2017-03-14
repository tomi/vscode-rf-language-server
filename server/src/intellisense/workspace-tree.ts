import { TestSuite } from "../parser/models";
import Uri from "vscode-uri";

export class WorkspaceFile {
  constructor(
    public filePath: string,
    public relativePath: string,
    public fileTree: TestSuite,
  ) {}

  public get uri() {
    return Uri.file(this.filePath).toString();
  }
}

export class WorkspaceTree {
  // Mapping from filename: string -> file
  private fileTreeMap: Map<string, WorkspaceFile> = new Map();

  public addFile(file: WorkspaceFile) {
    this.fileTreeMap.set(file.filePath, file);
  }

  public removeFileByPath(filePath: string) {
    this.fileTreeMap.delete(filePath);
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
