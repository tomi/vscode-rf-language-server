import * as _ from "lodash";

import {
    DataCell
} from "./table-models";

import {
    parseCallExpression,
} from "./primitive-parsers";

function composeCallExpression(separationResultArray: DataCell[]) {
    let callExpressionArray = [];
    let effectiveCallExpression = [];
    for (let separationResult of separationResultArray) {
        let dataCellName = separationResult.content;
        if (dataCellName.indexOf(" ") !== -1 && effectiveCallExpression.length > 0) {
            let singleCallExpression = parseCallExpression(effectiveCallExpression);
            callExpressionArray.push(singleCallExpression);
            effectiveCallExpression = [];
        }

        effectiveCallExpression.push(separationResult);
    }

    let singleCallExpression = parseCallExpression(effectiveCallExpression);
    callExpressionArray.push(singleCallExpression);
    return callExpressionArray;
}

export function decomposeKeywords(valueCells: DataCell[]) {
    let callExpressionArray = [];
    let separationResultArray = [];
    for (let singleValueCell of valueCells) {
        if (singleValueCell.content === "Run Keywords" || singleValueCell.content === "Run Keyword And Ignore Error") {
            continue;
        }
        if (singleValueCell.content === "AND") {
            let composedResultArray = composeCallExpression(separationResultArray);
            callExpressionArray = callExpressionArray.concat(composedResultArray);

            separationResultArray = [];
            continue;
        }
        separationResultArray.push(singleValueCell);
    }

    let composedResultArray = composeCallExpression(separationResultArray);
    return callExpressionArray.concat(composedResultArray);
}
