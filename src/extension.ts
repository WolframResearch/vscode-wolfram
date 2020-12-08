
import { basename } from 'path';
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
	TransportKind
} from 'vscode-languageclient';


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

let kernel_initialized = false;

let implicitTokensDecorationType = window.createTextEditorDecorationType({});


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

	let implicitTokens = config.get<boolean>("implicitTokens", false);
	// let bracketMatcher = config.get<boolean>("bracketMatcher", false);
	// let debugBracketMatcher = config.get<boolean>("debugBracketMatcher", false);

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
		initializationOptions: {
			implicitTokens: implicitTokens,
			// bracketMatcher: bracketMatcher,
			// debugBracketMatcher: debugBracketMatcher
		}
	};
	
	client = new LanguageClient(
		'wolfram',
		'Wolfram Language',
		serverOptions,
		clientOptions
	);

	client.onReady().then(() => {

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
		case "N": return "Null";
		case "1": return "1";
		case "A": return "All";
		case "e": return "\u25a1";
		case "f": return "\u25a1\xd7";
		case "y": return "\xd71";
		case "B": return "All\xd7";
		case "C": return "All\xd71";
		default: return " ";
	}
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
