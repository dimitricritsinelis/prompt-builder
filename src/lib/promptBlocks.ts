import type { JSONContent } from "@tiptap/core";

export type PromptBlockType =
  | "role"
  | "context"
  | "task"
  | "constraints"
  | "examples"
  | "format";

export type PromptBlockDefinition = {
  type: PromptBlockType;
  label: string;
  slashKeyword: string;
  description: string;
  placeholder: string;
  accent: string;
};

export const PROMPT_BLOCKS: PromptBlockDefinition[] = [
  {
    type: "role",
    label: "ROLE",
    slashKeyword: "role",
    description: "Who should the model be?",
    placeholder: "Define the assistant role.",
    accent: "#BF5B3A",
  },
  {
    type: "context",
    label: "CONTEXT",
    slashKeyword: "context",
    description: "Background and relevant details.",
    placeholder: "Add relevant background context.",
    accent: "#3A7DBF",
  },
  {
    type: "task",
    label: "TASK",
    slashKeyword: "task",
    description: "What should the model do?",
    placeholder: "Describe the task to perform.",
    accent: "#4E9A51",
  },
  {
    type: "constraints",
    label: "CONSTRAINTS",
    slashKeyword: "constraints",
    description: "Rules, limits, and must-avoid behavior.",
    placeholder: "List required constraints.",
    accent: "#A66FD4",
  },
  {
    type: "examples",
    label: "EXAMPLES",
    slashKeyword: "examples",
    description: "Reference examples or expected style.",
    placeholder: "Provide useful examples.",
    accent: "#D48A3A",
  },
  {
    type: "format",
    label: "OUTPUT FORMAT",
    slashKeyword: "format",
    description: "Required output shape.",
    placeholder: "Describe the desired output format.",
    accent: "#2A9D8F",
  },
];

export function promptBlockTemplate(type: PromptBlockType): JSONContent {
  const definition = PROMPT_BLOCKS.find((block) => block.type === type);

  return {
    type: "promptBlock",
    attrs: {
      blockType: type,
      collapsed: false,
    },
    content: [
      {
        type: "paragraph",
        content: definition
          ? [
              {
                type: "text",
                text: definition.placeholder,
              },
            ]
          : [],
      },
    ],
  };
}

export function promptTemplateDoc(): JSONContent {
  return {
    type: "doc",
    content: PROMPT_BLOCKS.map((block) => promptBlockTemplate(block.type)),
  };
}

export function promptTemplateText(): string {
  return PROMPT_BLOCKS.map((block) => `${block.label}\n${block.placeholder}`).join("\n\n");
}

export function isPromptBlockType(value: string): value is PromptBlockType {
  return PROMPT_BLOCKS.some((block) => block.type === value);
}
