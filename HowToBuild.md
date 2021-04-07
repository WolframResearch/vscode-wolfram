# Building

VSCode-Wolfram uses a Wolfram Language kernel to build a `.vsix` file.

VSCode-Wolfram uses CMake to generate build scripts.

## One time setup

npm must be installed on your system. Get npm from here:
[Get npm](https://www.npmjs.com/get-npm)

Make sure that you have installed the required tools:
```
npm install -g vsce
```


## Building

Here is an example transcript using the default make generator to build VSCode-Wolfram:

```
cd vscode-wolfram
mkdir build
cd build
cmake ..
cmake --build .
```

The result is a `.vsix` file in the `build` directory.

Specify `MATHEMATICA_INSTALL_DIR` if you have Mathematica installed in a non-default location:

```
cmake -DMATHEMATICA_INSTALL_DIR=/Applications/Mathematica123.app/Contents/ ..
cmake --build .
```

On Windows:

```
cmake -DMATHEMATICA_INSTALL_DIR="C:/Program Files/Wolfram Research/Mathematica/12.3" ..
cmake --build .
```

## Installing

You can install the paclet from CMake:
```
cmake --install .
```
