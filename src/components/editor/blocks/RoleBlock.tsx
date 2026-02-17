import type { NodeViewProps } from "@tiptap/react";
import { PromptBlockFrame } from "./PromptBlock";

export function RoleBlock(props: NodeViewProps) {
  return <PromptBlockFrame {...props} label="ROLE" accent="#BF5B3A" />;
}
