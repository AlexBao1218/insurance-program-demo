import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
const Layout = lazy(() => import("@/components/Layout").then(m => ({default:m.Layout})));
import HomePage from "@/pages/HomePage/HomePage";
const DashboardPage = lazy(() => import("@/pages/DashboardPage/DashboardPage"));
const AssistantPage = lazy(() => import("@/pages/AssistantPage/AssistantPage"));
const DataManagePage = lazy(() => import("@/pages/DataManagePage/DataManagePage"));
const ClassDetailPage = lazy(() => import("@/pages/ClassDetailPage/ClassDetailPage"));
import NotFoundPage from "@/pages/NotFoundPage/NotFoundPage";

export default function App() {
  return (
    <Suspense fallback={<div role="status" style={{padding:24}}>Loading…</div>}><Routes>
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
    </Routes></Suspense>
  );
}
