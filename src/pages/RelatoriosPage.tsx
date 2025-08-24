import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/Input";
import { Loading } from "@/components/Loading";
import {
  estoqueService,
  relatoriosService,
  clientesService,
} from "@/services/api";

import type {
  Rentabilidade,
  RelatorioPagamentosPendentes,
  RelatorioHistoricoVendas,
  RelatorioResumoFinanceiro,
  RelatorioDashboardVendas,
  RelatorioClientesInadimplentes,
  Cliente,
} from "@/types";

export function RelatoriosPage() {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<
    | "rentabilidade"
    | "pagamentos"
    | "historico"
    | "financeiro"
    | "dashboard"
    | "inadimplentes"
  >("rentabilidade");

  // Estados dos relatórios existentes
  const [rentabilidade, setRentabilidade] = useState<Rentabilidade | null>(
    null
  );

  // Estados dos novos relatórios financeiros
  const [pagamentosPendentes, setPagamentosPendentes] =
    useState<RelatorioPagamentosPendentes | null>(null);
  const [historicoVendas, setHistoricoVendas] =
    useState<RelatorioHistoricoVendas | null>(null);
  const [resumoFinanceiro, setResumoFinanceiro] =
    useState<RelatorioResumoFinanceiro | null>(null);
  const [dashboardVendas, setDashboardVendas] =
    useState<RelatorioDashboardVendas | null>(null);
  const [clientesInadimplentes, setClientesInadimplentes] =
    useState<RelatorioClientesInadimplentes | null>(null);
  const [clientes, setClientes] = useState<Cliente[]>([]);

  // Estados dos filtros

  const [filtrosRentabilidade, setFiltrosRentabilidade] = useState({
    data_inicio: "",
    data_fim: "",
  });

  // Novos filtros para relatórios financeiros
  const [filtrosPagamentos, setFiltrosPagamentos] = useState({
    cliente_id: "",
    ordenar_por: "valor_desc" as
      | "valor_desc"
      | "valor_asc"
      | "data_desc"
      | "data_asc",
  });

  const [filtrosHistorico, setFiltrosHistorico] = useState({
    cliente_id: "",
    data_inicio: "",
    data_fim: "",
    situacao_pagamento: "" as "" | "Pago" | "Pendente",
  });

  const [filtrosDashboard, setFiltrosDashboard] = useState({
    data_inicio: "",
    data_fim: "",
  });

  const [filtrosInadimplentes, setFiltrosInadimplentes] = useState({
    dias_minimo: "30", // string para permitir apagar
    valor_minimo: "",
    ordenar_por: "valor_desc" as
      | "valor_desc"
      | "valor_asc"
      | "dias_desc"
      | "dias_asc",
  });

  useEffect(() => {
    if (activeTab === "pagamentos") {
      carregarClientes();
    } else if (activeTab === "historico") {
      carregarClientes();
    } else if (activeTab === "dashboard") {
      carregarDashboardVendas();
    } else if (activeTab === "inadimplentes") {
      carregarClientesInadimplentes();
    }
  }, [activeTab]);

  // const carregarFluxoCaixa = async () => {
  //   try {
  //     setLoading(true);
  //     const filtros: any = {};

  //     if (filtrosFluxo.data_inicio)
  //       filtros.data_inicio = filtrosFluxo.data_inicio;
  //     if (filtrosFluxo.data_fim) filtros.data_fim = filtrosFluxo.data_fim;
  //     if (filtrosFluxo.produto_id)
  //       filtros.produto_id = Number(filtrosFluxo.produto_id);

  //     const resultado = await estoqueService.obterFluxoCaixa(filtros);
  //     setFluxoCaixa(resultado);
  //   } catch (error) {
  //     console.error("Erro ao carregar fluxo de caixa:", error);
  //     alert("Erro ao carregar fluxo de caixa");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const carregarRentabilidade = async () => {
    if (!filtrosRentabilidade.data_inicio || !filtrosRentabilidade.data_fim) {
      alert("Por favor, informe o período (data início e fim)");
      return;
    }

    try {
      setLoading(true);
      const filtros: any = {
        data_inicio: filtrosRentabilidade.data_inicio,
        data_fim: filtrosRentabilidade.data_fim,
      };

      const resultado = await estoqueService.obterRentabilidade(filtros);
      setRentabilidade(resultado);
    } catch (error) {
      console.error("Erro ao carregar rentabilidade:", error);
      alert("Erro ao carregar relatório de rentabilidade");
    } finally {
      setLoading(false);
    }
  };

  // const carregarAlertas = async () => {
  //   try {
  //     setLoading(true);
  //     console.log("Carregando alertas...");
  //     const resultado = await estoqueService.obterAlertas();
  //     console.log("Resultado dos alertas:", resultado);
  //     setAlertas(resultado);
  //   } catch (error) {
  //     console.error("Erro ao carregar alertas:", error);
  //     setAlertas({
  //       data: {
  //         produtos_estoque_baixo: [],
  //         produtos_sem_estoque: [],
  //       },
  //       total_alertas: 0,
  //       message: "Erro ao carregar alertas",
  //       success: false,
  //     });
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  };

  const formatarData = (data: string) => {
    if (!data) return "-";

    try {
      const date = new Date(data);
      if (isNaN(date.getTime())) {
        return "-";
      }

      return new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
    } catch (error) {
      console.error("Erro ao formatar data:", data, error);
      return "-";
    }
  };

  const formatarDataSimples = (data: string) => {
    if (!data) return "-";

    try {
      const date = new Date(data);
      if (isNaN(date.getTime())) {
        return "-";
      }

      return new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(date);
    } catch (error) {
      console.error("Erro ao formatar data simples:", data, error);
      return "-";
    }
  };

  // const obterNomeProduto = (produtoId: number): string => {
  //   const produto = produtos.find((p) => p.id === produtoId);
  //   return produto ? produto.nome : `Produto ID: ${produtoId}`;
  // };
  //alertas de estoque
  // ===== FUNÇÕES PARA RELATÓRIOS FINANCEIROS =====

  const carregarClientes = async () => {
    try {
      const resultado = await clientesService.listar();
      setClientes(resultado.clientes || []);
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
    }
  };

  const carregarPagamentosPendentes = async () => {
    try {
      setLoading(true);
      const filtros: any = {};

      if (filtrosPagamentos.cliente_id) {
        filtros.cliente_id = Number(filtrosPagamentos.cliente_id);
      }
      if (filtrosPagamentos.ordenar_por) {
        filtros.ordenar_por = filtrosPagamentos.ordenar_por;
      }

      const resultado = await relatoriosService.obterPagamentosPendentes(
        filtros
      );
      setPagamentosPendentes(resultado.data);
    } catch (error) {
      console.error("Erro ao carregar pagamentos pendentes:", error);
      alert("Erro ao carregar relatório de pagamentos pendentes");
    } finally {
      setLoading(false);
    }
  };

  const carregarHistoricoVendas = async () => {
    if (!filtrosHistorico.cliente_id) {
      alert("Selecione um cliente para ver o histórico");
      return;
    }

    try {
      setLoading(true);
      const filtros: any = {};

      if (filtrosHistorico.data_inicio)
        filtros.data_inicio = filtrosHistorico.data_inicio;
      if (filtrosHistorico.data_fim)
        filtros.data_fim = filtrosHistorico.data_fim;
      if (filtrosHistorico.situacao_pagamento)
        filtros.situacao_pagamento = filtrosHistorico.situacao_pagamento;

      const resultado = await relatoriosService.obterHistoricoVendas(
        Number(filtrosHistorico.cliente_id),
        filtros
      );
      setHistoricoVendas(resultado.data);
    } catch (error) {
      console.error("Erro ao carregar histórico de vendas:", error);
      alert("Erro ao carregar histórico de vendas");
    } finally {
      setLoading(false);
    }
  };

  const carregarResumoFinanceiro = async () => {
    if (!filtrosHistorico.cliente_id) {
      alert("Selecione um cliente para ver o resumo financeiro");
      return;
    }

    try {
      setLoading(true);
      const resultado = await relatoriosService.obterResumoFinanceiro(
        Number(filtrosHistorico.cliente_id)
      );
      setResumoFinanceiro(resultado.data);
    } catch (error) {
      console.error("Erro ao carregar resumo financeiro:", error);
      alert("Erro ao carregar resumo financeiro");
    } finally {
      setLoading(false);
    }
  };

  const carregarDashboardVendas = async () => {
    try {
      setLoading(true);
      const filtros: any = {};

      if (filtrosDashboard.data_inicio)
        filtros.data_inicio = filtrosDashboard.data_inicio;
      if (filtrosDashboard.data_fim)
        filtros.data_fim = filtrosDashboard.data_fim;

      const resultado = await relatoriosService.obterDashboardVendas(filtros);
      setDashboardVendas(resultado.data);
    } catch (error) {
      console.error("Erro ao carregar dashboard de vendas:", error);
      alert("Erro ao carregar dashboard de vendas");
    } finally {
      setLoading(false);
    }
  };

  const carregarClientesInadimplentes = async () => {
    try {
      setLoading(true);
      const filtros: any = {};

      if (
        filtrosInadimplentes.dias_minimo &&
        filtrosInadimplentes.dias_minimo !== ""
      )
        filtros.dias_minimo = parseInt(filtrosInadimplentes.dias_minimo, 10);
      if (filtrosInadimplentes.valor_minimo)
        filtros.valor_minimo = Number(filtrosInadimplentes.valor_minimo);
      if (filtrosInadimplentes.ordenar_por)
        filtros.ordenar_por = filtrosInadimplentes.ordenar_por;

      const resultado = await relatoriosService.obterClientesInadimplentes(
        filtros
      );
      setClientesInadimplentes(resultado.data);
    } catch (error) {
      console.error("Erro ao carregar clientes inadimplentes:", error);
      alert("Erro ao carregar clientes inadimplentes");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Relatórios
        </h1>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        {/* Mobile: Grid de botões (até 767px) */}
        <div className="grid grid-cols-2 gap-2 md:hidden mb-4">
          <button
            onClick={() => setActiveTab("rentabilidade")}
            className={`p-3 rounded-lg border-2 font-medium text-xs text-center transition-colors ${
              activeTab === "rentabilidade"
                ? "border-blue-500 bg-blue-50 text-blue-700"
                : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
            }`}
          >
            📊 Rentabilidade
          </button>

          <button
            onClick={() => setActiveTab("pagamentos")}
            className={`p-3 rounded-lg border-2 font-medium text-xs text-center transition-colors ${
              activeTab === "pagamentos"
                ? "border-blue-500 bg-blue-50 text-blue-700"
                : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
            }`}
          >
            💳 Pagamentos
          </button>
          <button
            onClick={() => setActiveTab("historico")}
            className={`p-3 rounded-lg border-2 font-medium text-xs text-center transition-colors ${
              activeTab === "historico"
                ? "border-blue-500 bg-blue-50 text-blue-700"
                : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
            }`}
          >
            📋 Histórico
          </button>
          <button
            onClick={() => setActiveTab("financeiro")}
            className={`p-3 rounded-lg border-2 font-medium text-xs text-center transition-colors ${
              activeTab === "financeiro"
                ? "border-blue-500 bg-blue-50 text-blue-700"
                : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
            }`}
          >
            💼 Resumo
          </button>
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`p-3 rounded-lg border-2 font-medium text-xs text-center transition-colors ${
              activeTab === "dashboard"
                ? "border-blue-500 bg-blue-50 text-blue-700"
                : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
            }`}
          >
            📈 Dashboard
          </button>
          <button
            onClick={() => setActiveTab("inadimplentes")}
            className={`p-3 rounded-lg border-2 font-medium text-xs text-center transition-colors ${
              activeTab === "inadimplentes"
                ? "border-blue-500 bg-blue-50 text-blue-700"
                : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
            }`}
          >
            🚨 Inadimplentes
          </button>
        </div>

        {/* Desktop: Tabs tradicionais (768px+) */}
        <div className="border-b border-gray-200 hidden md:block">
          <nav className="-mb-px flex space-x-2 sm:space-x-4 lg:space-x-8 overflow-x-auto">
            <button
              onClick={() => setActiveTab("rentabilidade")}
              className={`py-2 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                activeTab === "rentabilidade"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Rentabilidade
            </button>

            <button
              onClick={() => setActiveTab("pagamentos")}
              className={`py-2 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                activeTab === "pagamentos"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Pagamentos Pendentes
            </button>
            <button
              onClick={() => setActiveTab("historico")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "historico"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Histórico de Vendas
            </button>
            <button
              onClick={() => setActiveTab("financeiro")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "financeiro"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Resumo Financeiro
            </button>
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "dashboard"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Dashboard Vendas
            </button>
            <button
              onClick={() => setActiveTab("inadimplentes")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "inadimplentes"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Inadimplentes
            </button>
          </nav>
        </div>
      </div>

      {loading && <Loading />}

      {/* Tab: Rentabilidade */}
      {activeTab === "rentabilidade" && (
        <div className="space-y-6">
          {/* Filtros */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium mb-4">
              Filtros de Rentabilidade
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data Início *
                </label>
                <Input
                  type="date"
                  value={filtrosRentabilidade.data_inicio}
                  onChange={(e) =>
                    setFiltrosRentabilidade((prev) => ({
                      ...prev,
                      data_inicio: e.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data Fim *
                </label>
                <Input
                  type="date"
                  value={filtrosRentabilidade.data_fim}
                  onChange={(e) =>
                    setFiltrosRentabilidade((prev) => ({
                      ...prev,
                      data_fim: e.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="flex items-end">
                <Button onClick={carregarRentabilidade} className="w-full">
                  Gerar Relatório
                </Button>
              </div>
            </div>
          </div>

          {/* Resultados da Rentabilidade */}
          {rentabilidade && (
            <div className="space-y-6">
              {/* Cards de Resumo */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium mb-4">
                  Resumo do Período: {rentabilidade.periodo.inicio} à{" "}
                  {rentabilidade.periodo.fim}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {formatarMoeda(Number(rentabilidade.resumo.total_vendas))}
                    </div>
                    <div className="text-sm text-gray-600">Total Vendas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {formatarMoeda(Number(rentabilidade.resumo.total_custos))}
                    </div>
                    <div className="text-sm text-gray-600">Total Custos</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {formatarMoeda(
                        Number(rentabilidade.resumo.lucro_bruto_total)
                      )}
                    </div>
                    <div className="text-sm text-gray-600">Lucro Bruto</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {Number(rentabilidade.resumo.margem_bruta_geral).toFixed(
                        2
                      )}
                      %
                    </div>
                    <div className="text-sm text-gray-600">Margem Bruta</div>
                  </div>
                </div>
              </div>

              {/* Rentabilidade por Produto */}
              {/* Mobile: Cards de Rentabilidade por Produto */}
              <div className="md:hidden space-y-3">
                {rentabilidade.produtos.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Nenhum produto encontrado
                  </div>
                ) : (
                  rentabilidade.produtos.map((produto) => (
                    <div
                      key={produto.produto.id}
                      className="bg-white rounded-lg shadow p-4 flex flex-col gap-1"
                    >
                      <div className="font-bold text-gray-800">
                        {produto.produto.nome}
                      </div>
                      <div className="flex flex-wrap gap-2 text-sm mt-1">
                        <span>Qtd: {produto.quantidade_vendida}</span>
                        <span>Vendas: {produto.vendas}</span>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs mt-1">
                        <span className="text-green-600">
                          Receita:{" "}
                          {formatarMoeda(Number(produto.receita_total))}
                        </span>
                        <span className="text-red-600">
                          Custo: {formatarMoeda(Number(produto.custo_total))}
                        </span>
                        <span className="text-blue-600">
                          Lucro: {formatarMoeda(Number(produto.lucro_bruto))}
                        </span>
                        <span className="text-purple-600">
                          Margem: {Number(produto.margem_bruta).toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {/* Desktop: Tabela de Rentabilidade por Produto */}
              <div className="bg-white rounded-lg shadow overflow-hidden hidden md:block">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">
                    Rentabilidade por Produto ({rentabilidade.produtos.length})
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Produto
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Qtd. Vendida
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Receita Total
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Custo Total
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Lucro Bruto
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Vendas
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Margem %
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {rentabilidade.produtos.map((produto) => (
                        <tr
                          key={produto.produto.id}
                          className="hover:bg-gray-50"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {produto.produto.nome}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {produto.quantidade_vendida}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatarMoeda(Number(produto.receita_total))}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatarMoeda(Number(produto.custo_total))}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                            {formatarMoeda(Number(produto.lucro_bruto))}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {produto.vendas}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                            {Number(produto.margem_bruta).toFixed(2)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Pagamentos Pendentes */}
      {activeTab === "pagamentos" && (
        <div className="space-y-6">
          {/* Filtros */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium mb-4">
              Filtros de Pagamentos Pendentes
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cliente (opcional)
                </label>
                <select
                  value={filtrosPagamentos.cliente_id}
                  onChange={(e) =>
                    setFiltrosPagamentos((prev) => ({
                      ...prev,
                      cliente_id: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Todos os clientes</option>
                  {clientes.map((cliente) => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.nome}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ordenar por
                </label>
                <select
                  value={filtrosPagamentos.ordenar_por}
                  onChange={(e) =>
                    setFiltrosPagamentos((prev) => ({
                      ...prev,
                      ordenar_por: e.target.value as any,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="valor_desc">Maior valor</option>
                  <option value="valor_asc">Menor valor</option>
                  <option value="data_desc">Mais recente</option>
                  <option value="data_asc">Mais antigo</option>
                </select>
              </div>
              <div className="flex items-end">
                <Button onClick={carregarPagamentosPendentes}>
                  Gerar Relatório
                </Button>
              </div>
            </div>
          </div>

          {/* Resultados */}
          {pagamentosPendentes && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium mb-4">Resumo Geral</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {formatarMoeda(
                      pagamentosPendentes.resumo.total_geral_pendente
                    )}
                  </div>
                  <div className="text-sm text-gray-500">Total Pendente</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {pagamentosPendentes.resumo.quantidade_clientes}
                  </div>
                  <div className="text-sm text-gray-500">Clientes</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {pagamentosPendentes.resumo.quantidade_vendas_pendentes}
                  </div>
                  <div className="text-sm text-gray-500">Vendas Pendentes</div>
                </div>
              </div>

              {pagamentosPendentes.clientes.map((clienteData) => (
                <div
                  key={clienteData.cliente.id}
                  className="border-b border-gray-200 pb-4 mb-4"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {clienteData.cliente.nome}
                      </h4>
                      {clienteData.cliente.nome_fantasia && (
                        <p className="text-sm text-gray-500">
                          {clienteData.cliente.nome_fantasia}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-red-600">
                        {formatarMoeda(clienteData.total_pendente)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {clienteData.quantidade_vendas} vendas
                      </div>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    {clienteData.vendas_pendentes.map((venda) => (
                      <div
                        key={venda.id}
                        className="flex justify-between items-center bg-gray-50 p-2 rounded"
                      >
                        <div>
                          <span className="text-sm font-medium">
                            #{venda.id}
                          </span>
                          <span className="text-sm text-gray-500 ml-2">
                            {venda.data_venda
                              ? formatarData(venda.data_venda)
                              : "-"}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">
                            {formatarMoeda(venda.total_venda)}
                          </div>
                          <div className="text-xs text-red-500">
                            {venda.dias_pendente} dias pendente
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Histórico de Vendas */}
      {activeTab === "historico" && (
        <div className="space-y-6">
          {/* Filtros */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium mb-4">Filtros do Histórico</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cliente *
                </label>
                <select
                  value={filtrosHistorico.cliente_id}
                  onChange={(e) =>
                    setFiltrosHistorico((prev) => ({
                      ...prev,
                      cliente_id: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Selecione um cliente</option>
                  {clientes.map((cliente) => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.nome}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data Início
                </label>
                <Input
                  type="date"
                  value={filtrosHistorico.data_inicio}
                  onChange={(e) =>
                    setFiltrosHistorico((prev) => ({
                      ...prev,
                      data_inicio: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data Fim
                </label>
                <Input
                  type="date"
                  value={filtrosHistorico.data_fim}
                  onChange={(e) =>
                    setFiltrosHistorico((prev) => ({
                      ...prev,
                      data_fim: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pagamento
                </label>
                <select
                  value={filtrosHistorico.situacao_pagamento}
                  onChange={(e) =>
                    setFiltrosHistorico((prev) => ({
                      ...prev,
                      situacao_pagamento: e.target.value as any,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Todos</option>
                  <option value="Pago">Pago</option>
                  <option value="Pendente">Pendente</option>
                </select>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button onClick={carregarHistoricoVendas}>Gerar Histórico</Button>
              <Button onClick={carregarResumoFinanceiro} variant="outline">
                Resumo Financeiro
              </Button>
            </div>
          </div>

          {/* Resultados do Histórico */}
          {historicoVendas && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium mb-4">
                Histórico - {historicoVendas.cliente.nome}
              </h3>

              {/* Estatísticas */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {formatarMoeda(historicoVendas.estatisticas.total_vendido)}
                  </div>
                  <div className="text-sm text-gray-500">Total Vendido</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {formatarMoeda(historicoVendas.estatisticas.ticket_medio)}
                  </div>
                  <div className="text-sm text-gray-500">Ticket Médio</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {historicoVendas.estatisticas.quantidade_vendas}
                  </div>
                  <div className="text-sm text-gray-500">Vendas</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {formatarMoeda(historicoVendas.estatisticas.total_pendente)}
                  </div>
                  <div className="text-sm text-gray-500">Pendente</div>
                </div>
              </div>

              {/* Lista de Vendas */}
              {/* Mobile: Cards de Vendas */}
              <div className="md:hidden space-y-3">
                {historicoVendas.vendas.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Nenhuma venda encontrada
                  </div>
                ) : (
                  historicoVendas.vendas.map((venda) => (
                    <div
                      key={venda.id}
                      className="bg-white rounded-lg shadow p-4 flex flex-col gap-1"
                    >
                      <div className="flex justify-between text-sm">
                        <span className="font-bold text-gray-700">
                          #{venda.id}
                        </span>
                        <span
                          className={`font-bold ${
                            venda.situacao_pagamento === "Pago"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {venda.situacao_pagamento}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        Data:{" "}
                        {venda.data_venda
                          ? formatarData(venda.data_venda)
                          : "-"}
                      </div>
                      <div className="text-xs text-blue-600 font-bold">
                        Valor: {formatarMoeda(venda.total_venda)}
                      </div>
                      <div className="text-xs text-gray-400">
                        Status: {venda.situacao_pedido}
                      </div>
                    </div>
                  ))
                )}
              </div>
              {/* Desktop: Tabela de Vendas */}
              <div className="overflow-x-auto hidden md:block">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Data
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Valor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pagamento
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {historicoVendas.vendas.map((venda) => (
                      <tr key={venda.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{venda.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {venda.data_venda
                            ? formatarData(venda.data_venda)
                            : "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatarMoeda(venda.total_venda)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              venda.situacao_pedido === "Separado"
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {venda.situacao_pedido}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              venda.situacao_pagamento === "Pago"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {venda.situacao_pagamento}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Resumo Financeiro */}
      {activeTab === "financeiro" && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium mb-4">
              Resumo Financeiro do Cliente
            </h3>
            <p className="text-gray-600 mb-4">
              Selecione um cliente na aba "Histórico de Vendas" e clique em
              "Resumo Financeiro" para ver informações detalhadas.
            </p>

            {resumoFinanceiro && (
              <div>
                <h4 className="text-lg font-medium mb-4">
                  {resumoFinanceiro.cliente.nome}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {formatarMoeda(
                        resumoFinanceiro.estatisticas_gerais.total_historico
                      )}
                    </div>
                    <div className="text-sm text-gray-500">Total Histórico</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {resumoFinanceiro.estatisticas_gerais.total_vendas}
                    </div>
                    <div className="text-sm text-gray-500">Total de Vendas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {formatarMoeda(
                        resumoFinanceiro.estatisticas_gerais.ticket_medio
                      )}
                    </div>
                    <div className="text-sm text-gray-500">Ticket Médio</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {resumoFinanceiro.estatisticas_gerais.percentual_inadimplencia.toFixed(
                        1
                      )}
                      %
                    </div>
                    <div className="text-sm text-gray-500">Inadimplência</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Dashboard de Vendas */}
      {activeTab === "dashboard" && (
        <div className="space-y-6">
          {/* Filtros */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium mb-4">Filtros do Dashboard</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data Início
                </label>
                <Input
                  type="date"
                  value={filtrosDashboard.data_inicio}
                  onChange={(e) =>
                    setFiltrosDashboard((prev) => ({
                      ...prev,
                      data_inicio: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data Fim
                </label>
                <Input
                  type="date"
                  value={filtrosDashboard.data_fim}
                  onChange={(e) =>
                    setFiltrosDashboard((prev) => ({
                      ...prev,
                      data_fim: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="flex items-end">
                <Button onClick={carregarDashboardVendas}>
                  Gerar Dashboard
                </Button>
              </div>
            </div>
          </div>

          {/* Resultados do Dashboard */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium mb-4">Dashboard Executivo</h3>

            {dashboardVendas && (
              <div>
                {/* KPIs - já corrigido antes, mas incluído para contexto */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {formatarMoeda(
                        dashboardVendas?.kpis?.faturamento_total || 0
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      Faturamento Total
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {dashboardVendas?.kpis?.total_vendas || 0}
                    </div>
                    <div className="text-sm text-gray-500">Total de Vendas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {formatarMoeda(dashboardVendas?.kpis?.ticket_medio || 0)}
                    </div>
                    <div className="text-sm text-gray-500">Ticket Médio</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {(dashboardVendas?.kpis?.taxa_inadimplencia || 0).toFixed(
                        1
                      )}
                      %
                    </div>
                    <div className="text-sm text-gray-500">
                      Taxa Inadimplência
                    </div>
                  </div>
                </div>

                {/* Top Clientes - CORRIGIDO AGORA */}
                {(dashboardVendas?.top_clientes?.length || 0) > 0 && (
                  <div className="mb-6">
                    <h4 className="text-md font-medium mb-3">Top Clientes</h4>
                    <div className="space-y-2">
                      {(dashboardVendas?.top_clientes || []) // Fornece um array vazio como padrão
                        .slice(0, 5)
                        .map((cliente, index) => (
                          <div
                            key={`cliente-${cliente.nome}-${index}`}
                            className="flex justify-between items-center bg-gray-50 p-3 rounded"
                          >
                            <div>
                              <span className="font-medium">
                                {cliente.nome}
                              </span>
                              {cliente.nome_fantasia && (
                                <span className="text-sm text-gray-500 ml-2">
                                  ({cliente.nome_fantasia})
                                </span>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="font-medium text-blue-600">
                                {formatarMoeda(cliente.total_comprado)}
                              </div>
                              <div className="text-xs text-gray-500">
                                {cliente.quantidade_compras} compras
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Top Produtos - CORRIGIDO AGORA */}
                {(dashboardVendas?.top_produtos?.length || 0) > 0 && (
                  <div className="mb-6">
                    <h4 className="text-md font-medium mb-3">Top Produtos</h4>
                    <div className="space-y-2">
                      {(dashboardVendas?.top_produtos || []) // Fornece um array vazio como padrão
                        .slice(0, 5)
                        .map((produto, index) => (
                          <div
                            key={`produto-${produto.nome}-${index}`}
                            className="flex justify-between items-center bg-gray-50 p-3 rounded"
                          >
                            <span className="font-medium">{produto.nome}</span>
                            <div className="text-right">
                              <div className="font-medium text-green-600">
                                {formatarMoeda(produto.faturamento)}
                              </div>
                              <div className="text-xs text-gray-500">
                                {produto.quantidade_vendida}kg vendidos
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Clientes Inadimplentes */}
      {activeTab === "inadimplentes" && (
        <div className="space-y-6">
          {/* Filtros */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium mb-4">
              Filtros de Inadimplência
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dias mínimo de atraso
                </label>
                <Input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={filtrosInadimplentes.dias_minimo}
                  onChange={(e) =>
                    setFiltrosInadimplentes((prev) => ({
                      ...prev,
                      dias_minimo: e.target.value.replace(/[^0-9]/g, ""),
                    }))
                  }
                  placeholder="Digite o número de dias"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valor mínimo (opcional)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={filtrosInadimplentes.valor_minimo}
                  onChange={(e) =>
                    setFiltrosInadimplentes((prev) => ({
                      ...prev,
                      valor_minimo: e.target.value,
                    }))
                  }
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ordenar por
                </label>
                <select
                  value={filtrosInadimplentes.ordenar_por}
                  onChange={(e) =>
                    setFiltrosInadimplentes((prev) => ({
                      ...prev,
                      ordenar_por: e.target.value as any,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="valor_desc">Maior valor devido</option>
                  <option value="valor_asc">Menor valor devido</option>
                  <option value="dias_desc">Mais dias de atraso</option>
                  <option value="dias_asc">Menos dias de atraso</option>
                </select>
              </div>
              <div className="flex items-end">
                <Button onClick={carregarClientesInadimplentes}>
                  Gerar Relatório
                </Button>
              </div>
            </div>
          </div>

          {/* Resultados */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium mb-4">Clientes Inadimplentes</h3>

            {clientesInadimplentes && (
              <div>
                {/* Resumo - responsivo */}
                <div className="mb-6">
                  <div className="flex flex-col md:grid md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg shadow p-4 flex-1 text-center border border-gray-100">
                      <div className="text-2xl font-bold text-red-600 break-words">
                        {formatarMoeda(
                          clientesInadimplentes.resumo.total_devido_geral
                        )}
                      </div>
                      <div className="text-sm text-gray-500">Total Devido</div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4 flex-1 text-center border border-gray-100">
                      <div className="text-2xl font-bold text-orange-600 break-words">
                        {clientesInadimplentes.resumo.quantidade_clientes}
                      </div>
                      <div className="text-sm text-gray-500">
                        Clientes Inadimplentes
                      </div>
                    </div>
                  </div>
                  <div className="text-center mt-4">
                    <div className="text-sm text-gray-600">
                      Critérios: Mínimo{" "}
                      {
                        clientesInadimplentes.resumo.criterios
                          .dias_minimo_atraso
                      }{" "}
                      dias de atraso
                      {clientesInadimplentes.resumo.criterios.valor_minimo &&
                        ` • Valor mínimo ${formatarMoeda(
                          clientesInadimplentes.resumo.criterios.valor_minimo
                        )}`}
                    </div>
                  </div>
                </div>

                {/* Lista de inadimplentes - responsivo */}
                <div className="space-y-4">
                  {clientesInadimplentes.clientes_inadimplentes.map((item) => (
                    <div
                      key={item.cliente.id}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 bg-white shadow flex flex-col gap-2 md:flex-row md:justify-between md:items-center"
                    >
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 break-words">
                          {item.cliente.nome}
                        </h4>
                        {item.cliente.nome_fantasia && (
                          <p className="text-sm text-gray-500 break-words">
                            {item.cliente.nome_fantasia}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-2 mt-1">
                          {item.cliente.telefone1 && (
                            <span className="text-xs text-gray-500 bg-gray-100 rounded px-2 py-0.5">
                              📞 {item.cliente.telefone1}
                            </span>
                          )}
                          {item.cliente.email && (
                            <span className="text-xs text-gray-500 bg-gray-100 rounded px-2 py-0.5">
                              ✉️ {item.cliente.email}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end mt-3 md:mt-0 md:items-end min-w-[120px]">
                        <div className="text-lg font-bold text-red-600 break-words">
                          {formatarMoeda(item.divida.total_devido)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {item.divida.vendas_pendentes} vendas pendentes
                        </div>
                        <div className="text-sm text-red-500 font-medium">
                          {item.divida.dias_atraso_maximo} dias de atraso máximo
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          Mais antiga:{" "}
                          {item.divida.venda_mais_antiga
                            ? formatarDataSimples(item.divida.venda_mais_antiga)
                            : "-"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {clientesInadimplentes.clientes_inadimplentes.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-green-600 font-medium text-lg">
                      ✅ Nenhum cliente inadimplente encontrado!
                    </div>
                    <div className="text-sm text-gray-500 mt-2">
                      Todos os clientes estão em dia com os pagamentos.
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
