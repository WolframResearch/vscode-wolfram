cd ..

call %RE_NODE_HOME%\npm install -g @vscode/vsce

call %RE_NODE_HOME%\npm install

call %RE_NODE_HOME%\vsce package
