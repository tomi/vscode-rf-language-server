import WorkspaceFile from "./workspace-file";

export interface WorkspaceFileParserFn {
  (fileData: string, absolutePath: string, relativePath: string): WorkspaceFile;
}

export default WorkspaceFileParserFn;
