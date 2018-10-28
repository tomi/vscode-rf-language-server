import { window, workspace } from "vscode";

import { Config } from "./utils/config";
import RFServerClient from "./rf-server-client";
import { exec } from "child_process";

function getIncludeExcludePattern() {
  return {
    include: Config.getInclude(),
    exclude: Config.getExclude(),
  };
}

export default class CommandHandler {
  private langClient: RFServerClient;

  constructor(languageClient: RFServerClient) {
    this.langClient = languageClient;
  }

  public parseAll() {
    const includeExclude = getIncludeExcludePattern();

    if (!workspace.rootPath) {
      // Not a folder
      const activeEditor = window.activeTextEditor;
      if (!activeEditor) {
        return;
      }

      this.langClient.sendBuildFilesRequest([activeEditor.document.uri.fsPath]);
    } else {
      workspace
        .findFiles(includeExclude.include, includeExclude.exclude)
        .then(files => {
          const filePaths = files.map(fileUri => fileUri.fsPath);

          // Send the array of paths to the language server
          this.langClient.sendBuildFilesRequest(filePaths);
        });
    }
  }

  public reportBug() {
    _openLinkInBrowser(
      "https://github.com/tomi/vscode-rf-language-server/issues"
    );
  }
}

function _openLinkInBrowser(url: string) {
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
