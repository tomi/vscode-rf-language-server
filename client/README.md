# Robot Framework Intellisense

A [Visual Studio Code](https://code.visualstudio.com/) extension that supports Robot Framework development.

## Features

### Syntax highlighting
* Supports `.robot` files

### Goto definition (`F12`)
* For variables
* For user keywords

### List file symbols (`⇧⌘O`, `Ctrl+Shift+O`)
* Shows variables, keywords and test cases

### List workspace symbols (`⌘T`, `Ctrl+T`)
* Shows variables, keywords and test cases

## Configuration

By default all `.robot` files are parsed. This can be configured using parameters. (see `Code` > `Preferences` > `Workspace Settings`).

|param                          | description              |
|----------------------------   |--------------------------|
| `rfLanguageServer.includePaths`     | Array of glob patterns for files to be included`|
| `rfLanguageServer.excludePaths`       | Array of glob patterns for files to be excluded|


## Known issues

Can be found [here](https://github.com/tomi/vscode-rf-language-server/blob/master/client/KNOWNISSUES.md)

## Changelog

Can be found [here](https://github.com/tomi/vscode-rf-language-server/blob/master/client/CHANGELOG.md).

## Bugs

Report them [here](https://github.com/tomi/vscode-rf-language-server/issues).


## License

[MIT](https://github.com/tomi/vscode-rf-language-server/blob/master/LICENSE)


## Acknowledgements

This project is a grateful recipient of the [Futurice Open Source sponsorship program](https://spiceprogram.org). ♥

Syntax highlighting grammar is based on [work](https://bitbucket.org/jussimalinen/robot.tmbundle/wiki/Home) by Jussi Malinen.
