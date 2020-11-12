
import * as path from 'path';
import { workspace, ExtensionContext, WorkspaceConfiguration } from 'vscode';
import { window } from 'vscode';

import {
	LanguageClient,
	LanguageClientOptions,
	ServerOptions,
	TransportKind
} from 'vscode-languageclient';

let client: LanguageClient;

export function activate(context: ExtensionContext) {

	const config: WorkspaceConfiguration = workspace.getConfiguration("wolfram", null);

	let command: [string] = config.get<[string]>("command") || [""];

	let base = path.basename(command[0]);

	if (!base.toLowerCase().startsWith("wolframkernel")) {
		window.showErrorMessage("Command for Wolfram Language Server does not start with 'WolframKernel': " + command[0]);
	}

	let serverOptions: ServerOptions = {
		run: {
			transport: TransportKind.stdio,
			command: command[0],
			args: command.slice(1)
		},
		debug: {
			transport: TransportKind.stdio,
			command: command[0],
			args: command.slice(1)
		}
	};

	let clientOptions: LanguageClientOptions = {
		documentSelector: [{ scheme: 'file', language: 'wolfram' }],
		initializationOptions: {}
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
