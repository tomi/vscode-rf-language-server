import * as _ from "lodash";

import {
    DataCell
} from "./table-models";

import {
    parseCallExpression,
} from "./primitive-parsers";

export function decomposeKeywords(valueCells: DataCell[]) {
    let callExpressionArray = [];
    let effectiveKeyword = [];
    for (let singleValueCell of valueCells) {
        if (singleValueCell.content === "Run Keywords" || singleValueCell.content === "Run Keyword And Ignore Error") {
            continue;
        }
        if (singleValueCell.content === "AND") {

            let singleCallExpression = parseCallExpression(effectiveKeyword);
            callExpressionArray.push(singleCallExpression);

            effectiveKeyword = [];
            continue;
        }
        effectiveKeyword.push(singleValueCell);
    }

    let singleCallExpression = parseCallExpression(effectiveKeyword);
    callExpressionArray.push(singleCallExpression);
    return callExpressionArray;
}
