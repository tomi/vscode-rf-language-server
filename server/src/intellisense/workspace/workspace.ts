import * as _ from "lodash";
import WorkspaceFile from "./workspace-file";
import {
  GlobalKeywordContainer,
  VariableContainer,
  Symbols,
} from "../search-tree";
import { UserKeyword } from "../../parser/models";
import { Library } from "./library";

/**
 * A class that represents a workspace (=folder) open in VSCode
 */
export class Workspace {
  // A tree of all global variables in the workspace
  public variables = new VariableContainer();

  // A tree of all global keywords in the workspace
  private keywords = new GlobalKeywordContainer();

  // Mapping from filename: string -> file
  private filesByPath: Map<string, WorkspaceFile> = new Map();

  // Mapping from WorkspaceFile namespace: string -> file
  private filesByNamespace: Map<string, WorkspaceFile> = new Map();

  // Mapping from library name --> Library
  private librariesByName: Map<string, Library> = new Map();

  /**
   * Adds a file to the workspace
   *
   * @param file
   */
  public addFile(file: WorkspaceFile) {
    // Remove file first so its search tree is removed from global tree
    this.removeFileByPath(file.filePath);

    file.keywords.forEach((key, keyword) => this.keywords.addKeyword(keyword));
    this.variables.copyFrom(file.variables);

    this.filesByPath.set(file.filePath, file);
    this.filesByNamespace.set(file.namespace, file);
  }

  /**
   * Adds given library and its keywords to the workspace
   */
  public addLibrary(library: Library) {
    library.keywords.forEach((key, keyword) =>
      this.keywords.addKeyword(keyword)
    );
    this.variables.copyFrom(library.variables);

    this.librariesByName.set(library.namespace, library);
  }

  /**
   * Removes all libraries and their keywords from the workspace
   */
  public removeAllLibraries() {
    Array.from(this.librariesByName.values()).forEach(library => {
      library.keywords.forEach((key, keyword) =>
        this.keywords.removeKeyword(keyword)
      );

      this.librariesByName.delete(library.namespace);
    });
  }

  /**
   *
   * @param filePath
   */
  public removeFileByPath(filePath: string) {
    const existingFile = this.filesByPath.get(filePath);
    if (existingFile) {
      existingFile.keywords.forEach((key, keyword) =>
        this.keywords.removeKeyword(keyword)
      );
      const { ast } = existingFile;
      if (ast && ast.variablesTable) {
        ast.variablesTable.variables.forEach(variable => {
          this.variables.remove(variable);
        });
      }
      this.filesByNamespace.delete(existingFile.namespace);
    }

    this.filesByPath.delete(filePath);
  }

  /**
   * Searchs the global workspace for matching keywords.
   * Results are grouped by the matching keyword.
   */
  public findKeywords(textToSearch: string): UserKeyword[][] {
    /* An example of the resulting array-of-arrays:
     * [
     *   [
     *     { namespace: "Foo": keyword: "Find" },
     *     { namespace: "Bar": keyword: "Find" },
     *   ],
     *   [
     *     { namespace: "Bar": keyword: "DoThing" },
     *   ]
     * ]
     */
    return _(this.keywords.findByPrefix(textToSearch))
      .flatten()
      .groupBy((keyword: UserKeyword) => keyword.id.name)
      .map((keywords: UserKeyword[]) => keywords)
      .value();
  }

  /**
   * Finds modules (resource files and libraries) by their namespace
   */
  public findModulesByNamespace(textToSearch: string): Symbols[] {
    const modules: Symbols[] = [];
    const normalizedSearchText = textToSearch.toLowerCase();

    for (const file of this.filesByNamespace.values()) {
      if (file.namespace.toLowerCase().startsWith(normalizedSearchText)) {
        modules.push(file);
      }
    }

    for (const libraryNamespace of this.librariesByName.values()) {
      if (
        libraryNamespace.namespace
          .toLowerCase()
          .startsWith(normalizedSearchText)
      ) {
        modules.push(libraryNamespace);
      }
    }

    return modules;
  }

  /**
   * Removes all files
   */
  public clear() {
    this.filesByPath = new Map();
    this.filesByNamespace = new Map();
    this.librariesByName = new Map();
    this.keywords = new GlobalKeywordContainer();
    this.variables = new VariableContainer();
  }

  public getFile(filename: string) {
    return this.filesByPath.get(filename);
  }

  public getFileByNamespace(namespace: string) {
    return this.filesByNamespace.get(namespace);
  }

  public getSymbolsByNamespace(namespace: string): Symbols {
    // Assume there's only one resource file / library per namespace
    return (
      this.filesByNamespace.get(namespace) ||
      this.librariesByName.get(namespace)
    );
  }

  public getFiles() {
    return this.filesByPath.values();
  }
}

export default Workspace;
