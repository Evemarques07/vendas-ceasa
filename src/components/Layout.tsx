import type { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button } from "./Button";
import { useAuth } from "@/contexts/AuthContext";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const navigationAdmin = [
    { name: "Dashboard", href: "/dashboard", icon: "📊" },
    { name: "Clientes", href: "/clientes", icon: "👥" },
    { name: "Produtos", href: "/produtos", icon: "🛒" },
    { name: "Vendas", href: "/vendas", icon: "💰" },
    { name: "Estoque", href: "/estoque", icon: "📦" },
    { name: "Relatórios", href: "/relatorios", icon: "📈" },
  ];

  const navigationFuncionario = [
    { name: "Dashboard", href: "/dashboard", icon: "📊" },
    { name: "Separação", href: "/separacao", icon: "📋" },
  ];

  // Navegação baseada no tipo de usuário
  const navigation =
    user?.tipo === "administrador" ? navigationAdmin : navigationFuncionario;

  const isActivePath = (path: string) => location.pathname === path;

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 md:relative fixed top-0 left-0 right-0 z-[60] md:z-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              {/* Mobile menu button */}
              <button
                type="button"
                className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <span className="sr-only">Abrir menu</span>
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
              <h1 className="ml-2 md:ml-0 text-lg sm:text-xl font-bold text-gray-900">
                Sistema de Vendas
              </h1>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4">
              <span className="hidden sm:block text-sm text-gray-700">
                Olá, {user?.nome}
              </span>
              <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {user?.tipo === "administrador" ? "Admin" : "Funcionário"}
              </span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <span className="hidden sm:inline">Sair</span>
                <span className="sm:hidden">👋</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 md:hidden">
          <div
            className="fixed inset-0 bg-gray-600 bg-opacity-75"
            onClick={closeSidebar}
          ></div>
        </div>
      )}

      <div className="flex">
        {/* Desktop Sidebar */}
        <nav className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 md:pt-16">
          <div className="flex-1 flex flex-col min-h-0 bg-white shadow-sm">
            <div className="flex-1 flex flex-col pt-4 pb-4 overflow-y-auto">
              <div className="px-4">
                <ul className="space-y-2">
                  {navigation.map((item) => (
                    <li key={item.name}>
                      <Link
                        to={item.href}
                        className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                          isActivePath(item.href)
                            ? "bg-blue-100 text-blue-700"
                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                        }`}
                      >
                        <span className="mr-3 text-lg">{item.icon}</span>
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </nav>

        {/* Mobile Sidebar */}
        <nav
          className={`md:hidden fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-sm transform transition-transform duration-300 ease-in-out ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 mt-16">
            <h2 className="text-lg font-bold text-gray-900">Menu</h2>
            <button
              type="button"
              className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              onClick={closeSidebar}
            >
              <span className="sr-only">Fechar menu</span>
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <div className="mt-4 px-4">
            <ul className="space-y-2">
              {navigation.map((item) => (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    onClick={closeSidebar}
                    className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActivePath(item.href)
                        ? "bg-blue-100 text-blue-700"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <span className="mr-3 text-lg">{item.icon}</span>
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 md:ml-64">
          <div className="pt-20 md:pt-6 min-h-screen">{children}</div>
        </main>
      </div>
    </div>
  );
}
