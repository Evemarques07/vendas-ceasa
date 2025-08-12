import { createBrowserRouter, Navigate } from "react-router-dom";
import { LoginPage } from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import { ClientesPage } from "@/pages/ClientesPage";
import { ProdutosPage } from "@/pages/ProdutosPage";
import { VendasPage } from "@/pages/VendasPage";
import { SeparacaoPage } from "@/pages/SeparacaoPage";
import EstoquePage from "@/pages/EstoquePage";
import { RelatoriosPage } from "@/pages/RelatoriosPage";
import { AuthGuard } from "@/components/AuthGuard";
import { RoleGuard } from "@/components/RoleGuard";
import { Layout } from "@/components/Layout";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/dashboard",
    element: (
      <AuthGuard>
        <Layout>
          <DashboardPage />
        </Layout>
      </AuthGuard>
    ),
  },
  {
    path: "/clientes",
    element: (
      <AuthGuard>
        <RoleGuard allowedRoles={["administrador"]}>
          <Layout>
            <ClientesPage />
          </Layout>
        </RoleGuard>
      </AuthGuard>
    ),
  },
  {
    path: "/produtos",
    element: (
      <AuthGuard>
        <RoleGuard allowedRoles={["administrador"]}>
          <Layout>
            <ProdutosPage />
          </Layout>
        </RoleGuard>
      </AuthGuard>
    ),
  },
  {
    path: "/vendas",
    element: (
      <AuthGuard>
        <RoleGuard allowedRoles={["administrador"]}>
          <Layout>
            <VendasPage />
          </Layout>
        </RoleGuard>
      </AuthGuard>
    ),
  },
  {
    path: "/separacao",
    element: (
      <AuthGuard>
        <RoleGuard allowedRoles={["funcionario"]}>
          <Layout>
            <SeparacaoPage />
          </Layout>
        </RoleGuard>
      </AuthGuard>
    ),
  },
  {
    path: "/estoque",
    element: (
      <AuthGuard>
        <RoleGuard allowedRoles={["administrador"]}>
          <Layout>
            <EstoquePage />
          </Layout>
        </RoleGuard>
      </AuthGuard>
    ),
  },
  {
    path: "/relatorios",
    element: (
      <AuthGuard>
        <RoleGuard allowedRoles={["administrador"]}>
          <Layout>
            <RelatoriosPage />
          </Layout>
        </RoleGuard>
      </AuthGuard>
    ),
  },
  {
    path: "*",
    element: <Navigate to="/dashboard" replace />,
  },
]);
