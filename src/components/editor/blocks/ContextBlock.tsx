import type { NodeViewProps } from "@tiptap/react";
import { PromptBlockFrame } from "./PromptBlock";

export function ContextBlock(props: NodeViewProps) {
  return <PromptBlockFrame {...props} label="CONTEXT" accent="#3A7DBF" />;
}
