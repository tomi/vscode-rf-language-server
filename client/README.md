# Robot Framework Intellisense

A [Visual Studio Code](https://code.visualstudio.com/) extension that supports Robot Framework development.

## Features

### Syntax highlighting
* Supports `.robot` files

### Goto definition
* For variables
* For user keywords
* `F12` on Mac, Linux and Windows

### List file symbols
* Shows variables, keywords and test cases
* `⇧⌘O` on Mac, `Ctrl+Shift+O` on Linux and Windows

### List workspace symbols
* Shows variables, keywords and test cases
* `⌘T` on Mac, `Ctrl+T` on Linux and Windows

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
