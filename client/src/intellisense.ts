import { window, workspace, Disposable, ExtensionContext } from "vscode";
import {
  LanguageClient, LanguageClientOptions,
  SettingMonitor, ServerOptions,
  TransportKind, RequestType
} from "vscode-languageclient";

import { Config } from "./utils/config";

export interface BuildFromFilesParam {
  files: string[];
}

export const BuildFromFilesRequestType =
  new RequestType<BuildFromFilesParam, void, void, void>("buildFromFiles");

export default class Intellisense {
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

  private initialize() {
    this.parseAll();
  }

};
