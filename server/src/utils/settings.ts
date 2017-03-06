"use strict";

const CONFIG_BLOCK_NAME = "rfLanguageServer";

export interface Settings {
  includePaths?: string[];
  excludePaths?: string[];
}

export class Config {
  public static settings: Settings = {};

  public static setSettings(settings: Settings) {
    Config.settings = settings;
  }

  public static getIncludeExclude() {
    if (!Config.settings) {
      return {
        include: [],
        exclude: []
      };
    }

    return {
      include: Config.settings.includePaths || [],
      exclude: Config.settings.excludePaths || [],
    };
  }
}
