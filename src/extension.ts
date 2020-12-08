
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

let kernel_initialized = false;

export function activate(context: ExtensionContext) {

	const config: WorkspaceConfiguration = workspace.getConfiguration("wolfram", null);

	let command = config.get<string[]>("command", ["`kernel`"])

	if (command[0] == "`kernel`") {

		let kernel = config.get<string>("kernel", "<<Path to WolframKernel>>");

		if (kernel == "<<Path to WolframKernel>>") {
			switch (process.platform) {
				case "aix": case "freebsd": case "linux": case "openbsd": case "sunos":
					kernel = "/usr/local/Wolfram/Mathematica/12.1/Executables/WolframKernel";
					break;
				case "darwin":
					kernel = "/Applications/Mathematica.app/Contents/MacOS/WolframKernel";
					break;
				case "win32":
					kernel = "C:\\Program Files\\Wolfram Research\\Mathematica\\12.1\\WolframKernel.exe";
					break;
			}
		}

		command[0] = kernel
	}

	let base = basename(command[0]);

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

	client.onReady().then(() => {
		kernel_initialized = true
	  });

	
	setTimeout(kernel_initialization_check_function, 10000, command);

	client.start();
}

function kernel_initialization_check_function(command: [string]) {
	if (kernel_initialized) {
		return
	}

	// kill kernel, is possible

	let report = window.createOutputChannel("Wolfram Language Error Report");

	report.appendLine("Language Server kernel did not initialize properly after 10 seconds.")
	report.appendLine("")
	report.appendLine("This is the command that was used:")
	report.appendLine(command.toString())
	report.appendLine("")
	report.appendLine("To diagnose the problem, run this in a notebook:")
	report.appendLine("")
	report.appendLine("Needs[\"LSPServer`\"]")
	report.append("LSPServer`RunServerDiagnostic[{")
	//
	// TODO: when replaceAll is available, then use it instead of split().join()
	//
	command.slice(0, -1).forEach( (a) => {
		report.append("\"" + a.split("\"").join("\\\"") + "\"")
		report.append(", ")
	})
	report.append("\"" + command[command.length - 1].split("\"").join("\\\"") + "\"")
	report.append("}]")
	report.appendLine("")
	report.appendLine("")
	report.appendLine("Fix any problems then restart and try again.")

	window.showErrorMessage("Cannot start Wolfram Language server. Check Wolfram Language Error Report output channel for more information.")
}

export function deactivate(): Thenable<void> | undefined {
	if (!client) {
		return undefined;
	}
	return client.stop();
}
