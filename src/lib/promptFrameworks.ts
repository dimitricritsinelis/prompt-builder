import type { JSONContent } from "@tiptap/core";

export type PromptSectionKey =
  | "role"
  | "task"
  | "context"
  | "constraints"
  | "output_format"
  | "example"
  | "objective"
  | "inputs"
  | "approach"
  | "edge_cases"
  | "examples"
  | "verification"
  | "system_behavior"
  | "input_variables"
  | "context_source_priority"
  | "output_contract"
  | "error_handling"
  | "test_cases"
  | "changelog"
  | "goal"
  | "milestones"
  | "questions_first_policy"
  | "work_plan"
  | "deliverable_format"
  | "stop_conditions";

export type PromptFrameworkId =
  | "basic"
  | "standard"
  | "advanced"
  | "developer"
  | "workflow";

export type PromptFrameworkSection = {
  sectionKey: PromptSectionKey;
  label: string;
  helper: string;
  defaultEnabled: boolean;
};

export type PromptFrameworkDefinition = {
  id: PromptFrameworkId;
  label: string;
  sections: PromptFrameworkSection[];
};

export const PROMPT_FRAMEWORKS: PromptFrameworkDefinition[] = [
  {
    id: "basic",
    label: "Basic",
    sections: [
      {
        sectionKey: "task",
        label: "TASK",
        helper: "What do you want me to do?",
        defaultEnabled: true,
      },
      {
        sectionKey: "context",
        label: "CONTEXT",
        helper: "What background should I use (or assume)?",
        defaultEnabled: true,
      },
      {
        sectionKey: "output_format",
        label: "OUTPUT",
        helper: "How should the answer look? (bullets/table/JSON + length)",
        defaultEnabled: true,
      },
      {
        sectionKey: "constraints",
        label: "CONSTRAINTS",
        helper: "Any must-do / must-avoid rules?",
        defaultEnabled: false,
      },
    ],
  },
  {
    id: "standard",
    label: "Standard",
    sections: [
      {
        sectionKey: "role",
        label: "ROLE",
        helper: "Who should I act as (expert/coach/editor)?",
        defaultEnabled: false,
      },
      {
        sectionKey: "task",
        label: "TASK",
        helper: "What do you want me to produce?",
        defaultEnabled: true,
      },
      {
        sectionKey: "context",
        label: "CONTEXT",
        helper: "Key facts, references, constraints from your world",
        defaultEnabled: true,
      },
      {
        sectionKey: "constraints",
        label: "CONSTRAINTS",
        helper: "Rules: scope, tone, length, do/don’t",
        defaultEnabled: true,
      },
      {
        sectionKey: "output_format",
        label: "OUTPUT FORMAT",
        helper: "Exact structure you want back",
        defaultEnabled: true,
      },
      {
        sectionKey: "example",
        label: "EXAMPLE",
        helper: "One small example of the style/format you want",
        defaultEnabled: false,
      },
    ],
  },
  {
    id: "advanced",
    label: "Advanced",
    sections: [
      {
        sectionKey: "role",
        label: "ROLE",
        helper: "What expertise/stance should I take?",
        defaultEnabled: true,
      },
      {
        sectionKey: "objective",
        label: "OBJECTIVE / SUCCESS CRITERIA",
        helper: "What does ‘done well’ mean?",
        defaultEnabled: true,
      },
      {
        sectionKey: "context",
        label: "CONTEXT",
        helper: "Reference material + definitions + key facts",
        defaultEnabled: true,
      },
      {
        sectionKey: "inputs",
        label: "INPUTS",
        helper: "What you’re providing (data, text, requirements)",
        defaultEnabled: true,
      },
      {
        sectionKey: "constraints",
        label: "CONSTRAINTS",
        helper: "Hard rules + boundaries",
        defaultEnabled: true,
      },
      {
        sectionKey: "approach",
        label: "APPROACH",
        helper: "How to tackle the task (steps/checklist)",
        defaultEnabled: true,
      },
      {
        sectionKey: "edge_cases",
        label: "EDGE CASES",
        helper: "What should I watch out for?",
        defaultEnabled: false,
      },
      {
        sectionKey: "examples",
        label: "EXAMPLES",
        helper: "A couple of input→output examples",
        defaultEnabled: false,
      },
      {
        sectionKey: "output_format",
        label: "OUTPUT FORMAT",
        helper: "Required structure/schema",
        defaultEnabled: true,
      },
      {
        sectionKey: "verification",
        label: "VERIFICATION / SELF-CHECK",
        helper: "How to verify quality before finalizing",
        defaultEnabled: true,
      },
    ],
  },
  {
    id: "developer",
    label: "Developer",
    sections: [
      {
        sectionKey: "system_behavior",
        label: "SYSTEM BEHAVIOR",
        helper: "Non-negotiable behavior rules (tone, safety, refusal style)",
        defaultEnabled: true,
      },
      {
        sectionKey: "task",
        label: "TASK",
        helper: "What the assistant must do (often variable-driven)",
        defaultEnabled: true,
      },
      {
        sectionKey: "input_variables",
        label: "INPUT VARIABLES",
        helper: "What the user/app will supply (types + examples)",
        defaultEnabled: true,
      },
      {
        sectionKey: "context_source_priority",
        label: "CONTEXT / SOURCE PRIORITY",
        helper: "What to trust first (Vault > user text > general knowledge)",
        defaultEnabled: true,
      },
      {
        sectionKey: "constraints",
        label: "CONSTRAINTS",
        helper: "Hard limits, compliance rules, performance bounds",
        defaultEnabled: true,
      },
      {
        sectionKey: "output_contract",
        label: "OUTPUT CONTRACT",
        helper: "Schema/format the system expects (JSON keys, tables, etc.)",
        defaultEnabled: true,
      },
      {
        sectionKey: "error_handling",
        label: "ERROR HANDLING",
        helper: "What to do when info is missing/ambiguous",
        defaultEnabled: true,
      },
      {
        sectionKey: "test_cases",
        label: "TEST CASES",
        helper: "Example inputs + what ‘good’ output looks like",
        defaultEnabled: false,
      },
      {
        sectionKey: "changelog",
        label: "CHANGELOG",
        helper: "Notes for maintaining the prompt over time",
        defaultEnabled: false,
      },
    ],
  },
  {
    id: "workflow",
    label: "Workflow",
    sections: [
      {
        sectionKey: "role",
        label: "ROLE",
        helper: "What kind of partner should I be?",
        defaultEnabled: true,
      },
      {
        sectionKey: "goal",
        label: "GOAL",
        helper: "What outcome are we trying to reach?",
        defaultEnabled: true,
      },
      {
        sectionKey: "context",
        label: "CONTEXT",
        helper: "Background + constraints + non-goals",
        defaultEnabled: true,
      },
      {
        sectionKey: "milestones",
        label: "MILESTONES",
        helper: "What steps and deliverables should we produce?",
        defaultEnabled: true,
      },
      {
        sectionKey: "questions_first_policy",
        label: "QUESTIONS FIRST POLICY",
        helper: "Ask questions first vs proceed with assumptions",
        defaultEnabled: true,
      },
      {
        sectionKey: "work_plan",
        label: "WORK PLAN",
        helper: "Step-by-step plan before execution",
        defaultEnabled: true,
      },
      {
        sectionKey: "deliverable_format",
        label: "DELIVERABLE FORMAT",
        helper: "What the final output should look like",
        defaultEnabled: true,
      },
      {
        sectionKey: "stop_conditions",
        label: "STOP CONDITIONS",
        helper: "When to stop vs continue",
        defaultEnabled: false,
      },
    ],
  },
];

export const INJECT_TARGET_SECTION_KEY = {
  ROLE: "role",
  CONTEXT: "context",
  CONSTRAINTS: "constraints",
} as const;

export function getFrameworkById(
  frameworkId: PromptFrameworkId,
): PromptFrameworkDefinition | undefined {
  return PROMPT_FRAMEWORKS.find((framework) => framework.id === frameworkId);
}

export function getDefaultSectionKeys(frameworkId: PromptFrameworkId): PromptSectionKey[] {
  const framework = getFrameworkById(frameworkId);
  if (!framework) return [];

  return framework.sections
    .filter((section) => section.defaultEnabled)
    .map((section) => section.sectionKey);
}

export function resolveSectionDefinition(
  sectionKey: PromptSectionKey,
): PromptFrameworkSection | undefined {
  for (const framework of PROMPT_FRAMEWORKS) {
    const section = framework.sections.find((item) => item.sectionKey === sectionKey);
    if (section) return section;
  }
  return undefined;
}

export function createPromptSectionNode(
  section: PromptFrameworkSection,
  initialText = "",
): JSONContent {
  const paragraph: JSONContent =
    initialText.trim().length > 0
      ? {
          type: "paragraph",
          content: [{ type: "text", text: initialText }],
        }
      : { type: "paragraph" };

  return {
    type: "promptSection",
    attrs: {
      sectionKey: section.sectionKey,
      label: section.label,
      helper: section.helper,
    },
    content: [paragraph],
  };
}

