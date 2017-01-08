import * as _ from "lodash";

import {
  DataTable,
  DataRow
} from "./table-models";

import {
  KeywordsTable,
  Keyword,
  Step
} from "./models";

export function parseKeywordsTable(dataTable: DataTable): KeywordsTable {
  const keywordsTable = new KeywordsTable(dataTable.location);
  let currentKeyword: Keyword;

  dataTable.rows.forEach(row => {
    if (row.isEmpty()) {
      return;
    }

    if (startsKeyword(row)) {
      const keywordName = row.first().content;

      currentKeyword = new Keyword(keywordName, row.location.start);
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

function parseStep(row: DataRow) {
  const stepName = row.getCellByIdx(1).content;
  const stepArgs = row.getCellsByRange(2).map(cell => cell.content);

  return new Step(stepName, stepArgs, row.location);
}
