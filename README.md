# Wolfram System Integration with Visual Studio Code

Official Visual Studio Code extension for Wolfram Language


## Features

* Syntax Highlighting
* Diagnostics and suggestions for fixes
* Formatting files and selections
* Semantic highlighting
* Expand and shrink selection
* Outline
* Color swatches
* Symbol references
* Documentation on hover

### Syntax Highlighting

Support for the entire Wolfram Language syntax and all built-in functions.

![highlighting](docs/highlighting.png)


## Setup

<!--  filter me START -->
Install the Wolfram Language extension from the [Visual Studio Code Marketplace](https://marketplace.visualstudio.com/items?itemName=WolframResearch.wolfram).

The extension must be installed from Wolfram Research.
<!--  filter me END -->

LSP functionality uses a Wolfram kernel to run as a language server.

This requires Wolfram System 12.1 or higher.

The Wolfram Language extension depends on [LSPServer paclet](https://github.com/WolframResearch/lspserver) to provide LSP functionality.

Install LSPServer paclet and its dependencies by running this Wolfram Language code:
```
PacletInstall["CodeParser"]
PacletInstall["CodeInspector"]
PacletInstall["CodeFormatter"]
PacletInstall["LSPServer"]
```

If properly setup, you should have syntax highlighting and linting of Wolfram Language `.wl` files.

Test this by typing this into a new `.wl` file and saving it:
```
Which[a, b, a, b]
```

You should see warnings about duplicate clauses.


### Settings

If you have Wolfram System installed in the default location on your system, you may not have to change any settings.

If Wolfram System is not in the default location, then specify the actual location:

Open the Command Palette

Enter the command:
`Preferences: Configure Language Specific Settings...`

Select `Wolfram`

A `settings.json` file is now open.

Add a `wolfram.kernel` setting:
```
{
  …

  "wolfram.kernel": "/Applications/Mathematica123.app/Contents/MacOS/WolframKernel"

  …
}

```

You may also change the command that is used to start the server:
```
{
  …

  "wolfram.command": [
      "`kernel`",
      "-noinit",
      "-noprompt",
      "-nopaclet",
      "-noicon",
      "-nostartuppaclets",
      "-run",
      "Needs[\"LSPServer`\"];LSPServer`StartServer[]"
  ]

  …
}
```

You should now have syntax highlighting and linting of Wolfram `.m` and `.wl` files working.

Test this by typing this into a new `.m` file and saving it:
```
Which[a, b, a, b]
```

You should see warnings about duplicate clauses.

#### Other Settings

It is convenient to specify word separators that do not have the `$` character, which is a letterlike character in WL.

```
"editor.wordSeparators": "`~!@#%^&*()-=+[{]}\\|;:'\",.<>/?",
```


#### Experimental Settings

You can enable experimental settings. These are not supported.

`implicitTokens` controls the display of implicit tokens such as `Null` after `;` and implicit Times character `×`.

```
{
  …

  "wolfram.implicitTokens": ["*", ",", ";;", "?"]

  …
}
```

`semanticTokens` controls semantic highlighting such as `Module` variables.

```
{
  …

  "wolfram.semanticTokens": true

  …
}
```


## Troubleshooting

Make sure that the paclets can be found on your system:
```
Needs["LSPServer`"]
```
