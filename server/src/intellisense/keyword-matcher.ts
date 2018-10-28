import * as _ from "lodash";
import { UserKeyword, Identifier } from "../parser/models";

import { parseVariableString } from "../parser/primitive-parsers";
import { isNamespacedIdentifier } from "./type-guards";

// As per RF documentation, the variables are matched with .*? regex
const ARGUMENT_REGEX = ".*?";

function sanitizeKeywordName(name: string) {
  return name.replace(/ /g, "").replace(/_/g, "");
}

function createKeywordRegex(keywordName: string) {
  const sanitizedName = sanitizeKeywordName(keywordName);
  const parseResult = parseVariableString(sanitizedName);

  const regexParts = parseResult.map(result => {
    return result.kind === "var"
      ? ARGUMENT_REGEX
      : _.escapeRegExp(result.value);
  });

  const regexString = `^${regexParts.join("")}\$`;

  // As per RF documentation, keywords are matched case-insensitive
  return new RegExp(regexString, "i");
}

export function identifierMatchesKeyword(
  identifier: Identifier,
  keyword: UserKeyword
) {
  if (isNamespacedIdentifier(identifier)) {
    // When the identifier is explicit, the namespace must match the keyword case-insensitively.
    if (
      identifier.namespace &&
      identifier.namespace.toLowerCase() !== keyword.id.namespace.toLowerCase()
    ) {
      return false;
    }
  }

  const keywordName = keyword.id.name;
  const regex = createKeywordRegex(keywordName);

  const sanitizedIdentifierName = sanitizeKeywordName(identifier.name);
  return regex.test(sanitizedIdentifierName);
}

/**
 * Tests case-insensitively if two identifiers are the same
 *
 * @param identifier1
 * @param identifier2
 */
export function identifierMatchesIdentifier(x: Identifier, y: Identifier) {
  const regex = new RegExp(`^${_.escapeRegExp(x.name)}\$`, "i");

  return regex.test(y.name);
}
