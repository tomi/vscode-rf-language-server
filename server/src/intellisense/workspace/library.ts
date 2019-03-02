import {
  UserKeyword,
  NamespacedIdentifier,
  Documentation,
  Identifier,
  Arguments,
  ScalarDeclaration,
  Literal,
} from "../../parser/models";
import { location, position } from "../../parser/position-helper";
import { LibraryDefinition, KeywordDefinition } from "../../utils/settings";
import { Symbols, VariableContainer, KeywordContainer } from "../search-tree";

const DUMMY_POSITION = position(0, 0);
const DUMMY_LOCATION = location(0, 0, 0, 0);

/**
 * A standard or 3rd party library. Contains only keyword definitions
 * of that library.
 */
export class Library implements Symbols {
  public readonly variables = VariableContainer.Empty;
  public readonly keywords = new KeywordContainer();

  constructor(
    public readonly namespace: string,
    public readonly version: string,
    public readonly documentation: string,
    keywords: UserKeyword[]
  ) {
    keywords.forEach(kw => this.keywords.add(kw));
  }
}

/**
 * Parses a library file
 */
export function createLibraryFile(
  libraryDefinition: LibraryDefinition
): Library {
  const { name = "", version = "", keywords = [] } = libraryDefinition;

  const parsedKeywords = keywords
    .filter(kw => kw && kw.name)
    .map(kw => _jsonKeywordToModel(name, kw));

  return new Library(name, version, "", parsedKeywords);
}

function _jsonKeywordToModel(
  namespace: string,
  keywordDefinition: KeywordDefinition
): UserKeyword {
  const { name, args = [], doc = "" } = keywordDefinition;

  const keyword = new UserKeyword(
    new NamespacedIdentifier(namespace, name, DUMMY_LOCATION),
    DUMMY_POSITION
  );

  keyword.documentation = new Documentation(
    new Identifier("Documentation", DUMMY_LOCATION),
    new Literal(doc, DUMMY_LOCATION),
    DUMMY_LOCATION
  );

  const parsedArgs = Array.isArray(args) ? args : [args];

  keyword.arguments = new Arguments(
    new Identifier("Arguments", DUMMY_LOCATION),
    parsedArgs.map(
      arg =>
        new ScalarDeclaration(
          new Identifier(arg, DUMMY_LOCATION),
          undefined,
          DUMMY_LOCATION
        )
    ),
    DUMMY_LOCATION
  );

  return keyword;
}
