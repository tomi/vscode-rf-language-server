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

    function shouldNotMatch(id: Identifier, kw: UserKeyword) {
      const result = identifierMatchesKeyword(id, kw);

      chai.assert.isFalse(result);
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

    it("should not match when identifier is only partial of keyword", () => {
      shouldNotMatch(
        new Identifier("Partial of", dummyLoc),
        new UserKeyword(new Identifier("Partial of longer keyword", dummyLoc), dummyPos)
      );
    });

    it("should not match when keyword is only partial of identifier", () => {
      shouldNotMatch(
        new Identifier("Partial of longer keyword", dummyLoc),
        new UserKeyword(new Identifier("Partial of", dummyLoc), dummyPos)
      );
    });

    it("should not match when identifier is only partial of keyword with embedded arguments", () => {
      shouldNotMatch(
        new Identifier("Partial of", dummyLoc),
        new UserKeyword(new Identifier("Partial of keyword ${with} @{args}", dummyLoc), dummyPos)
      );
    });

    it("should not match when keyword with embedded arguments is only partial of identifier", () => {
      shouldNotMatch(
        new Identifier("Partial with ${embedded} args longer keyword", dummyLoc),
        new UserKeyword(new Identifier("Partial with ${embedded} args", dummyLoc), dummyPos)
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

    it("should work with keywords with reserved regex characters", () => {
      const createMatchTest = value => {
        shouldMatch(
          new Identifier(value, dummyLoc),
          new UserKeyword(new Identifier(value, dummyLoc), dummyPos)
        );
      };

      createMatchTest("Keyword ^ $ . * + ? ( ) [ ] { } |");
      createMatchTest("Keyword[a-z|c?d]");
    });
  });

});
