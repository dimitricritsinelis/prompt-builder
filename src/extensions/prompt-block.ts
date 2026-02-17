import { Extension, mergeAttributes, Node, type Editor, type Range } from "@tiptap/core";
import Suggestion from "@tiptap/suggestion";
import { ReactNodeViewRenderer, type NodeViewProps } from "@tiptap/react";
import { createElement } from "react";
import { ContextBlock } from "../components/editor/blocks/ContextBlock";
import { ConstraintsBlock } from "../components/editor/blocks/ConstraintsBlock";
import { ExamplesBlock } from "../components/editor/blocks/ExamplesBlock";
import { FormatBlock } from "../components/editor/blocks/FormatBlock";
import { RoleBlock } from "../components/editor/blocks/RoleBlock";
import { TaskBlock } from "../components/editor/blocks/TaskBlock";
import {
  PROMPT_BLOCKS,
  type PromptBlockDefinition,
  type PromptBlockType,
  isPromptBlockType,
  promptBlockTemplate,
} from "../lib/promptBlocks";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    promptBlock: {
      insertPromptBlock: (blockType: PromptBlockType) => ReturnType;
    };
  }
}

type SlashItem = PromptBlockDefinition;

function PromptBlockNodeView(props: NodeViewProps) {
  const blockType = props.node.attrs.blockType as PromptBlockType;

  switch (blockType) {
    case "role":
      return createElement(RoleBlock, props);
    case "context":
      return createElement(ContextBlock, props);
    case "task":
      return createElement(TaskBlock, props);
    case "constraints":
      return createElement(ConstraintsBlock, props);
    case "examples":
      return createElement(ExamplesBlock, props);
    case "format":
      return createElement(FormatBlock, props);
    default:
      return createElement(RoleBlock, props);
  }
}

function insertPromptBlock(editor: Editor, range: Range, blockType: PromptBlockType) {
  editor
    .chain()
    .focus()
    .deleteRange(range)
    .insertContent(promptBlockTemplate(blockType))
    .run();
}

function buildSlashMenu() {
  let popup: HTMLDivElement | null = null;
  let selectedIndex = 0;
  let currentProps:
    | {
        items: SlashItem[];
        command: (item: SlashItem) => void;
        clientRect?: (() => DOMRect | null) | null;
      }
    | null = null;

  const destroyPopup = () => {
    if (popup && popup.parentNode) {
      popup.parentNode.removeChild(popup);
    }
    popup = null;
    currentProps = null;
    selectedIndex = 0;
  };

  const positionPopup = () => {
    if (!popup || !currentProps?.clientRect) return;
    const rect = currentProps.clientRect();
    if (!rect) return;
    popup.style.left = `${rect.left + window.scrollX}px`;
    popup.style.top = `${rect.bottom + window.scrollY + 6}px`;
  };

  const renderItems = () => {
    if (!popup || !currentProps) return;
    popup.innerHTML = "";

    currentProps.items.forEach((item, index) => {
      const option = document.createElement("button");
      option.type = "button";
      option.className = "slash-menu-item";
      if (index === selectedIndex) {
        option.classList.add("slash-menu-item-active");
      }

      option.innerHTML = `<span class="slash-menu-item-title">${item.label}</span><span class="slash-menu-item-description">${item.description}</span>`;
      option.addEventListener("mousedown", (event) => {
        event.preventDefault();
        currentProps?.command(item);
      });
      popup?.appendChild(option);
    });

    if (currentProps.items.length === 0) {
      const empty = document.createElement("div");
      empty.className = "slash-menu-empty";
      empty.textContent = "No matching block";
      popup.appendChild(empty);
    }
  };

  return {
    onStart(props: any) {
      popup = document.createElement("div");
      popup.className = "slash-menu";
      document.body.appendChild(popup);

      currentProps = props;
      selectedIndex = 0;
      renderItems();
      positionPopup();
    },
    onUpdate(props: any) {
      currentProps = props;
      selectedIndex = 0;
      renderItems();
      positionPopup();
    },
    onKeyDown(props: any) {
      if (!currentProps) return false;

      if (props.event.key === "ArrowDown") {
        props.event.preventDefault();
        selectedIndex = (selectedIndex + 1) % Math.max(currentProps.items.length, 1);
        renderItems();
        return true;
      }

      if (props.event.key === "ArrowUp") {
        props.event.preventDefault();
        selectedIndex =
          (selectedIndex - 1 + Math.max(currentProps.items.length, 1)) %
          Math.max(currentProps.items.length, 1);
        renderItems();
        return true;
      }

      if (props.event.key === "Enter") {
        const item = currentProps.items[selectedIndex];
        if (!item) return false;
        props.event.preventDefault();
        currentProps.command(item);
        return true;
      }

      if (props.event.key === "Escape") {
        destroyPopup();
        return true;
      }

      return false;
    },
    onExit() {
      destroyPopup();
    },
  };
}

export const PromptBlock = Node.create({
  name: "promptBlock",
  group: "block",
  content: "block+",
  draggable: true,
  defining: true,
  isolating: true,

  addAttributes() {
    return {
      blockType: {
        default: "role",
        parseHTML: (element: HTMLElement) => {
          const value = element.getAttribute("data-block-type") ?? "role";
          return isPromptBlockType(value) ? value : "role";
        },
        renderHTML: (attrs: { blockType?: PromptBlockType }) => ({
          "data-block-type": attrs.blockType ?? "role",
        }),
      },
      collapsed: {
        default: false,
        parseHTML: (element: HTMLElement) =>
          element.getAttribute("data-collapsed") === "true",
        renderHTML: (attrs: { collapsed?: boolean }) => ({
          "data-collapsed": attrs.collapsed ? "true" : "false",
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="prompt-block"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "prompt-block",
      }),
      0,
    ];
  },

  addCommands() {
    return {
      insertPromptBlock:
        (blockType: PromptBlockType) =>
        ({ commands }) =>
          commands.insertContent(promptBlockTemplate(blockType)),
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(PromptBlockNodeView);
  },
});

export const PromptBlockSlashMenu = Extension.create({
  name: "promptBlockSlashMenu",

  addProseMirrorPlugins() {
    return [
      Suggestion<SlashItem>({
        editor: this.editor,
        char: "/",
        startOfLine: true,
        allowSpaces: false,
        items: ({ query }) => {
          const normalized = query.toLowerCase().trim();
          if (!normalized) return PROMPT_BLOCKS;

          return PROMPT_BLOCKS.filter((item) =>
            `${item.slashKeyword} ${item.label.toLowerCase()}`
              .toLowerCase()
              .includes(normalized),
          );
        },
        command: ({ editor, range, props }) => {
          insertPromptBlock(editor, range, props.type);
        },
        render: buildSlashMenu,
      }),
    ];
  },
});
