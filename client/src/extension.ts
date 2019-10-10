
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

	let command: [string] = config.get<[string]>("command");
	let confidenceLevel: [number] = config.get<[number]>("confidenceLevel");

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
		initializationOptions: {confidenceLevel: confidenceLevel}
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
