// --- Gráficos ---
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
// src/pages/DashboardPage.tsx

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { dashboardService } from "@/services/api";
import type { DashboardVendas } from "@/types";

// --- Componentes ---
// import { BackendStatus } from "@/components/BackendStatus";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/Loading";

// --- Ícones ---
import {
  ChevronDown,
  CircleDot,
  DollarSign,
  Loader2,
  Package,
  RefreshCw,
  ShoppingCart,
  Users,
  XCircle,
  FileText,
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

export default function DashboardPage() {
  useAuth(); // apenas para garantir contexto, sem extrair 'user'
  const [dashboardData, setDashboardData] = useState<DashboardVendas | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [periodoSelecionado, setPeriodoSelecionado] = useState<number>(0);

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

  // Novo formato do dashboard
  // const periodo = dashboardData?.periodo || {}; // não utilizado
  // Ajuste: vendas_periodo pode não ter lucro_bruto_total/ticket_medio dependendo do backend
  const vendas_periodo = dashboardData?.vendas_periodo || {
    total_vendas: 0,
    valor_total: 0,
  };
  const estatisticas_clientes = dashboardData?.estatisticas_clientes || {
    total_clientes: 0,
    clientes_ativos: 0,
    clientes_inativos: 0,
  };
  const vendas_mensais = dashboardData?.vendas_mensais || {};
  const pagamentos_pendentes = dashboardData?.pagamentos_pendentes || {
    quantidade_vendas: 0,
    valor_total: 0,
    vendas: [],
  };
  // Ajuste: ranking_clientes vem de dashboardData.ranking_clientes
  const ranking_clientes = (dashboardData as any)?.ranking_clientes || [];

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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
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
          icon={<DollarSign size={22} />}
          title="Lucro Bruto"
          value={formatarMoeda((vendas_periodo as any).lucro_bruto_total ?? 0)}
          color="purple"
        />
        <StatCard
          icon={<DollarSign size={22} />}
          title="Ticket Médio"
          value={formatarMoeda((vendas_periodo as any).ticket_medio ?? 0)}
          color="yellow"
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
          Vendas, Faturamento e Lucro dos Últimos 12 Meses
        </h3>
        <div style={{ width: "100%", height: 350 }}>
          <ResponsiveContainer>
            <ComposedChart
              data={Object.entries(vendas_mensais)
                .slice(-12)
                .map(([mes, dados]: any) => ({
                  mes,
                  vendas: dados.quantidade,
                  faturamento: dados.valor_total,
                  lucro: dados.lucro_bruto_total,
                }))}
              margin={{ top: 20, right: 50, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="left" tickFormatter={(v: number) => `${v}`} />
              <YAxis
                yAxisId="faturamento"
                orientation="right"
                tickFormatter={(v: number) => formatarMoeda(Number(v))}
                width={80}
                label={{
                  // value: "Faturamento",
                  angle: -90,
                  position: "insideRight",
                  offset: 30,
                }}
                stroke="#22c55e"
                axisLine={true}
                tickLine={true}
                mirror={false}
                hide={false}
                // domain={[0, 'auto']}
              />
              <YAxis
                yAxisId="lucro"
                orientation="right"
                tickFormatter={(v: number) => formatarMoeda(Number(v))}
                width={80}
                label={{
                  // value: "Lucro Bruto",
                  angle: -90,
                  position: "outsideRight",
                  offset: 80,
                }}
                stroke="#a21caf"
                axisLine={true}
                tickLine={true}
                mirror={false}
                hide={false}
                // domain={[0, 'auto']}
              />
              <Tooltip
                formatter={(value: any, name: string) =>
                  name === "faturamento" || name === "lucro"
                    ? formatarMoeda(Number(value))
                    : value
                }
              />
              <Legend />
              <Bar
                yAxisId="left"
                dataKey="vendas"
                name="Vendas"
                fill="#2563eb"
                radius={[4, 4, 0, 0]}
              />
              <Line
                yAxisId="faturamento"
                type="monotone"
                dataKey="faturamento"
                name="Faturamento"
                stroke="#22c55e"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
              <Line
                yAxisId="lucro"
                type="monotone"
                dataKey="lucro"
                name="Lucro Bruto"
                stroke="#a21caf"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          Pagamentos Pendentes
        </h3>
        {pagamentos_pendentes.vendas &&
        pagamentos_pendentes.vendas.length > 0 ? (
          <div className="space-y-2">
            {pagamentos_pendentes.vendas.map((venda: any) => (
              <div
                key={venda.id}
                className="flex flex-wrap items-center justify-between gap-3 p-3 bg-yellow-50 rounded-md border"
              >
                <div>
                  <p className="font-medium text-gray-900">{venda.cliente}</p>
                  <p className="text-sm text-gray-500">
                    {formatarMoeda(venda.valor)} &bull;{" "}
                    {formatarData(venda.data_venda)}
                  </p>
                </div>
                <span className="text-xs font-medium text-yellow-800 bg-yellow-100 px-2.5 py-1 rounded-full">
                  {venda.dias_pendente === 0
                    ? "Hoje"
                    : `${venda.dias_pendente} dias pendente`}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 py-6">
            Nenhum pagamento pendente no momento.
          </p>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          Ranking de Clientes
        </h3>
        {ranking_clientes.length > 0 ? (
          <div className="space-y-2">
            {ranking_clientes.map((cliente: any, idx: number) => (
              <div
                key={idx}
                className="flex flex-wrap items-center justify-between gap-3 p-3 bg-blue-50 rounded-md border"
              >
                <div>
                  <p className="font-medium text-gray-900">{cliente.cliente}</p>
                  <p className="text-sm text-gray-500">
                    {cliente.qtd_vendas} vendas &bull;{" "}
                    {formatarMoeda(cliente.valor_total)}
                  </p>
                </div>
                <span className="text-xs font-medium text-blue-800 bg-blue-100 px-2.5 py-1 rounded-full">
                  Lucro: {formatarMoeda(cliente.lucro_total)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 py-6">
            Nenhum cliente no ranking.
          </p>
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
          <QuickLink
            icon={<FileText size={28} />}
            label="Relatórios"
            to="/relatorios"
          />
        </div>
      </div>
    </div>
  );
}
