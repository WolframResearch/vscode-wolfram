

## 0.12 - 5 Aug, 2019

Unify the various command settings into a single wolfram.command setting


## 0.14 - 28 Oct, 2019

Add ConfidenceLevel setting


## 0.15 - 15 Jan, 2020

Add (\* \*) as a kind of bracket


## 1.3 - 30 Aug, 2021

Rename publisher to WolframResearch

A change in CMake \~3.20 introduced compiler_depend.ts file in the CMakeFiles directory
So exclude compiler_depend.ts files


## v1.3.1 - 22 Sep, 2021

First release from official Wolfram Research GitHub repo

https://github.com/WolframResearch/vscode-wolfram


## v1.3.2 - 27 Sep, 2021

### Fixes
- Fixed problem with dialog saying "Language Server kernel did not initialize properly after 10 seconds."

The kernel actually did start correctly, but the timeout for the dialog was not being handled properly.


## v1.3.3 - 11 Oct, 2021

If a kernel cannot be started, then do not also show the timeout dialog after 10 seconds, that is just extra noise.

lsp_server_enabled setting: Allow selectively disabling Wolfram Language LSP


## v1.4.0 - 25 Oct, 2021

Remove unused WolframLanguageSyntax files


### Fixes

Fix 415574: unrecognized symbol followed by [ should have scope variable.function

Also recognized f @ x syntax for function call, but do NOT recognize a ~f~ b or a // f


