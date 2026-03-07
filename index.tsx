import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router";
import App from "./App";

// Catch module-level errors before React mounts
window.addEventListener("error", (e) => {
  const root = document.getElementById("root");
  if (root && root.innerHTML === "") {
    root.innerHTML = `<div style="padding:32px;background:#fee;color:#900;font-family:monospace">
      <h2>Module Load Error</h2>
      <pre>${e.message}\n${e.filename}:${e.lineno}</pre>
    </div>`;
  }
});

window.addEventListener("unhandledrejection", (e) => {
  const root = document.getElementById("root");
  if (root && root.innerHTML === "") {
    root.innerHTML = `<div style="padding:32px;background:#fee;color:#900;font-family:monospace">
      <h2>Unhandled Promise Rejection</h2>
      <pre>${e.reason}</pre>
    </div>`;
  }
});

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return React.createElement("div",
        { style: { padding: 32, background: "#fee", color: "#900", fontFamily: "monospace" } },
        React.createElement("h2", null, "React Render Error"),
        React.createElement("pre", null, this.state.error.message + "\n" + this.state.error.stack)
      );
    }
    return this.props.children;
  }
}

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("No root element");

ReactDOM.createRoot(rootElement).render(
  React.createElement(ErrorBoundary, null,
    React.createElement(BrowserRouter, null,
      React.createElement(App)
    )
  )
);

