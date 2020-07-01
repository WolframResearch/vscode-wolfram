"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const vscode_1 = require("vscode");
const vscode_2 = require("vscode");
const vscode_languageclient_1 = require("vscode-languageclient");
let client;
function activate(context) {
    const config = vscode_1.workspace.getConfiguration("[wolfram]", null);
    let command = config.get("command");
    let confidenceLevel = config.get("confidenceLevel");
    let base = path.basename(command[0]);
    if (!base.toLowerCase().startsWith("wolframkernel")) {
        vscode_2.window.showErrorMessage("Command for Wolfram Language Server does not start with 'WolframKernel': " + command[0]);
    }
    let serverOptions = {
        run: {
            transport: vscode_languageclient_1.TransportKind.stdio,
            command: command[0],
            args: command.slice(1)
        },
        debug: {
            transport: vscode_languageclient_1.TransportKind.stdio,
            command: command[0],
            args: command.slice(1)
        }
    };
    let clientOptions = {
        documentSelector: [{ scheme: 'file', language: 'wolfram' }],
        initializationOptions: { confidenceLevel: confidenceLevel }
    };
    client = new vscode_languageclient_1.LanguageClient('wolfram', 'Wolfram Language', serverOptions, clientOptions);
    client.start();
}
exports.activate = activate;
function deactivate() {
    if (!client) {
        return undefined;
    }
    return client.stop();
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map