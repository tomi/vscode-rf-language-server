import * as _ from "lodash";
import {
  Symbols,
  VariableContainer
} from "../search-tree";
import { ConsoleLogger as logger } from "../../logger";
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
 * @param symbols
 * @param localVariables
 */
export function getKeywordCompletions(
  textToSearch: string,
  symbols: Symbols,
  localVariables?: VariableContainer
): CompletionItem[] {
  if (_isInVariable(textToSearch)) {
    return getVariableCompletions(textToSearch, symbols.variables, localVariables);
  }

  logger.debug(`Searching keywords with ${ textToSearch }`);

  return symbols.keywords.findByPrefix(textToSearch)
    .map(keyword => {
      let [insertText, insertTextFormat] = _createKeywordSnippet(keyword);
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
        label: keyword.id.name,
        kind: CompletionItemKind.Function,
        insertText,
        insertTextFormat,
        detail,
        documentation
      };
    });
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
  localVariables: VariableContainer = VariableContainer.Empty
): CompletionItem[] {
  if (!_isInVariable(textToSearch)) {
    return [];
  }

  const searchText = _getVariableSearchText(textToSearch);
  logger.debug(`Searching variables with ${ searchText }`);

  return [
    ...globalVariables.findByPrefix(searchText),
    ...localVariables.findByPrefix(searchText)
  ].map(variable => {
    const variableLabel = _formatVariable(variable);
    const variableName = variable.id.name;

    return {
      label: variableLabel,
      insertText: variableName,
      kind: CompletionItemKind.Variable
    };
  });
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
  keyword: UserKeyword
): [string, InsertTextFormat] {
  if (keyword.arguments) {
    const args = keyword.arguments.values
      .map((arg, idx) => `\${${idx + 1}:${arg.id.name}}`)
      .join("  ");

    return [`${keyword.id.name}  ${args}`, InsertTextFormat.Snippet];
  } else {
    return [keyword.id.name, InsertTextFormat.PlainText];
  }
}

function _formatVariable(variable: VariableDeclaration) {
  return `${_variableKindToIdentifier(variable.kind)}{${variable.id.name}}`;
}

function _removeFromBeginning(toCheck: string, partToRemove: string) {
  const regex = new RegExp(`^${_.escapeRegExp(partToRemove)}`, "i");
  return toCheck.replace(regex, "");
}

function _variableKindToIdentifier(kind: VariableKind) {
  switch (kind) {
    case "Scalar": return "$";
    case "List": return "@";
    case "Dictionary": return "&";
    default: return null;
  }
}

function _getKeywordArgs(keyword: UserKeyword): string {
  if (keyword.arguments) {
    return keyword.arguments.values
      .map(arg => _formatVariable(arg))
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
