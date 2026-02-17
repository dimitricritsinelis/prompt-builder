import type { NodeViewProps } from "@tiptap/react";
import { PromptBlockFrame } from "./PromptBlock";

export function TaskBlock(props: NodeViewProps) {
  return <PromptBlockFrame {...props} label="TASK" accent="#4E9A51" />;
}
