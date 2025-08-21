// src/components/Layout.tsx

import {
  type ReactNode,
  useState,
  useRef,
  useEffect,
  useCallback,
} from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
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
  User,
  Lock,
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
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { perfilService } from "@/services/api";
import { useToast } from "@/components/ui/use-toast";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"; // Supondo que você use shadcn/ui
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

// Schemas para validação (inalterados)
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
  const { toast } = useToast();

  // --- Estados do Componente ---
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [modal, setModal] = useState<null | "nome" | "senha">(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // UX Enhancement: Estado para o Command Menu (Cmd+K)
  const [commandMenuOpen, setCommandMenuOpen] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);

  // --- Formulários (inalterados) ---
  const {
    register: registerNome,
    handleSubmit: handleSubmitNome,
    formState: { errors: errorsNome },
  } = useForm({
    resolver: zodResolver(nameSchema),
    defaultValues: { nome: user?.nome || "" },
  });
  const {
    register: registerSenha,
    handleSubmit: handleSubmitSenha,
    formState: { errors: errorsSenha },
  } = useForm({ resolver: zodResolver(passwordSchema) });

  // --- Efeitos ---

  // UX Enhancement: Adiciona atalho de teclado para abrir o Command Menu
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandMenuOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Efeito para fechar o menu do usuário ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [userMenuRef]);

  // --- Funções de Manipulação ---
  const handleLogout = useCallback(async () => {
    await logout();
    navigate("/login");
  }, [logout, navigate]);

  const runCommand = (command: () => void) => {
    setCommandMenuOpen(false);
    command();
  };

  // Funções onSubmit (inalteradas, mas agora podem ser chamadas pelo Command Menu)
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
      }
      toast({ title: "Sucesso!", description: "Nome atualizado." });
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

  // --- Definições de Navegação e Ações ---
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

  // UX Enhancement: Componente de Item de Navegação com Animação
  const NavItem = ({ item }: { item: (typeof navigation)[0] }) => (
    <li className="relative">
      <Link
        to={item.href}
        onClick={() => setSidebarOpen(false)}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors duration-200 relative z-10 ${
          isActivePath(item.href)
            ? "text-white"
            : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
        }`}
      >
        {item.icon}
        <span>{item.name}</span>
      </Link>
      {/* UX Enhancement: Animação "Magic Ink" para o item ativo */}
      {isActivePath(item.href) && (
        <motion.div
          layoutId="active-nav-item"
          className="absolute inset-0 bg-blue-600 rounded-md z-0"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      )}
    </li>
  );

  // --- Renderização do Componente ---
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
      {/* ================= Header Reimaginado ================= */}
      <header className="bg-white/80 backdrop-blur-lg shadow-sm border-b border-gray-200 fixed top-0 left-0 right-0 z-30">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <button
                type="button"
                className="md:hidden p-2 rounded-md text-gray-500 hover:bg-gray-100"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu size={24} />
              </button>
              <Link to="/dashboard" className="flex items-center gap-2">
                <img
                  src="/logoFrutosDaTerra.png"
                  alt="Logo Frutos da Terra"
                  className="h-10 w-10 object-contain"
                />
                <h1 className="text-xl font-bold text-gray-800 hidden sm:block">
                  Frutos da Terra
                </h1>
              </Link>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 text-sm font-medium text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                    {user?.nome?.[0]?.toUpperCase()}
                  </div>
                  <span className="hidden sm:inline">
                    Olá, {user?.nome?.split(" ")[0]}
                  </span>
                  <ChevronDown
                    size={16}
                    className={`transition-transform duration-300 ${
                      userMenuOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {/* UX Enhancement: Dropdown do Usuário com Animação */}
                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                      className="absolute right-0 mt-2 w-64 origin-top-right bg-white rounded-md shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none py-2"
                    >
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-800 truncate">
                          {user?.nome}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">
                          {user?.tipo}
                        </p>
                      </div>
                      <div className="py-1">
                        <button
                          onClick={() => {
                            setModal("nome");
                            setUserMenuOpen(false);
                          }}
                          className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <User size={16} /> Alterar Nome
                        </button>
                        <button
                          onClick={() => {
                            setModal("senha");
                            setUserMenuOpen(false);
                          }}
                          className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <Lock size={16} /> Alterar Senha
                        </button>
                      </div>
                      <div className="border-t border-gray-100 py-1">
                        <button
                          onClick={handleLogout}
                          className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <LogOut size={16} /> Sair
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
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
                <ul className="space-y-1">
                  {navigation.map((item) => (
                    <NavItem key={item.name} item={item} />
                  ))}
                </ul>
              </nav>
            </div>
          </div>
        </aside>

        {/* ================= Sidebar (Mobile) com Animação ================= */}
        <AnimatePresence>
          {sidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="fixed inset-0 bg-black/60 z-40 md:hidden"
                onClick={() => setSidebarOpen(false)}
              />
              <motion.aside
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="md:hidden fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl"
              >
                <div className="flex items-center justify-between h-16 px-4 border-b">
                  <h2 className="text-lg font-bold">Menu</h2>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="p-2 rounded-md text-gray-500 hover:bg-gray-100"
                  >
                    <X size={24} />
                  </button>
                </div>
                <nav className="mt-4 px-4">
                  <ul className="space-y-1">
                    {navigation.map((item) => (
                      <NavItem key={item.name} item={item} />
                    ))}
                  </ul>
                </nav>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* ================= Conteúdo Principal ================= */}
        <main className="flex-1 md:ml-64 pt-16">
          <div className="p-4 sm:p-6 lg:p-8">{children}</div>
        </main>

        <Toaster />

        {/* Modais (inalterados) */}
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

        {/* UX Enhancement: Command Menu (Cmd+K) */}
        <CommandDialog open={commandMenuOpen} onOpenChange={setCommandMenuOpen}>
          <VisuallyHidden>
            <h2>Menu de Comandos</h2>
          </VisuallyHidden>
          <CommandInput placeholder="Digite um comando ou pesquise..." />
          <CommandList>
            <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
            <CommandGroup heading="Navegação">
              {navigation.map((item) => (
                <CommandItem
                  key={item.href}
                  onSelect={() => runCommand(() => navigate(item.href))}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup heading="Ações">
              <CommandItem onSelect={() => runCommand(() => setModal("nome"))}>
                <User className="mr-2 h-4 w-4" />
                <span>Alterar Nome</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => setModal("senha"))}>
                <Lock className="mr-2 h-4 w-4" />
                <span>Alterar Senha</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(handleLogout)}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </CommandDialog>
      </div>
    </div>
  );
}
