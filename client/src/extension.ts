"use strict";

import * as path from "path";

import { commands, workspace, Disposable, ExtensionContext } from "vscode";
import {
    LanguageClient, LanguageClientOptions,
    SettingMonitor, ServerOptions,
    TransportKind
} from "vscode-languageclient";

import Intellisense from "./intellisense";

export function activate(context: ExtensionContext) {

  // The server is implemented in node
  let serverModule = context.asAbsolutePath(path.join("server", "server.js"));
  // The debug options for the server
  let debugOptions = { execArgv: ["--nolazy", "--debug=6009"] };

  // If the extension is launched in debug mode then the debug server options are used
  // Otherwise the run options are used
  let serverOptions: ServerOptions = {
    run : { module: serverModule, transport: TransportKind.ipc },
    debug: { module: serverModule, transport: TransportKind.ipc, options: debugOptions }
  };

  // Options to control the language client
  let clientOptions: LanguageClientOptions = {
    // Register the server for plain text documents
    documentSelector: ["robot"],
    synchronize: {
      // Synchronize the setting section "rfLanguageServer" to the server
      configurationSection: "rfLanguageServer",
      // Notify the server about file changes to ".clientrc files contain in the workspace
      fileEvents: workspace.createFileSystemWatcher("**/.clientrc")
    }
  };

  // Create the language client and start the client.
  let langClient = new LanguageClient(
    "rfLanguageServer",
    "Robot Framework Intellisense Server",
    serverOptions,
    clientOptions
  );

  let disposable = langClient.start();

  langClient.onReady().then(() => {
    let intellisense: Intellisense = new Intellisense(langClient);

    context.subscriptions.push(commands.registerCommand("rfIntellisense.rebuildSources", () => {
      intellisense.parseAll();
    }));

    context.subscriptions.push(commands.registerCommand("rfIntellisense.rebuildCurrentSource", () => {
      intellisense.parseCurrent();
    }));
  });

  // Push the disposable to the context"s subscriptions so that the
  // client can be deactivated on extension deactivation
  context.subscriptions.push(disposable);
}
