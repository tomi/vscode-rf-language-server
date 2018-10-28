import * as _ from "lodash";
import Workspace from "./workspace/workspace";
import { ConsoleLogger as logger } from "../logger";
import { Location, isInRange } from "../utils/position";
import { findLocationInfo } from "./node-locator";
import { RobotFile } from "./workspace/robot-file";

import {
  getSuiteCompletion,
  getSettingsTableCompletions,
  getVariableTableCompletions,
  getKeywordTableCompletions,
  getTestCaseTableCompletions,
} from "./completion-provider/completion-providers";

export function findCompletionItems(location: Location, workspace: Workspace) {
  const position = location.position;

  const file = workspace.getFile(location.filePath) as RobotFile;
  if (!file) {
    logger.info(`Definition not found. File '${location.filePath}' not parsed`);
    return [];
  }
  const ast = file.ast;

  const locationInfo = findLocationInfo(location, file.tables);
  if (!locationInfo) {
    logger.info(
      `Location info not available. Location '${
        location.position
      }' not available`
    );
    return [];
  }

  const suiteCompletions = getSuiteCompletion(location, locationInfo, ast);
  if (!_.isEmpty(suiteCompletions)) {
    return suiteCompletions;
  }

  if (isInRange(position, ast.settingsTable)) {
    return getSettingsTableCompletions(location, locationInfo, ast, workspace);
  } else if (isInRange(position, ast.variablesTable)) {
    return getVariableTableCompletions(location, locationInfo, ast, workspace);
  } else if (isInRange(position, ast.keywordsTable)) {
    return getKeywordTableCompletions(location, locationInfo, ast, workspace);
  } else if (isInRange(position, ast.testCasesTable)) {
    return getTestCaseTableCompletions(location, locationInfo, ast, workspace);
  }

  return [];
}
