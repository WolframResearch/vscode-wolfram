# Visual Studio Code extension for Wolfram Language

Wolfram Language extension for VSCode

## Installing

There is a VSCode extension to install and 3 Wolfram paclets to install.

### VSCode extension

Download the VSIX file from:
`http://temp-store.wolfram.com/temp-store/brenton/CodeTools-XX/`

where `XX` is the latest release.

Open VS Code

Open the Command Palette (⇧⌘P)

Enter the command:
`Extensions: Install from VSIX`

Install the VSIX file that you downloaded.

### Wolfram paclets

Install `LSPServer` and dependencies from the public paclet server:
```
In[1]:= PacletUpdate["AST", "Site" -> "http://pacletserver.wolfram.com", "UpdateSites" -> True]
            PacletUpdate["Lint", "Site" -> "http://pacletserver.wolfram.com", "UpdateSites" -> True]
            PacletUpdate["LSPServer", "Site" -> "http://pacletserver.wolfram.com", "UpdateSites" -> True]

Out[1]= Paclet[AST,0.2,<>]
Out[2]= Paclet[Lint,0.2,<>]
Out[3]= Paclet[LSPServer,0.2,<>]
```


## Setup

Make sure `python` is on your path.

Either Python 2 or Python 3 may be used.

The extension depends on the `AST` paclet, `Lint` paclet, and the `LSPServer` paclet. Make sure that the paclets can be found on your system: 
```
In[1]:= Needs["AST`"]
			Needs["Lint`"]
			Needs["LSPServer`"]
```

[AST on stash.wolfram.com](https://stash.wolfram.com/projects/COD/repos/ast/browse)

[Lint on stash.wolfram.com](https://stash.wolfram.com/projects/COD/repos/lint/browse)

[LSPServer on stash.wolfram.com](https://stash.wolfram.com/projects/COD/repos/lspserver/browse)


## Settings

Open the Command Palette

Enter the command:
`Preferences: Configure Language Specific Settings...`

Select `Wolfram`

A `settings.json` file is now open.

In `settings.json` put:

```
{
    "[wolfram]": {
        "command": [
        		"python",
        		"/path/to/my/wolfram_lsp_proxy.py",
        		"--logDir", "/path/to/my/logDir/",
        		"--extra=-noinit",
        		"/path/to/my/WolframKernel"
        	]
    }
}
```

Restart VS Code

You should now have syntax highlighting and linting of Wolfram `.m` and `.wl` files working.

Test this by typing this into a new `.m` file and saving it:
```
Which[a, b, a, b]
```

You should see warnings about duplicate clauses.


### Command arguments:

`/path/to/my/wolfram_lsp_proxy.py`

This is the Python script that will be called by Sublime.

If you installed the `LSPServer` paclet, then this is something like:
```
/Users/brenton/Library/Mathematica/Paclets/Repository/LSPServer-0.12/Python/wolfram_lsp_proxy.py
```


`/path/to/my/logDir/`

This is the directory where log files will be written to. This can be any directory. A typical value is something like:
```
/Users/brenton/development/logs/
```


`--extra`

extra arguments for `WolframKernel`

multiple `--extra` may be given

NOTE: `=` must be used to prevent Python from interpreting `-noinit` as an argument


`/path/to/my/WolframKernel`

This is the path to your `WolframKernel` executable.

If you installed Mathematica in a default location, then this is something like:
```
/Applications/Mathematica.app/Contents/MacOS/WolframKernel
```

On Windows, it is recommended to specify `wolfram.exe` instead of `WolframKernel.exe`.

`WolframKernel.exe` opens a new window while it is running. But `wolfram.exe` runs inside the window that started it.


# Building

You may want to manually build the VSIX file.

Taken from:
https://code.visualstudio.com/api/working-with-extensions/publishing-extension

```
cd vscode-wolfram

vsce package -o build/wolfram-0.11.0.vsix

```


# Troubleshooting

## I see "Unknown Identifier. Use language identifiers" while editing settings.json

This is an open issue:
https://github.com/microsoft/vscode/issues/26707
