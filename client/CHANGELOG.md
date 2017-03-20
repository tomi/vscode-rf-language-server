# Change Log

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
