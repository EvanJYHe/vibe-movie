import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Analytics } from "@vercel/analytics/react";
import "./index.css";

const normalizedPath = window.location.pathname.replace(/\/+$/, "") || "/";
const isEditorRoute = normalizedPath === "/editor";

document.title = "VibeMovie";

async function renderRoute() {
  const Route = isEditorRoute
    ? (await import("./App.tsx")).default
    : (await import("./LandingPage.tsx")).LandingPage;

  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <Route />
      <Analytics />
    </StrictMode>
  );
}

void renderRoute();
