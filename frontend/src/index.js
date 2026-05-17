import * as Sentry from "@sentry/react";
import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";

const root = ReactDOM.createRoot(document.getElementById("root"));
Sentry.init({
  dsn: process.env.REACT_APP_SENTRY_DSN,
  enabled: process.env.NODE_ENV === "production" && !!process.env.REACT_APP_SENTRY_DSN,
});
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
