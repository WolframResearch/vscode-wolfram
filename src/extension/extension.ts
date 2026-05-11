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
import { exec } from 'child_process';
import { FindKernel, getUserBaseDirectoryPath } from "./find-kernel";


import * as vscode from 'vscode';
import { WolframNotebookKernel } from './controller';
import { VSNBContentSerializer } from './serializer';


import {
	commands,
	window,
	DecorationOptions,
	Position,
	Range,
	Uri,
	ViewColumn,
	WebviewPanel
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

let extensionKernel = new FindKernel();

let client: LanguageClient;

let wolframTmpDir: string

let kernel_initialized = false;


let implicitTokensDecorationType = vscode.window.createTextEditorDecorationType({});



// Create output channel for Wolfram extension logging
// let wolframOutputChannel: vscode.OutputChannel;


  
export function activate(context: vscode.ExtensionContext) {

		// Create output channel for debugging
		// wolframOutputChannel = vscode.window.createOutputChannel("Wolfram Extension");
		// context.subscriptions.push(wolframOutputChannel);

	    const config: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration("wolfram", null);

		// Setup the menu

		context.subscriptions.push(commands.registerCommand('wolfram.OpenNotebook', (name: Uri) => { if (name) { open(name.fsPath) } }));
		context.subscriptions.push(commands.registerCommand('wolfram.DownloadWolframEngine', onDownloadWolframEngine));


		// MCP server change emitters - fired when config changes so VS Code re-queries providers
		const mcpSearchEmitter = new vscode.EventEmitter<void>();
		const mcpWolframAIEmitter = new vscode.EventEmitter<void>();

		// Listen for config changes to refresh MCP providers dynamically
		context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(e => {
			if (e.affectsConfiguration("wolfram.mcp.serverEnabled")) {
				mcpSearchEmitter.fire();
				mcpWolframAIEmitter.fire();
			}
		}));


		

		// Register Native Wolfram MCP Server
		context.subscriptions.push(vscode.lm.registerMcpServerDefinitionProvider('wolframAI', {
			onDidChangeMcpServerDefinitions: mcpWolframAIEmitter.event,
			provideMcpServerDefinitions(): vscode.McpServerDefinition[] {
				const cfg = vscode.workspace.getConfiguration("wolfram", null);
				if (!cfg.get<boolean>("mcp.serverEnabled", true)) {
					return [];
				}
				const mcpKernelPath = extensionKernel.resolveMCPWolframExecutable();
				
				return [
					new vscode.McpStdioServerDefinition(
						'WolframAI',
						mcpKernelPath,
						[
							"-run",
							"Needs[\"Wolfram\`AgentTools\`\"] ;PacletSymbol[\"Wolfram/AgentTools\",\"Wolfram`AgentTools`StartMCPServer\"][\"WolframLanguage\"]",
							"-noinit",
							"-noprompt",
						]
					)
				];
			}
		}));




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


		let mainKernel = extensionKernel.resolveKernel();

		const download_WEngine_MDString = new vscode.MarkdownString(`[Download Wolfram Engine for kernel support.](https://www.wolfram.com/engine/)`);

		download_WEngine_MDString.supportHtml = true;
		download_WEngine_MDString.isTrusted = true;

		/* 
			kernel setting is Automatic and kernel could not be found. As LSP and Notebook kernels  
			are same as mainKernel, these kernels will also be missing. So no point of going further. 
			Show error message here.
		*/

		if(mainKernel === "kernel-not-found"){
			vscode.window.showErrorMessage("Kernel is not found in the default location. Either change \"System Kernel\" in the configuration or " + download_WEngine_MDString.value)
			return
		};

		if (!fs.existsSync(mainKernel)) {
			vscode.window.showErrorMessage("Kernel executable path does not exist: " + mainKernel + ". Either change \"System Kernel\" in the configuration or "  + download_WEngine_MDString.value)
			return
		}

		// Log wolframscript path information
		let envPath = terminalFromEnvPath();
		
		const actualPath = envPath;

		// Add Terminal

		let terminalKernel = resolveTerminalKernel(mainKernel);



		if(process.platform === "win32"){
			terminalKernel = terminalKernel.replace("WolframKernel.exe", "wolfram.exe")
		};

		// wolframOutputChannel.appendLine(`=== Wolfram Extension Activated ===`);
		// wolframOutputChannel.appendLine(`Environment WOLFRAM_SCRIPT_PATH: ${envPath || 'Not set'}`);
		// wolframOutputChannel.appendLine(`mainKernel: ${mainKernel}`);
		// wolframOutputChannel.appendLine(`Using path: ${terminalKernel}`);
		// wolframOutputChannel.appendLine(`Path exists: ${fs.existsSync(terminalKernel)}`);
		// wolframOutputChannel.appendLine(`================================`);

		context.subscriptions.push(
			commands.registerCommand(
				'createWolframTerminal', () => {
					
						// Reads systemKernel configuration value, and resolve the kernel
						// For defaulkt value, it will resolve to the actual path
						// For any kernel path is given in the configuration, it will be used
						
						const wolframscriptTerminal = window.createTerminal(`WolframKernel`,  terminalKernel);
						wolframscriptTerminal.show()

				}
			)
		);




		// Setup Notebook client

		let nbKernelenabled = config.get<boolean>("notebook.kernelEnabled", true);


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
			commands.registerCommand(
				"wolfram.kernelMenu", async () => {
					const isConnected = controller.isKernelConnected();

					interface KernelMenuItem extends vscode.QuickPickItem {
						action: string;
					}

					const items: KernelMenuItem[] = isConnected
						? [
							{ label: "$(debug-restart) Restart Kernel", description: "Disconnect and reconnect the kernel", action: "restart" },
							{ label: "$(debug-disconnect) Disconnect Kernel", description: "Stop the running kernel", action: "disconnect" },
							{ label: "$(gear) Open Kernel Settings", description: "Configure kernel options", action: "settings" }
						]
						: [
							{ label: "$(plug) Connect Kernel", description: "Start the Wolfram kernel", action: "connect" },
							{ label: "$(gear) Open Kernel Settings", description: "Configure kernel options", action: "settings" }
						];

					const selected = await vscode.window.showQuickPick(items, {
						placeHolder: isConnected ? "Wolfram Kernel is connected" : "Wolfram Kernel is disconnected"
					});

					if (!selected) { return; }

					switch (selected.action) {
						case "connect":
							if (nbKernelenabled) { controller.launchKernel(); }
							break;
						case "disconnect":
							controller.quitKernel();
							break;
						case "restart":
							controller.quitKernel();
							if (nbKernelenabled) { controller.launchKernel(); }
							break;
						case "settings":
							vscode.commands.executeCommand("workbench.action.openSettings", "@ext:WolframResearch.wolfram kernel");
							break;
					}
				}
			)
		);

		context.subscriptions.push(
			commands.registerCommand(
				"wolfram.abortKernel", () => {
					controller.quitKernel();
				}
			)
		);
		

		context.subscriptions.push(
			vscode.workspace.registerNotebookSerializer(
				NOTEBOOK_TYPE, new VSNBContentSerializer()
			),
			controller	
		);

		// Register a command to run selected text in a dedicated Wolfram terminal
		context.subscriptions.push(
			vscode.commands.registerCommand(
				"wolfram.runSelectedInWolframTerminal",
				async () => {
					// Get the active text editor
					const editor = vscode.window.activeTextEditor;
					if (!editor) {
						return;
					}
					// Get the selected text, or the current line if no selection
					const selection = editor.selection;
					const text = editor.document.getText(
						selection.isEmpty
							? editor.document.lineAt(selection.active.line).range
							: selection
					);

					// Find an existing Wolfram terminal by name
					let terminal = vscode.window.terminals.find(
						(t) => t.name === "WolframKernel"
					);
					if (!terminal) {
						// If not found, create a new Wolfram terminal using the resolved terminal path
						terminal = vscode.window.createTerminal(
							"WolframKernel",
							terminalKernel
						);
						// Wait briefly to ensure the terminal is ready
						await new Promise((res) => setTimeout(res, 300));
					}
					// Show the terminal and send the selected text for execution
					terminal.show();
					terminal.sendText(text, true);
				}
			)
		);




		// Setup LSP client



		let enabled = config.get<boolean>("lsp.serverEnabled", true);

		if (!enabled) {
			return
		}

		

		let lspcommand = config.get<string[]>("advanced.lsp.command", ["lspKernel"]);
		let lspLogEnabled = config.get<boolean>("advanced.lsp.ServerLogEnabled", false);
		let lspLogLoc = path.join(getUserBaseDirectoryPath(), "LSPServer", "Log");

		// Set lspcommand to use standalone LSP app.






		// Use the default option to launch LSPServer
		if (lspcommand[0] == "lspKernel") {

			// Logging disabled: start LSP server without log directory
			if (!lspLogEnabled){

				lspcommand = [
					mainKernel,
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
					mainKernel,
					"-noinit",
					"-noprompt",
					"-nopaclet",
					"-noicon",
					"-nostartuppaclets",
					"-run",
					"Needs[\"LSPServer`\"]; LSPServer`$LogLevel = 1; LSPServer`StartServer[\"" + lspLogLoc + "\"]"
				];


			}

		};
	

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
			// documentSelector: [{ scheme: 'file', language: 'wolfram' }],
			documentSelector: [{ language: 'wolfram' }],
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

		let timeoutWarningEnabled = config.get<boolean>("timeoutWarningEnabled", true);

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

		

}



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


function terminalFromEnvPath(): string | undefined {
	let envPath = process.env.WOLFRAMSCRIPT_KERNELPATH;

	// If environment variable not set, try to read from shell config files
	if (!envPath) {
		const homeDir = os.homedir();
		const shellConfigs = [
			path.join(homeDir, '.zshrc'),
			path.join(homeDir, '.bashrc'),
			path.join(homeDir, '.bash_profile'),
			path.join(homeDir, '.profile')
		];

		for (const configFile of shellConfigs) {
			if (fs.existsSync(configFile)) {
				try {
					const content = fs.readFileSync(configFile, 'utf8');
					const match = content.match(/export\s+WOLFRAMSCRIPT_KERNELPATH\s*=\s*["']?([^"'\s]+)["']?/);
					if (match && match[1]) {
						envPath = match[1];
						break;
					}
				} catch (error) {
					// Ignore file read errors
				}
			}
		}
	}

	return envPath;
}

function resolveTerminalKernel(kernel: string): string {
	return terminalFromEnvPath() || kernel;
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



export function deactivate() {
	// Clean up resources when extension is deactivated
	if (client) {
		return client.stop();
	}
}
