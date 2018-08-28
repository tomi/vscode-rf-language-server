import * as _ from "lodash";
import { VariableContainer } from "../search-tree";
import { ConsoleLogger as logger } from "../../logger";
import { formatVariable } from "../formatters";
import {
  CompletionItem,
  CompletionItemKind,
  InsertTextFormat,
} from "vscode-languageserver";
import {
  VariableDeclaration,
  UserKeyword,
  VariableKind
} from "../../parser/models";
import { Workspace } from "../workspace/workspace";

const VARIABLE_PREFIXES = new Set(["$", "@", "%", "&"]);

/**
 * Get completions for syntax keywords
 *
 * @param textToSearch
 * @param syntaxKeywords
 */
export function getSyntaxCompletions(
  textToSearch: string,
  syntaxKeywords: string[]
) {
  const lowerText = textToSearch.toLowerCase();

  return syntaxKeywords
    .filter(keyword => keyword.toLowerCase().startsWith(lowerText))
    .map(keyword => ({
      label: keyword,
      kind: CompletionItemKind.Keyword
    }));
}

/**
 *
 * @param textToSearch
 * @param workspace
 * @param localVariables
 */
export function getKeywordCompletions(
  textToSearch: string,
  workspace: Workspace,
  localVariables?: VariableContainer
): CompletionItem[] {
  if (_isInVariable(textToSearch)) {
    return getVariableCompletions(textToSearch, workspace.variables, localVariables);
  }

  logger.debug(`Searching keywords with ${ textToSearch }`);

  const keywordGroups = workspace.findKeywords(textToSearch);
  const keywords = keywordGroups.map(keywordGroup => {
    // A keyword is ambiguous when there are multiples in the global workspace with the same name.
    const ambiguousKeyword = keywordGroup.length > 1;
    return keywordGroup.map(keyword => {
      const shouldSuggestNamespace = ambiguousKeyword ||
        // Assuming namespaces 'Page1' and 'Page2'...
        textToSearch.startsWith(keyword.id.namespace) || // User typed 'Page1.Someth'
        keyword.id.namespace.startsWith(textToSearch);   // User typed 'Page'
      let [insertText, insertTextFormat] = _createKeywordSnippet(keyword, shouldSuggestNamespace);
      const detail = _getKeywordArgs(keyword);
      const documentation = _getKeywordDocumentation(keyword);

      if (textToSearch.includes(" ")) {
        // VSCode completion handles only complete words and not spaces,
        // so everything before the last space needs to be trimmed
        // from the insert text for it to work correctly
        const textBeforeLastSpace =
          textToSearch.substr(0, textToSearch.lastIndexOf(" ") + 1);

        insertText = _removeFromBeginning(insertText, textBeforeLastSpace);
      }

      return {
        label: shouldSuggestNamespace ? keyword.id.fullName : keyword.id.name,
        kind: CompletionItemKind.Function,
        insertText,
        insertTextFormat,
        detail,
        documentation
      };
    });
  });

  return _.flatten(keywords);
}

/**
 *
 * @param textToSearch
 * @param globalVariables
 * @param localVariables
 */
export function getVariableCompletions(
  textToSearch: string,
  globalVariables: VariableContainer,
  localVariables: VariableContainer = VariableContainer.Empty,
  suiteVariables: VariableContainer = VariableContainer.Empty
): CompletionItem[] {
  if (!_isInVariable(textToSearch)) {
    return [];
  }

  const searchText = _getVariableSearchText(textToSearch);
  logger.debug(`Searching variables with ${ searchText }`);

  const localCompletions = localVariables
    .findByPrefix(searchText)
    .map(_localVarToCompletionItem);
  const suiteCompletions = suiteVariables
    .findByPrefix(searchText)
    .map(_suiteVarToCompletionItem);
  const globalCompletions = globalVariables
    .findByPrefix(searchText)
    .map(_globalVarToCompletionItem);

  return [
    ...localCompletions,
    ...suiteCompletions,
    ...globalCompletions
  ];
}

const _localVarToCompletionItem = variable =>
  _variableToCompletionItem(`0-${ variable.id.name }`, variable);

const _suiteVarToCompletionItem = variable =>
  _variableToCompletionItem(`1-${ variable.id.name }`, variable);

const _globalVarToCompletionItem = variable =>
  _variableToCompletionItem(`2-${ variable.id.name }`, variable);

function _variableToCompletionItem(sortText: string, variable: VariableDeclaration): CompletionItem {
  const variableLabel = formatVariable(variable);
  const variableName = variable.id.name;

  return {
    label: variableLabel,
    insertText: variableName,
    kind: CompletionItemKind.Variable,
    sortText
  };
}

function _isInVariable(text: string) {
  const lastStartingCurlyIdx = text.lastIndexOf("{");
  if (lastStartingCurlyIdx < 0) {
    return false;
  }
  const lastEndingCurlyIdx = text.lastIndexOf("}");
  if (lastStartingCurlyIdx < lastEndingCurlyIdx) {
    return false;
  }

  const charBeforeCurly = text[lastStartingCurlyIdx - 1];
  if (!VARIABLE_PREFIXES.has(charBeforeCurly)) {
    return false;
  }

  return true;
}

function _getVariableSearchText(textBefore: string) {
  const curlyBeforeIdx = textBefore.lastIndexOf("{");

  return textBefore.substring(curlyBeforeIdx - 1);
}

/**
 * Creates a signature from given keyword. If the keyword has arguments,
 * the signature is returned as a snippet
 *
 * @param keyword
 */
function _createKeywordSnippet(
  keyword: UserKeyword,
  suggestNamespace: boolean
): [string, InsertTextFormat] {
  const keywordName = suggestNamespace ? keyword.id.fullName : keyword.id.name;
  if (keyword.arguments) {
    const args = keyword.arguments.values
      .map((arg, idx) => `\${${idx + 1}:${arg.id.name}}`)
      .join("  ");

    return [`${keywordName}  ${args}`, InsertTextFormat.Snippet];
  } else {
    return [keywordName, InsertTextFormat.PlainText];
  }
}

function _removeFromBeginning(toCheck: string, partToRemove: string) {
  const regex = new RegExp(`^${_.escapeRegExp(partToRemove)}`, "i");
  return toCheck.replace(regex, "");
}

function _getKeywordArgs(keyword: UserKeyword): string {
  if (keyword.arguments) {
    return keyword.arguments.values
      .map(arg => formatVariable(arg))
      .join("  ");
  } else {
    return undefined;
  }
}

function _getKeywordDocumentation(keyword: UserKeyword): string {
  if (keyword.documentation && keyword.documentation.value) {
    return keyword.documentation.value.value;
  } else {
    return undefined;
  }
}
