import React, { useState, useEffect } from "react";
import {
  Plus,
  Package,
  TrendingUp,
  TrendingDown,
  BarChart3,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/Input";
import { Loading } from "../components/Loading";
import { estoqueService, produtosService } from "../services/api";
import type {
  EntradaEstoque,
  Inventario,
  FluxoCaixa,
  Produto,
  AlertasEstoque,
  FormEntradaEstoque,
  FormCorrecaoInventario,
} from "../types";

// Tipo para movimentação na view (combina entradas e saídas)
interface MovimentoEstoque {
  id: number;
  produtoId: number;
  produto: string;
  tipo: "entrada" | "saida" | "inventario";
  quantidade: number;
  preco?: number;
  data: string;
  observacao?: string;
  fornecedor?: string;
}

export default function EstoquePage() {
  const [activeTab, setActiveTab] = useState<
    "movimentos" | "produtos" | "relatorio"
  >("produtos");

  // Estados para dados da API
  const [entradas, setEntradas] = useState<EntradaEstoque[]>([]);
  const [inventario, setInventario] = useState<Inventario[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [alertas, setAlertas] = useState<AlertasEstoque | null>(null);
  const [fluxoCaixa, setFluxoCaixa] = useState<FluxoCaixa | null>(null);

  // Estados de UI
  const [loading, setLoading] = useState(true);
  const [loadingForm, setLoadingForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [alertasExpanded, setAlertasExpanded] = useState(false);
  const [isCorrecaoVisible, setIsCorrecaoVisible] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] =
    useState<Inventario | null>(null);

  // Form state para entrada de estoque
  const [formData, setFormData] = useState<FormEntradaEstoque>({
    produto_id: 0,
    quantidade: 0,
    preco_custo: 0,
    fornecedor: "",
    tipo_medida: "kg",
    observacoes: "",
  });

  // Form state para correção de inventário
  const [formCorrecao, setFormCorrecao] = useState<FormCorrecaoInventario>({
    quantidade_atual: 0,
    observacoes: "",
  });

  useEffect(() => {
    carregarDados();
  }, [activeTab]);

  const carregarDados = async () => {
    try {
      setLoading(true);
      setError(null);

      // Carregar produtos primeiro (necessário para o formulário)
      const produtosResponse = await produtosService.listar({ limit: 100 });
      setProdutos(produtosResponse.produtos);

      if (activeTab === "movimentos") {
        // Carregar entradas de estoque
        const entradasResponse = await estoqueService.listarEntradas({
          limit: 50,
        });
        setEntradas(entradasResponse.entradas);
      } else if (activeTab === "produtos") {
        // Carregar inventário
        const inventarioResponse = await estoqueService.obterInventario({
          limit: 100,
        });
        setInventario(inventarioResponse.inventario);

        // Carregar alertas
        const alertasResponse = await estoqueService.obterAlertas();
        setAlertas(alertasResponse);
      } else if (activeTab === "relatorio") {
        // Carregar fluxo de caixa do mês atual
        const hoje = new Date();
        const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

        const fluxoResponse = await estoqueService.obterFluxoCaixa({
          data_inicio: inicioMes.toISOString().split("T")[0],
          data_fim: fimMes.toISOString().split("T")[0],
        });
        setFluxoCaixa(fluxoResponse);
      }
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
      setError("Erro ao carregar dados do estoque");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoadingForm(true);
      setError(null);

      // Criar entrada de estoque
      await estoqueService.registrarEntrada(formData, produtos);

      // Recarregar dados
      await carregarDados();

      // Fechar formulário
      resetForm();
    } catch (err) {
      console.error("Erro ao criar entrada:", err);
      setError("Erro ao criar entrada de estoque");
    } finally {
      setLoadingForm(false);
    }
  };

  const resetForm = () => {
    setFormData({
      produto_id: 0,
      quantidade: 0,
      preco_custo: 0,
      fornecedor: "",
      tipo_medida: "kg",
      observacoes: "",
    });
    setIsFormVisible(false);
  };

  const resetFormCorrecao = () => {
    setFormCorrecao({
      quantidade_atual: 0,
      observacoes: "",
    });
    setIsCorrecaoVisible(false);
    setProdutoSelecionado(null);
  };

  const handleCorrecaoInventario = (item: Inventario) => {
    setProdutoSelecionado(item);
    setFormCorrecao({
      quantidade_atual: parseFloat(item.quantidade_atual),
      observacoes: "",
    });
    setIsCorrecaoVisible(true);
  };

  const handleSubmitCorrecao = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!produtoSelecionado) return;

    try {
      setLoadingForm(true);
      setError(null);

      // Validação local
      if (formCorrecao.observacoes.trim() === "") {
        throw new Error("Observações são obrigatórias para auditoria");
      }

      await estoqueService.corrigirInventario(produtoSelecionado.produto_id, {
        quantidade_atual: formCorrecao.quantidade_atual,
        observacoes: formCorrecao.observacoes,
      });

      // Recarregar dados
      await carregarDados();

      // Fechar formulário
      resetFormCorrecao();

      alert("Correção de inventário realizada com sucesso!");
    } catch (err: any) {
      console.error("Erro ao corrigir inventário:", err);
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        "Erro desconhecido ao corrigir inventário";
      setError(`Erro ao corrigir inventário: ${errorMessage}`);
    } finally {
      setLoadingForm(false);
    }
  };

  // Função para converter entradas em movimentos para exibição
  const getMovimentosFromEntradas = (): MovimentoEstoque[] => {
    return entradas.map((entrada) => ({
      id: entrada.id,
      produtoId: entrada.produto_id,
      produto: entrada.produto?.nome || `Produto ID: ${entrada.produto_id}`,
      tipo: "entrada" as const,
      quantidade: entrada.quantidade,
      preco: entrada.preco_custo ? Number(entrada.preco_custo) : undefined,
      data: entrada.data_entrada,
      observacao: entrada.observacoes,
      fornecedor: entrada.fornecedor,
    }));
  };

  const handleDelete = async (id: number) => {
    try {
      // Primeiro, verificar se a entrada pode ser deletada
      const statusExclusao = await estoqueService.verificarStatusExclusao(id);

      if (!statusExclusao.pode_deletar) {
        // Mostrar motivos pelos quais não pode deletar
        const motivos =
          statusExclusao.motivos_bloqueio?.join("\n• ") ||
          "Motivo não especificado";
        alert(
          `Esta entrada não pode ser deletada pelos seguintes motivos:\n\n• ${motivos}`
        );
        return;
      }

      // Confirmar exclusão mostrando o impacto
      const produto =
        statusExclusao.entrada.produto_nome ||
        `Produto ID: ${statusExclusao.entrada.produto_id}`;
      const quantidade = statusExclusao.entrada.quantidade;
      const valor =
        statusExclusao.entrada.preco_custo * statusExclusao.entrada.quantidade;

      const confirmMessage =
        `Tem certeza que deseja excluir esta entrada de estoque?\n\n` +
        `Produto: ${produto}\n` +
        `Quantidade: ${quantidade}\n` +
        `Valor: R$ ${valor.toFixed(2)}\n\n` +
        `Esta ação não pode ser desfeita.`;

      if (confirm(confirmMessage)) {
        await estoqueService.excluirEntrada(id);
        setError(null);
        await carregarDados();
        alert("Entrada excluída com sucesso!");
      }
    } catch (err: any) {
      console.error("Erro ao excluir entrada:", err);
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        "Erro desconhecido ao excluir entrada";
      setError(`Erro ao excluir entrada: ${errorMessage}`);
    }
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case "entrada":
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case "saida":
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      case "inventario":
        return <BarChart3 className="w-4 h-4 text-blue-600" />;
      default:
        return <Package className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case "entrada":
        return "bg-green-100 text-green-800";
      case "saida":
        return "bg-red-100 text-red-800";
      case "inventario":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatQuantidade = (
    quantidade: string | number,
    tipoMedida: string
  ) => {
    const num =
      typeof quantidade === "string" ? parseFloat(quantidade) : quantidade;
    if (tipoMedida === "unidade") {
      return num.toFixed(0); // Para unidades, não mostrar decimais
    }
    return num.toFixed(2); // Para outros tipos, mostrar 2 decimais
  };

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Estoque</h1>
            <p className="text-gray-600">
              Gerencie entradas, saídas e inventário
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={carregarDados}
              variant="outline"
              className="w-full sm:w-auto"
              disabled={loading}
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
              />
              Atualizar
            </Button>
            <Button
              onClick={() => setIsFormVisible(true)}
              className="w-full sm:w-auto"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova Entrada
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 overflow-x-auto">
          <nav className="flex space-x-8 min-w-max">
            <button
              onClick={() => setActiveTab("produtos")}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === "produtos"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Produtos
            </button>
            <button
              onClick={() => setActiveTab("movimentos")}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === "movimentos"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Movimentações
            </button>
            <button
              onClick={() => setActiveTab("relatorio")}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === "relatorio"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Relatório
            </button>
          </nav>
        </div>

        {/* Form Modal */}
        {isFormVisible && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <h2 className="text-lg font-semibold mb-4">
                Nova Entrada de Estoque
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Produto
                  </label>
                  <select
                    value={formData.produto_id}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      setFormData({
                        ...formData,
                        produto_id: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value={0}>Selecione um produto</option>
                    {produtos.map((produto) => (
                      <option key={produto.id} value={produto.id}>
                        {produto.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <Input
                  label="Quantidade"
                  type="number"
                  step="0.001"
                  value={formData.quantidade}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData({
                      ...formData,
                      quantidade: parseFloat(e.target.value) || 0,
                    })
                  }
                  required
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Medida
                  </label>
                  <select
                    value={formData.tipo_medida}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      setFormData({
                        ...formData,
                        tipo_medida: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="kg">Quilograma (kg)</option>
                    <option value="unidade">Unidade</option>
                    <option value="litro">Litro</option>
                    <option value="caixa">Caixa</option>
                    <option value="saco">Saco</option>
                    <option value="duzia">Dúzia</option>
                  </select>
                </div>

                <Input
                  label="Preço de Custo (R$)"
                  type="number"
                  step="0.01"
                  value={formData.preco_custo}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData({
                      ...formData,
                      preco_custo: parseFloat(e.target.value) || 0,
                    })
                  }
                  required
                />

                <Input
                  label="Fornecedor"
                  value={formData.fornecedor}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, fornecedor: e.target.value })
                  }
                  required
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Observações
                  </label>
                  <textarea
                    value={formData.observacoes}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setFormData({ ...formData, observacoes: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-4">
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={loadingForm}
                  >
                    {loadingForm ? "Salvando..." : "Adicionar"}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={resetForm}
                    className="flex-1"
                    disabled={loadingForm}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal de Correção de Inventário */}
        {isCorrecaoVisible && produtoSelecionado && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <h2 className="text-lg font-semibold mb-4">
                Correção de Inventário
              </h2>

              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Produto:</strong>{" "}
                  {produtoSelecionado.produto?.descricao ||
                    `Produto ID: ${produtoSelecionado.produto_id}`}
                </p>
                <p className="text-sm text-blue-800">
                  <strong>Saldo Atual:</strong>{" "}
                  {formatQuantidade(
                    produtoSelecionado.quantidade_atual,
                    produtoSelecionado.tipo_medida
                  )}{" "}
                  {produtoSelecionado.tipo_medida}
                </p>
              </div>

              <form onSubmit={handleSubmitCorrecao} className="space-y-4">
                <Input
                  label="Nova Quantidade"
                  type="number"
                  step="0.001"
                  min="0"
                  value={formCorrecao.quantidade_atual}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormCorrecao({
                      ...formCorrecao,
                      quantidade_atual: parseFloat(e.target.value) || 0,
                    })
                  }
                  required
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Motivo da Correção <span className="text-red-600">*</span>
                  </label>
                  <select
                    value={formCorrecao.observacoes}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      setFormCorrecao({
                        ...formCorrecao,
                        observacoes: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Selecione o motivo</option>
                    <option value="Contagem física mensal - ajuste de diferença">
                      Contagem Física
                    </option>
                    <option value="Produto deteriorado - baixa total do estoque">
                      Correção de Erro
                    </option>
                    <option value="Ajuste por perda - produtos danificados">
                      Ajuste de Perda
                    </option>
                    <option value="Configuração inicial do inventário">
                      Primeira Configuração
                    </option>
                    <option value="custom">Personalizado...</option>
                  </select>
                </div>

                {formCorrecao.observacoes === "custom" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Observações Personalizadas{" "}
                      <span className="text-red-600">*</span>
                    </label>
                    <textarea
                      value=""
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setFormCorrecao({
                          ...formCorrecao,
                          observacoes: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="Descreva o motivo da correção..."
                      required
                    />
                  </div>
                )}

                <div className="p-3 bg-yellow-50 rounded-lg">
                  <p className="text-xs text-yellow-800">
                    <strong>Importante:</strong> Esta ação irá registrar uma
                    correção no inventário para fins de auditoria. Certifique-se
                    de que a quantidade e o motivo estão corretos.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-4">
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={loadingForm}
                  >
                    {loadingForm ? "Corrigindo..." : "Confirmar Correção"}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={resetFormCorrecao}
                    className="flex-1"
                    disabled={loadingForm}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-8">
            <Loading />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
            <Button onClick={() => setError(null)} className="mt-2">
              Fechar
            </Button>
          </div>
        )}

        {/* Content */}
        {!loading && activeTab === "movimentos" && (
          <div className="space-y-4">
            {/* Desktop Table */}
            <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Produto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantidade
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Preço Custo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fornecedor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {getMovimentosFromEntradas().map((movimento) => (
                    <tr key={movimento.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {movimento.produto}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getTipoIcon(movimento.tipo)}
                          <span
                            className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${getTipoColor(
                              movimento.tipo
                            )}`}
                          >
                            {movimento.tipo}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {movimento.quantidade}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {movimento.preco
                          ? `R$ ${Number(movimento.preco).toFixed(2)}`
                          : "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {movimento.fornecedor || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(movimento.data).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleDelete(movimento.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Excluir
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
              {getMovimentosFromEntradas().map((movimento) => (
                <div
                  key={movimento.id}
                  className="bg-white rounded-lg shadow p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">
                        {movimento.produto}
                      </h3>
                      <div className="flex items-center mt-1">
                        {getTipoIcon(movimento.tipo)}
                        <span
                          className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${getTipoColor(
                            movimento.tipo
                          )}`}
                        >
                          {movimento.tipo}
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleDelete(movimento.id)}
                        className="text-red-600 text-sm"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Quantidade:</span>
                      <span className="ml-1 font-medium">
                        {movimento.quantidade}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Preço:</span>
                      <span className="ml-1 font-medium">
                        {movimento.preco
                          ? `R$ ${Number(movimento.preco).toFixed(2)}`
                          : "-"}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-500">Fornecedor:</span>
                      <span className="ml-1">
                        {movimento.fornecedor || "-"}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-500">Data:</span>
                      <span className="ml-1">
                        {new Date(movimento.data).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                    {movimento.observacao && (
                      <div className="col-span-2">
                        <span className="text-gray-500">Obs:</span>
                        <span className="ml-1">{movimento.observacao}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && activeTab === "produtos" && (
          <div className="space-y-4">
            {/* Alertas de Estoque */}
            {alertas &&
              (alertas.data?.produtos_estoque_baixo?.length > 0 ||
                alertas.data?.produtos_sem_estoque?.length > 0) && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => setAlertasExpanded(!alertasExpanded)}
                  >
                    <div className="flex items-center">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
                      <h3 className="text-lg font-semibold text-yellow-800">
                        Alertas de Estoque
                      </h3>
                      <span className="ml-2 bg-yellow-200 text-yellow-800 text-xs px-2 py-1 rounded-full">
                        {(alertas.data.produtos_estoque_baixo?.length || 0) +
                          (alertas.data.produtos_sem_estoque?.length || 0)}{" "}
                        alertas
                      </span>
                    </div>
                    <svg
                      className={`w-5 h-5 text-yellow-600 transform transition-transform ${
                        alertasExpanded ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>

                  {alertasExpanded && (
                    <div className="mt-3 space-y-1">
                      {alertas.data.produtos_estoque_baixo?.map((produto) => (
                        <p
                          key={produto.produto_id}
                          className="text-yellow-700 text-sm"
                        >
                          • {produto.produto}: {produto.quantidade_atual} em
                          estoque (mín: {produto.estoque_minimo})
                        </p>
                      ))}
                      {alertas.data.produtos_sem_estoque?.map((produto) => (
                        <p
                          key={produto.produto_id}
                          className="text-red-700 text-sm font-medium"
                        >
                          • {produto.produto}: SEM ESTOQUE (mín:{" "}
                          {produto.estoque_minimo})
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}

            {/* Desktop Table */}
            <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Produto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Saldo Atual
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valor Unitário
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valor Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Última Atualização
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {inventario.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.produto?.descricao ||
                          `Produto ID: ${item.produto_id}`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatQuantidade(
                          item.quantidade_atual,
                          item.tipo_medida
                        )}{" "}
                        {item.tipo_medida}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        R$ {parseFloat(item.valor_unitario).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        R$ {parseFloat(item.valor_total).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(
                          item.data_ultima_atualizacao
                        ).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            parseFloat(item.quantidade_atual) > 0
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {parseFloat(item.quantidade_atual) > 0
                            ? "Em estoque"
                            : "Sem estoque"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleCorrecaoInventario(item)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Corrigir
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
              {inventario.map((item) => (
                <div key={item.id} className="bg-white rounded-lg shadow p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">
                        {item.produto?.descricao ||
                          `Produto ID: ${item.produto_id}`}
                      </h3>
                      <span
                        className={`inline-block mt-1 px-2 py-1 text-xs font-semibold rounded-full ${
                          parseFloat(item.quantidade_atual) > 0
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {parseFloat(item.quantidade_atual) > 0
                          ? "Em estoque"
                          : "Sem estoque"}
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleCorrecaoInventario(item)}
                        className="text-blue-600 text-sm"
                      >
                        Corrigir
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Saldo:</span>
                      <span className="ml-1 font-medium">
                        {formatQuantidade(
                          item.quantidade_atual,
                          item.tipo_medida
                        )}{" "}
                        {item.tipo_medida}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Valor Unitário:</span>
                      <span className="ml-1 font-medium">
                        R$ {parseFloat(item.valor_unitario).toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Valor Total:</span>
                      <span className="ml-1 font-medium">
                        R$ {parseFloat(item.valor_total).toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Última Atualização:</span>
                      <span className="ml-1">
                        {new Date(
                          item.data_ultima_atualizacao
                        ).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                    {item.observacoes && (
                      <div className="col-span-2">
                        <span className="text-gray-500">Obs:</span>
                        <span className="ml-1">{item.observacoes}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && activeTab === "relatorio" && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Relatório de Estoque</h3>
              <Button onClick={carregarDados} size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Atualizar
              </Button>
            </div>

            {fluxoCaixa ? (
              <div className="space-y-6">
                {/* Resumo */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      R${" "}
                      {typeof fluxoCaixa.total_entradas === "number"
                        ? fluxoCaixa.total_entradas.toFixed(2)
                        : parseFloat(fluxoCaixa.total_entradas || "0").toFixed(
                            2
                          )}
                    </div>
                    <div className="text-sm text-green-600">
                      Total em Entradas
                    </div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      R${" "}
                      {typeof fluxoCaixa.total_saidas === "number"
                        ? fluxoCaixa.total_saidas.toFixed(2)
                        : parseFloat(fluxoCaixa.total_saidas || "0").toFixed(2)}
                    </div>
                    <div className="text-sm text-red-600">Total em Saídas</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      R${" "}
                      {typeof fluxoCaixa.saldo === "number"
                        ? fluxoCaixa.saldo.toFixed(2)
                        : parseFloat(fluxoCaixa.saldo || "0").toFixed(2)}
                    </div>
                    <div className="text-sm text-blue-600">Saldo Atual</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {fluxoCaixa.quantidade_vendas || 0}
                    </div>
                    <div className="text-sm text-purple-600">
                      Vendas no Período
                    </div>
                  </div>
                </div>

                {/* Lucro e Margem */}
                {fluxoCaixa.lucro_bruto_total !== undefined && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">
                        R${" "}
                        {typeof fluxoCaixa.lucro_bruto_total === "number"
                          ? fluxoCaixa.lucro_bruto_total.toFixed(2)
                          : parseFloat(
                              fluxoCaixa.lucro_bruto_total || "0"
                            ).toFixed(2)}
                      </div>
                      <div className="text-sm text-yellow-600">
                        Lucro Bruto Total
                      </div>
                    </div>
                    <div className="text-center p-4 bg-indigo-50 rounded-lg">
                      <div className="text-2xl font-bold text-indigo-600">
                        {fluxoCaixa.margem_media
                          ? parseFloat(String(fluxoCaixa.margem_media)).toFixed(
                              1
                            )
                          : "0"}
                        %
                      </div>
                      <div className="text-sm text-indigo-600">
                        Margem Média
                      </div>
                    </div>
                  </div>
                )}

                {/* Inventário Resumo */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {
                        inventario.filter(
                          (item) => parseFloat(item.quantidade_atual) > 0
                        ).length
                      }
                    </div>
                    <div className="text-sm text-green-600">
                      Produtos em Estoque
                    </div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {
                        inventario.filter(
                          (item) => parseFloat(item.quantidade_atual) === 0
                        ).length
                      }
                    </div>
                    <div className="text-sm text-red-600">
                      Produtos em Falta
                    </div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      R${" "}
                      {inventario
                        .reduce(
                          (total, item) => total + parseFloat(item.valor_total),
                          0
                        )
                        .toFixed(2)}
                    </div>
                    <div className="text-sm text-blue-600">
                      Valor Total do Estoque
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>Carregue os dados para ver o relatório</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
