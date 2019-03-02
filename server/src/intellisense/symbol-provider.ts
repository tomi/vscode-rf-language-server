import Workspace from "./workspace/workspace";
import WorkspaceFile from "./workspace/workspace-file";
import { nodeLocationToRange } from "../utils/position";
import { SymbolKind } from "vscode-languageserver";
import { formatVariable } from "./formatters";
import { isVariableDeclaration, isUserKeyword } from "./type-guards";
import { VariableDeclaration, TestCase, UserKeyword } from "../parser/models";

/**
 * Returns all symbols for given file
 *
 * @param filePath
 * @param workspaceTree
 */
export function getFileSymbols(
  file: WorkspaceFile,
  useFileNameAsContainer: boolean = false,
  query: string = ""
) {
  const idMatches = _createIdMatcherFn(query);
  const createVariableSymbol = (node: VariableDeclaration) =>
    _createVariableSymbol(node, file, useFileNameAsContainer);
  const createKeywordSymbol = (node: UserKeyword) =>
    _createKeywordSymbol(node, file, useFileNameAsContainer);
  const createTestCaseSymbol = (node: TestCase) =>
    _createTestCaseSymbol(node, file, useFileNameAsContainer);

  const variableSymbols = file.variables
    .filter(idMatches)
    .map(createVariableSymbol);
  const keywordSymbols = file.keywords
    .filter(idMatches)
    .map(createKeywordSymbol);
  const testCases = file.ast.testCasesTable
    ? file.ast.testCasesTable.testCases
    : [];
  const testCaseSymbols = testCases.filter(idMatches).map(createTestCaseSymbol);

  return [...variableSymbols, ...keywordSymbols, ...testCaseSymbols];
}

/**
 * Returns all symbols in the workspace that match the given search string
 *
 * @param workspace
 */
export function getWorkspaceSymbols(workspace: Workspace, query: string) {
  return Array.from(workspace.getFiles())
    .map(files => getFileSymbols(files, true, query))
    .reduce((fileSymbols, allSymbols) => {
      return allSymbols.concat(fileSymbols);
    }, []);
}

/**
 * Creates a function that checks if given identifier is
 * a match to given query string. Comparison is done
 * case insensitive.
 *
 * @param query
 *
 * @returns {function}
 */
function _createIdMatcherFn(query: string) {
  const lowerQuery = query.toLowerCase();

  return (node: VariableDeclaration | UserKeyword | TestCase) => {
    if (query.includes(".") && isUserKeyword(node)) {
      // Query must be considered an explicit keyword to match this node.
      // Only keywords with namespaces shall match.
      if (node.id.namespace) {
        return node.id.fullName.toLowerCase().includes(lowerQuery);
      }
    }

    const toMatch = isVariableDeclaration(node)
      ? formatVariable(node)
      : node.id.name;

    return toMatch.toLowerCase().includes(lowerQuery);
  };
}

function _createVariableSymbol(
  node: VariableDeclaration,
  file: WorkspaceFile,
  useFileNameAsContainer: boolean
) {
  return {
    name: formatVariable(node),
    kind: SymbolKind.Variable,
    location: {
      uri: file.uri,
      range: nodeLocationToRange(node),
    },
    containerName: useFileNameAsContainer ? file.relativePath : undefined,
  };
}

function _createTestCaseSymbol(
  node: TestCase,
  file: WorkspaceFile,
  useFileNameAsContainer: boolean
) {
  return {
    name: node.id.name,
    kind: SymbolKind.Function,
    location: {
      uri: file.uri,
      range: nodeLocationToRange(node),
    },
    containerName: useFileNameAsContainer ? file.relativePath : "<test case>",
  };
}

function _createKeywordSymbol(
  node: UserKeyword,
  file: WorkspaceFile,
  useFileNameAsContainer: boolean
) {
  return {
    name: node.id.name,
    kind: SymbolKind.Function,
    location: {
      uri: file.uri,
      range: nodeLocationToRange(node),
    },
    containerName: useFileNameAsContainer ? file.relativePath : "<keyword>",
  };
}
