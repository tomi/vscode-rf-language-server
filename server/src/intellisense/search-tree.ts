// @ts-ignore
import * as Trie from "node-ternary-search-trie";

import {
  UserKeyword,
  VariableKind,
  VariableDeclaration,
} from "../parser/models";

import { TestSuite } from "../parser/models";

abstract class SymbolContainer<T> {
  protected tree: Trie = new Trie();

  public add(item: T) {
    const normalizedKey = this._getNormalizedKey(item);

    this.tree.set(normalizedKey, item);
  }

  public get(key: string): T | undefined {
    return this.tree.get(key);
  }

  public getAll(): T[] {
    const all: T[] = [];

    this.forEach((key, item) => all.push(item));

    return all;
  }

  public remove(item: T) {
    const normalizedKey = this._getNormalizedKey(item);

    this.tree.del(normalizedKey);
  }

  public forEach(cb: (key: string, item: T) => void) {
    this.tree.traverse((key: string, item: T) => {
      cb(key, item);
    });
  }

  public filter(cb: ((item: T) => boolean)): T[] {
    const filtered: T[] = [];

    this.forEach((key, item) => {
      if (cb(item)) {
        filtered.push(item);
      }
    });

    return filtered;
  }

  public findByPrefix(prefix: string): T[] {
    const found: T[] = [];
    const normalizedPrefix = this._normalizeKey(prefix);

    if (prefix.length === 0) {
      return this.getAll();
    }

    this.tree.searchWithPrefix(normalizedPrefix, (key: any, keyword: T) => {
      found.push(keyword);
    });

    return found;
  }

  public copyFrom(other: SymbolContainer<T>) {
    other.forEach((key, item) => this.tree.set(key, item));
  }

  public size() {
    return this.tree.size();
  }

  protected abstract getKey(item: T): string;

  protected _getNormalizedKey(item: T) {
    const key = this.getKey(item);

    return this._normalizeKey(key);
  }

  protected _normalizeKey(key: string) {
    return key.toLowerCase();
  }
}

/**
 * Container for keywords
 */
export class KeywordContainer extends SymbolContainer<UserKeyword> {
  protected getKey(item: UserKeyword) {
    return item.id.name;
  }
}

/**
 * Container for global keywords. Indexed without the namespace.
 * Keywords from different namespaces with the same name are grouped in an array.
 */
export class GlobalKeywordContainer extends SymbolContainer<UserKeyword[]> {
  public addKeyword(item: UserKeyword) {
    const key = this._getKeywordNormalizedKey(item);
    const existingKeywords = this.get(key) || [];

    this.tree.set(key, [...existingKeywords, item]);
  }

  public removeKeyword(item: UserKeyword) {
    const key = this._getKeywordNormalizedKey(item);
    const existingKeywords = this.get(key);

    if (!existingKeywords) {
      return;
    }

    const keywordsWithoutRemoved = existingKeywords.filter(
      keyword => keyword.id.fullName !== item.id.fullName
    );

    if (keywordsWithoutRemoved.length > 0) {
      this.tree.set(key, keywordsWithoutRemoved);
    } else {
      this.tree.del(key);
    }
  }

  protected getKey(item: UserKeyword[]) {
    return item[0].id.name;
  }

  private _getKeywordNormalizedKey(item: UserKeyword) {
    return this._normalizeKey(item.id.name);
  }
}

/**
 * Container for variables
 */
export class VariableContainer extends SymbolContainer<VariableDeclaration> {
  public static Empty = new VariableContainer();

  public findVariable(kind: string, name: string) {
    const matches = this.findByPrefix(name);
    if (matches.length === 0) {
      return null;
    }

    const possibleMatch = matches[0];
    return possibleMatch.kind === kind ? possibleMatch : null;
  }

  protected getKey(item: VariableDeclaration) {
    return this._getVariableName(item);
  }

  private _getVariableName(node: VariableDeclaration) {
    const typeIdentifier = this._variableKindToIdentifier(node.kind);

    if (!typeIdentifier) {
      return node.id.name;
    } else {
      return `${typeIdentifier}{${node.id.name}}`;
    }
  }

  // TODO: Move to formatters
  private _variableKindToIdentifier(kind: VariableKind) {
    switch (kind) {
      case "Scalar":
        return "$";
      case "List":
        return "@";
      case "Dictionary":
        return "&";
      default:
        return null;
    }
  }
}

export interface Symbols {
  namespace: string;
  documentation: string;
  keywords: KeywordContainer;
  variables: VariableContainer;
}

/**
 * Creates search trees for keywords and variables
 *
 * @param ast
 */
export function createFileSearchTrees(ast: TestSuite) {
  const keywords = new KeywordContainer();
  const variables = new VariableContainer();

  if (!ast) {
    return {
      documentation: "",
      keywords,
      variables,
    };
  }

  if (ast.keywordsTable) {
    ast.keywordsTable.keywords.forEach(keyword => {
      keywords.add(keyword);
    });
  }

  if (ast.variablesTable) {
    ast.variablesTable.variables.forEach(variable => {
      variables.add(variable);
    });
  }

  const documentation =
    ast.settingsTable &&
    ast.settingsTable.documentation &&
    ast.settingsTable.documentation.value &&
    ast.settingsTable.documentation.value.value;

  return {
    documentation,
    keywords,
    variables,
  };
}

/**
 * Removes keywords and variables in given fileTree from given search trees
 *
 * @param searchTrees
 * @param ast
 */
export function removeFileSymbols(symbols: Symbols, ast: TestSuite) {
  // TODO: Could use another search trees instead of fileTree
  const { keywords, variables } = symbols;

  if (ast && ast.keywordsTable) {
    ast.keywordsTable.keywords.forEach(keyword => {
      keywords.remove(keyword);
    });
  }

  if (ast && ast.variablesTable) {
    ast.variablesTable.variables.forEach(variable => {
      variables.remove(variable);
    });
  }
}
