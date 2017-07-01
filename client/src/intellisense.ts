import { window, workspace, Disposable, ExtensionContext } from "vscode";
import {
  LanguageClient, LanguageClientOptions,
  SettingMonitor, ServerOptions,
  TransportKind, RequestType
} from "vscode-languageclient";

import { Config } from "./utils/config";
import { exec } from "child_process";
import * as path from "path";

export interface BuildFromFilesParam {
  files: string[];
}

export const BuildFromFilesRequestType =
  new RequestType<BuildFromFilesParam, void, void, void>("buildFromFiles");

function createGlob(patterns: string[]) {
  switch (patterns.length) {
    case 0:
      return "";
    case 1:
      return patterns[0];
    default:
      return `{${ patterns.join(",") }}`;
  }
};

function getIncludeExcludePattern() {
  const { include, exclude } = Config.getIncludeExclude();

  const defaultInclude = Config.getHasPythonKeywords() ?
     ["**/*.robot", "**/*.py"] : ["**/*.robot"];

  return {
    include: createGlob(include.length === 0 ? defaultInclude : include),
    exclude: createGlob(exclude)
  };
}

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

  public parseAll() {
    const includeExclude = getIncludeExcludePattern();

    const allowedFileExts = new Set(
      Config.getHasPythonKeywords() ? [".robot", ".py"] : [".robot"]
    );

    workspace.findFiles(includeExclude.include, includeExclude.exclude).then(files => {
      const filePaths = files
        // User can configure patterns that include other files than .robot.
        // Filter those out.
        .filter(file => allowedFileExts.has(path.extname(file.fsPath)))
        .map(file => file.fsPath);

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
