import { NodeViewContent, NodeViewWrapper, type NodeViewProps } from "@tiptap/react";

type PromptBlockFrameProps = NodeViewProps & {
  label: string;
  accent: string;
};

export function PromptBlockFrame({
  node,
  selected,
  updateAttributes,
  label,
  accent,
}: PromptBlockFrameProps) {
  const collapsed = Boolean(node.attrs.collapsed);
  const preview = node.textContent.trim().slice(0, 60);

  return (
    <NodeViewWrapper
      className={[
        "prompt-block",
        selected ? "prompt-block-selected" : "",
        collapsed ? "prompt-block-collapsed" : "",
      ].join(" ")}
      style={{ borderLeftColor: accent }}
    >
      <div className="prompt-block-labelbar">
        <div className="prompt-block-leading">
          <button
            type="button"
            className="prompt-block-icon-btn prompt-block-drag-handle"
            data-drag-handle
            title="Drag block"
            aria-label={`Drag ${label} block`}
          >
            ::
          </button>
          <span className="prompt-block-label">{label}</span>
        </div>
        <button
          type="button"
          className="prompt-block-icon-btn"
          onClick={() => updateAttributes({ collapsed: !collapsed })}
          title={collapsed ? "Expand block" : "Collapse block"}
          aria-label={collapsed ? "Expand block" : "Collapse block"}
        >
          {collapsed ? "+" : "-"}
        </button>
      </div>

      {collapsed ? (
        <p className="prompt-block-preview">
          {preview.length > 0 ? `${preview}${node.textContent.length > 60 ? "..." : ""}` : "Empty"}
        </p>
      ) : (
        <NodeViewContent className="prompt-block-content" />
      )}
    </NodeViewWrapper>
  );
}
