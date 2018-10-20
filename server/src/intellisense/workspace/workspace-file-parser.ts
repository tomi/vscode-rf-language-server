import WorkspaceFile from "./workspace-file";

export type WorkspaceFileParserFn = (fileData: string, absolutePath: string, relativePath: string) => WorkspaceFile;

export default WorkspaceFileParserFn;
