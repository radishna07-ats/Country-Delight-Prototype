import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { refreshUpcomingOrders } from "./backend/api";
import "./styles.css";

refreshUpcomingOrders();
ReactDOM.createRoot(document.getElementById("root")!).render(<React.StrictMode><App /></React.StrictMode>);
