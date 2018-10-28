import * as _ from "lodash";
import * as chai from "chai";

import { parseStep } from "../function-parsers";
import { DataCell } from "../table-models";

import { Identifier, ScalarDeclaration, Step } from "../models";

import { createLocation } from "./test-helper";

function parseAndAssert(data: DataCell[], expected: Step) {
  const [first, ...rest] = data;
  const actual = parseStep(first, rest);

  chai.assert.deepEqual(actual, expected);
}

describe("parseStep", () => {
  it("should parse empty variable declaration", () => {
    const loc = createLocation(0, 0, 0, 7);
    const data = [new DataCell("${var}=", loc)];

    const expected = new Step(
      new ScalarDeclaration(new Identifier("var", loc), null, loc),
      loc
    );

    parseAndAssert(data, expected);
  });
});
