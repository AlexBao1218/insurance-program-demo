import { Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import HomePage from "@/pages/HomePage/HomePage";
import DashboardPage from "@/pages/DashboardPage/DashboardPage";
import AssistantPage from "@/pages/AssistantPage/AssistantPage";
import DataManagePage from "@/pages/DataManagePage/DataManagePage";
import ClassDetailPage from "@/pages/ClassDetailPage/ClassDetailPage";
import NotFoundPage from "@/pages/NotFoundPage/NotFoundPage";

export default function App() {
  return (
    <Routes>
      {/* Hub 门户页：独立全屏布局，无侧边栏 */}
      <Route index element={<HomePage />} />
      {/* 内部程序页面：带侧边栏 Layout */}
      <Route element={<Layout />}>
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="assistant" element={<AssistantPage />} />
        <Route path="data" element={<DataManagePage />} />
        <Route path="data/class/:classId" element={<ClassDetailPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
