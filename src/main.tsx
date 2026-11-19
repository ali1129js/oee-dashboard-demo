import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { applyTheme, initialTheme } from "@/theme/theme";
import "./index.css";

applyTheme(initialTheme());

const root = document.getElementById("root");
if (!root) throw new Error("#root fehlt");
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>
);
