"use strict";

import { workspace } from "vscode";

const CONFIG_BLOCK_NAME = "rfLanguageServer";

export class Config {
    public static settings = workspace.getConfiguration(CONFIG_BLOCK_NAME);

    public static reloadConfig() {
        Config.settings = workspace.getConfiguration(CONFIG_BLOCK_NAME);
    }

    public static getIncludeExclude() {
        Config.reloadConfig();

        if (!Config.settings) {
            return {
                include: [],
                exclude: []
            };
        }

        return {
            include: Config.settings.get<string[]>("includePaths"),
            exclude: Config.settings.get<string[]>("excludePaths")
        };
    }

    public static getHasPythonKeywords() {
        Config.reloadConfig();

        if (!Config.settings) {
            return false;
        }

        return Config.settings.pythonKeywords === true;
    }
}
