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

    const identifier = name => new Identifier(name, dummyLoc);
    const keyword    = name => new UserKeyword(new Identifier(name, dummyLoc), dummyPos);

    it("should match identifier to user keyword with same name", () => {
      shouldMatch(
        identifier("Keyword Name"),
        keyword("Keyword Name")
      );
    });

    it("should match case-insensitively", () => {
      shouldMatch(
        identifier("Keyword Name"),
        keyword("keyword name")
      );
    });

    it("should ignore spaces when matching", () => {
      shouldMatch(identifier("I shall call you"), keyword("iShallCallYou"));
      shouldMatch(identifier("I shall call you"), keyword("i  ShallCall    You"));
    });

    it("should ignore underscores when matching", () => {
      shouldMatch(identifier("I shall call you"), keyword("i_shall_call_you"));
      shouldMatch(identifier("IShallCallYou"), keyword("i___shall_call_you"));
    });

    it("should not match when identifier is only partial of keyword", () => {
      shouldNotMatch(
        identifier("Partial of"),
        keyword("Partial of longer keyword")
      );
    });

    it("should not match when keyword is only partial of identifier", () => {
      shouldNotMatch(
        identifier("Partial of longer keyword"),
        keyword("Partial of")
      );
    });

    it("should not match when identifier is only partial of keyword with embedded arguments", () => {
      shouldNotMatch(
        identifier("Partial of"),
        keyword("Partial of keyword ${with} @{args}")
      );
    });

    it("should not match when keyword with embedded arguments is only partial of identifier", () => {
      shouldNotMatch(
        identifier("Partial with ${embedded} args longer keyword"),
        keyword("Partial with ${embedded} args")
      );
    });

    it("should match name with embedded arguments", () => {
      shouldMatch(
        identifier(`Keyword "with" embedded "args"`),
        keyword("Keyword ${arg1} embedded ${arg2}")
      );

      shouldMatch(
        identifier(`Keyword with embedded args`),
        keyword("Keyword ${arg1} embedded ${arg2}")
      );

      shouldMatch(
        identifier(`Keyword \${VAR} embedded \${VAR2}`),
        keyword("Keyword ${arg1} embedded ${arg2}")
      );
    });

    it("should work with keywords with reserved regex characters", () => {
      const createMatchTest = value =>
        shouldMatch(identifier(value), keyword(value));

      createMatchTest("Keyword ^ $ . * + ? ( ) [ ] { } |");
      createMatchTest("Keyword[a-z|c?d]");
    });
  });

});
