# Robot Framework Intellisense

A [Visual Studio Code](https://code.visualstudio.com/) extension that supports Robot Framework development.

## Features

### Syntax highlighting
* Supports `.robot` files

### Goto definition
* For variables
* For user keywords
* `F12` on Mac, Linux and Windows

### Find all references
* For user keywords
* `⇧F12` on Mac, `Shift+F12` on Linux and Windows

### List file symbols
* Shows variables, keywords and test cases
* `⇧⌘O` on Mac, `Ctrl+Shift+O` on Linux and Windows

### List workspace symbols
* Shows variables, keywords and test cases
* `⌘T` on Mac, `Ctrl+T` on Linux and Windows

### Show Code Completion Proposals
* Suggests user keywords and variables
* `⌃Space` on Mac, `Ctrl+Space` on Linux and Windows

### Support for python keywords
* Keywords defined in `.py` files are also included
* Requires `rfLanguageServer.pythonKeywords` setting to be `true`

## Configuration

By default all `.robot` files are parsed. This can be configured using parameters. (see `Code` > `Preferences` > `Workspace Settings`).

|param                            | description              |
|---------------------------------|--------------------------|
| `rfLanguageServer.pythonKeywords` | Should `.py` files be parsed for keywords |
| `rfLanguageServer.includePaths` | Array of glob patterns for files to be included`|
| `rfLanguageServer.excludePaths` | Array of glob patterns for files to be excluded|
| `rfLanguageServer.logLevel` | What information of the language server is logged in the Output. Possible values `off`, `errors`, `info`, `debug`|
| `rfLanguageServer.trace.server` | what information of the communication between VSCode and the rfLanguageServer is logged to the Output. Possible values `off`, `messages`, `verbose`|


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

Syntax highlighting grammar is built on top of [work](https://bitbucket.org/jussimalinen/robot.tmbundle/wiki/Home) by Jussi Malinen.
