# Building

npm must be installed on your system. Get npm from here:
[Get npm](https://www.npmjs.com/get-npm)

Make sure that you have installed the required tools:
```
npm install -g vsce
```


## Building

Here is an example transcript using the default npm and vsce to build VSCode-Wolfram:

```
npm install
vace package
```

The result is a `.vsix` file in the project directory.

## Installing

You can install the built extension from command-line terminal in VsCode:
```
code --install-extension vsixFilePath
```
