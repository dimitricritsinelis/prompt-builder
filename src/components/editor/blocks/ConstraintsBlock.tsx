import type { NodeViewProps } from "@tiptap/react";
import { PromptBlockFrame } from "./PromptBlock";

export function ConstraintsBlock(props: NodeViewProps) {
  return <PromptBlockFrame {...props} label="CONSTRAINTS" accent="#A66FD4" />;
}
