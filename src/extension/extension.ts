/*
 *  vscode-wolfram
 *
 *  Created by IDE support team on 10/01/24.
 *  Copyright (c) 2024 Wolfram Research. All rights reserved.
 *
 */

const open = require('open');
const path = require('path');
const os = require('os');
const fs = require('fs');
const util = require("util");
import { FindKernel } from "./find-kernel";


import * as vscode from 'vscode';
import { WolframNotebookKernel } from './controller';
import { SampleContentSerializer } from './serializer';


import {
	commands,
	window,
	workspace,
	DecorationOptions,
	ExtensionContext,
	Position,
	Range,
	Uri,
	WorkspaceConfiguration
} from 'vscode';

import {
	LanguageClient,
	LanguageClientOptions,
	ServerOptions,
	TransportKind,
	ExecutableOptions
} from 'vscode-languageclient/node';

const NOTEBOOK_TYPE = 'wolfram-notebook';

interface ImplicitTokenI {
	line: number;
	column: number;
	character: string
}

interface ImplicitTokensI {
	uri: string;
	tokens: ImplicitTokenI[]
}

let lspKernel = new FindKernel();

let client: LanguageClient;

let wolframTmpDir: string

let kernel_initialized = false;


let implicitTokensDecorationType = vscode.window.createTextEditorDecorationType({});


  
export function activate(context: vscode.ExtensionContext) {

	    const config: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration("wolfram", null);

		// Setup the menu

		context.subscriptions.push(commands.registerCommand('wolfram.OpenNotebook', (name: Uri) => { if (name) { open(name.fsPath) } }));
		context.subscriptions.push(commands.registerCommand('wolfram.DownloadWolframEngine', onDownloadWolframEngine));

		context.subscriptions.push(
			vscode.commands.registerCommand(
				"wolfram.openConfigurations",
				async () => {
					await vscode.commands.executeCommand(
						"workbench.action.openSettings",
						"@ext:WolframResearch.wolfram"
					)
				}
			)
		);



		// Add Terminal

		let terminalKernel = lspKernel.resolveNBKernel();

		if(process.platform === "win32"){
			terminalKernel = terminalKernel.replace("WolframKernel.exe","wolfram.exe")
		};

		context.subscriptions.push(
			commands.registerCommand(
				'createWolframScriptTerminal', () => {
					
						// Reads systemKernel configuration value, and resolve the kernel
						// For defaulkt value, it will resolve to the actual path
						// For any kernel path is given in the configuration, it will be used
						
						const wolframscriptTerminal = window.createTerminal(`WolframKernel`,  terminalKernel);
						wolframscriptTerminal.show()

				}
			)
		);




		// Setup the LSP client

		// let extensionDebug = vscode.window.createOutputChannel("Wolfram extension debug");

		let enabled = config.get<boolean>("lsp.serverEnabled", true);
		let nbKernelenabled = config.get<boolean>("notebook.kernelEnabled", true);

		if (!enabled) {
			return
		}

		

		let lspcommand = config.get<string[]>("advanced.lsp.command", ["lspKernel"]);
		let lspLog = config.get<string>("advanced.lsp.ServerLogDirectory", "Off");

		// Set lspcommand to use standalone LSP app.
		if (lspcommand[0] == "lspKernel") {

			// No log directory is to be used
			if (lspLog == "Off") {

				lspcommand = [
					lspKernel.resolveNBKernel(),
					"-noinit",
					"-noprompt",
					"-nopaclet",
					"-noicon",
					"-nostartuppaclets",
					"-run",
					"Needs[\"LSPServer`\"];LSPServer`StartServer[]"
				];

			}

			// log directory is a folder location, use that as the log folder
			else{

				lspcommand = [
					lspKernel.resolveNBKernel(),
					"-noinit",
					"-noprompt",
					"-nopaclet",
					"-noicon",
					"-nostartuppaclets",
					"-run",
					"Needs[\"LSPServer`\"]; LSPServer`$LogLevel = 1; LSPServer`StartServer[\"" + lspLog + "\"]"
				];


			}

		};


		// extensionDebug.appendLine(lspcommand[0]);
	

		let implicitTokens = config.get<string[]>("lsp.implicitTokens", []);

		let semanticTokens = config.get<boolean>("lsp.semanticTokens", false);

		wolframTmpDir = path.join(os.tmpdir(), "Wolfram")

		//
		// recursive option suppresses any directory-already-exists error
		//
		fs.mkdirSync(wolframTmpDir, { recursive: true })


		let opts: ExecutableOptions = {
			cwd: wolframTmpDir
		};

	
		let serverOptions: ServerOptions = {
			run: {
				transport: TransportKind.stdio,
				command: lspcommand[0],
				args: lspcommand.slice(1),
				options: opts
			},
			debug: {
				transport: TransportKind.stdio,
				command: lspcommand[0],
				args: lspcommand.slice(1),
				options: opts
			}
		};

		let clientOptions: LanguageClientOptions = {
			documentSelector: [{ scheme: 'file', language: 'wolfram' }],
			initializationOptions: {
				implicitTokens: implicitTokens,
				// bracketMatcher: bracketMatcher,
				// debugBracketMatcher: debugBracketMatcher
				semanticTokens: semanticTokens
			}
		};

		
		
		client = new LanguageClient(
			'wolfram',
			'Wolfram-LSP',
			serverOptions,
			clientOptions
		);

		// client.outputChannel.dispose();

		let timeoutWarningEnabled = config.get<boolean>("timeout_warning_enabled", true);

		if (timeoutWarningEnabled) {
			setTimeout(kernel_initialization_check_function, 15000, lspcommand);
		}

		client.start().then(() => {
		
			//
			// client.onStart() is called after initialize response, so it is appropriate to set kernel_initialized here
			//
			kernel_initialized = true;
	
			client.onNotification("textDocument/publishImplicitTokens", (params: ImplicitTokensI) => {
	
				let activeEditor = window.activeTextEditor;
	
				if (!activeEditor) {
					return;
				}
	
				let opts: DecorationOptions[] = [];
	
				params.tokens.forEach( (t) => {
					if (!activeEditor) {
						return;
					}
	
					const opt: DecorationOptions = {
						range: new Range(new Position(t.line - 1, t.column - 1), new Position(t.line - 1, t.column - 1)),
						renderOptions: {
							before: {
								contentText: implicitTokenCharToText(t.character),
								color: 'gray'
							}
						}
					};
	
					opts.push(opt);
				})
				

				activeEditor.setDecorations(implicitTokensDecorationType, opts);
			});
	

		});

		

		let controller = new WolframNotebookKernel();

		if(nbKernelenabled){controller.launchKernel()};


		context.subscriptions.push(
			commands.registerCommand(
				"wolfram.launchKernel", () => {

					if(nbKernelenabled){
						client.outputChannel.appendLine("Launching Wolfram Kernel");
						controller.launchKernel()
					}

				}
			)
		);
		

		context.subscriptions.push(
			vscode.workspace.registerNotebookSerializer(
				NOTEBOOK_TYPE, new SampleContentSerializer()
			),
			controller	
		);

		context.subscriptions.push(vscode.commands.registerCommand('getting-started-sample.runCommand', async () => {
			await new Promise(resolve => setTimeout(resolve, 1000));
			vscode.commands.executeCommand('getting-started-sample.sayHello', vscode.Uri.joinPath(context.extensionUri, 'sample-folder'));
		}));



}




async function lanchKernelInExtension(controller: WolframNotebookKernel) {
	const kernel = await controller.launchKernel();
	console.log(`kernel = ${kernel}`)
};



function kernel_initialization_check_function(command: string[]) {

	
	if (kernel_initialized) {
		return
	}

	let kernel = command[0]

	//
	// User knows that the kernel did not start properly, so do not also display timeout error
    //
	if (!fs.existsSync(kernel)) {
		vscode.window.showErrorMessage("Kernel executable not found: " + kernel)
		return
	}

	// TODO: kill kernel, if possible

	let report = window.createOutputChannel("Wolfram Language Error Report");

	report.appendLine("Language server kernel did not respond after 15 seconds.")
	report.appendLine("")
	report.appendLine("If the language kernel server did eventually start after this warning, then you can disable this warning with the timeout_warning_enabled setting.")
	report.appendLine("")
	report.appendLine("The most likely cause is that required paclets are not installed.")
	report.appendLine("")
	report.appendLine("The language server kernel process is hanging and may need to be killed manually.")
	report.appendLine("")
	report.appendLine("This is the command that was used:")
	report.appendLine(command.toString())
	report.appendLine("")
	report.appendLine("To ensure that required paclets are installed and up-to-date, run this in a notebook:")
	report.appendLine("")
	report.appendLine("PacletInstall[\"CodeParser\"]")
	report.appendLine("PacletInstall[\"CodeInspector\"]")
	report.appendLine("PacletInstall[\"CodeFormatter\"]")
	report.appendLine("PacletInstall[\"LSPServer\"]")
	report.appendLine("")
	report.appendLine("To help diagnose the problem, run this in a notebook:")
	report.appendLine("")
	report.appendLine("Needs[\"LSPServer`\"]")
	report.append("LSPServer`RunServerDiagnostic[{")
	command.slice(0, -1).forEach( (a) => {
		//
		// important to replace \ -> \\ before replacing " -> \"
		//
		report.append("\"" + a.replace(/\\/g, "\\\\").replace(/"/g, "\\\"") + "\"")
		report.append(", ")
	})
	report.append("\"" + command[command.length - 1].replace(/\\/g, "\\\\").replace(/"/g, "\\\"") + "\"")
	report.append("}, ProcessDirectory -> \"")
	report.append(wolframTmpDir.replace(/\\/g, "\\\\"))
	report.append("\"]")
	report.appendLine("")
	report.appendLine("")
	report.appendLine("Fix any problems then restart and try again.")

	//
	// FIXME: it would be great to just include the above text in the error message.
	// But VSCode does not currently allow newlines in error messages
	//
	// Related issues: https://github.com/microsoft/vscode/issues/5454
	//
	window.showErrorMessage("Cannot start Wolfram language server. Check Output view and open the Wolfram Language Error Report output channel for more information. ")
}


function implicitTokenCharToText(c: string) {
	switch (c) {
		case "x": return "\xd7";
		case "z": return " \xd7";
		// add a space before Null because it looks nicer
		case "N": return " Null";
		case "1": return "1";
		case "A": return "All";
		// add spaces before and after \u25a1 because it looks nicer
		case "e": return " \u25a1 ";
		case "f": return "\u25a1\xd7";
		case "y": return "\xd71";
		case "B": return "All\xd7";
		case "C": return "All\xd71";
		case "D": return "All1";
		default: return " ";
	}
}

function onDownloadWolframEngine(): void {
    const uri: Uri = Uri.parse(`https://www.wolfram.com/engine/`);
    commands.executeCommand('vscode.open', uri);
}
