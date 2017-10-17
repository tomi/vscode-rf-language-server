"use strict";

import * as _ from "lodash";
import * as minimatch from "minimatch";
import Uri from "vscode-uri";
import * as path from "path";

import {
  IPCMessageReader, IPCMessageWriter,
  createConnection, IConnection, TextDocumentSyncKind,
  InitializeParams, InitializeResult, TextDocumentPositionParams,
  RequestType, Location, Range, DocumentSymbolParams, WorkspaceSymbolParams,
  SymbolInformation, FileChangeType, ReferenceParams, CompletionItem, DocumentHighlight,
  DidChangeTextDocumentParams, TextDocumentSyncOptions
} from "vscode-languageserver";

import Workspace from "./intellisense/workspace/workspace";
import { WorkspaceFileParserFn } from "./intellisense/workspace/workspace-file";
import { findDefinition } from "./intellisense/definition-finder";
import { findReferences } from "./intellisense/reference-finder";
import { findCompletionItems } from "./intellisense/completion-provider";
import { getFileSymbols, getWorkspaceSymbols } from "./intellisense/symbol-provider";
import { findFileHighlights } from "./intellisense/highlight-provider";
import { Settings, Config } from "./utils/settings";
import { createFileSearchTrees } from "./intellisense/search-tree";
import { ConsoleLogger } from "./logger";

import * as asyncFs from "./utils/async-fs";

import { createRobotFile } from "./intellisense/workspace/robot-file";
import { createPythonFile } from "./intellisense/workspace/python-file";

const parsersByFile = new Map([
  [".robot", createRobotFile],
  [".txt",   createRobotFile],
  [".py",    createPythonFile]
]);
const workspace = new Workspace();

// Create a connection for the server. The connection uses Node's IPC as a transport
let connection: IConnection = createConnection(
  new IPCMessageReader(process), new IPCMessageWriter(process));

const logger = ConsoleLogger;

export interface BuildFromFilesParam {
  files: string[];
}

export const BuildFromFilesRequest =
  new RequestType<BuildFromFilesParam, void, void, void>("buildFromFiles");

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
connection.onDidChangeTextDocument(onDidChangeTextDocument);
connection.onDidChangeWatchedFiles(onDidChangeWatchedFiles);

/**
 * Parse files
 */
function onBuildFromFiles(message: BuildFromFilesParam) {
  logger.info("buildFromFiles", message);

  workspace.clear();

  message.files
    .filter(_shouldAcceptFile)
    .forEach(_readAndParseFile);
}

/**
 * Provides completion items for given text position
 */
function onCompletion(textDocumentPosition: TextDocumentPositionParams): CompletionItem[] {
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

  const found = findDefinition({
    filePath,
    position: {
      line: textDocumentPosition.position.line,
      column: textDocumentPosition.position.character,
    }
  }, workspace);

  if (!found) {
    return null;
  }

  return {
    uri: found.uri,
    range: found.range
  };
}

/**
 * Configuration has changed
 */
function onDidChangeConfiguration(change) {
  logger.info("onDidChangeConfiguration...");

  if (change.settings && change.settings.rfLanguageServer) {
    Config.setSettings(change.settings.rfLanguageServer);
  }
}

/**
 * Message sent when the content of a text document did change in VSCode.
 */
function onDidChangeTextDocument(params: DidChangeTextDocumentParams) {
  logger.info("onDidChangeTextDocument");

  const filePath = _filePathFromUri(params.textDocument.uri);
  if (!_shouldAcceptFile(filePath)) {
    return;
  }

  // Because syncKind is set to Full, entire file content is received
  const fileData = _.first(params.contentChanges).text;

  _parseFile(filePath, fileData);
}

function onDidChangeWatchedFiles(params) {
  logger.info(`onDidChangeWatchedFiles ${params.changes}`);

  // Remove deleted files
  params.changes
    .filter(change => change.type === FileChangeType.Deleted)
    .map(deletedFile => _filePathFromUri(deletedFile.uri))
    .forEach(deletedFilePath => {
      logger.info("Removing file", deletedFilePath);
      workspace.removeFileByPath(deletedFilePath);
    });

  // Parse created files
  params.changes
    .filter(change => change.type === FileChangeType.Created)
    .map(createdFile => _filePathFromUri(createdFile.uri))
    .filter(_shouldAcceptFile)
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
function onDocumentSymbol(documentSymbol: DocumentSymbolParams): SymbolInformation[] {
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
  workspaceRoot = rootUri && Uri.parse(rootUri).fsPath;

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
        triggerCharacters: [
          "[", "{", "*"
        ]
      }
    },
  };
}

/**
 * Finds references for the symbol in document position
 */
function onReferences(referenceParams: ReferenceParams): Location[] {
  logger.info("onReferences...");

  const filePath = _filePathFromUri(referenceParams.textDocument.uri);

  const foundReferences = findReferences({
    filePath,
    position: {
      line: referenceParams.position.line,
      column: referenceParams.position.character
    }
  }, workspace);

  return foundReferences;
}

/**
 * Provides workspace symbols
 */
function onWorkspaceSymbol(workspaceSymbol: WorkspaceSymbolParams): SymbolInformation[] {
  logger.info("onWorkspaceSymbol...");

  const query = workspaceSymbol.query;

  return getWorkspaceSymbols(workspace, query);
}

function _shouldAcceptFile(filePath: string) {
  const fileExt = path.extname(filePath);
  if (!parsersByFile.has(fileExt)) {
    logger.debug(`Not accepting file ${ filePath }. Extension ${ fileExt } is not supported.`);
    return false;
  }

  const { include, exclude } = Config.getIncludeExclude();

  const hasIncludePatterns = include.length > 0;
  const hasExcludePatterns = exclude.length > 0;

  const shouldInclude = !hasIncludePatterns ||
    _.some(include, pattern => minimatch(filePath, pattern));
  const shouldExclude = hasExcludePatterns &&
    _.some(exclude, pattern => minimatch(filePath, pattern));

  return shouldInclude && !shouldExclude;
}

function _parseFile(filePath: string, fileContents: string) {
  try {
    const createFn = _getParserFn(filePath);
    const file = _createWorkspaceFile(filePath, fileContents, createFn);

    workspace.addFile(file);
  } catch (error) {
    logger.error("Failed to parse", filePath, error);
  }
};

async function _readAndParseFile(filePath: string) {
  try {
    const createFn = _getParserFn(filePath);
    const fileContents = await asyncFs.readFileAsync(filePath, "utf-8");
    const file = _createWorkspaceFile(filePath, fileContents, createFn);

    workspace.addFile(file);
  } catch (error) {
    logger.error("Failed to parse", filePath, error);
  }
}

function _getParserFn(filePath: string) {
  const fileExt = path.extname(filePath);

  const parserFn = parsersByFile.get(fileExt);
  if (!parserFn) {
    throw new Error(`Unsupported file extension ${ fileExt }`);
  }

  return parserFn;
}

function _createWorkspaceFile(filePath: string, fileContents: string, createFn: WorkspaceFileParserFn) {
  const relativePath = workspaceRoot ?
    path.relative(workspaceRoot, filePath) :
    filePath;

  logger.info("Parsing", filePath);
  return createFn(fileContents, filePath, relativePath);
}

function _filePathFromUri(uri: string): string {
  return Uri.parse(uri).path;
}

function _textPositionToLocation(position: TextDocumentPositionParams) {
  const filePath = _filePathFromUri(position.textDocument.uri);

  return {
    filePath,
    position: {
      line: position.position.line,
      column: position.position.character,
    }
  };
}

// Listen on the connection
connection.listen();
