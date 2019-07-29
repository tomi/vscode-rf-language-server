import * as _ from "lodash";
import * as minimatch from "minimatch";
import Uri from "vscode-uri";
import * as path from "path";

import {
  createConnection,
  IConnection,
  TextDocumentSyncKind,
  InitializeParams,
  InitializeResult,
  TextDocumentPositionParams,
  RequestType,
  Location,
  DocumentSymbolParams,
  WorkspaceSymbolParams,
  SymbolInformation,
  FileChangeType,
  ReferenceParams,
  CompletionItem,
  DocumentHighlight,
  DidChangeTextDocumentParams,
  DidChangeConfigurationParams,
  DidChangeWatchedFilesParams,
  FileEvent,
} from "vscode-languageserver";

import Workspace from "./intellisense/workspace/workspace";
import { WorkspaceFileParserFn } from "./intellisense/workspace/workspace-file";
import { findDefinition } from "./intellisense/definition-finder";
import { findReferences } from "./intellisense/reference-finder";
import { findCompletionItems } from "./intellisense/completion-provider";
import {
  getFileSymbols,
  getWorkspaceSymbols,
} from "./intellisense/symbol-provider";
import { findFileHighlights } from "./intellisense/highlight-provider";
import { Config, LibraryDefinition } from "./utils/settings";
import { ConsoleLogger } from "./logger";

import * as asyncFs from "./utils/async-fs";

import { createRobotFile } from "./intellisense/workspace/robot-file";
import { createPythonFile } from "./intellisense/workspace/python-file";
import { createLibraryFile } from "./intellisense/workspace/library";

const LIBRARY_PATH = path.resolve(__dirname, "./library-docs");

const parsersByFile = new Map([
  [".robot", createRobotFile],
  [".resource", createRobotFile],
  [".txt", createRobotFile],
  [".py", createPythonFile],
]);
const workspace = new Workspace();

// Create a connection for the server
const connection: IConnection =
  process.argv.length <= 2
    ? createConnection(process.stdin, process.stdout)
    : createConnection();

const logger = ConsoleLogger;

export interface BuildFromFilesParam {
  files: string[];
}

export const BuildFromFilesRequest = new RequestType<
  BuildFromFilesParam,
  void,
  void,
  void
>("buildFromFiles");

// After the server has started the client sends an initilize request. The server receives
// in the passed params the rootPath of the workspace plus the client capabilites.
let workspaceRoot: string;

connection.onInitialize(onInitialize);
connection.onDocumentHighlight(onDocumentHighlight);
connection.onDidChangeConfiguration(onDidChangeConfiguration);
connection.onDocumentSymbol(onDocumentSymbol);
connection.onWorkspaceSymbol(onWorkspaceSymbol);
connection.onDefinition(onDefinition);
connection.onReferences(onReferences);
connection.onCompletion(onCompletion);
connection.onRequest(BuildFromFilesRequest, onBuildFromFiles);
// Called when contents of a file changes
connection.onDidChangeTextDocument(onDidChangeTextDocument);
// Called when a file gets deleted or added
connection.onDidChangeWatchedFiles(onDidChangeWatchedFiles);

/**
 * Parse files
 */
function onBuildFromFiles(message: BuildFromFilesParam) {
  logger.info("buildFromFiles", message);

  workspace.clear();

  message.files.filter(_shouldAcceptFile).forEach(_readAndParseFile);

  Config.getLibraries().forEach(_readAndParseLibrary);
}

/**
 * Provides completion items for given text position
 */
function onCompletion(
  textDocumentPosition: TextDocumentPositionParams
): CompletionItem[] {
  logger.info("onCompletion...");

  const location = _textPositionToLocation(textDocumentPosition);

  const completionItems = findCompletionItems(location, workspace);

  logger.debug(JSON.stringify(completionItems, null, 2));

  return completionItems;
}

/**
 * Finds the definition for an item in the cursor position
 */
function onDefinition(textDocumentPosition: TextDocumentPositionParams) {
  logger.info("onDefinition...");

  const filePath = _filePathFromUri(textDocumentPosition.textDocument.uri);

  const found = findDefinition(
    {
      filePath,
      position: {
        line: textDocumentPosition.position.line,
        column: textDocumentPosition.position.character,
      },
    },
    workspace
  );

  if (!found) {
    return null;
  }

  return {
    uri: found.uri,
    range: found.range,
  };
}

/**
 * Configuration has changed
 */
function onDidChangeConfiguration(change: DidChangeConfigurationParams) {
  logger.info("onDidChangeConfiguration...");

  if (change.settings && change.settings.rfLanguageServer) {
    const librariesBefore = Config.getLibraries();
    Config.setSettings(change.settings.rfLanguageServer);
    const librariesAfter = Config.getLibraries();

    if (!_.isEqual(librariesBefore, librariesAfter)) {
      logger.info("Library configuration changed, reparsing...");
      workspace.removeAllLibraries();
      librariesAfter.forEach(_readAndParseLibrary);
    }
  }
}

/**
 * Message sent when the content of a text document did change in VSCode.
 */
function onDidChangeTextDocument(params: DidChangeTextDocumentParams) {
  logger.info("onDidChangeTextDocument", params.textDocument.uri);

  const filePath = _filePathFromUri(params.textDocument.uri);
  if (!_shouldAcceptFile(filePath)) {
    return;
  }

  // Because syncKind is set to Full, entire file content is received
  const firstChange = params.contentChanges[0];
  if (firstChange) {
    const fileData = firstChange.text;

    _parseFile(filePath, fileData);
  }
}

function onDidChangeWatchedFiles(params: DidChangeWatchedFilesParams) {
  logger.info(
    "onDidChangeWatchedFiles",
    params.changes.map(f => `[${_fileEventTypeToString(f)} ${f.uri}]`).join(" ")
  );

  const urisOfDeletedFiles = params.changes
    .filter(change => change.type === FileChangeType.Deleted)
    .map(deletedFile => _filePathFromUri(deletedFile.uri));

  // Remove deleted files
  urisOfDeletedFiles.forEach(deletedFilePath => {
    logger.info("Removing file", deletedFilePath);
    workspace.removeFileByPath(deletedFilePath);
  });

  const urisOfCreatedFiles = params.changes
    .filter(change => change.type === FileChangeType.Created)
    .map(createdFile => _filePathFromUri(createdFile.uri));

  // There are no 'onDidChangeTextDocument' events for python files, because
  // the extension is not configured to work with .py files.
  const urisOfChangedPyFiles = params.changes
    .filter(change => change.type === FileChangeType.Changed)
    .map(createdFile => _filePathFromUri(createdFile.uri))
    .filter(_isPythonFile);

  [...urisOfCreatedFiles, ...urisOfChangedPyFiles]
    // In some cases there can be a create and delete events for the same file.
    // Such as in the case of VSCode python extension, which creates temp
    // files when formatting.
    .filter(uri => !urisOfDeletedFiles.includes(uri) && _shouldAcceptFile(uri))
    .forEach(_readAndParseFile);
}

function onDocumentHighlight(
  textDocumentPosition: TextDocumentPositionParams
): DocumentHighlight[] {
  logger.info("onDocumentHighlight...");

  const location = _textPositionToLocation(textDocumentPosition);

  const highlights = findFileHighlights(location, workspace);

  return highlights;
}

/**
 * Provides document symbols
 */
function onDocumentSymbol(
  documentSymbol: DocumentSymbolParams
): SymbolInformation[] {
  logger.info("onDocumentSymbol...");

  const filePath = _filePathFromUri(documentSymbol.textDocument.uri);
  const file = workspace.getFile(filePath);
  if (!file) {
    return [];
  }

  return getFileSymbols(file);
}

/**
 *
 * @param params
 */
function onInitialize(params: InitializeParams): InitializeResult {
  logger.info("Initializing...");

  const rootUri = params.rootUri;
  if (rootUri) {
    workspaceRoot = Uri.parse(rootUri).fsPath;
  }

  return {
    capabilities: {
      // Tell the client that the server works in FULL text document sync mode
      textDocumentSync: TextDocumentSyncKind.Full,
      definitionProvider: true,
      documentSymbolProvider: true,
      workspaceSymbolProvider: true,
      referencesProvider: true,
      documentHighlightProvider: true,
      completionProvider: {
        triggerCharacters: ["[", "{", "*", "."],
      },
    },
  };
}

/**
 * Finds references for the symbol in document position
 */
function onReferences(referenceParams: ReferenceParams): Location[] {
  logger.info("onReferences...");

  const filePath = _filePathFromUri(referenceParams.textDocument.uri);

  const foundReferences = findReferences(
    {
      filePath,
      position: {
        line: referenceParams.position.line,
        column: referenceParams.position.character,
      },
    },
    workspace
  );

  return foundReferences;
}

/**
 * Provides workspace symbols
 */
function onWorkspaceSymbol(
  workspaceSymbol: WorkspaceSymbolParams
): SymbolInformation[] {
  logger.info("onWorkspaceSymbol...");

  const query = workspaceSymbol.query;

  return getWorkspaceSymbols(workspace, query);
}

function _shouldAcceptFile(filePath: string) {
  const fileExt = path.extname(filePath);
  if (!parsersByFile.has(fileExt)) {
    logger.debug(
      `Not accepting file ${filePath}. Extension ${fileExt} is not supported.`
    );
    return false;
  }

  const { include, exclude } = Config.getIncludeExclude();

  const hasIncludePatterns = include.length > 0;
  const hasExcludePatterns = exclude.length > 0;

  const shouldInclude =
    !hasIncludePatterns ||
    _.some(include, pattern => minimatch(filePath, pattern));
  const shouldExclude =
    hasExcludePatterns &&
    _.some(exclude, pattern => minimatch(filePath, pattern));

  if (!shouldInclude) {
    logger.debug(
      `Not accepting file ${filePath}. It doesn't match any include pattern.`
    );
  } else if (shouldExclude) {
    logger.debug(
      `Not accepting file ${filePath}. It matches an exclude pattern.`
    );
  }

  return shouldInclude && !shouldExclude;
}

const _isPythonFile = (filePath: string) => path.extname(filePath) === ".py";

function _parseFile(filePath: string, fileContents: string) {
  try {
    const createFn = _getParserFn(filePath);
    const file = _createWorkspaceFile(filePath, fileContents, createFn);

    workspace.addFile(file);
  } catch (error) {
    logger.error("Failed to parse", filePath, error);
  }
}

async function _readAndParseFile(filePath: string) {
  try {
    const createFn = _getParserFn(filePath);
    const fileContents = await asyncFs.readFileAsync(filePath, "utf-8");
    const file = _createWorkspaceFile(filePath, fileContents, createFn);

    workspace.addFile(file);
  } catch (error) {
    logger.error("Failed to parse file", filePath, error);
  }
}

async function _readAndParseLibrary(libraryName: string | LibraryDefinition) {
  try {
    let libraryDefinition: LibraryDefinition;

    if (typeof libraryName === "string") {
      const filePath = path.join(LIBRARY_PATH, `${libraryName}.json`);
      const fileContents = await asyncFs.readFileAsync(filePath, "utf-8");

      logger.info("Parsing library", filePath);
      libraryDefinition = JSON.parse(fileContents);
    } else {
      libraryDefinition = libraryName;
    }

    const file = createLibraryFile(libraryDefinition);

    workspace.addLibrary(file);
  } catch (error) {
    logger.error("Failed to parse library", libraryName, error);
  }
}

function _getParserFn(filePath: string) {
  const fileExt = path.extname(filePath);

  const parserFn = parsersByFile.get(fileExt);
  if (!parserFn) {
    throw new Error(`Unsupported file extension ${fileExt}`);
  }

  return parserFn;
}

function _createWorkspaceFile(
  filePath: string,
  fileContents: string,
  createFn: WorkspaceFileParserFn
) {
  const relativePath = workspaceRoot
    ? path.relative(workspaceRoot, filePath)
    : filePath;

  logger.info("Parsing file", filePath);
  return createFn(fileContents, filePath, relativePath);
}

function _filePathFromUri(uri: string): string {
  return Uri.parse(uri).fsPath;
}

function _textPositionToLocation(position: TextDocumentPositionParams) {
  const filePath = _filePathFromUri(position.textDocument.uri);

  return {
    filePath,
    position: {
      line: position.position.line,
      column: position.position.character,
    },
  };
}

const _fileEventTypeToString = (fileEvent: FileEvent) =>
  fileEvent.type === FileChangeType.Created
    ? "Cr"
    : fileEvent.type === FileChangeType.Changed
      ? "Ch"
      : "De";

// Listen on the connection
connection.listen();
