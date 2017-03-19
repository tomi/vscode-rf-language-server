"use strict";

import * as _ from "lodash";
import * as minimatch from "minimatch";
import Uri from "vscode-uri";
import * as path from "path";

import {
  IPCMessageReader, IPCMessageWriter,
  createConnection, IConnection, TextDocumentSyncKind,
  TextDocuments, InitializeParams, InitializeResult, TextDocumentPositionParams,
  RequestType, Location, Range, DocumentSymbolParams, WorkspaceSymbolParams,
  SymbolInformation, FileChangeType
} from "vscode-languageserver";

import { WorkspaceFile, WorkspaceTree } from "./intellisense/workspace-tree";
import { findDefinition } from "./intellisense/definition-finder";
import { getFileSymbols, getWorkspaceSymbols } from "./intellisense/symbol-provider";
import { Settings, Config } from "./utils/settings";

import * as asyncFs from "./utils/async-fs";

import { FileParser } from "./parser/parser";
const parser = new FileParser();

const workspaceMap = new WorkspaceTree();

function filePathFromUri(uri: string): string {
  return Uri.parse(uri).path;
}

// Create a connection for the server. The connection uses Node"s IPC as a transport
let connection: IConnection = createConnection(
  new IPCMessageReader(process), new IPCMessageWriter(process));

// Create a simple text document manager. The text document manager
// supports full document sync only
let documents: TextDocuments = new TextDocuments();
// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

const logger = console;

// After the server has started the client sends an initilize request. The server receives
// in the passed params the rootPath of the workspace plus the client capabilites.
let workspaceRoot: string;
connection.onInitialize((params: InitializeParams): InitializeResult => {
  logger.log("Initializing...");

  const rootUri = params.rootUri;
  workspaceRoot = rootUri && Uri.parse(rootUri).fsPath;

  return {
    capabilities: {
      // Tell the client that the server works in FULL text document sync mode
      textDocumentSync: documents.syncKind,
      definitionProvider: true,
      documentSymbolProvider: true,
      workspaceSymbolProvider: true,
    },
  };
});

// The settings have changed. Is send on server activation
// as well.
connection.onDidChangeConfiguration(change => {
  logger.log("onDidChangeConfiguration...");

  if (change.settings && change.settings.rfLanguageServer) {
    Config.setSettings(change.settings.rfLanguageServer);
  }
});

/**
 * Provides document symbols
 */
connection.onDocumentSymbol((documentSymbol: DocumentSymbolParams): SymbolInformation[] => {
  logger.log("onDocumentSymbol...");

  const filePath = filePathFromUri(documentSymbol.textDocument.uri);
  const fileTree = workspaceMap.getFile(filePath);
  if (!fileTree) {
    return [];
  }

  return getFileSymbols(fileTree);
});

/**
 * Provides workspace symbols
 */
connection.onWorkspaceSymbol((workspaceSymbol: WorkspaceSymbolParams): SymbolInformation[] => {
  logger.log("onWorkspaceSymbol...");

  const query = workspaceSymbol.query;

  return getWorkspaceSymbols(workspaceMap, query);
});

/**
 * Finds the definition for an item in the cursor position
 */
connection.onDefinition((textDocumentPosition: TextDocumentPositionParams): Location => {
  logger.log("onDefinition...");

  const filePath = filePathFromUri(textDocumentPosition.textDocument.uri);

  const found = findDefinition({
    filePath,
    position: {
      line: textDocumentPosition.position.line,
      column: textDocumentPosition.position.character,
    }
  }, workspaceMap);

  if (!found) {
    return null;
  }

  return {
    uri: found.uri,
    range: found.range
  };
});

export interface BuildFromFilesParam {
  files: string[];
}

export const BuildFromFilesRequest =
  new RequestType<BuildFromFilesParam, void, void, void>("buildFromFiles");

connection.onRequest(BuildFromFilesRequest, message => {
  logger.log("buildFromFiles", message);

  message.files.forEach(readAndParseFile);
});

/**
 * Message sent when the content of a text document did change in VSCode.
 */
connection.onDidChangeTextDocument(params => {
  logger.log("onDidChangeTextDocument");

  // Because syncKind is set to Full, entire file content is received
  const filePath = filePathFromUri(params.textDocument.uri);
  const fileData = _.first(params.contentChanges).text;

  debouncedParseFile(filePath, fileData);
});

connection.onDidChangeWatchedFiles(params => {
  logger.log(`onDidChangeWatchedFiles ${ params.changes }`);

  // Remove deleted files
  params.changes
    .filter(change => change.type === FileChangeType.Deleted)
    .map(deletedFile => filePathFromUri(deletedFile.uri))
    .forEach(deletedFilePath => {
      logger.info("Removing file", deletedFilePath);
      workspaceMap.removeFileByPath(deletedFilePath);
    });

  // Parse created files
  params.changes
    .filter(change => change.type === FileChangeType.Created)
    .map(createdFile => filePathFromUri(createdFile.uri))
    .filter(matchFilePathToConfig)
    .forEach(readAndParseFile);
});

function matchFilePathToConfig(filePath: string) {
  const { include, exclude } = Config.getIncludeExclude();

  const hasIncludePatterns = include.length > 0;
  const hasExcludePatterns = exclude.length > 0;

  const shouldInclude = !hasIncludePatterns ||
    _.some(include, pattern => minimatch(filePath, pattern));
  const shouldExclude = hasExcludePatterns &&
    _.some(exclude, pattern => minimatch(filePath, pattern));

  return shouldInclude && !shouldExclude;
}

const debouncedParseFile = _.debounce((filePath: string, fileData: string) => {
    try {
      const parsedFile = parser.parseFile(fileData);
      const file = createWorkspaceFile(filePath, parsedFile);

      workspaceMap.addFile(file);
    } catch (error) {
      logger.error("Failed to parse", filePath, error);
    }
  }, 3000);

function readAndParseFile(filePath: string) {
  logger.info("Parsing", filePath);

  asyncFs.readFileAsync(filePath, "utf-8")
    .then(fileData => parser.parseFile(fileData))
    .then(parsedFile => {
      const file = createWorkspaceFile(filePath, parsedFile);

      workspaceMap.addFile(file);
    })
    .catch(error => {
      logger.error("Failed to parse", filePath, error);
    });
}

function createWorkspaceFile(filePath: string, fileTree) {
  const relativePath = path.relative(workspaceRoot, filePath);

  return new WorkspaceFile(filePath, relativePath, fileTree);
}

// Listen on the connection
connection.listen();
