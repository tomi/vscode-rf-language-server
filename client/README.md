# Robot Framework Intellisense

A [Visual Studio Code](https://code.visualstudio.com/) extension that supports Robot Framework development.

## Features

### Syntax highlighting
* Supports `.robot` and `.resource` files
* Can be added for `.txt` files using the `files.associations` setting:
```json
"files.associations": {
    "*.txt": "robot"
}
```

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

### Highlight All Occurrences of a Symbol in a Document
* Highlights all occurrences of a variable, keyword or setting
* Move the cursor to a variable, keyword or setting

### Show Code Completion Proposals
* Suggests user keywords and variables
* `⌃Space` on Mac, `Ctrl+Space` on Linux and Windows

### Code Completion for Standard Library Keywords
* Code completion for keywords in the standard libraries, like `BuiltIn` and `String`
* Requires configuration for which libraries are suggested with `rfLanguageServer.libraries` setting. E.g.
```json
"rfLanguageServer.libraries": [
  "BuiltIn-3.0.4"
]
```
* See a list of all available libraries [here](#supported-standard-libraries)

### Code Completion for Any 3rd Party Library
* See [defining 3rd party libraries](#defining-3rd-party-libraries)

### Support for python keywords
* Keywords defined in `.py` files are also included
* Requires that the `.py` files are included with `rfLanguageServer.includePaths` setting. E.g.
```json
"rfLanguageServer.includePaths": [
  "**/*.robot",
  "**/*.py"
]
```

## Configuration

By default all `.robot` and `.resource` files are parsed. This can be configured using parameters. (see `Code` > `Preferences` > `Workspace Settings`).

|param                            | description              |
|---------------------------------|--------------------------|
| `rfLanguageServer.includePaths` | Array of glob patterns for files to be included`|
| `rfLanguageServer.excludePaths` | Array of glob patterns for files to be excluded|
| `rfLanguageServer.logLevel` | What information of the language server is logged in the Output. Possible values `off`, `errors`, `info`, `debug`|
| `rfLanguageServer.trace.server` | what information of the communication between VSCode and the rfLanguageServer is logged to the Output. Possible values `off`, `messages`, `verbose`|
| `rfLanguageServer.libraries` | What libraries' keywords are suggested with code completion. Can be a name of a standard library (see [Supported standard libraries](#supported-standard-libraries)) or a library definition (see [defining 3rd party libraries](#defining-3rd-party-libraries)) or a combination of them. |

The `includePaths` and `excludePaths` properties take a list of glob-like file patterns. Even though any files can be matched this way, only files with supported extensions are included (i.e. `.robot`, `.resource`, `.txt`, and `.py`).

If the `includePaths` is left unspecified, the parser defaults to including all `.robot` and `.resource` files in the containing directory and subdirectories except those excluded using the `excludePaths` property.

## Supported standard libraries

* `AppiumLibrary-1.5.0.4`
* `BuiltIn-3.1.2`
* `Collections-3.1.2`
* `DateTime-3.1.2`
* `Dialogs-3.1.2`
* `FakerLibrary-`
* `JSONLibrary-`
* `OperatingSystem-3.1.2`
* `Process-3.1.2`
* `RequestsLibrary-0.6.5`
* `REST-`
* `Screenshot-3.1.2`
* `SeleniumLibrary-4.3.0`
* `SeleniumLibrary with SeleniumTestability Plugin-4.3.0`
* `SSHLibrary-3.4.0`
* `String-3.1.2`
* `SwingLibrary-1.9.9`
* `Telnet-3.1.2`
* `WhiteLibrary-1.6.0`
* `XML-3.1.2`

## Defining 3rd party libraries

3rd party libraries can be defined inline in the `rfLanguageServer.libraries` configuration block. 

You may use the tool `libdoc2json` to generate these JSON files. You will find it [here.](https://pypi.org/project/robotframework-libdoc2json)

For example:

```json
"rfLanguageServer.libraries": [
  "RequestsLibrary",
  "Screenshot-3.1.2",
  "SeleniumLibrary-4.2.0",
  {
    "name": "MyLibrary",
    "version": "1.0.0",
    "keywords": [
      { "name": "My Keyword 1", "args": ["arg1"], "doc": "documentation" },
      { "name": "My Keyword 2", "args": [],       "doc": "documentation" }
    ]
  }
]
```

## Known issues

Can be found [here](https://github.com/tomi/vscode-rf-language-server/blob/master/client/KNOWNISSUES.md)

## Changelog

Can be found [here](https://github.com/tomi/vscode-rf-language-server/blob/master/client/CHANGELOG.md).

## Bugs

Report them [here](https://github.com/tomi/vscode-rf-language-server/issues).

## Contributing

All contributions are welcomed! Please see [the contributing guide](https://github.com/tomi/vscode-rf-language-server/blob/master/CONTRIBUTING.md) for more details.

## License

[MIT](https://github.com/tomi/vscode-rf-language-server/blob/master/LICENSE)


## Acknowledgements

This project is a grateful recipient of the [Futurice Open Source sponsorship program](https://spiceprogram.org). ♥

Syntax highlighting grammar is built on top of [work](https://bitbucket.org/jussimalinen/robot.tmbundle/wiki/Home) by Jussi Malinen.

This specific version has been made by @Snooz82 René Rohner
