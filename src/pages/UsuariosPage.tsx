// src/pages/UsuariosPage.tsx

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PlusCircle, Trash2, ToggleLeft, ToggleRight } from "lucide-react";

import { userService } from "@/services/api";
import type { Usuario, FormUsuarioCreate } from "@/types";

// Componentes de UI
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/Loading";
import Table from "@/components/Table";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/TableParts";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { formatCpfCnpj } from "@/lib/utils";

// --- Esquema de Validação com Zod ---
const createSchema = z.object({
  nome: z.string().min(3, "O nome deve ter pelo menos 3 caracteres."),
  cpf_ou_cnpj: z
    .string()
    .min(11, "O CPF/CNPJ deve ter pelo menos 11 dígitos.")
    .max(14, "CPF/CNPJ inválido"),
});

// --- Tipos para o Modal (simplificado) ---
type ModalState =
  | { type: "create" }
  | { type: "delete"; user: Usuario }
  | { type: null };

export function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalState, setModalState] = useState<ModalState>({ type: null });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const {
    register: registerCreate,
    handleSubmit: handleSubmitCreate,
    reset: resetCreate,
    formState: { errors: errorsCreate },
  } = useForm<FormUsuarioCreate>({ resolver: zodResolver(createSchema) });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await userService.listar();
      setUsuarios(data);
    } catch (err) {
      setError("Falha ao carregar usuários.");
      toast({
        title: "Erro",
        description: "Não foi possível buscar os usuários.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCloseModal = () => {
    setModalState({ type: null });
    resetCreate();
  };

  const handleCreateSubmit = async (data: FormUsuarioCreate) => {
    setIsSubmitting(true);
    try {
      await userService.criar(data);
      toast({ title: "Sucesso!", description: "Usuário criado com sucesso." });
      await fetchUsers();
      handleCloseModal();
    } catch (err: any) {
      toast({
        title: "Erro",
        description: err.message || "Não foi possível criar o usuário.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Nova função para alternar o status de ativo/inativo
  const handleToggleActive = async (user: Usuario) => {
    try {
      await userService.atualizarAtivo(user.id, !user.ativo);
      toast({
        title: "Sucesso!",
        description: `Usuário ${user.nome} foi ${
          !user.ativo ? "ativado" : "desativado"
        }.`,
      });
      await fetchUsers(); // Re-busca a lista para refletir a mudança
    } catch (err: any) {
      toast({
        title: "Erro",
        description:
          err.message || "Não foi possível atualizar o status do usuário.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (modalState.type !== "delete") return;
    setIsSubmitting(true);
    try {
      await userService.excluir(modalState.user.id);
      toast({
        title: "Sucesso!",
        description: "Usuário excluído com sucesso.",
      });
      await fetchUsers();
      handleCloseModal();
    } catch (err: any) {
      toast({
        title: "Erro",
        description: err.message || "Não foi possível excluir o usuário.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <Loading />;
  if (error) return <div className="text-red-500 text-center p-4">{error}</div>;

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Gerenciamento de Funcionários
          </h1>
          <p className="text-gray-500 mt-1">
            Crie, desative e gerencie os funcionários do sistema.
          </p>
        </div>
        <Button
          onClick={() => setModalState({ type: "create" })}
          className="w-full sm:w-auto"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Funcionário
        </Button>
      </header>

      {/* --- Estrutura Responsiva --- */}

      {/* Tabela para Desktop (visível a partir do breakpoint 'md') */}
      <div className="hidden md:block bg-white rounded-lg border border-gray-200 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-left">Nome</TableHead>
              <TableHead className="text-left">CPF/CNPJ</TableHead>
              <TableHead className="text-left">Status</TableHead>
              <TableHead className="text-right w-[120px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usuarios.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.nome}</TableCell>
                <TableCell>{formatCpfCnpj(user.cpf_ou_cnpj)}</TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      user.ativo
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {user.ativo ? "Ativo" : "Inativo"}
                  </span>
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleActive(user)}
                    title={user.ativo ? "Desativar" : "Ativar"}
                  >
                    {user.ativo ? (
                      <ToggleRight className="h-5 w-5 text-green-600" />
                    ) : (
                      <ToggleLeft className="h-5 w-5 text-gray-500" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setModalState({ type: "delete", user })}
                    title="Excluir"
                  >
                    <Trash2 className="h-5 w-5 text-red-600" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Lista de Cards para Mobile (visível até o breakpoint 'md') */}
      <div className="md:hidden space-y-4">
        {usuarios.map((user) => (
          <div
            key={user.id}
            className="bg-white p-4 rounded-lg border shadow-sm space-y-3"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="font-bold text-gray-800">{user.nome}</p>
                <p className="text-sm text-gray-500">
                  {formatCpfCnpj(user.cpf_ou_cnpj)}
                </p>
              </div>
              <span
                className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  user.ativo
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {user.ativo ? "Ativo" : "Inativo"}
              </span>
            </div>
            <div className="flex justify-end items-center border-t pt-2 space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleToggleActive(user)}
              >
                {user.ativo ? (
                  <ToggleRight className="mr-2 h-4 w-4" />
                ) : (
                  <ToggleLeft className="mr-2 h-4 w-4" />
                )}
                {user.ativo ? "Desativar" : "Ativar"}
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setModalState({ type: "delete", user })}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* --- Modais --- */}

      {/* Modal de Criar Usuário */}
      <Dialog
        open={modalState.type === "create"}
        onOpenChange={handleCloseModal}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Novo Funcionário</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={handleSubmitCreate(handleCreateSubmit)}
            className="space-y-4"
          >
            <div>
              <Label htmlFor="nome">Nome</Label>
              <Input id="nome" {...registerCreate("nome")} />
              {errorsCreate.nome && (
                <p className="text-red-500 text-sm mt-1">
                  {errorsCreate.nome.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="cpf_ou_cnpj">CPF/CNPJ</Label>
              <Input id="cpf_ou_cnpj" {...registerCreate("cpf_ou_cnpj")} />
              {errorsCreate.cpf_ou_cnpj && (
                <p className="text-red-500 text-sm mt-1">
                  {errorsCreate.cpf_ou_cnpj.message}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseModal}
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

      {/* Modal de Excluir */}
      <Dialog
        open={modalState.type === "delete"}
        onOpenChange={handleCloseModal}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Você tem certeza que deseja excluir o funcionário{" "}
              <strong>
                {modalState.type === "delete" && modalState.user.nome}
              </strong>
              ? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCloseModal}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Excluindo..." : "Confirmar Exclusão"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
