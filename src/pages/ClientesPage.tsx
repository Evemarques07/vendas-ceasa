import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/Input";
import { Loading } from "@/components/Loading";
import { clientesService } from "@/services/api";
import type { Cliente, FormCliente } from "@/types";

export function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Estado do formulário
  const [formData, setFormData] = useState<FormCliente>({
    nome: "",
    nome_fantasia: "",
    cpf_ou_cnpj: "",
    endereco: "",
    ponto_referencia: "",
    email: "",
    telefone1: "",
    telefone2: "",
  });

  useEffect(() => {
    carregarClientes();
  }, []);

  const carregarClientes = async () => {
    try {
      setLoading(true);
      const resultado = await clientesService.listar();
      setClientes(resultado.clientes || []);
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
      setClientes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCliente) {
        await clientesService.atualizar(editingCliente.id, formData);
      } else {
        await clientesService.criar(formData);
      }
      await carregarClientes();
      resetForm();
    } catch (error) {
      console.error("Erro ao salvar cliente:", error);
    }
  };

  const handleEdit = (cliente: Cliente) => {
    setEditingCliente(cliente);
    setFormData({
      nome: cliente.nome,
      nome_fantasia: cliente.nome_fantasia || "",
      cpf_ou_cnpj: cliente.cpf_ou_cnpj,
      endereco: cliente.endereco,
      ponto_referencia: cliente.ponto_referencia || "",
      email: cliente.email || "",
      telefone1: cliente.telefone1,
      telefone2: cliente.telefone2 || "",
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Tem certeza que deseja excluir este cliente?")) {
      try {
        await clientesService.excluir(id);
        await carregarClientes();
      } catch (error) {
        console.error("Erro ao excluir cliente:", error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      nome: "",
      nome_fantasia: "",
      cpf_ou_cnpj: "",
      endereco: "",
      ponto_referencia: "",
      email: "",
      telefone1: "",
      telefone2: "",
    });
    setEditingCliente(null);
    setShowForm(false);
  };

  const clientesFiltrados = (clientes || []).filter(
    (cliente) =>
      cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cliente.nome_fantasia &&
        cliente.nome_fantasia
          .toLowerCase()
          .includes(searchTerm.toLowerCase())) ||
      cliente.cpf_ou_cnpj.includes(searchTerm)
  );

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Clientes
        </h1>
        <Button onClick={() => setShowForm(true)} className="w-full sm:w-auto">
          + <span className="hidden sm:inline ml-1">Novo Cliente</span>
          <span className="sm:hidden ml-1">Novo</span>
        </Button>
      </div>

      {/* Busca */}
      <div className="mb-6">
        <Input
          placeholder="Buscar por nome, nome fantasia ou CPF/CNPJ..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full sm:max-w-md"
        />
      </div>

      {/* Modal do Formulário */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                  {editingCliente ? "Editar Cliente" : "Novo Cliente"}
                </h2>
                <Button variant="outline" onClick={resetForm}>
                  ✕
                </Button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Nome *"
                    value={formData.nome}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, nome: e.target.value }))
                    }
                    required
                  />
                  <Input
                    label="Nome Fantasia"
                    value={formData.nome_fantasia || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        nome_fantasia: e.target.value,
                      }))
                    }
                  />
                </div>

                <Input
                  label="CPF/CNPJ *"
                  value={formData.cpf_ou_cnpj}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      cpf_ou_cnpj: e.target.value,
                    }))
                  }
                  required
                />

                <Input
                  label="Endereço *"
                  value={formData.endereco}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      endereco: e.target.value,
                    }))
                  }
                  required
                />

                <Input
                  label="Ponto de Referência"
                  value={formData.ponto_referencia || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      ponto_referencia: e.target.value,
                    }))
                  }
                />

                <Input
                  label="Email"
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Telefone 1 *"
                    value={formData.telefone1}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        telefone1: e.target.value,
                      }))
                    }
                    placeholder="(11) 99999-9999"
                    required
                  />
                  <Input
                    label="Telefone 2"
                    value={formData.telefone2 || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        telefone2: e.target.value,
                      }))
                    }
                    placeholder="(11) 99999-9999"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-2 justify-end pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                    className="w-full sm:w-auto"
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" className="w-full sm:w-auto">
                    {editingCliente ? "Atualizar" : "Cadastrar"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Clientes */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-4">
            Lista de Clientes
          </h2>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    CPF/CNPJ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contato
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Endereço
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {clientesFiltrados.map((cliente) => (
                  <tr key={cliente.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {cliente.nome}
                        </div>
                        {cliente.nome_fantasia && (
                          <div className="text-sm text-gray-500">
                            {cliente.nome_fantasia}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {cliente.cpf_ou_cnpj}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {cliente.email}
                      </div>
                      <div className="text-sm text-gray-500">
                        {cliente.telefone1}
                        {cliente.telefone2 && `, ${cliente.telefone2}`}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {cliente.endereco}
                      </div>
                      {cliente.ponto_referencia && (
                        <div className="text-sm text-gray-500">
                          {cliente.ponto_referencia}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(cliente)}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(cliente.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Excluir
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {clientesFiltrados.map((cliente) => (
              <div
                key={cliente.id}
                className="border rounded-lg p-4 bg-gray-50"
              >
                <div className="mb-3">
                  <h3 className="font-medium text-lg text-gray-900">
                    {cliente.nome}
                  </h3>
                  {cliente.nome_fantasia && (
                    <p className="text-gray-600 text-sm">
                      {cliente.nome_fantasia}
                    </p>
                  )}
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">CPF/CNPJ:</span>
                    <span className="font-medium">{cliente.cpf_ou_cnpj}</span>
                  </div>

                  {cliente.email && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Email:</span>
                      <span className="font-medium truncate ml-2">
                        {cliente.email}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Telefone:</span>
                    <span className="font-medium">
                      {cliente.telefone1}
                      {cliente.telefone2 && `, ${cliente.telefone2}`}
                    </span>
                  </div>

                  <div className="text-sm">
                    <span className="text-gray-500 block">Endereço:</span>
                    <span className="font-medium">{cliente.endereco}</span>
                    {cliente.ponto_referencia && (
                      <span className="text-gray-600 block text-xs mt-1">
                        Ref: {cliente.ponto_referencia}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(cliente)}
                    className="flex-1"
                  >
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(cliente.id)}
                    className="flex-1 text-red-600 hover:text-red-900 hover:bg-red-50"
                  >
                    Excluir
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {clientesFiltrados.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {searchTerm
                ? "Nenhum cliente encontrado"
                : "Nenhum cliente cadastrado"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
