# Building

VSCode-Wolfram uses a Wolfram Language kernel to build a `.vsix` file.

VSCode-Wolfram uses CMake to generate build scripts.

## One time setup

Make sure that you have installed the required modules and tools.

```
cd vscode-wolfram
npm install
npm install -g vsce
npm install -g tsc
```


## Building

Here is an example transcript using the default make generator to build VSCode-Wolfram:

```
cd vscode-wolfram
mkdir build
cd build
cmake ..
cmake --build . --target package
```

The result is a `.vsix` file in the `build` directory.

Specify `MATHEMATICA_INSTALL_DIR` if you have Mathematica installed in a non-default location:

```
cmake -DMATHEMATICA_INSTALL_DIR=/Applications/Mathematica121.app/Contents/ ..
cmake --build . --target package
```

On Windows:

```
cmake -DMATHEMATICA_INSTALL_DIR="C:/Program Files/Wolfram Research/Mathematica/12.1" ..
cmake --build . --target package
```
