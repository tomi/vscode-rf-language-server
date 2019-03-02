import { assert } from "chai";
import { findDefinition, NodeDefinition } from "../definition-finder";
import Workspace from "../workspace/workspace";
import { createRobotFile, RobotFile } from "../workspace/robot-file";
import { keywords, tests } from "./data/definition-finder.data";

const workspace = new Workspace();

const range = (
  startLine: number,
  startColumn: number,
  endLine: number,
  endColumn: number
) => ({
  start: { line: startLine, character: startColumn },
  end: { line: endLine, character: endColumn },
});

describe("Definition finder", () => {
  let keywordsFile: RobotFile;
  let testsFile: RobotFile;

  before(() => {
    keywordsFile = createRobotFile(
      keywords.content,
      keywords.filePath,
      keywords.relativePath
    );

    testsFile = createRobotFile(
      tests.content,
      tests.filePath,
      tests.relativePath
    );

    workspace.addFile(keywordsFile);
    workspace.addFile(testsFile);
  });

  describe("findDefinition", () => {
    describe("keywords", () => {
      const assertIsSimpleKeyword = (definition: NodeDefinition) => {
        assert.equal(definition.uri, `file:///${keywords.filePath}`);
        assert.deepEqual(definition.range, range(5, 0, 6, 33));
        assert.equal(
          definition.node,
          keywordsFile.ast.keywordsTable.keywords[0]
        );
      };

      describe("simple keyword", () => {
        const runTest = (column: number) => {
          const actual = findDefinition(
            {
              filePath: "tests.robot",
              position: {
                line: 7,
                column,
              },
            },
            workspace
          );

          assertIsSimpleKeyword(actual);
        };

        it("beginning of keyword call", () => {
          runTest(2);
        });

        it("middle of keyword call", () => {
          runTest(10);
        });

        it("end of keyword call", () => {
          runTest(16);
        });
      });

      describe("gherking keywords", () => {
        const runTest = (line: number, column: number) => {
          const actual = findDefinition(
            {
              filePath: "tests.robot",
              position: {
                line,
                column,
              },
            },
            workspace
          );

          assertIsSimpleKeyword(actual);
        };

        it("works for given", () => {
          runTest(11, 2);
        });

        it("works for when", () => {
          runTest(12, 2);
        });

        it("works for then", () => {
          runTest(13, 2);
        });

        it("works for and", () => {
          runTest(14, 2);
        });

        it("works for but", () => {
          runTest(15, 2);
        });
      });

      it("non existing keyword", () => {
        const actual = findDefinition(
          {
            filePath: "tests.robot",
            position: {
              line: 18,
              column: 2,
            },
          },
          workspace
        );

        assert.isNull(actual);
      });

      it("non existing gherkin keyword", () => {
        const actual = findDefinition(
          {
            filePath: "tests.robot",
            position: {
              line: 19,
              column: 2,
            },
          },
          workspace
        );

        assert.isNull(actual);
      });
    });
  });
});
