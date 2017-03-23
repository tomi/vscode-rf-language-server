import {
  UserKeyword,
  Identifier
} from "../parser/models";

// As per RF documentation, the variables are matched with .*? regex
const ARGUMENT_REGEX = ".*?";

function createKeywordRegex(keywordName: string) {
  const variableRegex = /([$,@,%,&]){([^}]+)}/g;

  const regexString = variableRegex.test(keywordName) ?
    `^${ keywordName.replace(variableRegex, ARGUMENT_REGEX) }\$` :
    `^${ keywordName }\$`;

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
  const regex = new RegExp(`^${ x.name }\$`, "i");

  return regex.test(y.name);
}
