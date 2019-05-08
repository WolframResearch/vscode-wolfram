"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const vscode_languageclient_1 = require("vscode-languageclient");
let client;
function activate(context) {
    const config = vscode_1.workspace.getConfiguration("[wolfram]", null);
    let proxy = config.get("proxy");
    let wolframkernel = config.get("wolframkernel");
    let logDir = config.get("logDir");
    let args;
    if (logDir) {
        args = [proxy, wolframkernel, "--logDir", logDir];
    }
    else {
        args = [proxy, wolframkernel];
    }
    let serverOptions = {
        run: {
            transport: vscode_languageclient_1.TransportKind.stdio,
            command: "python",
            args: args
        },
        debug: {
            transport: vscode_languageclient_1.TransportKind.stdio,
            command: "python",
            args: args
        }
    };
    let clientOptions = {
        documentSelector: [{ scheme: 'file', language: 'wolfram' }],
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