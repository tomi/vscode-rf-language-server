# How to contribute to Robot Framework Language Server

## Developing the extension locally

1. Install dependencies `npm ci`
2. Start the client & server build process in watch mode with `npm run build` or using VSCode task `Cmd+Shift+B`
3. Use the "Launch Extension" launch configuration in VSCode to run the extension in debug mode
   1. Go to "Run and Debug" view (`Cmd+Shift+D`)
   2. Select "Launch Extension" from the dropdown
   3. Press ▷ to launch the config

## Packaging the extension into installation package

The extension can be packaged into an `.vsix` file that can be installed into VSCode:

1. Make sure you have [vsce](https://github.com/microsoft/vscode-vsce) installed: `npm install --global @vscode/vsce`
2. Run `npm run package`
3. The `.vsix` can be installed from VSCode extensions panel's `...` menu: "Install from VSIX..."

## Did you find a bug?

* **Ensure the bug was not already reported** by searching on GitHub under [Issues](https://github.com/tomi/vscode-rf-language-server/issues).

* If you're unable to find an open issue addressing the problem, [open a new one](https://github.com/tomi/vscode-rf-language-server/issues/new). Be sure to include a **title and clear description**, as much relevant information as possible, and a **code sample** or an **executable test case** demonstrating the expected behavior that is not occurring.

* If possible, use the relevant bug report templates to create the issue.

## Did you write a patch that fixes a bug?

* Open a new GitHub pull request with the patch.

* Ensure the PR description clearly describes the problem and solution. Include the relevant issue number if applicable.

* Before submitting, please ensure that

1. The code has been formatted and passes linting (`npm run lint`)
2. A test case has been added and it passes (`npm run test`)

## Do you intend to add a new feature or change an existing one?

* Suggest your change by creating an issue (unless one exists already) on [the issues page](https://github.com/tomi/vscode-rf-language-server/issues) and start writing code.

* Open a new GitHub pull request with the patch.

* Ensure the PR description clearly describes the problem and solution. Include the relevant issue number if applicable.

* Before submitting, please ensure that

1. The code has been formatted and passes linting (`npm run lint`)
2. A test case has been added and it passes (`npm run test`)

## Do you have questions about the source code?

* Ask any question on [the issues page](https://github.com/tomi/vscode-rf-language-server/issues).

The extension is being developed solely on the author's free time. I encourage you to contribute if you want to see a specific feature added!

Thanks! :heart: :heart: :heart:

Tomi Turtiainen
