"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";

export function SidebarWrapper() {
const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);

return <Sidebar collapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />;
}
