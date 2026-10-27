import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import AppLayout from "@/components/layout/AppLayout"
import Dashboard from "@/pages/Dashboard"
import Division from "@/pages/Division"
import Analytics from "@/pages/Reports"
import Leads from "@/pages/Leads"
import LeadDetail from "@/pages/LeadDetail"
import Pipeline from "@/pages/Pipeline"
import Territories from "@/pages/Territories"
import Accounts from "@/pages/Accounts"
import Quotes from "@/pages/Quotes"
import Tasks from "@/pages/Tasks"
import Targets from "@/pages/Targets"
import Invoices from "@/pages/Invoices"
import PaymentTerms from "@/pages/PaymentTerms"
import Approvals from "@/pages/Approvals"
import Materials from "@/pages/Materials"
import Products from "@/pages/Products"
import Playbooks from "@/pages/Playbooks"
import Team from "@/pages/Team"
import DataAccess from "@/pages/DataAccess"
import SettingsPage from "@/pages/Settings"
import NotFound from "@/pages/NotFound"

// Old Indonesian paths keep working via redirects
const legacy: Record<string, string> = {
  aktivitas: "/tasks", akun: "/accounts", penawaran: "/quotes", produk: "/products", konten: "/materials", playbook: "/playbooks",
  tim: "/team", target: "/targets", laporan: "/analytics", analitik: "/analytics", pengaturan: "/settings", divisi: "/division",
  invoice: "/invoices", termin: "/payment-terms", persetujuan: "/approvals",
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="division" element={<Division />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="leads" element={<Leads />} />
          <Route path="leads/:id" element={<LeadDetail />} />
          <Route path="pipeline" element={<Pipeline />} />
          <Route path="territories" element={<Territories />} />
          <Route path="accounts" element={<Accounts />} />
          <Route path="quotes" element={<Quotes />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="targets" element={<Targets />} />
          <Route path="invoices" element={<Invoices />} />
          <Route path="payment-terms" element={<PaymentTerms />} />
          <Route path="approvals" element={<Approvals />} />
          <Route path="materials" element={<Materials />} />
          <Route path="products" element={<Products />} />
          <Route path="playbooks" element={<Playbooks />} />
          <Route path="team" element={<Team />} />
          <Route path="data" element={<DataAccess />} />
          <Route path="settings" element={<SettingsPage />} />
          {Object.entries(legacy).map(([from, to]) => <Route key={from} path={from} element={<Navigate to={to} replace />} />)}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
