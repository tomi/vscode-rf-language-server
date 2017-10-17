"use strict";

import { workspace } from "vscode";

export const CONFIG_BLOCK_NAME = "rfLanguageServer";

export class Config {
  public static settings = workspace.getConfiguration(CONFIG_BLOCK_NAME);

  public static reloadConfig() {
    Config.settings = workspace.getConfiguration(CONFIG_BLOCK_NAME);
  }

  public static getSettings() {
    Config.reloadConfig();

    return Config.settings;
  }

  /**
   * Returns configured include patterns or default pattern
   */
  public static getInclude() {
    Config.reloadConfig();

    const includePatterns = Config.settings ?
      Config.settings.get<string[]>("includePaths") :
      [];

    return _createGlob(
      includePatterns.length > 0 ? includePatterns : ["**/*.robot"]
    );
  }

  public static getExclude() {
    Config.reloadConfig();

    const exlcudePatterns = Config.settings ?
      Config.settings.get<string[]>("excludePaths") :
      [];

    return _createGlob(exlcudePatterns);
  }
}

function _areEqual(a: any[], b: any[]) {
  if (a.length !== b.length) {
    return false;
  }

  return a.every((val, idx) => val === b[idx]);
}

function _createGlob(patterns: string[]) {
  switch (patterns.length) {
    case 0:
      return "";
    case 1:
      return patterns[0];
    default:
      return `{${patterns.join(",")}}`;
  }
};
