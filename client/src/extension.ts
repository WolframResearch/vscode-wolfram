
import * as path from 'path';
import { workspace, ExtensionContext, WorkspaceConfiguration } from 'vscode';

import {
	LanguageClient,
	LanguageClientOptions,
	ServerOptions,
	TransportKind
} from 'vscode-languageclient';

let client: LanguageClient;

export function activate(context: ExtensionContext) {

	const config: WorkspaceConfiguration = workspace.getConfiguration("[wolfram]", null);

	let proxy: string = config.get<string>("proxy");
	let wolframkernel: string = config.get<string>("wolframkernel");
	let logDir: string = config.get<string>("logDir");

	let args;
	if (logDir) {
		args = [proxy, wolframkernel, "--logDir", logDir]
	} else {
		args = [proxy, wolframkernel]
	}

	let serverOptions: ServerOptions = {
		run: {
			transport: TransportKind.stdio,
			command: "python",
			args: args
		},
		debug: {
			transport: TransportKind.stdio,
			command: "python",
			args: args
		}
	};

	let clientOptions: LanguageClientOptions = {
		documentSelector: [{ scheme: 'file', language: 'wolfram' }],
	};

	client = new LanguageClient(
		'wolfram',
		'Wolfram Language',
		serverOptions,
		clientOptions
	);

	client.start();
}

export function deactivate(): Thenable<void> | undefined {
	if (!client) {
		return undefined;
	}
	return client.stop();
}
