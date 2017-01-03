import { workspace, Disposable, ExtensionContext } from "vscode";
import {
    LanguageClient, LanguageClientOptions,
    SettingMonitor, ServerOptions,
    TransportKind
} from "vscode-languageclient";

import { Config } from "./utils/config";

export default class Intellisense {
    private langClient: LanguageClient;

    constructor(languageClient: LanguageClient) {
        this.langClient = languageClient;

        // const config = Config.includeExclude();
        workspace.findFiles(`**/*.robot`, "").then(files => {
            const filePaths = files.map(file => file.fsPath);

            // Send the array of paths to the language server
            this.langClient.sendRequest({ method: "buildFromFiles" }, {
                files: filePaths
            });

        });
    }
};
