import * as _ from "lodash";
import { DataTable, DataRow } from "./table-models";
import { VariablesTable } from "./models";
import { parseValueExpression } from "./primitive-parsers";
import {
  isVariable,
  parseTypeAndName,
  parseVariableDeclaration,
} from "./variable-parsers";

export function parseVariablesTable(dataTable: DataTable): VariablesTable {
  const variablesTable = new VariablesTable(dataTable.location);

  dataTable.rows.forEach(row => parseRow(variablesTable, row));

  return variablesTable;
}

function parseRow(variablesTable: VariablesTable, row: DataRow) {
  if (row.isEmpty()) {
    return;
  }

  const typeNameCell = row.first();
  if (!isVariable(typeNameCell)) {
    return;
  }

  const typeAndName = parseTypeAndName(typeNameCell);
  const values = row.getCellsByRange(1).map(parseValueExpression);
  const variableDeclaration = parseVariableDeclaration(
    typeAndName,
    values,
    row.location
  );
  variablesTable.addVariable(variableDeclaration);
}
