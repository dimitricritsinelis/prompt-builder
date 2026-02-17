import type { NodeViewProps } from "@tiptap/react";
import { PromptBlockFrame } from "./PromptBlock";

export function ExamplesBlock(props: NodeViewProps) {
  return <PromptBlockFrame {...props} label="EXAMPLES" accent="#D48A3A" />;
}
