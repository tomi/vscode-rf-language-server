# Change Log

## Version 2.0.0
* Release date: October 17, 2017

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
