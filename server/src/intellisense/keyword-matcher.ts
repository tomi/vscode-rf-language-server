import * as _ from "lodash";
import {
  UserKeyword,
  Identifier
} from "../parser/models";

import { parseVariableString } from "../parser/primitive-parsers";

// As per RF documentation, the variables are matched with .*? regex
const ARGUMENT_REGEX = ".*?";

function createKeywordRegex(keywordName: string) {
  const parseResult = parseVariableString(keywordName);

  const regexParts = parseResult.map(result => {
    return result.kind === "var" ? ARGUMENT_REGEX : _.escapeRegExp(result.value);
  });

  const regexString = `^${ regexParts.join("") }\$`;

  // As per RF documentation, keywords are matched case-insensitive
  return new RegExp(regexString, "i");
}

export function identifierMatchesKeyword(
  identifier: Identifier,
  keyword: UserKeyword
) {
  const keywordName = keyword.id.name;
  const regex = createKeywordRegex(keywordName);

  return regex.test(identifier.name);
}

/**
 * Tests case-insensitively if two identifiers are the same
 *
 * @param identifier1
 * @param identifier2
 */
export function identifierMatchesIdentifier(
  x: Identifier,
  y: Identifier
) {
  const regex = new RegExp(`^${ _.escapeRegExp(x.name) }\$`, "i");

  return regex.test(y.name);
}
