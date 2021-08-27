# Wolfram Integration with Visual Studio Code

A Visual Studio Code extension for Wolfram Language.

* Syntax highlighting
* [LSP](https://microsoft.github.io/language-server-protocol/) support

![highlighting](docs/highlighting.png)


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
