"use strict";

import { workspace } from "vscode";

const CONFIG_BLOCK_NAME = "rfLanguageServer";

export class Config {
    public static settings = workspace.getConfiguration(CONFIG_BLOCK_NAME);

    public static reloadConfig() {
        Config.settings = workspace.getConfiguration("crane");
    }

    public static get includeExclude() {
        Config.reloadConfig();

        if (!Config.settings) {
            return {
                include: [],
                exclude: []
            };
        }

        return {
            include: Config.settings.get<string[]>("include"),
            exclude: Config.settings.get<string[]>("exclude")
        };
    }
}
