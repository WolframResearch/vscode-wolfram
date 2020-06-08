# Building

You may want to manually build the VSIX file.

Taken from:
https://code.visualstudio.com/api/working-with-extensions/publishing-extension

## Setup

Make sure that you have installed the required modules and tools.

```
cd vscode-wolfram

npm install

npm install -g vsce

npm install -g tsc
```

## Building the extension

Now build the extension.

```
cd vscode-wolfram

vsce package
```
