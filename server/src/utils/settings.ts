export interface KeywordDefinition {
  name: string;
  args: string[] | string;
  doc: string;
}

export interface LibraryDefinition {
  name: string;
  version: string;
  keywords: KeywordDefinition[];
}

export interface Settings {
  includePaths?: string[];
  excludePaths?: string[];
  logLevel?: string;
  libraries?: Array<string | LibraryDefinition>;
}

export enum LogLevel {
  Off,
  Errors,
  Info,
  Debug,
}

const defaultLogLevel = LogLevel.Off;

export class Config {
  public static settings: Settings = {};

  public static setSettings(settings: Settings) {
    Config.settings = settings;
  }

  public static getIncludeExclude() {
    if (!Config.settings) {
      return {
        include: [],
        exclude: [],
      };
    }

    return {
      include: Config.settings.includePaths || [],
      exclude: Config.settings.excludePaths || [],
    };
  }

  public static getLogLevel() {
    if (!Config.settings) {
      return defaultLogLevel;
    }

    switch (Config.settings.logLevel) {
      case "off":
        return LogLevel.Off;
      case "errors":
        return LogLevel.Errors;
      case "info":
        return LogLevel.Info;
      case "debug":
        return LogLevel.Debug;
      default:
        return defaultLogLevel;
    }
  }

  public static getLibraries() {
    if (!Config.settings) {
      return [];
    }

    return Config.settings.libraries || [];
  }
}
