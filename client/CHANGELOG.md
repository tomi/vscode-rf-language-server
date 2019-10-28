# Change Log

## Version 2.8.0
* Release date: October 28, 2019

### What's new in this version
* Fix syntax highlight for named arguments where the value contains a '=' character. Big thanks to [3zk1m0](https://github.com/3zk1m0) for fixing this!
* Fix repository links in VSCode extension page. Thanks to [tumit](https://github.com/tumit) for fixing this!

## Version 2.7.0
* Release date: October 5, 2019

### What's new in this version
* Fix error when both a file added and file removed event is received for the same file at the same time.
* Fix watching of python files. There was a bug that caused python files to not be reparsed if they were changed.
* Fix .resource files not being correctly monitored for changes.
* Fix anchor links in README. Thanks to [@JaPyR](https://github.com/JaPyR) for fixing!
* Add definitions for standard library versions 3.1.1. Big thanks to [@lolotoms](https://github.com/lolotoms) for this!

## Version 2.6.0
* Release date: July 12, 2019

### What's new in this version
* Add support for `.resource` files introduced in [RF 3.1](https://github.com/robotframework/robotframework/blob/master/doc/releasenotes/rf-3.1.rst#new-resource-extension-for-resource-files). Thanks to [@BabyMaybe](https://github.com/BabyMaybe) for help in implementing this!

## Version 2.5.0
* Release date: March 10, 2019

### What's new in this version
* Add support for Goto definition for keywords that are parameters to 'Wait Until Keyword Succeeds' keyword. Big thanks to [@allyusd](https://github.com/allyusd) for implementing this!

## Version 2.4.0
* Release date: March 2, 2019

### What's new in this version
* Go to definition support for BDD style keyword calls (Given-When-Then)

## Version 2.3.0
* Release date: January 10, 2019

### What's new in this version
* Fix error when keyword call has been split into multiple rows with '...'.
* Add support for Goto definition for keywords that are parameters to one of Run Keyword keywords from the BuiltIn library.

## Version 2.2.1
* Release date: October 28, 2018

### What's new in this version
* Fix keywords being namespaced too eagerly in code completion suggestions
  * Now the namespace (i.e. the file name of a resource file, or library name for libraries) is shown only if there are multiple keywords with the same name
  * Suggest also resource file and library names in code completion

## Version 2.2.0
* Release date: October 21, 2018

### What's new in this version
* Code completion support for standard and any 3rd party libraries.
  * Need to be configured in `rfLanguageServer.libraries`.
  * Standard libraries can be included by just configuring the library using its name and version. See a list of all available libraries [here](https://github.com/tomi/vscode-rf-language-server/tree/master/client#supported-standard-libraries).
  * Other libraries can be configured by specifying their keywords inline. See details [here](https://github.com/tomi/vscode-rf-language-server/tree/master/client#defining-3rd-party-libraries).
* As a consequence of this, code completion documentation now supports markdown. Meaning any markdown in keyword `[Documentation]` will be rendered properly in VS Code.
* A fix for bug that caused keywords being shown multiple times in the code completion list.

```json
"rfLanguageServer.libraries": [
  "BuiltIn-3.0.4",
  "String-3.0.4",
  {
      "name": "My3rdPartyLibrary",
      "version": "1.0.0",
      "keywords": [
          { "name": "Keyword 1", "args": ["arg"], "doc": "documentation" }
      ]
  }
]
```

## Version 2.1.1
* Release date: October 14, 2018

### What's new in this version
* We have an icon now. Big thanks to [@tumit](https://github.com/tumit) for providing this!
* Support for explicitly specified keywords. Huge thanks to [@edchapel](https://github.com/edchapel) for implementing this!
  * The extension now understands from which resource file the keyword is being called, if the keyword's full name is specified. See [Robot Framework documentation](http://robotframework.org/robotframework/latest/RobotFrameworkUserGuide.html#handling-keywords-with-same-names) for details.


## Version 2.0.1
* Release date: July 9, 2018

### What's new in this version
* Fix file path of robot being interpreted incorrectly on Windows. This prevented goto definition and some other features from working. Big thanks to [@edchapel](https://github.com/edchapel) for fixing this!


## Version 2.0.0
* Release date: October 18, 2017

### What's new in this version
* Local variables are shown first in completion suggestions
* Python files are still supported, but `rfLanguageServer.pythonKeywords` setting has been removed. Python files need to be included using `rfLanguageServer.includePaths`.
  * There's a migration support that automatically updates the settings so that everything works as before.
* Add support for `.txt` files. They are not included by default and need to included using `rfLanguageServer.includePaths`. For syntax highlight support, use `files.associations` setting:
```json
"files.associations": {
    "*.txt": "robot"
}
```
* Improved server logging


## Version 1.0.0
* Release date: August 10, 2017

### What's new in this version
* Improved code completion suggestions
  * Suggestions take now the context better into consideration and know when keywords and when variables should be suggested
  * Suggestions are now provided also for settings and tables
* Add support for document highlights
  * All occurrences of the selected keyword, variable or setting are highlighted in the current document
* Fix parsing of library imports


## Version 0.8.1
* Release date: July 25, 2017

### What's new in this version
* Fix errors thrown when opening a single file instead of a folder


## Version 0.8.0
* Release date: July 4, 2017

### What's new in this version
* Add support for python keywords
  * For `.py` files to be parsed, `rfLanguageServer.pythonKeywords` setting must be set to `true`
  * Python files are parsed only for keywords
  * Python keywords are not yet shown in code completion proposals
* Fix finding definition of keywords that don't match exactly (i.e. ignore spaces and underscores when comparing)


## Version 0.7.0
* Release date: June 27, 2017

### What's new in this version
* Add support for code completion suggestions
  * Supports keywords and variables
  * Doesn't yet understand which variable is local and which is "global"
  * Doesn't yet understand all cases where a keyword and where a variable is allowed
  * Suggests only user defined variables and keywords
* Add `rfLanguageServer.logLevel` configuration option
  * Defines what information of the language server is logged in the Output
  * Possible values are `off`, `errors`, `info`, `debug`
  * Default value is `off`
* Add `rfLanguageServer.trace.server` configuration option
  * Defines what information of the communication between VSCode and the rfLanguageServer is logged to the Output
  * Possible values are `off`, `messages`, `verbose`
  * Default value is `off`
* Fix syntax highlighting for templated test cases


## Version 0.6.1
* Release date: April 11, 2017

### What's new in this version
* Fix release date in change log


## Version 0.6.0
* Release date: April 11, 2017

### What's new in this version
* Rows that are split into multiple rows are now parsed correctly
* Couple of improvements to syntax highlighting:
  * Named arguments' name and value are highlighted separately
  * Change the name (and therefore color) of variables' "prefix" and "suffix", i.e. the ${}, @{}, &{} and %{} part.
  * Highlight even illegal settings for keywords and test cases. E.g. test cases can't have [Arguments] setting.
* Fix bug in parsing an empty variable declaration


## Version 0.5.1
* Release date: April 4, 2017

### What's new in this version
* Fixed couple issues with syntax highlighting keywords


## Version 0.5.0
* Release date: April 4, 2017

### What's new in this version
* Improved syntax highlighting
  * Syntax highlighting has been completely rewritten from ground up. If you encounter odd behavior with it don't hesitate to file an issue in github.


## Version 0.4.1
* Release date: March 23, 2017

### What's new in this version
* Fix goto definition and find all references for keywords that contain special regex characters (such as `^`, `$`, `.` or `*`)


## Version 0.4.0
* Release date: March 23, 2017

### What's new in this version
* Updated robot framework language configuration:
  * Typing a double quote is automatically closed.
  * Selecting text and typing an angle bracket, single or double quote or back tick surrounds the selection.
* Fix goto definition for keywords defined in [Setup]
* Fixed bug that find references didn't find keywords defined in Settings tables or in [Setup]
* Fix bug in goto definition when keyword with embedded arguments had a partial name of another keyword (#1)
* Fix find all references for keyword that don't have a definition


## Version 0.3.0
* Release date: March 20, 2017

### What's new in this version
* Add support to find references for user keywords
* The parser is now aware of [Documentation], [Arguments], [Return], [Timeout], [Tags], [Setup] and [Teardown]. This means that for example goto definition works on keywords and variables used in aforementioned settings.


## Version 0.2.0
* Release date: March 14, 2017

### What's new in this version
* Add language configuration for robot framework files. This adds support for commenting lines and bracket matching.
* Add support to list and find workspace symbols
* Fix bug in goto definition when keyword had a partial name of another keyword (#1)


## Version 0.1.1
* Release date: March 9, 2017

### What's new in this version
* Fix goto definition for keywords with embedded arguments
* Fix goto definition when case didn't match keyword's name
* Fix internal completion request error when editing a robot framework file


## Version 0.1.0
* Release date: March 6, 2017

### What's new in this version
* Initial release with syntax highlight, goto definition and list file symbols support.


## Known issues
* Located [here](https://github.com/tomi/vscode-rf-language-server/blob/master/client/KNOWNISSUES.md)
