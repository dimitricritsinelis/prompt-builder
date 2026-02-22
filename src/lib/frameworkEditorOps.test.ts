import type { JSONContent } from "@tiptap/core";
import { describe, expect, it } from "vitest";
import {
  applyFrameworkToContent,
  injectContextIntoContent,
  sortSectionKeys,
  syncFrameworkSectionsInContent,
} from "./frameworkEditorOps";
import { getFrameworkById } from "./promptFrameworks";

function paragraph(text: string): JSONContent {
  return {
    type: "paragraph",
    content: [{ type: "text", text }],
  };
}

function line(node: JSONContent | undefined): string {
  if (!node) return "";
  if (!Array.isArray(node.content)) return typeof node.text === "string" ? node.text : "";
  return node.content
    .map((child) => (typeof child.text === "string" ? child.text : ""))
    .join("");
}

describe("frameworkEditorOps", () => {
  it("applies framework sections in canonical order", () => {
    const framework = getFrameworkById("basic");
    expect(framework).toBeTruthy();

    const orderedKeys = sortSectionKeys(framework!, ["context", "task"]);
    const result = applyFrameworkToContent([paragraph("Existing body")], framework!, orderedKeys, "replace");

    expect(line(result[0])).toBe("TASK: ");
    expect(line(result[1])).toBe("CONTEXT: ");
  });

  it("syncs sections while preserving section text and non-framework content", () => {
    const framework = getFrameworkById("basic");
    expect(framework).toBeTruthy();

    const initial = [
      paragraph("Keep this standalone paragraph"),
      paragraph("CONTEXT: dataset and operations"),
      paragraph("TASK: summarize output"),
    ];

    const result = syncFrameworkSectionsInContent(
      initial,
      framework!,
      sortSectionKeys(framework!, ["task", "context"]),
      () => true,
    );

    expect(result.applied).toBe(true);
    expect(line(result.content[0])).toBe("TASK: summarize output");
    expect(line(result.content[1])).toBe("CONTEXT: dataset and operations");
    expect(line(result.content[2])).toBe("Keep this standalone paragraph");
  });

  it("cancels section removal when confirmation is denied", () => {
    const framework = getFrameworkById("basic");
    expect(framework).toBeTruthy();

    const initial = [paragraph("TASK: write a spec"), paragraph("CONSTRAINTS: do not skip tests")];

    const result = syncFrameworkSectionsInContent(
      initial,
      framework!,
      sortSectionKeys(framework!, ["task"]),
      () => false,
    );

    expect(result.applied).toBe(false);
    expect(result.content).toEqual(initial);
  });

  it("injects vault content into matching sections and prepends missing sections", () => {
    const initial = [
      paragraph("TASK: Generate a concise summary"),
      paragraph("CONTEXT: "),
      paragraph("OUTPUT: bullet list"),
    ];

    const result = injectContextIntoContent(initial, [
      { target: "CONTEXT", text: "Reservoir pressure trends from Q1-Q4" },
      { target: "ROLE", text: "Senior production engineer" },
    ]);

    expect(line(result[0])).toBe("ROLE: Senior production engineer");
    expect(line(result[2])).toBe("CONTEXT: Reservoir pressure trends from Q1-Q4");
  });
});
