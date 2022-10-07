
## v1.9.0 - XX Dec, 2022


## v1.8.0 - 10 Oct, 2022

Add `_` to wordSeparators suggestion.

Add links to free Wolfram Engine.


## v1.7.0 - 4 July, 2022

Add light theme

13.1 syntax updates


## v1.6.0 - 12 May, 2022

Update dependencies

Add "Download Wolfram Engine" links to command palette

support new 13.1 syntax `"PackedArray"::["Real64"]`


## v1.5.0 - 7 Mar, 2022

Ensure an empty directory to use as working directory

Properly push subscription from client.start()

Increase timeout to 15 seconds and add timeout_warning_enabled setting

Syntax error for invalid `\|XXXXXX` character syntax

Remove "Open Notebook" from command palette

Rename "Open in Notebook Editor" -> "Open in System Editor"

Various "open" commands are run on different systems, and nothing guarantees opening with the FE

Minimize user confusion by not mentioning "Notebook Editor"

13.0.1 syntax updates

Merge pull request #9 from LumaKernel/patch-1
Add "Wolfram Language" as language alias for Jupyter Notebook VSCode Integration


### Fixes

Fix leftover "Example configuration" from early days

https://github.com/WolframResearch/vscode-wolfram/issues/5

Fix logic for resolving kernel paths

Should try new versions as well as older versions


## v1.4.0 - 25 Oct, 2021

Remove unused WolframLanguageSyntax files


### Fixes

Fix 415574: unrecognized symbol followed by `[` should have scope `variable.function`

Also recognize `f @ x` syntax for function call, but do NOT recognize `a ~f~ b` or `a // f`


## v1.3.3 - 11 Oct, 2021

If a kernel cannot be started, then do not also show the timeout dialog after 10 seconds, that is just extra noise.

`lsp_server_enabled` setting: Allow selectively disabling Wolfram Language LSP


## v1.3.2 - 27 Sep, 2021

### Fixes
- Fixed problem with dialog saying "Language Server kernel did not initialize properly after 10 seconds."

The kernel actually did start correctly, but the timeout for the dialog was not being handled properly.


## v1.3.1 - 22 Sep, 2021

First release from official Wolfram Research GitHub repo

https://github.com/WolframResearch/vscode-wolfram


## 1.3 - 30 Aug, 2021

Rename publisher to WolframResearch

A change in CMake \~3.20 introduced compiler_depend.ts file in the CMakeFiles directory
So exclude compiler_depend.ts files


## 0.15 - 15 Jan, 2020

Add `(\* \*)` as a kind of bracket


## 0.14 - 28 Oct, 2019

Add ConfidenceLevel setting


## 0.12 - 5 Aug, 2019

Unify the various command settings into a single wolfram.command setting
