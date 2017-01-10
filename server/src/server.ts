"use strict";

import * as _ from "lodash";

import {
  IPCMessageReader, IPCMessageWriter,
  createConnection, IConnection, TextDocumentSyncKind,
  TextDocuments, TextDocument, Diagnostic, DiagnosticSeverity,
  InitializeParams, InitializeResult, TextDocumentPositionParams,
  CompletionItem, CompletionItemKind, RequestType,
  Location, Range
} from "vscode-languageserver";

import { Position } from "./parser/table-models";
import { TestSuite } from "./parser/models";
import { isInRange } from "./parser/position-helper";
import { traverse, VisitorOption } from "./traverse/traverse";
import { Node } from "./parser/models";

import Uri from "vscode-uri";

import * as fs from "fs";

import { FileParser } from "./parser/parser";
const parser = new FileParser();

const fileTreeMapper = new Map();

// Create a connection for the server. The connection uses Node"s IPC as a transport
let connection: IConnection = createConnection(new IPCMessageReader(process), new IPCMessageWriter(process));

// Create a simple text document manager. The text document manager
// supports full document sync only
let documents: TextDocuments = new TextDocuments();
// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// After the server has started the client sends an initilize request. The server receives
// in the passed params the rootPath of the workspace plus the client capabilites.
let workspaceRoot: string;
connection.onInitialize((params: InitializeResult) => {
  // workspaceRoot = params.rootPath;
  return {
    capabilities: {
      // Tell the client that the server works in FULL text document sync mode
      textDocumentSync: documents.syncKind,
      // Tell the client that the server support code complete
      completionProvider: {
        resolveProvider: true,
      },
      definitionProvider: true
    },
  };
});

function findNodeInPos(pos: Position, data: TestSuite) {
  let foundNode;

  traverse(null, data, {
    enter: (node: Node, parent) => {
      if (!isInRange(pos, node)) {
        return VisitorOption.Skip;
      }

      foundNode = {
        node,
        parent
      };
    }
  });

  return foundNode;
}

// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent(change => {
  validateDocument(change.document);
});

// The settings interface describe the server relevant settings part
interface Settings {
  languageServerExample: ExampleSettings;
}

// These are the example settings we defined in the client"s package.json
// file
interface ExampleSettings {
  maxNumberOfProblems: number;
}

// hold the maxNumberOfProblems setting
let maxNumberOfProblems: number;
// The settings have changed. Is send on server activation
// as well.
connection.onDidChangeConfiguration((change) => {
  let settings = <Settings>change.settings;
  maxNumberOfProblems = settings.languageServerExample.maxNumberOfProblems || 100;
  // Revalidate any open text documents
  documents.all().forEach(validateDocument);
});

function validateDocument(textDocument: TextDocument): void {
  let diagnostics: Diagnostic[] = [];
  // Send the computed diagnostics to VSCode.
  connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
}

connection.onDidChangeWatchedFiles(change => {
  // Monitored files have change in VSCode
  connection.console.log("We recevied an file change event");
});

// This handler provides the initial list of the completion items.
connection.onCompletion((textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
  // The pass parameter contains the position of the text document in
  // which code complete got requested. For the example we ignore this
  // info and always provide the same completion items.
  return [
    {
      label: "TypeScript",
      kind: CompletionItemKind.Text,
      data: 1,
    },
    {
      label: "JavaScript",
      kind: CompletionItemKind.Text,
      data: 2,
    },
  ];
});

connection.onDefinition((textDocumentPosition: TextDocumentPositionParams): Location => {
  const fileUri = textDocumentPosition.textDocument.uri;
  const filePath = Uri.parse(fileUri).path;

  const fileDefinition = fileTreeMapper.get(filePath);
  if (!fileDefinition) {
    return null;
  }

  const step = findNodeInPos({
    line: textDocumentPosition.position.line,
    column: textDocumentPosition.position.character
  }, fileDefinition);

  console.log(step);

  return Location.create(fileUri, Range.create(0, 0, 0, 0));
});

// This handler resolve additional information for the item selected in
// the completion list.
connection.onCompletionResolve((item: CompletionItem): CompletionItem => {
  if (item.data === 1) {
    item.detail = "TypeScript details",
    item.documentation = "TypeScript documentation";
  } else if (item.data === 2) {
    item.detail = "JavaScript details",
    item.documentation = "JavaScript documentation";
  }
  return item;
});

const buildFromFiles: RequestType<{
    files: string[],
}, any, any> = { method: "buildFromFiles" };
connection.onRequest(buildFromFiles, message => {
  console.log("buildFromFiles", message);

  fileTreeMapper.clear();

  message.files.forEach(filePath => {
    const fileData = fs.readFileSync(filePath, "utf-8");
    const parsedFile = parser.parseFile(fileData);

    fileTreeMapper.set(filePath, parsedFile);
  });
});
/*
connection.onDidOpenTextDocument((params) => {
  // A text document got opened in VSCode.
  // params.uri uniquely identifies the document. For documents store on disk this is a file URI.
  // params.text the initial full content of the document.
  connection.console.log(`${params.textDocument.uri} opened.`);
});

connection.onDidChangeTextDocument((params) => {
  // The content of a text document did change in VSCode.
  // params.uri uniquely identifies the document.
  // params.contentChanges describe the content changes to the document.
  connection.console.log(`${params.textDocument.uri} changed: ${JSON.stringify(params.contentChanges)}`);
});

connection.onDidCloseTextDocument((params) => {
  // A text document got closed in VSCode.
  // params.uri uniquely identifies the document.
  connection.console.log(`${params.textDocument.uri} closed.`);
});
*/

// Listen on the connection
connection.listen();
