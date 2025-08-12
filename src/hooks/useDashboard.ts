import { useState, useEffect } from "react";
import { dashboardService } from "@/services/api";

interface EstatisticasDashboard {
  pedidos_hoje: number;
  vendas_mes: number;
  clientes_ativos: number;
  produtos_estoque: number;
}

interface PedidoPendente {
  id: number;
  cliente_nome: string;
  quantidade_produtos: number;
  situacao_pedido: "A separar" | "Separado";
  situacao_pagamento?: "Pago" | "Pendente";
  data_criacao: string;
  data_separacao?: string;
}

interface AlerteEstoque {
  produto_id: number;
  produto_nome: string;
  quantidade_atual: number;
  estoque_minimo: number;
  diferenca: number;
  tipo_medida: string;
  status: "BAIXO" | "ZERADO";
}

interface DadosDashboard {
  estatisticas: EstatisticasDashboard;
  pedidos_pendentes: PedidoPendente[];
  alertas_estoque: AlerteEstoque[];
}

export function useDashboard() {
  const [dados, setDados] = useState<DadosDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const carregarDados = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("🔄 Carregando dados do dashboard...");
      const dadosDashboard = await dashboardService.obterDadosCompletos();

      setDados(dadosDashboard);
      console.log("✅ Dados do dashboard carregados com sucesso");
    } catch (err) {
      console.error("❌ Erro ao carregar dados do dashboard:", err);
      setError("Erro ao carregar dados do dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  return {
    dados,
    loading,
    error,
    recarregar: carregarDados,
  };
}
