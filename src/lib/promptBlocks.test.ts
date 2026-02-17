import { describe, expect, it } from "vitest";
import { PROMPT_BLOCKS, promptTemplateDoc, promptTemplateText } from "./promptBlocks";

describe("prompt block templates", () => {
  it("creates a prompt template doc with all block types in canonical order", () => {
    const doc = promptTemplateDoc();
    const blockTypes =
      doc.content?.map((node) => node.attrs?.blockType as string | undefined) ?? [];

    expect(blockTypes).toEqual(PROMPT_BLOCKS.map((block) => block.type));
  });

  it("derives placeholder text for every block", () => {
    const bodyText = promptTemplateText();

    for (const block of PROMPT_BLOCKS) {
      expect(bodyText).toContain(block.label);
      expect(bodyText).toContain(block.placeholder);
    }
  });
});
