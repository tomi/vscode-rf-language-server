import * as _ from "lodash";
import {
  VariableDeclaration,
  VariableKind
} from "../parser/models";

export function formatVariable(variable: VariableDeclaration) {
  const identifier = _variableKindToIdentifier(variable.kind);
  const name       = variable.id.name;

  return `${ identifier }{${ name }}`;
}

function _removeFromBeginning(toCheck: string, partToRemove: string) {
  const regex = new RegExp(`^${_.escapeRegExp(partToRemove)}`, "i");
  return toCheck.replace(regex, "");
}

function _variableKindToIdentifier(kind: VariableKind) {
  switch (kind) {
    case "Scalar":     return "$";
    case "List":       return "@";
    case "Dictionary": return "&";
    default: return null;
  }
}
