import type { NodeViewProps } from "@tiptap/react";
import { PromptBlockFrame } from "./PromptBlock";

export function FormatBlock(props: NodeViewProps) {
  return <PromptBlockFrame {...props} label="OUTPUT FORMAT" accent="#2A9D8F" />;
}
