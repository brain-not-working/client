import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import axios from "axios";
import { SpeedInsights } from "@vercel/speed-insights/react"
import {  Analytics } from "@vercel/analytics/react"

// Set base URL for API requests
axios.defaults.baseURL =
  import.meta.env.VITE_API_URL || "http://localhost:8000";

// Add token to requests if available
const adminToken = localStorage.getItem("adminToken");
const vendorToken = localStorage.getItem("vendorToken");

if (window.location.pathname.startsWith("/") && adminToken) {
  axios.defaults.headers.common["Authorization"] = `Bearer ${adminToken}`;
} else if (window.location.pathname.startsWith("/") && vendorToken) {
  axios.defaults.headers.common["Authorization"] = `Bearer ${vendorToken}`;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <>
    <SpeedInsights />
    <Analytics />
    <App />
  </>
);
