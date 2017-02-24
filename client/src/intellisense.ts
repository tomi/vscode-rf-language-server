import { window, workspace, Disposable, ExtensionContext } from "vscode";
import {
  LanguageClient, LanguageClientOptions,
  SettingMonitor, ServerOptions,
  TransportKind, RequestType
} from "vscode-languageclient";

import { Config } from "./utils/config";

export namespace BuildFromFilesRequest {
  export interface BuildFromFilesParam {
    files: string[];
  }

  export const type = new RequestType<BuildFromFilesParam, void, void, void>("buildFromFiles");
}

export default class Intellisense {
  private langClient: LanguageClient;

  constructor(languageClient: LanguageClient) {
    this.langClient = languageClient;
  }

  parseCurrent() {
    if (!window.activeTextEditor) {
      return;
    }

    const filePath = window.activeTextEditor.document.fileName;
    this.langClient.sendRequest(BuildFromFilesRequest.type, {
      files: [filePath]
    });
  }

  parseAll() {
    // const config = Config.includeExclude();
    workspace.findFiles(`**/*.robot`, "").then(files => {
      const filePaths = files.map(file => file.fsPath);

      // Send the array of paths to the language server
      this.langClient.sendRequest(BuildFromFilesRequest.type, {
        files: filePaths
      });
    });
  }
};
