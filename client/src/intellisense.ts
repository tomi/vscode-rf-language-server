import { window, workspace, Disposable, ExtensionContext } from "vscode";
import {
  LanguageClient, LanguageClientOptions,
  SettingMonitor, ServerOptions,
  TransportKind, RequestType
} from "vscode-languageclient";

import { Config } from "./utils/config";
import { exec } from "child_process";

export interface BuildFromFilesParam {
  files: string[];
}

export const BuildFromFilesRequestType =
  new RequestType<BuildFromFilesParam, void, void, void>("buildFromFiles");

export default class Intellisense {
  private static openLinkInBrowser(url: string) {
    let openCommand: string = "";

    switch (process.platform) {
      case "darwin":
      case "linux":
        openCommand = "open ";
        break;
      case "win32":
        openCommand = "start ";
        break;
      default:
        return;
    }

    exec(openCommand + url);
  }

  private langClient: LanguageClient;

  constructor(languageClient: LanguageClient) {
    this.langClient = languageClient;

    this.initialize();
  }

  public parseCurrent() {
    if (!window.activeTextEditor) {
      return;
    }

    const filePath = window.activeTextEditor.document.fileName;
    this.langClient.sendRequest(BuildFromFilesRequestType, {
      files: [filePath]
    });
  }

  public parseAll() {
    // const config = Config.includeExclude();
    workspace.findFiles(`**/*.robot`, "").then(files => {
      const filePaths = files.map(file => file.fsPath);

      // Send the array of paths to the language server
      this.langClient.sendRequest(BuildFromFilesRequestType, {
        files: filePaths
      });
    });
  }

  public reportBug() {
    Intellisense.openLinkInBrowser("https://github.com/tomi/vscode-rf-language-server/issues");
  }

  private initialize() {
    this.parseAll();
  }

};
