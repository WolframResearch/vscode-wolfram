
# wolfram-language README


# LSPServer

Follow instructions for LSPServer paclet.






# Building wolfram-XXX.vsix file

Taken from:
https://code.visualstudio.com/api/working-with-extensions/publishing-extension



```
cd vscode-wolfram

vsce package -o build/wolfram-0.11.0.vsix

```







# Setup

Download the VSIX file from:

`http://temp-store.wolfram.com/temp-store/brenton/wolfram-vscode-releases/`


Open VS Code

Open the Command Palette (⇧⌘P)

Enter the command:
Extensions: Install from VSIX

Install the VSIX file that you downloaded.



Open the Command Palette

Enter the command:
Preferences: Configure Language Specific Settings...

Select Wolfram


A settings.json file is now open.

In settings.json put:

```
{
    "[wolfram]": {
        "wolframkernel": "/path/to/my/wolframkernel",
        "proxy": "/path/to/my/wolfram_lsp_proxy.py",
        "logDir": "/path/to/my/log/dir"
    }
}
```

### Windows


It is recommended to specify wolfram.exe instead of WolframKernel.exe.

WolframKernel.exe opens a new window while it is running. But wolfram.exe runs inside the window that started it.






Restart VS Code



You should now have syntax highlighting and linting of Wolfram .m and .wl files working.

Test this by typing this into a .m file and saving it:

```
Which[a, b, a, b]
```

You should see warnings about duplicate clauses.








# Troubleshooting

## I see "Unknown Identifier. Use language identifiers" while editing settings.json

This is an open issue:
https://github.com/microsoft/vscode/issues/26707






