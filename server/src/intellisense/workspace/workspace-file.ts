import * as _ from "lodash";
import { TestSuite } from "../../parser/models";
import {
  Symbols,
  createFileSearchTrees,
  KeywordContainer,
  VariableContainer,
} from "../search-tree";

import Uri from "vscode-uri";

abstract class WorkspaceFile implements Symbols {
  // All the variables in the file
  public variables: VariableContainer;

  // All the keywords in the file
  public keywords: KeywordContainer;

  public documentation: string;

  constructor(
    // The namespace for this file is based on the filename.
    public namespace: string,
    // Absolute path of the file in the file system
    public filePath: string,
    // File's relative path to workspace root
    public relativePath: string,
    // AST of the file
    public ast: TestSuite
  ) {
    const { documentation, keywords, variables } = createFileSearchTrees(ast);

    this.documentation = documentation;
    this.keywords = keywords;
    this.variables = variables;
  }

  public get uri() {
    return Uri.file(this.filePath).toString();
  }
}

export default WorkspaceFile;

export type WorkspaceFileParserFn = (
  contents: string,
  absolutePath: string,
  relativePath: string
) => WorkspaceFile;
