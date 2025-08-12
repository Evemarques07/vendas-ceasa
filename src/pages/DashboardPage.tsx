import { useAuth } from "@/contexts/AuthContext";
import { BackendStatus } from "@/components/BackendStatus";
import { Link } from "react-router-dom";
import { Button } from "@/components/Button";
import { Loading } from "@/components/Loading";
import { useState, useEffect } from "react";
import { estoqueService, relatoriosService } from "@/services/api";
import type { AlertasEstoque, DashboardVendas } from "@/types";

function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

function formatarData(data: string): string {
  try {
    if (!data) return "Data não informada";
    const dataObj = new Date(data);
    if (isNaN(dataObj.getTime())) return "Data inválida";
    return dataObj.toLocaleDateString("pt-BR");
  } catch (error) {
    return "Data inválida";
  }
}

function obterTextoPeriodo(dias: number): string {
  switch (dias) {
    case 0:
      return "Hoje";
    case 7:
      return "Últimos 7 dias";
    case 15:
      return "Últimos 15 dias";
    case 30:
      return "Últimos 30 dias";
    case 60:
      return "Últimos 60 dias";
    default:
      return "Período personalizado";
  }
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [alertas, setAlertas] = useState<AlertasEstoque | null>(null);
  const [carregandoAlertas, setCarregandoAlertas] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardVendas | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [periodoSelecionado, setPeriodoSelecionado] = useState<number>(0); // 0 = hoje, 7, 15, 30, 60 dias atrás

  // Carregar dados ao montar o componente e quando mudar o período
  useEffect(() => {
    carregarAlertas();
  }, []);

  useEffect(() => {
    carregarDashboard();
  }, [periodoSelecionado]);

  const carregarDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("📊 Carregando dashboard de vendas...");

      // Calcular data de início baseada no período selecionado
      const hoje = new Date();
      const dataInicio = new Date(hoje);

      if (periodoSelecionado > 0) {
        dataInicio.setDate(hoje.getDate() - periodoSelecionado);
      }

      const dataInicioFormatada = dataInicio.toISOString().split("T")[0];

      const resultado = await relatoriosService.obterDashboardVendas({
        data_inicio: dataInicioFormatada,
      });

      console.log("✅ Dashboard carregado:", resultado);
      setDashboardData(resultado.data);
    } catch (error) {
      console.error("❌ Erro ao carregar dashboard:", error);
      setError("Erro ao carregar dados do dashboard");
    } finally {
      setLoading(false);
    }
  };

  const carregarAlertas = async () => {
    try {
      setCarregandoAlertas(true);
      console.log("Carregando alertas do dashboard...");
      const resultado = await estoqueService.obterAlertas();
      console.log("Resultado dos alertas:", resultado);
      setAlertas(resultado);
    } catch (error) {
      console.error("Erro ao carregar alertas:", error);
      setAlertas({
        data: {
          produtos_estoque_baixo: [],
          produtos_sem_estoque: [],
        },
        total_alertas: 0,
        message: "Erro ao carregar alertas",
        success: false,
      });
    } finally {
      setCarregandoAlertas(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Loading />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
          <Button onClick={carregarDashboard} className="mt-2">
            Tentar Novamente
          </Button>
        </div>
      </div>
    );
  }

  // Dados do dashboard com fallback para modo desenvolvimento
  const vendas_periodo = dashboardData?.vendas_periodo || {
    total_vendas: 0,
    valor_total: 0,
    em_separacao: { quantidade: 0, valor: 0, vendas: [] },
    separadas: { quantidade: 0, valor: 0, vendas: [] },
  };

  const vendas_mensais = dashboardData?.vendas_mensais || {
    mes_atual: { quantidade: 0, valor_total: 0 },
    mes_anterior: { quantidade: 0, valor_total: 0 },
    comparacao: {
      diferenca_quantidade: 0,
      diferenca_valor: 0,
      crescimento_percentual: 0,
    },
  };

  const estatisticas_clientes = dashboardData?.estatisticas_clientes || {
    total_clientes: 0,
    clientes_ativos: 0,
    clientes_inativos: 0,
  };

  const pagamentos_pendentes = dashboardData?.pagamentos_pendentes || {
    quantidade_vendas: 0,
    valor_total: 0,
    vendas: [],
  };

  // Dashboard para funcionário (simplificado)
  if (user?.tipo === "funcionario") {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Dashboard - Separação
          </h1>
          <p className="text-gray-600">Sistema de separação de pedidos</p>
        </div>

        {/* Cards responsivos para funcionário */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">
                  Pedidos para Separar
                </p>
                <p className="text-xl md:text-2xl font-bold text-yellow-600">
                  {vendas_periodo.em_separacao.quantidade}
                </p>
              </div>
              <div className="w-8 h-8 md:w-10 md:h-10 bg-yellow-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm md:text-base">📋</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">
                  Pedidos Separados
                </p>
                <p className="text-xl md:text-2xl font-bold text-green-600">
                  {vendas_periodo.separadas.quantidade}
                </p>
              </div>
              <div className="w-8 h-8 md:w-10 md:h-10 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm md:text-base">✅</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4 md:p-6 md:col-span-2 xl:col-span-1">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">
                  Alertas de Estoque
                </p>
                <p className="text-xl md:text-2xl font-bold text-red-600">
                  {alertas?.total_alertas || 0}
                </p>
              </div>
              <div className="w-8 h-8 md:w-10 md:h-10 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm md:text-base">⚠️</span>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de pedidos para separação - responsiva */}
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-2 sm:mb-0">
              Pedidos para Separação
            </h2>
            <Link
              to="/separacao"
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Ver Todos
            </Link>
          </div>
          <div className="space-y-3">
            {vendas_periodo.em_separacao.vendas.slice(0, 5).map((venda) => (
              <div
                key={venda.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
              >
                <div className="flex-1 mb-2 sm:mb-0">
                  <p className="font-medium text-gray-900 text-sm md:text-base">
                    {venda.cliente}
                  </p>
                  <p className="text-xs md:text-sm text-gray-600">
                    {formatarMoeda(venda.valor)} -{" "}
                    {formatarData(venda.data_venda)}
                  </p>
                </div>
                <span className="text-xs md:text-sm font-medium text-yellow-600 bg-yellow-100 px-2 py-1 rounded">
                  A separar
                </span>
              </div>
            ))}
            {vendas_periodo.em_separacao.vendas.length === 0 && (
              <p className="text-gray-500 text-center py-4 text-sm md:text-base">
                Nenhum pedido para separar no momento
              </p>
            )}
          </div>
        </div>

        <BackendStatus />
      </div>
    );
  }

  // Dashboard completo para administrador
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              Dashboard Administrativo
            </h1>
            <p className="text-gray-600">Visão geral do sistema</p>
          </div>

          {/* Seletor de período */}
          <div className="mt-4 sm:mt-0">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Período de análise:
            </label>
            <select
              value={periodoSelecionado}
              onChange={(e) => setPeriodoSelecionado(Number(e.target.value))}
              className="block w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
              disabled={loading}
            >
              <option value={0}>Hoje</option>
              <option value={7}>Últimos 7 dias</option>
              <option value={15}>Últimos 15 dias</option>
              <option value={30}>Últimos 30 dias</option>
              <option value={60}>Últimos 60 dias</option>
            </select>
          </div>
        </div>

        {/* Indicador do período atual */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-blue-800 mb-2 sm:mb-0">
              <span className="font-medium">Dados exibidos:</span>{" "}
              {obterTextoPeriodo(periodoSelecionado)}
              {dashboardData?.periodo?.descricao && (
                <span className="ml-2 text-blue-600">
                  ({dashboardData.periodo.descricao})
                </span>
              )}
              {loading && (
                <span className="ml-2">
                  <span className="inline-block w-3 h-3 border border-blue-600 border-t-transparent rounded-full animate-spin"></span>
                  <span className="ml-1">Carregando...</span>
                </span>
              )}
            </p>
            <div className="flex items-center text-xs text-green-700 bg-green-100 px-2 py-1 rounded">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
              Dados em tempo real
            </div>
          </div>
        </div>
      </div>

      {/* Cards de estatísticas - responsivos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">
                {periodoSelecionado === 0
                  ? "Vendas Hoje"
                  : `Vendas (${obterTextoPeriodo(periodoSelecionado)})`}
              </p>
              <p className="text-xl md:text-2xl font-bold text-gray-900">
                {vendas_periodo.total_vendas}
              </p>
            </div>
            <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm md:text-base">📋</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">
                {periodoSelecionado === 0
                  ? "Faturamento Hoje"
                  : `Faturamento (${obterTextoPeriodo(periodoSelecionado)})`}
              </p>
              <p className="text-xl md:text-2xl font-bold text-gray-900">
                {formatarMoeda(vendas_periodo.valor_total)}
              </p>
            </div>
            <div className="w-8 h-8 md:w-10 md:h-10 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm md:text-base">💰</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Vendas do Mês</p>
              <p className="text-xl md:text-2xl font-bold text-gray-900">
                {formatarMoeda(vendas_mensais.mes_atual.valor_total)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {vendas_mensais.mes_atual.quantidade} vendas
              </p>
            </div>
            <div className="w-8 h-8 md:w-10 md:h-10 bg-purple-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm md:text-base">📅</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">
                Clientes Ativos
              </p>
              <p className="text-xl md:text-2xl font-bold text-gray-900">
                {estatisticas_clientes.clientes_ativos}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Total: {estatisticas_clientes.total_clientes}
              </p>
            </div>
            <div className="w-8 h-8 md:w-10 md:h-10 bg-orange-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm md:text-base">👥</span>
            </div>
          </div>
        </div>
      </div>

      {/* Card de comparação mensal */}
      <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Comparação Mensal
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-sm font-medium text-gray-600 mb-2">Mês Atual</p>
            <p className="text-xl font-bold text-blue-600">
              {formatarMoeda(vendas_mensais.mes_atual.valor_total)}
            </p>
            <p className="text-sm text-gray-500">
              {vendas_mensais.mes_atual.quantidade} vendas
            </p>
          </div>

          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-600 mb-2">
              Mês Anterior
            </p>
            <p className="text-xl font-bold text-gray-600">
              {formatarMoeda(vendas_mensais.mes_anterior.valor_total)}
            </p>
            <p className="text-sm text-gray-500">
              {vendas_mensais.mes_anterior.quantidade} vendas
            </p>
          </div>

          <div
            className={`text-center p-4 rounded-lg ${
              vendas_mensais.comparacao.crescimento_percentual > 0
                ? "bg-green-50"
                : vendas_mensais.comparacao.crescimento_percentual < 0
                ? "bg-red-50"
                : "bg-yellow-50"
            }`}
          >
            <p className="text-sm font-medium text-gray-600 mb-2">
              Crescimento
            </p>
            <p
              className={`text-xl font-bold ${
                vendas_mensais.comparacao.crescimento_percentual > 0
                  ? "text-green-600"
                  : vendas_mensais.comparacao.crescimento_percentual < 0
                  ? "text-red-600"
                  : "text-yellow-600"
              }`}
            >
              {vendas_mensais.mes_anterior.valor_total === 0 &&
              vendas_mensais.mes_atual.valor_total > 0
                ? "+100%"
                : vendas_mensais.comparacao.crescimento_percentual > 0
                ? `+${vendas_mensais.comparacao.crescimento_percentual.toFixed(
                    1
                  )}%`
                : vendas_mensais.comparacao.crescimento_percentual === 0
                ? "0%"
                : `${vendas_mensais.comparacao.crescimento_percentual.toFixed(
                    1
                  )}%`}
            </p>
            <p className="text-sm text-gray-500">
              {vendas_mensais.comparacao.diferenca_quantidade > 0 ? "+" : ""}
              {vendas_mensais.comparacao.diferenca_quantidade} vendas
            </p>
          </div>
        </div>
      </div>

      {/* Cards de situação dos pedidos - responsivos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Em Separação
            </h3>
            <span className="text-2xl">🔄</span>
          </div>
          <p className="text-2xl md:text-3xl font-bold text-yellow-600 mb-2">
            {vendas_periodo.em_separacao.quantidade}
          </p>
          <p className="text-sm text-gray-600">Pedidos aguardando separação</p>
          <Link
            to="/vendas"
            className="mt-3 inline-flex items-center text-sm text-yellow-600 hover:text-yellow-700"
          >
            Ver detalhes →
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Separados</h3>
            <span className="text-2xl">✅</span>
          </div>
          <p className="text-2xl md:text-3xl font-bold text-green-600 mb-2">
            {vendas_periodo.separadas.quantidade}
          </p>
          <p className="text-sm text-gray-600">Pedidos prontos para entrega</p>
          <Link
            to="/vendas"
            className="mt-3 inline-flex items-center text-sm text-green-600 hover:text-green-700"
          >
            Ver detalhes →
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Pag. Pendente
            </h3>
            <span className="text-2xl">💳</span>
          </div>
          <p className="text-2xl md:text-3xl font-bold text-red-600 mb-2">
            {pagamentos_pendentes.quantidade_vendas}
          </p>
          <p className="text-sm text-gray-600">
            Pedidos com pagamento pendente
          </p>
          <Link
            to="/vendas"
            className="mt-3 inline-flex items-center text-sm text-red-600 hover:text-red-700"
          >
            Ver detalhes →
          </Link>
        </div>
      </div>

      {/* Alertas de Estoque - responsivo */}
      <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
          <div className="flex items-center mb-2 sm:mb-0">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 mr-2">
              Alertas de Estoque
            </h2>
            {carregandoAlertas && (
              <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={carregarAlertas}
              disabled={carregandoAlertas}
              className="text-sm bg-gray-600 hover:bg-gray-700"
            >
              Atualizar
            </Button>
            <Link
              to="/relatorios"
              className="inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Ver Relatórios
            </Link>
          </div>
        </div>

        {alertas && alertas.data ? (
          <div className="space-y-4">
            {/* Produtos com estoque baixo */}
            {alertas.data.produtos_estoque_baixo &&
              alertas.data.produtos_estoque_baixo.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-orange-800 mb-2">
                    Estoque Baixo ({alertas.data.produtos_estoque_baixo.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {alertas.data.produtos_estoque_baixo
                      .slice(0, 6)
                      .map((produto, index) => (
                        <div
                          key={index}
                          className="bg-orange-50 border border-orange-200 rounded-lg p-3"
                        >
                          <h4 className="font-medium text-orange-800 text-sm md:text-base">
                            {produto.produto}
                          </h4>
                          <p className="text-xs md:text-sm text-orange-700">
                            Atual: {produto.quantidade_atual} | Mínimo:{" "}
                            {produto.estoque_minimo}
                          </p>
                        </div>
                      ))}
                  </div>
                </div>
              )}

            {/* Produtos sem estoque */}
            {alertas.data.produtos_sem_estoque &&
              alertas.data.produtos_sem_estoque.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-red-800 mb-2">
                    Sem Estoque ({alertas.data.produtos_sem_estoque.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {alertas.data.produtos_sem_estoque
                      .slice(0, 6)
                      .map((produto, index) => (
                        <div
                          key={index}
                          className="bg-red-50 border border-red-200 rounded-lg p-3"
                        >
                          <h4 className="font-medium text-red-800 text-sm md:text-base">
                            {produto.produto}
                          </h4>
                          <p className="text-xs md:text-sm text-red-700">
                            Estoque zerado - Mínimo: {produto.estoque_minimo}
                          </p>
                        </div>
                      ))}
                  </div>
                </div>
              )}

            {/* Caso não tenha alertas */}
            {(!alertas.data.produtos_estoque_baixo ||
              alertas.data.produtos_estoque_baixo.length === 0) &&
              (!alertas.data.produtos_sem_estoque ||
                alertas.data.produtos_sem_estoque.length === 0) && (
                <div className="text-center py-8">
                  <span className="text-4xl mb-4 block">✅</span>
                  <p className="text-gray-500 text-sm md:text-base">
                    Todos os produtos estão com estoque adequado
                  </p>
                </div>
              )}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm md:text-base">
              {carregandoAlertas
                ? "Carregando alertas..."
                : "Nenhum alerta disponível"}
            </p>
          </div>
        )}
      </div>

      {/* Lista de vendas recentes - responsiva */}
      <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
          <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-2 sm:mb-0">
            {periodoSelecionado === 0
              ? "Resumo de Vendas - Hoje"
              : `Resumo de Vendas - ${obterTextoPeriodo(periodoSelecionado)}`}
          </h2>
          <Link
            to="/vendas"
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Ver Todas
          </Link>
        </div>

        {vendas_periodo.total_vendas === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm md:text-base">
              Nenhuma venda registrada no período
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg bg-yellow-50 border-yellow-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900">Em Separação</h3>
                <span className="text-sm text-yellow-600 bg-yellow-100 px-2 py-1 rounded">
                  A separar
                </span>
              </div>
              <p className="text-2xl font-bold text-yellow-600 mb-1">
                {vendas_periodo.em_separacao.quantidade}
              </p>
              <p className="text-sm text-gray-600">
                {formatarMoeda(vendas_periodo.em_separacao.valor)}
              </p>
            </div>

            <div className="p-4 border rounded-lg bg-green-50 border-green-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900">Separadas</h3>
                <span className="text-sm text-green-600 bg-green-100 px-2 py-1 rounded">
                  Separado
                </span>
              </div>
              <p className="text-2xl font-bold text-green-600 mb-1">
                {vendas_periodo.separadas.quantidade}
              </p>
              <p className="text-sm text-gray-600">
                {formatarMoeda(vendas_periodo.separadas.valor)}
              </p>
            </div>

            {pagamentos_pendentes.quantidade_vendas > 0 && (
              <div className="p-4 border rounded-lg bg-red-50 border-red-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900">Pag. Pendente</h3>
                  <span className="text-sm text-red-600 bg-red-100 px-2 py-1 rounded">
                    Pendente
                  </span>
                </div>
                <p className="text-2xl font-bold text-red-600 mb-1">
                  {pagamentos_pendentes.quantidade_vendas}
                </p>
                <p className="text-sm text-gray-600">
                  {formatarMoeda(pagamentos_pendentes.valor_total || 0)}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Links rápidos - responsivos */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Link
          to="/vendas"
          className="bg-white rounded-lg shadow-md p-4 md:p-6 text-center hover:shadow-lg transition-shadow"
        >
          <div className="text-2xl md:text-3xl mb-2">🛒</div>
          <p className="text-sm md:text-base font-medium text-gray-900">
            Nova Venda
          </p>
        </Link>
        <Link
          to="/produtos"
          className="bg-white rounded-lg shadow-md p-4 md:p-6 text-center hover:shadow-lg transition-shadow"
        >
          <div className="text-2xl md:text-3xl mb-2">📦</div>
          <p className="text-sm md:text-base font-medium text-gray-900">
            Produtos
          </p>
        </Link>
        <Link
          to="/clientes"
          className="bg-white rounded-lg shadow-md p-4 md:p-6 text-center hover:shadow-lg transition-shadow"
        >
          <div className="text-2xl md:text-3xl mb-2">👥</div>
          <p className="text-sm md:text-base font-medium text-gray-900">
            Clientes
          </p>
        </Link>
        <Link
          to="/estoque"
          className="bg-white rounded-lg shadow-md p-4 md:p-6 text-center hover:shadow-lg transition-shadow"
        >
          <div className="text-2xl md:text-3xl mb-2">📊</div>
          <p className="text-sm md:text-base font-medium text-gray-900">
            Estoque
          </p>
        </Link>
      </div>

      <BackendStatus />
    </div>
  );
}
