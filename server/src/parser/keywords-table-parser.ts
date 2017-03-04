import * as _ from "lodash";

import {
  DataTable,
  DataRow
} from "./table-models";

import {
  CallExpression,
  KeywordsTable,
  UserKeyword,
  Step
} from "./models";

import {
  parseIdentifier,
  parseValueExpression,
} from "./primitive-parsers";

import { parseStep } from "./function-parsers";

export function parseKeywordsTable(dataTable: DataTable): KeywordsTable {
  const keywordsTable = new KeywordsTable(dataTable.location);
  let currentKeyword: UserKeyword;

  dataTable.rows.forEach(row => {
    if (row.isEmpty()) {
      return;
    }

    if (startsKeyword(row)) {
      const identifier = parseIdentifier(row.first());

      currentKeyword = new UserKeyword(identifier, row.location.start);
      keywordsTable.addKeyword(currentKeyword);
    } else if (currentKeyword) {
      const step = parseStep(row);
      currentKeyword.addStep(step);
    }
  });

  return keywordsTable;
}

function startsKeyword(row: DataRow) {
  return !row.first().isEmpty();
}
