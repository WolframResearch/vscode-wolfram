# VSCode-Wolfram

Wolfram Language extension for VSCode


## Setup

VSCode-WolframLanguage depends on the CodeParser, CodeInspector, CodeFormatter, and LSPServer paclets. Make sure that the paclets can be found on your system:
```
In[1]:= Needs["CodeParser`"]
      Needs["CodeInspector`"]
      Needs["CodeFormatter`"]
      Needs["LSPServer`"]
```

[CodeParser on github.com](https://github.com/<<TODO_placeholder_for_actual_link>>)
[CodeInspector on github.com](https://github.com/<<TODO_placeholder_for_actual_link>>)
[CodeFormatter on github.com](https://github.com/<<TODO_placeholder_for_actual_link>>)
[CodeParser on github.com](https://github.com/<<TODO_placeholder_for_actual_link>>)

Install LSPServer and dependencies from the CodeTools paclet server:
```
In[1]:= PacletUpdate["CodeParser", "Site" -> "<<TODO_placeholder_for_actual_link>>", "UpdateSites" -> True]
      PacletUpdate["CodeInspector", "Site" -> "<<TODO_placeholder_for_actual_link>>", "UpdateSites" -> True]
      PacletUpdate["CodeFormatter", "Site" -> "<<TODO_placeholder_for_actual_link>>", "UpdateSites" -> True]
      PacletUpdate["LSPServer", "Site" -> "<<TODO_placeholder_for_actual_link>>", "UpdateSites" -> True]

Out[1]= PacletObject[CodeParser, 1.0, <>]
Out[2]= PacletObject[CodeInspector, 1.0, <>]
Out[3]= PacletObject[CodeFormatter, 1.0, <>]
Out[4]= PacletObject[LSPServer, 1.0, <>]
```

Search the VSCode Marketplace for the extension "WolframLanguage" and install.

### Settings

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
            "<<Path to WolframKernel (or wolfram.exe on Windows)>>",
            "-noinit",
            "-noprompt",
            "-nopaclet",
            "-run",
            "Needs[\"LSPServer`\"];LSPServer`StartServer[]"
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


#### Command arguments:

`<<Path to WolframKernel>>`

This is the path to your `WolframKernel` executable.

If you installed Mathematica in a default location, then this is something like:
```
/Applications/Mathematica.app/Contents/MacOS/WolframKernel
```

``"Needs[\"LSPServer`\"];LSPServer`StartServer[]"``

This is the command that the kernel runs to start the server.


## Building

You may want to manually build the VSIX file.

Taken from:
https://code.visualstudio.com/api/working-with-extensions/publishing-extension

```
cd vscode-wolfram

vsce package -o build/wolfram-1.0.vsix

```


## Troubleshooting

## Windows

On Windows, it is recommended to specify `wolfram.exe` instead of `WolframKernel.exe`.

`WolframKernel.exe` opens a new window while it is running. But `wolfram.exe` runs inside the window that started it.

You may need to double-up quotation marks in the command:

``"Needs[\"\"LSPServer`\"\"];LSPServer`StartServer[]"``

## I see "Unknown Identifier. Use language identifiers" while editing settings.json

This is an open issue:
https://github.com/microsoft/vscode/issues/26707
