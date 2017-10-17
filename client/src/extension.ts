"use strict";

import * as path from "path";

import { commands, workspace, ExtensionContext } from "vscode";
import CommandHandler from "./command-handler";
import RFServerClient from "./rf-server-client";
import { Config } from "./utils/config";
import { runMigrations } from "./migration-helper";

let rfLanguageServerClient: RFServerClient;
let commandHandler: CommandHandler;

export function activate(context: ExtensionContext) {

  rfLanguageServerClient = new RFServerClient(context);
  commandHandler = new CommandHandler(rfLanguageServerClient);

  runMigrations();

  context.subscriptions.push(
    commands.registerCommand("rfIntellisense.reportBug", commandHandler.reportBug));
  context.subscriptions.push(
    commands.registerCommand("rfIntellisense.rebuildSources", () =>
      commandHandler.parseAll()
  ));

  rfLanguageServerClient.start()
    .then(() => commandHandler.parseAll());

  let currentIncludePattern = Config.getInclude();
  const disposable = workspace.onDidChangeConfiguration(() => {
    const newIncludePattern = Config.getInclude();
    if (currentIncludePattern === newIncludePattern) {
      return;
    }

    currentIncludePattern = newIncludePattern;
    console.log("Configuration has changed. Restarting language server..");
    rfLanguageServerClient.restart()
      .then(() => commandHandler.parseAll());
  });

  // Push the disposable to the context's subscriptions so that the
  // client can be deactivated on extension deactivation
  context.subscriptions.push(rfLanguageServerClient);
  context.subscriptions.push(disposable);
}
