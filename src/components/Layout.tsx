// src/components/Layout.tsx

import type { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import {
  GaugeCircle,
  Users,
  Box,
  ShoppingCart,
  Warehouse,
  BarChart3,
  ListTodo,
  Menu,
  X,
  LogOut,
  ChevronDown,
  Building2,
} from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/Toaster";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/Input";
import { Button } from "@/components/ui/Button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { perfilService } from "@/services/api";
import { useToast } from "@/components/ui/use-toast";
// Schemas para validação
const nameSchema = z.object({
  nome: z.string().min(3, "O nome deve ter pelo menos 3 caracteres."),
});
const passwordSchema = z.object({
  nova_senha: z
    .string()
    .min(6, "A nova senha deve ter pelo menos 6 caracteres."),
});

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const auth = useAuth();
  const { user, logout } = auth;
  const location = useLocation();
  const navigate = useNavigate();

  // Estado para modais
  const [modal, setModal] = useState<null | "nome" | "senha">(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Formulários
  const {
    register: registerNome,
    handleSubmit: handleSubmitNome,
    reset: resetNome,
    formState: { errors: errorsNome },
  } = useForm({
    resolver: zodResolver(nameSchema),
    defaultValues: { nome: user?.nome || "" },
  });
  const {
    register: registerSenha,
    handleSubmit: handleSubmitSenha,
    reset: resetSenha,
    formState: { errors: errorsSenha },
  } = useForm({ resolver: zodResolver(passwordSchema) });

  // --- Estados do Componente ---
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // --- Efeito para fechar o menu do usuário ao clicar fora ---
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [userMenuRef]);

  // --- Funções de Manipulação ---
  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  // Atualizar nome (funcionário e administrador)
  const onSubmitNome = async (data: { nome: string }) => {
    setIsSubmitting(true);
    try {
      if (!user) throw new Error("Usuário não autenticado.");
      let usuarioAtualizado;
      if (user.tipo === "administrador") {
        usuarioAtualizado = await perfilService.atualizarNomeAdmin(
          user.id,
          data.nome
        );
      } else {
        usuarioAtualizado = await perfilService.atualizarNome(data.nome);
      }
      if (typeof auth.updateUser === "function") {
        auth.updateUser(usuarioAtualizado);
      } else {
        localStorage.setItem("currentUser", JSON.stringify(usuarioAtualizado));
        window.dispatchEvent(new Event("storage"));
      }
      toast({ title: "Sucesso!", description: "Nome atualizado." });
      resetNome();
      setModal(null);
    } catch (err) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o nome.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Atualizar senha (funcionário e administrador)
  const onSubmitSenha = async (data: { nova_senha: string }) => {
    setIsSubmitting(true);
    try {
      if (!user) throw new Error("Usuário não autenticado.");
      if (user.tipo === "administrador") {
        await perfilService.alterarSenhaAdmin(user.id, data.nova_senha);
      } else {
        await perfilService.alterarSenha(data.nova_senha);
      }
      toast({ title: "Sucesso!", description: "Senha alterada." });
      resetSenha();
      setModal(null);
    } catch (err) {
      toast({
        title: "Erro",
        description: "Não foi possível alterar a senha.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeSidebar = () => setSidebarOpen(false);
  const toggleUserMenu = () => setUserMenuOpen(!userMenuOpen);

  // --- Definições de Navegação com Ícones Profissionais ---
  const navigationAdmin = [
    { name: "Dashboard", href: "/dashboard", icon: <GaugeCircle size={20} /> },
    { name: "Clientes", href: "/clientes", icon: <Users size={20} /> },
    { name: "Produtos", href: "/produtos", icon: <Box size={20} /> },
    { name: "Vendas", href: "/vendas", icon: <ShoppingCart size={20} /> },
    { name: "Estoque", href: "/estoque", icon: <Warehouse size={20} /> },
    { name: "Relatórios", href: "/relatorios", icon: <BarChart3 size={20} /> },
    { name: "Usuários", href: "/usuarios", icon: <Users size={20} /> },
  ];

  const navigationFuncionario = [
    { name: "Dashboard", href: "/dashboard", icon: <GaugeCircle size={20} /> },
    { name: "Separação", href: "/separacao", icon: <ListTodo size={20} /> },
  ];

  const navigation =
    user?.tipo === "administrador" ? navigationAdmin : navigationFuncionario;

  const isActivePath = (path: string) => location.pathname === path;

  // --- Componente de Item de Navegação Reutilizável ---
  const NavItem = ({ item }: { item: (typeof navigation)[0] }) => (
    <li key={item.name}>
      <Link
        to={item.href}
        onClick={closeSidebar}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 ${
          isActivePath(item.href)
            ? "bg-blue-50 text-blue-600 font-semibold"
            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        }`}
      >
        {item.icon}
        <span>{item.name}</span>
      </Link>
    </li>
  );

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      {/* ================= Header ================= */}
      <header className="bg-white/80 backdrop-blur-lg shadow-sm border-b border-gray-200 fixed top-0 left-0 right-0 z-30">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              {/* --- Botão do Menu Mobile --- */}
              <button
                type="button"
                className="md:hidden p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                onClick={() => setSidebarOpen(true)}
              >
                <span className="sr-only">Abrir menu</span>
                <Menu size={24} />
              </button>
              {/* --- Logo/Título --- */}
              <Link to="/dashboard" className="flex items-center gap-2">
                <Building2 className="h-7 w-7 text-blue-600" />
                <h1 className="text-xl font-bold text-gray-800 hidden sm:block">
                  SistemaCorp
                </h1>
              </Link>
            </div>

            {/* --- Menu do Usuário --- */}
            <div className="flex items-center gap-4">
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={toggleUserMenu}
                  className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <span>Olá, {user?.nome}</span>
                  <ChevronDown
                    size={16}
                    className={`transition-transform duration-200 ${
                      userMenuOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {/* --- Dropdown do Usuário --- */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 origin-top-right bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none py-1">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-800">
                        {user?.nome}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">
                        {user?.tipo}
                      </p>
                    </div>
                    {/* Opções para funcionário e administrador */}
                    <>
                      <button
                        onClick={() => {
                          setModal("nome");
                          setUserMenuOpen(false);
                          resetNome({ nome: user?.nome || "" });
                        }}
                        className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        Alterar Nome
                      </button>
                      <button
                        onClick={() => {
                          setModal("senha");
                          setUserMenuOpen(false);
                          resetSenha();
                        }}
                        className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        Alterar Senha
                      </button>
                    </>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut size={16} />
                      Sair
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* ================= Sidebar (Desktop) ================= */}
        <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
          <div className="flex flex-col flex-grow bg-white border-r border-gray-200 pt-16">
            <div className="flex-1 flex flex-col p-4 overflow-y-auto">
              <nav className="flex-1">
                <ul className="space-y-1.5">
                  {navigation.map((item) => (
                    <NavItem key={item.name} item={item} />
                  ))}
                </ul>
              </nav>
            </div>
          </div>
        </aside>

        {/* ================= Sidebar (Mobile) ================= */}
        {/* --- Overlay --- */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/60 z-40 md:hidden"
            onClick={closeSidebar}
          ></div>
        )}
        {/* --- Painel da Sidebar --- */}
        <aside
          className={`md:hidden fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between h-16 px-4 border-b">
            <h2 className="text-lg font-bold text-gray-900">Menu</h2>
            <button
              type="button"
              className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              onClick={closeSidebar}
            >
              <span className="sr-only">Fechar menu</span>
              <X size={24} />
            </button>
          </div>
          <nav className="mt-4 px-4">
            <ul className="space-y-1.5">
              {navigation.map((item) => (
                <NavItem key={item.name} item={item} />
              ))}
            </ul>
          </nav>
        </aside>

        {/* ================= Conteúdo Principal ================= */}
        <main className="flex-1 md:ml-64 pt-16">
          <div className="p-4 sm:p-6 lg:p-8">{children}</div>
        </main>
        <Toaster />
        {/* Modal Alterar Nome */}
        <Dialog open={modal === "nome"} onOpenChange={() => setModal(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Alterar Nome</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={handleSubmitNome(onSubmitNome)}
              className="space-y-4"
            >
              <div>
                <label
                  htmlFor="nome"
                  className="block text-sm font-medium text-gray-700"
                >
                  Novo nome
                </label>
                <Input id="nome" {...registerNome("nome")} />
                {errorsNome.nome && (
                  <p className="text-red-500 text-sm mt-1">
                    {errorsNome.nome.message}
                  </p>
                )}
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setModal(null)}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Salvando..." : "Salvar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        {/* Modal Alterar Senha */}
        <Dialog open={modal === "senha"} onOpenChange={() => setModal(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Alterar Senha</DialogTitle>
              <DialogDescription>
                Digite a nova senha de acesso.
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={handleSubmitSenha(onSubmitSenha)}
              className="space-y-4"
            >
              <div>
                <label
                  htmlFor="nova_senha"
                  className="block text-sm font-medium text-gray-700"
                >
                  Nova senha
                </label>
                <Input
                  id="nova_senha"
                  type="password"
                  {...registerSenha("nova_senha")}
                />
                {errorsSenha.nova_senha && (
                  <p className="text-red-500 text-sm mt-1">
                    {errorsSenha.nova_senha.message}
                  </p>
                )}
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setModal(null)}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Alterando..." : "Alterar Senha"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
