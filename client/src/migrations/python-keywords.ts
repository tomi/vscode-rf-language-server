import { window, WorkspaceConfiguration } from "vscode";
import { Config } from "../utils/config";

const YES = "Yes";
const NO = "No";
const PY_CONFIG_KEY = "pythonKeywords";
const INCLUDE_CONFIG_KEY = "includePaths";

export default async function checkShouldMigrate() {
  return _checkPythonKeywordsUsage();
}

async function _checkPythonKeywordsUsage() {
  const config = Config.getSettings();

  if (!config) {
    return;
  }

  const inspectResult = config.inspect<boolean>(PY_CONFIG_KEY);
  const hasLocal = inspectResult.workspaceValue === true;
  const hasGlobal = inspectResult.globalValue === true;
  if (hasLocal || hasGlobal) {
    const result = await _promptShouldUpdate();
    if (result === YES) {
      _replacePythonKeywords(config, hasLocal, hasGlobal);
      const infoMsg = `**pythonKeywords** setting has been replaced with a '\\*\\*/*.py' include pattern.`;
      window.showInformationMessage(infoMsg);
    } else if (result === NO) {
      _removePythonKeywords(config);
      const infoMsg = `**pythonKeywords** setting has been removed.`;
      window.showInformationMessage(infoMsg);
    }
  }
}

function _promptShouldUpdate() {
  const promptMsg =
    `[RobotFramework] '**pythonKeywords**' setting is deprecated in ` +
    `favor of '**includePaths**'. Do you want to migrate to include pattern '\\*\\*/*.py'?`;

  return window.showInformationMessage(promptMsg, YES, NO);
}

function _replacePythonKeywords(
  config: WorkspaceConfiguration,
  hasLocal: boolean,
  hasGlobal: boolean
) {
  _removePythonKeywords(config);

  const includeConfig = config.inspect<string[]>(INCLUDE_CONFIG_KEY);

  if (hasLocal) {
    const includePaths = _getIncludePatterns(includeConfig.workspaceValue);

    config.update(INCLUDE_CONFIG_KEY, includePaths, false);
  }
  if (hasGlobal) {
    const includePaths = _getIncludePatterns(includeConfig.globalValue);

    config.update(INCLUDE_CONFIG_KEY, includePaths, true);
  }
}

function _getIncludePatterns(includePaths = []) {
  const patterns = ["**/*.py"];

  if (includePaths.length === 0) {
    patterns.push("**/*.robot");
    patterns.push("**/*.resource");
  }

  return includePaths.concat(patterns);
}

function _removePythonKeywords(config: WorkspaceConfiguration) {
  config.update(PY_CONFIG_KEY, undefined, true);
  config.update(PY_CONFIG_KEY, undefined, false);
}
