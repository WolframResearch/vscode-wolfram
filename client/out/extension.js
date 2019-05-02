"use strict";
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const vscode_languageclient_1 = require("vscode-languageclient");
let client;
function activate(context) {
    // The server is implemented in node
    //let serverModule = context.asAbsolutePath(
    //	path.join('server', 'out', 'server.js')
    //);
    // The debug options for the server
    // --inspect=6009: runs the server in Node's Inspector mode so VS Code can attach to the server for debugging
    //let debugOptions = { execArgv: ['--nolazy', '--inspect=6009'] };
    const config = vscode_1.workspace.getConfiguration("[wolfram]", null);
    let proxy = config.get("proxy");
    let wolframkernel = config.get("wolframkernel");
    let logDir = config.get("logDir");
    // If the extension is launched in debug mode then the debug server options are used
    // Otherwise the run options are used
    let serverOptions = {
        run: {
            transport: vscode_languageclient_1.TransportKind.stdio,
            command: "python3", args: [proxy, wolframkernel, "--debug", "--logDir", logDir]
        },
        debug: {
            transport: vscode_languageclient_1.TransportKind.stdio,
            command: "python3", args: [proxy, wolframkernel, "--debug", "--logDir", logDir]
        }
    };
    // Options to control the language client
    let clientOptions = {
        // Register the server for plain text documents
        documentSelector: [{ scheme: 'file', language: 'wolfram' }],
        synchronize: {
            // Notify the server about file changes to '.clientrc files contained in the workspace
            fileEvents: vscode_1.workspace.createFileSystemWatcher('**/.clientrc')
        }
    };
    // Create the language client and start the client.
    client = new vscode_languageclient_1.LanguageClient('wolfram', 'Wolfram Language', serverOptions, clientOptions);
    // Start the client. This will also launch the server
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