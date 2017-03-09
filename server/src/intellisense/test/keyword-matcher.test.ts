import * as _ from "lodash";
import * as chai from "chai";

import { identifierMatchesKeyword } from "../keyword-matcher";
import { Location } from "../../utils/position";
import {
  Identifier,
  UserKeyword
} from "../../parser/models";

const dummyPos = { line: 0, column: 0 };
const dummyLoc = { start: dummyPos, end: dummyPos };

describe("Keyword matcher", () => {

  describe("identifierMatchesKeyword", () => {
    function shouldMatch(id: Identifier, kw: UserKeyword) {
      const result = identifierMatchesKeyword(id, kw);

      chai.assert.isTrue(result);
    }

    it("should match identifier to user keyword with same name", () => {
      shouldMatch(
        new Identifier("Keyword Name", dummyLoc),
        new UserKeyword(new Identifier("Keyword Name", dummyLoc), dummyPos)
      );
    });

    it("should match case-insensitively", () => {
      shouldMatch(
        new Identifier("Keyword Name", dummyLoc),
        new UserKeyword(new Identifier("keyword name", dummyLoc), dummyPos)
      );
    });

    it("should match name with embedded arguments", () => {
      shouldMatch(
        new Identifier(`Keyword "with" embedded "args"`, dummyLoc),
        new UserKeyword(new Identifier("Keyword ${arg1} embedded ${arg2}", dummyLoc), dummyPos)
      );

      shouldMatch(
        new Identifier(`Keyword with embedded args`, dummyLoc),
        new UserKeyword(new Identifier("Keyword ${arg1} embedded ${arg2}", dummyLoc), dummyPos)
      );

      shouldMatch(
        new Identifier(`Keyword \${VAR} embedded \${VAR2}`, dummyLoc),
        new UserKeyword(new Identifier("Keyword ${arg1} embedded ${arg2}", dummyLoc), dummyPos)
      );
    });
  });

});
