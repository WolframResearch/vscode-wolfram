import * as vscode from 'vscode';
import * as open from 'open';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

import {
	workspace,
	window,
	DecorationOptions,
	ExtensionContext,
	Range,
	TextEditorDecorationType,
	WorkspaceConfiguration,
	Position
} from 'vscode';

import {
	LanguageClient,
	LanguageClientOptions,
	ServerOptions,
	TransportKind,
	ExecutableOptions
} from 'vscode-languageclient/node';


interface ImplicitTokenI {
	line: number;
	column: number;
	character: string
}

interface ImplicitTokensI {
	uri: string;
	tokens: ImplicitTokenI[]
}


// interface HTMLSnippetLineI {
// 	line: number;
// 	content: string;
// 	characterCount: number
// }

// interface HTMLSnippetActionI {
// 	command: number;
// 	insertionText: string;
// 	deletionText: string;
// 	line: number;
// 	column: number;
// 	href: string
// }

// interface HTMLSnippetI {
// 	uri: string;
// 	lines: HTMLSnippetLineI[]
// 	actions: HTMLSnippetActionI[]
// }


let client: LanguageClient;

let wolframTmpDir: string

let kernel_initialized = false;

let implicitTokensDecorationType = window.createTextEditorDecorationType({});


export function activate(context: ExtensionContext) {

	// Setup the menu

	context.subscriptions.push(vscode.commands.registerCommand('wolfram.OpenNotebook', (name: vscode.Uri) => {open(name.fsPath)}));

	// Setup the LSP client

	const config: WorkspaceConfiguration = workspace.getConfiguration("wolfram", null);

	let enabled = config.get<boolean>("lsp_server_enabled", true)
	if (!enabled) {
		return
	}

	let command = config.get<string[]>("command", ["`kernel`"])

	if (command[0] == "`kernel`") {

		let kernel = config.get<string>("kernel", "<<Path to WolframKernel>>");

		if (kernel == "<<Path to WolframKernel>>") {
			switch (process.platform) {
				case "aix": case "freebsd": case "linux": case "openbsd": case "sunos":
					kernel = "/usr/local/Wolfram/WolframEngine/13.0/Executables/WolframKernel";
					if (!fs.existsSync(kernel)) {
						kernel = "/usr/local/Wolfram/Mathematica/13.0/Executables/WolframKernel";
					}
					break;
				case "darwin":
					kernel = "/Applications/Wolfram Engine.app/Contents/MacOS/WolframKernel";
					if (!fs.existsSync(kernel)) {
						kernel = "/Applications/Mathematica.app/Contents/MacOS/WolframKernel";
					}
					break;
				case "win32":
					kernel = "C:\\Program Files\\Wolfram Research\\Wolfram Engine\\13.0\\WolframKernel.exe";
					if (!fs.existsSync(kernel)) {
						kernel = "C:\\Program Files\\Wolfram Research\\Mathematica\\13.0\\WolframKernel.exe";
					}
					break;
			}
		}

		command[0] = kernel
	}

	let implicitTokens = config.get<string[]>("implicitTokens", []);
	// let bracketMatcher = config.get<boolean>("bracketMatcher", false);
	// let debugBracketMatcher = config.get<boolean>("debugBracketMatcher", false);
	let semanticTokens = config.get<boolean>("semanticTokens", false);

	let base = path.basename(command[0]);

	if (!base.toLowerCase().startsWith("wolframkernel")) {
		window.showErrorMessage("Command for Wolfram Language Server does not start with 'WolframKernel': " + command[0]);
	}

	//
	// Ensure an empty directory to use as working directory
	//
	wolframTmpDir = path.join(os.tmpdir(), "Wolfram-LSPServer")

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
			command: command[0],
			args: command.slice(1),
			options: opts
		},
		debug: {
			transport: TransportKind.stdio,
			command: command[0],
			args: command.slice(1),
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
		'Wolfram Language',
		serverOptions,
		clientOptions
	);

	client.onReady().then(() => {
		
		//
		// client.onReady() is called after initialize response, so it is appropriate to set kernel_initialized here
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
			
			// activeEditor.setDecorations(implicitTokensTimesDecorationType, implicitTokensTimes);
			// activeEditor.setDecorations(implicitTokensOneDecorationType, implicitTokensOne);
			// activeEditor.setDecorations(implicitTokensAllDecorationType, implicitTokensAll);
			// activeEditor.setDecorations(implicitTokensNullDecorationType, implicitTokensNull);
			activeEditor.setDecorations(implicitTokensDecorationType, opts);
		});

		// client.onNotification("textDocument/publishHTMLSnippet", (params: HTMLSnippetI) => {
			// experimental.appendLine("publishHTMLSnippet: ");
			// experimental.appendLine("uri: " + params.uri);
			// params.actions.forEach( (a) => {
			// 	experimental.appendLine("action: ");
			// 	experimental.appendLine("    " + a.column);
			// 	experimental.appendLine("    " + a.command);
			// 	experimental.appendLine("    " + a.deletionText);
			// 	experimental.appendLine("    " + a.href);
			// 	experimental.appendLine("    " + a.insertionText);
			// 	experimental.appendLine("    " + a.line);
			// })
			// params.lines.forEach( (l) => {
			// 	experimental.appendLine("line: ");
			// 	experimental.append("    " + l.characterCount);
			// 	experimental.append("    " + l.content);
			// 	experimental.append("    " + l.line);
			// })
			// experimental.appendLine("done publishHTMLSnippet");
		// });
	});
	
	setTimeout(kernel_initialization_check_function, 10000, command);

	client.start();
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

function kernel_initialization_check_function(command: string[]) {

	if (kernel_initialized) {
		return
	}

	let kernel = command[0]

	//
	// User knows that the kernel did not start properly, so do not also display timeout error
    //
	if (!fs.existsSync(kernel)) {
		return
	}

	// TODO: kill kernel, if possible

	let report = window.createOutputChannel("Wolfram Language Error Report");

	report.appendLine("Language server kernel did not respond after 10 seconds.")
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

export function deactivate(): Thenable<void> | undefined {
	if (!client) {
		return undefined;
	}
	return client.stop();
}
