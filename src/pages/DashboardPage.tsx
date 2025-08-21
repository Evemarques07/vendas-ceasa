// src/pages/DashboardPage.tsx

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { estoqueService, dashboardService } from "@/services/api";
import type { AlertasEstoque, DashboardVendas } from "@/types";

// --- Componentes ---
// import { BackendStatus } from "@/components/BackendStatus";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/Loading";

// --- Ícones ---
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Box,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  CircleDot,
  CreditCard,
  DollarSign,
  Loader2,
  Minus,
  Package,
  RefreshCw,
  ShoppingCart,
  TriangleAlert,
  Users,
  XCircle,
} from "lucide-react";
import type { ReactNode } from "react";

// --- Funções de Formatação (mantidas) ---
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

// ===================================================================
//                  COMPONENTES DE UI REUTILIZÁVEIS
// ===================================================================

interface StatCardProps {
  icon: ReactNode;
  title: string;
  value: string | number;
  footer?: string;
  color: "blue" | "green" | "purple" | "orange" | "red" | "yellow";
}

function StatCard({ icon, title, value, footer, color }: StatCardProps) {
  const colorClasses = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    purple: "bg-purple-100 text-purple-600",
    orange: "bg-orange-100 text-orange-600",
    red: "bg-red-100 text-red-600",
    yellow: "bg-yellow-100 text-yellow-600",
  };

  return (
    <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm flex items-start gap-4">
      <div className={`rounded-full p-3 ${colorClasses[color]}`}>{icon}</div>
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
        {footer && <p className="text-xs text-gray-400 mt-1">{footer}</p>}
      </div>
    </div>
  );
}

interface QuickLinkProps {
  icon: ReactNode;
  label: string;
  to: string;
}

function QuickLink({ icon, label, to }: QuickLinkProps) {
  return (
    <Link
      to={to}
      className="bg-white rounded-lg border border-gray-200 p-4 text-center hover:border-blue-500 hover:shadow-md transition-all duration-200 group flex flex-col items-center justify-center"
    >
      <div className="text-gray-500 group-hover:text-blue-600 transition-colors">
        {icon}
      </div>
      <p className="text-sm font-medium text-gray-700 mt-2 group-hover:text-blue-600 transition-colors">
        {label}
      </p>
    </Link>
  );
}

// ===================================================================
//                          PÁGINA PRINCIPAL
// ===================================================================

const estadoInicialAlertas: AlertasEstoque = {
  data: {
    produtos_estoque_baixo: [],
    produtos_sem_estoque: [],
  },
  total_alertas: 0,
  message: "",
  success: false,
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [alertas, setAlertas] = useState<AlertasEstoque>(estadoInicialAlertas);
  const [carregandoAlertas, setCarregandoAlertas] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardVendas | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [periodoSelecionado, setPeriodoSelecionado] = useState<number>(0);

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

    const hoje = new Date();
    const dataInicio = new Date(hoje);
    if (periodoSelecionado > 0) {
      dataInicio.setDate(hoje.getDate() - periodoSelecionado);
    }
    const dataInicioFormatada = dataInicio.toISOString().split("T")[0];

    // agora a chamada é no dashboardService
    const resultado = await dashboardService.obterDadosCompletos({
      data_inicio: dataInicioFormatada,
    });

    // resultado já tem { estatisticas, pedidos_pendentes, alertas_estoque }
    setDashboardData(resultado);
  } catch (err) {
    console.error("❌ Erro ao carregar dashboard:", err);
    setError(
      "Não foi possível carregar os dados do dashboard. Tente novamente."
    );
  } finally {
    setLoading(false);
  }
};

  const carregarAlertas = async () => {
    try {
      setCarregandoAlertas(true);
      const resultado = await estoqueService.obterAlertas();
      setAlertas(resultado);
    } catch (err) {
      console.error("Erro ao carregar alertas:", err);
      setAlertas({
        ...estadoInicialAlertas,
        message: "Erro ao carregar alertas",
      });
    } finally {
      setCarregandoAlertas(false);
    }
  };

  if (loading && !dashboardData) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <XCircle className="w-16 h-16 text-red-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-800">Ocorreu um Erro</h2>
        <p className="text-gray-600 mt-2">{error}</p>
        <Button onClick={carregarDashboard} className="mt-6">
          <RefreshCw className="mr-2 h-4 w-4" />
          Tentar Novamente
        </Button>
      </div>
    );
  }

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

  const ComparacaoCrescimento = () => {
    const { crescimento_percentual, diferenca_quantidade } =
      vendas_mensais.comparacao;

    const corClasses = {
      green: "bg-green-50 text-green-700",
      red: "bg-red-50 text-red-600",
      yellow: "bg-yellow-50 text-yellow-700",
    };

    let cor: keyof typeof corClasses = "yellow";
    let Icon = Minus;

    if (crescimento_percentual > 0) {
      cor = "green";
      Icon = ArrowUp;
    } else if (crescimento_percentual < 0) {
      cor = "red";
      Icon = ArrowDown;
    }

    const textoCrescimento =
      vendas_mensais.mes_anterior.valor_total === 0 &&
      vendas_mensais.mes_atual.valor_total > 0
        ? "+100%"
        : crescimento_percentual > 0
        ? `+${crescimento_percentual.toFixed(1)}%`
        : `${crescimento_percentual.toFixed(1)}%`;

    return (
      <div className={`p-4 rounded-lg text-center ${corClasses[cor]}`}>
        <p className="text-sm font-medium mb-1">Crescimento</p>
        <p className="text-xl font-bold flex items-center justify-center gap-1">
          <Icon size={18} />
          {textoCrescimento}
        </p>
        <p className="text-xs mt-1">
          {diferenca_quantidade > 0 ? "+" : ""}
          {diferenca_quantidade} vendas
        </p>
      </div>
    );
  };

  // ===================================================================
  //                   DASHBOARD PARA FUNCIONÁRIO
  // ===================================================================
  if (user?.tipo === "funcionario") {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-3xl font-bold text-gray-800">
            Painel de Separação
          </h1>
          <p className="text-gray-500 mt-1">
            Acompanhe os pedidos e o status do estoque.
          </p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard
            icon={<ShoppingCart size={22} />}
            title="Pedidos para Separar"
            value={vendas_periodo.em_separacao.quantidade}
            color="yellow"
          />
          <StatCard
            icon={<CheckCircle2 size={22} />}
            title="Pedidos Separados"
            value={vendas_periodo.separadas.quantidade}
            color="green"
          />
          <StatCard
            icon={<TriangleAlert size={22} />}
            title="Alertas de Estoque"
            value={alertas.total_alertas}
            color="red"
          />
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              Próximos Pedidos para Separação
            </h2>
            <Button asChild variant="outline">
              <Link to="/separacao">
                <span className="flex items-center">
                  Ver Todos <ArrowRight className="ml-2 h-4 w-4" />
                </span>
              </Link>
            </Button>
          </div>
          <div className="space-y-3">
            {vendas_periodo.em_separacao.vendas.length > 0 ? (
              vendas_periodo.em_separacao.vendas.slice(0, 5).map((venda) => (
                <div
                  key={venda.id}
                  className="flex flex-wrap items-center justify-between gap-3 p-3 bg-gray-50 rounded-md border"
                >
                  <div>
                    <p className="font-medium text-gray-900">{venda.cliente}</p>
                    <p className="text-sm text-gray-500">
                      {formatarMoeda(venda.valor)} &bull;{" "}
                      {formatarData(venda.data_venda)}
                    </p>
                  </div>
                  <span className="text-xs font-medium text-yellow-800 bg-yellow-100 px-2.5 py-1 rounded-full">
                    A separar
                  </span>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-6">
                Nenhum pedido para separar no momento. ✨
              </p>
            )}
          </div>
        </div>

        {/* <BackendStatus /> */}
      </div>
    );
  }

  // ===================================================================
  //                 DASHBOARD COMPLETO PARA ADMINISTRADOR
  // ===================================================================
  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Painel Administrativo
          </h1>
          <p className="text-gray-500 mt-1">
            Visão geral do desempenho e operações.
          </p>
        </div>
        <div className="relative">
          <select
            value={periodoSelecionado}
            onChange={(e) => setPeriodoSelecionado(Number(e.target.value))}
            className="w-full sm:w-56 appearance-none rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            disabled={loading}
          >
            <option value={0}>Hoje</option>
            <option value={7}>Últimos 7 dias</option>
            <option value={15}>Últimos 15 dias</option>
            <option value={30}>Últimos 30 dias</option>
            <option value={60}>Últimos 60 dias</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        </div>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
        <p className="flex items-center gap-2 text-sm text-blue-800">
          <CircleDot size={16} />
          <span>
            Exibindo dados para:{" "}
            <span className="font-semibold">
              {obterTextoPeriodo(periodoSelecionado)}
            </span>
            {dashboardData?.periodo?.descricao && (
              <span className="text-blue-600">
                {" "}
                ({dashboardData.periodo.descricao})
              </span>
            )}
          </span>
          {loading && <Loader2 size={16} className="animate-spin" />}
        </p>
        <div className="flex items-center text-xs text-green-700 bg-green-100 px-2 py-1 rounded-full">
          <span className="w-2 h-2 bg-green-500 rounded-full mr-1.5"></span>
          Dados em tempo real
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={<ShoppingCart size={22} />}
          title={`Vendas (${obterTextoPeriodo(periodoSelecionado)})`}
          value={vendas_periodo.total_vendas}
          color="blue"
        />
        <StatCard
          icon={<DollarSign size={22} />}
          title={`Faturamento (${obterTextoPeriodo(periodoSelecionado)})`}
          value={formatarMoeda(vendas_periodo.valor_total)}
          color="green"
        />
        <StatCard
          icon={<CalendarDays size={22} />}
          title="Faturamento do Mês"
          value={formatarMoeda(vendas_mensais.mes_atual.valor_total)}
          footer={`${vendas_mensais.mes_atual.quantidade} vendas`}
          color="purple"
        />
        <StatCard
          icon={<Users size={22} />}
          title="Clientes Ativos"
          value={estatisticas_clientes.clientes_ativos}
          footer={`Total: ${estatisticas_clientes.total_clientes} clientes`}
          color="orange"
        />
      </div>

      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          Análise Mensal
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg text-center">
            <p className="text-sm font-medium text-gray-600 mb-1">Mês Atual</p>
            <p className="text-xl font-bold text-blue-600">
              {formatarMoeda(vendas_mensais.mes_atual.valor_total)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {vendas_mensais.mes_atual.quantidade} vendas
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg text-center">
            <p className="text-sm font-medium text-gray-600 mb-1">
              Mês Anterior
            </p>
            <p className="text-xl font-bold text-gray-600">
              {formatarMoeda(vendas_mensais.mes_anterior.valor_total)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {vendas_mensais.mes_anterior.quantidade} vendas
            </p>
          </div>
          <ComparacaoCrescimento />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex justify-between items-start">
            <h3 className="font-semibold text-gray-800">Em Separação</h3>
            <RefreshCw className="text-yellow-500" size={20} />
          </div>
          <p className="text-3xl font-bold text-yellow-600 mt-2">
            {vendas_periodo.em_separacao.quantidade}
          </p>
          <p className="text-sm text-gray-500">
            {formatarMoeda(vendas_periodo.em_separacao.valor)}
          </p>
        </div>
        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex justify-between items-start">
            <h3 className="font-semibold text-gray-800">Separados</h3>
            <CheckCircle2 className="text-green-500" size={20} />
          </div>
          <p className="text-3xl font-bold text-green-600 mt-2">
            {vendas_periodo.separadas.quantidade}
          </p>
          <p className="text-sm text-gray-500">
            {formatarMoeda(vendas_periodo.separadas.valor)}
          </p>
        </div>
        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex justify-between items-start">
            <h3 className="font-semibold text-gray-800">
              Pagamentos Pendentes
            </h3>
            <CreditCard className="text-red-500" size={20} />
          </div>
          <p className="text-3xl font-bold text-red-600 mt-2">
            {pagamentos_pendentes.quantidade_vendas}
          </p>
          <p className="text-sm text-gray-500">
            {formatarMoeda(pagamentos_pendentes.valor_total)}
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            Alertas de Estoque
            {carregandoAlertas && (
              <Loader2 size={18} className="animate-spin text-gray-400" />
            )}
          </h2>
          <Button
            onClick={carregarAlertas}
            variant="secondary"
            size="sm"
            disabled={carregandoAlertas}
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Atualizar Alertas
          </Button>
        </div>
        {alertas.total_alertas > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-orange-700 mb-2">
                Estoque Baixo ({alertas.data.produtos_estoque_baixo.length})
              </h3>
              <div className="space-y-2">
                {alertas.data.produtos_estoque_baixo.slice(0, 5).map((p, i) => (
                  <div key={i} className="p-3 bg-orange-50 rounded-md text-sm">
                    <p className="font-medium text-orange-900">{p.produto}</p>
                    <p className="text-orange-800">
                      Atual: {p.quantidade_atual} | Mín.: {p.estoque_minimo}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-medium text-red-700 mb-2">
                Sem Estoque ({alertas.data.produtos_sem_estoque.length})
              </h3>
              <div className="space-y-2">
                {alertas.data.produtos_sem_estoque.slice(0, 5).map((p, i) => (
                  <div key={i} className="p-3 bg-red-50 rounded-md text-sm">
                    <p className="font-medium text-red-900">{p.produto}</p>
                    <p className="text-red-800">
                      Estoque zerado (Mín.: {p.estoque_minimo})
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-400" />
            <p className="mt-4 text-gray-600">
              Excelente! Nenhum alerta de estoque no momento.
            </p>
          </div>
        )}
      </div>

      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Ações Rápidas
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <QuickLink
            icon={<ShoppingCart size={28} />}
            label="Nova Venda"
            to="/vendas"
          />
          <QuickLink
            icon={<Package size={28} />}
            label="Produtos"
            to="/produtos"
          />
          <QuickLink
            icon={<Users size={28} />}
            label="Clientes"
            to="/clientes"
          />
          <QuickLink icon={<Box size={28} />} label="Estoque" to="/estoque" />
        </div>
      </div>

      {/* <BackendStatus /> */}
    </div>
  );
}
