# VSCode-Wolfram

Wolfram Language extension for VSCode


## Setup

VSCode-WolframLanguage depends on the CodeParser, CodeInspector, CodeFormatter, and LSPServer paclets. Make sure that the paclets can be found on your system:
```
Needs["CodeParser`"]
Needs["CodeInspector`"]
Needs["CodeFormatter`"]
Needs["LSPServer`"]
```

[CodeParser on github.com](https://github.com/<<TODO_placeholder_for_actual_link>>)
[CodeInspector on github.com](https://github.com/<<TODO_placeholder_for_actual_link>>)
[CodeFormatter on github.com](https://github.com/<<TODO_placeholder_for_actual_link>>)
[LSPServer on github.com](https://github.com/<<TODO_placeholder_for_actual_link>>)

Install LSPServer and dependencies from the CodeTools paclet server:
```
PacletInstall["CodeParser"]
PacletInstall["CodeInspector"]
PacletInstall["CodeFormatter"]
PacletInstall["LSPServer"]
```

Search the VSCode Marketplace for the extension "WolframLanguage" and install.

### Settings

If you have `Mathematica` installed in the default location on your system, you may not have to change any settings.

If `Mathematica` is not in the default location, then change the location by doing these steps:

Open the Command Palette

Enter the command:
`Preferences: Configure Language Specific Settings...`

Select `Wolfram`

A `settings.json` file is now open.

Add a `wolfram.kernel` setting:

```
{
  ...

  "wolfram.kernel": "/Applications/Mathematica123.app/Contents/MacOS/WolframKernel"
  
  ...
}

```

You may also change the command that is used to start the server:

```
{
  ...

  "wolfram.command": [
      "`kernel`",
      "-noinit",
      "-noprompt",
      "-nopaclet",
      "-noicon",
      "-run",
      "Needs[\"LSPServer`\"];LSPServer`StartServer[]"
  ]

  ...
}
```

Restart VS Code

You should now have syntax highlighting and linting of Wolfram `.m` and `.wl` files working.

Test this by typing this into a new `.m` file and saving it:
```
Which[a, b, a, b]
```

You should see warnings about duplicate clauses.


#### Experimental Settings

You can enable experimental settings. These are not supported.

`implicitTokens` controls the display of implicit tokens such as `Null` after `;` and implicit Times character `×`.

```
{
  ...

  "wolfram.implicitTokens": ["*", ",", ";;", "?"]

  ...
}
```

`semanticTokens` controls semantic highlighting such as `Module` variables.

```
{
  ...

  "wolfram.semanticTokens": true

  ...
}
```
