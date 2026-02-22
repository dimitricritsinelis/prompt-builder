import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/theme.css";
import "./styles/editor.css";

performance.mark("promptpad:main:module-eval:start");

const root = document.getElementById("root");

function renderBootError(error: unknown) {
  if (!root) return;
  const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  root.innerHTML = `
    <div style="padding:24px;font-family: ui-monospace, SFMono-Regular, Menlo, monospace; color:#7f1d1d;">
      <h2 style="margin:0 0 8px;font-size:16px;">PromptPad failed to start</h2>
      <pre style="white-space:pre-wrap;line-height:1.4;font-size:12px;margin:0;">${message}</pre>
    </div>
  `;
}

window.addEventListener("error", (event) => {
  renderBootError(event.error ?? event.message);
});

window.addEventListener("unhandledrejection", (event) => {
  renderBootError(event.reason);
});

type RootErrorBoundaryState = {
  error: unknown | null;
};

class RootErrorBoundary extends React.Component<
  React.PropsWithChildren,
  RootErrorBoundaryState
> {
  override state: RootErrorBoundaryState = {
    error: null,
  };

  static getDerivedStateFromError(error: unknown): RootErrorBoundaryState {
    return { error };
  }

  override componentDidCatch(error: unknown) {
    renderBootError(error);
  }

  override render() {
    if (this.state.error) {
      return null;
    }
    return this.props.children;
  }
}

function start() {
  if (!root) return;

  try {
    performance.mark("promptpad:react:render:requested");
    ReactDOM.createRoot(root).render(
      <React.StrictMode>
        <RootErrorBoundary>
          <App />
        </RootErrorBoundary>
      </React.StrictMode>,
    );
    performance.mark("promptpad:react:render:scheduled");
  } catch (error) {
    renderBootError(error);
  }
}

start();
