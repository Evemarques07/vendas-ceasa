import { useState, useEffect } from "react";
import { vendasService } from "@/services/api";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Loading } from "@/components/Loading";
import type { Venda, FormSeparacaoItem } from "@/types";

function formatarData(data: string | null | undefined): string {
  if (!data) return "Data não informada";
  try {
    // Se a data já estiver no formato brasileiro, retornar como está
    if (data.includes("/")) return data;

    const date = new Date(data);
    // Verificar se a data é válida
    if (isNaN(date.getTime())) {
      return "Data inválida";
    }
    return date.toLocaleDateString("pt-BR");
  } catch {
    return "Data inválida";
  }
}

function formatarDataHora(data: string | null | undefined): string {
  if (!data) return "Data não informada";
  try {
    // Se a data já estiver formatada, retornar como está
    if (data.includes("/") && data.includes(":")) return data;

    const date = new Date(data);
    // Verificar se a data é válida
    if (isNaN(date.getTime())) {
      return "Data inválida";
    }
    return date.toLocaleString("pt-BR");
  } catch {
    return "Data inválida";
  }
}

// Funções utilitárias para conversão
function toNumber(value: string | number): number {
  return typeof value === "string" ? parseFloat(value) || 0 : value;
}

function formatarMoeda(value: string | number): string {
  return toNumber(value).toFixed(2);
}

function obterNomeCliente(venda: Venda): string {
  return (
    venda.cliente?.nome ||
    venda.cliente_nome ||
    `Cliente ID: ${venda.cliente_id}`
  );
}

function obterDataPedido(venda: Venda): string {
  return venda.data_venda || venda.data_pedido || venda.criado_em || "";
}

export function SeparacaoPage() {
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [vendaSelecionada, setVendaSelecionada] = useState<Venda | null>(null);
  const [pesosReais, setPesosReais] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [processando, setProcessando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    carregarVendasParaSeparar();
  }, []);

  const carregarVendasParaSeparar = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("📋 Carregando pedidos para separação...");

      // Carregar tanto pedidos a separar quanto já separados
      const [responseSeparar, responseSeparados] = await Promise.all([
        vendasService.listar({ situacao_pedido: "A separar" }),
        vendasService.listar({ situacao_pedido: "Separado", limit: 5 }), // Últimos 5 separados
      ]);

      // Extrair vendas da resposta (baseado na estrutura real da API)
      const vendasSeparar = responseSeparar.vendas || [];
      const vendasSeparadas = responseSeparados.vendas || [];

      // Combinar e ordenar por data
      const todosPedidos = [...vendasSeparar, ...vendasSeparadas].sort(
        (a, b) => {
          // Pedidos "A separar" primeiro, depois por data
          if (a.situacao_pedido !== b.situacao_pedido) {
            return a.situacao_pedido === "A separar" ? -1 : 1;
          }
          // Usar data_venda (campo real do backend)
          const dataA = obterDataPedido(a);
          const dataB = obterDataPedido(b);
          return new Date(dataB).getTime() - new Date(dataA).getTime();
        }
      );

      setVendas(todosPedidos);
      console.log("✅ Pedidos carregados:", todosPedidos.length);
    } catch (err) {
      console.error("❌ Erro ao carregar pedidos:", err);
      setError("Erro ao carregar pedidos para separação");
    } finally {
      setLoading(false);
    }
  };

  const selecionarVenda = (venda: Venda) => {
    setVendaSelecionada(venda);
    // Inicializar pesos reais com as quantidades originais
    const pesosIniciais: Record<number, number> = {};
    venda.itens?.forEach((item) => {
      pesosIniciais[item.produto_id] = toNumber(item.quantidade);
    });
    setPesosReais(pesosIniciais);
  };

  const atualizarPesoReal = (produtoId: number, peso: number) => {
    // Validar que o peso é um número válido e positivo
    if (isNaN(peso) || peso < 0) {
      console.warn(`Peso inválido para produto ${produtoId}: ${peso}`);
      return;
    }
    
    setPesosReais((prev) => ({
      ...prev,
      [produtoId]: peso,
    }));
  };

  const confirmarSeparacao = async () => {
    if (!vendaSelecionada) return;

    try {
      setProcessando(true);

      console.log("🔄 Confirmando separação...");
      console.log("Venda selecionada:", vendaSelecionada);
      console.log("Pesos reais atuais:", pesosReais);

      // Validar se todos os itens têm peso real válido
      const itensSeparacao: FormSeparacaoItem[] =
        vendaSelecionada.itens?.map((item) => {
          const quantidadeReal = pesosReais[item.produto_id] || toNumber(item.quantidade);
          
          // Validação adicional
          if (isNaN(quantidadeReal) || quantidadeReal <= 0) {
            throw new Error(`Quantidade inválida para o produto ${item.produto_nome || item.produto_id}: ${quantidadeReal}`);
          }

          return {
            produto_id: item.produto_id,
            quantidade_real: Number(quantidadeReal),
          };
        }) || [];

      console.log("Itens preparados para separação:", itensSeparacao);

      // Verificar se há itens para separar
      if (itensSeparacao.length === 0) {
        throw new Error("Nenhum item encontrado para separação");
      }

      await vendasService.atualizarSeparacao(
        vendaSelecionada.id,
        itensSeparacao
      );

      console.log("✅ Separação confirmada com sucesso!");

      // Recarregar lista e limpar seleção
      await carregarVendasParaSeparar();
      setVendaSelecionada(null);
      setPesosReais({});
    } catch (err) {
      console.error("❌ Erro ao confirmar separação:", err);
      
      // Melhor tratamento do erro
      let mensagemErro = "Erro ao confirmar separação";
      if (err instanceof Error) {
        mensagemErro = err.message;
      } else if (typeof err === 'object' && err !== null && 'message' in err) {
        mensagemErro = (err as any).message;
      }
      
      setError(mensagemErro);
    } finally {
      setProcessando(false);
    }
  };

  const cancelarSeparacao = () => {
    setVendaSelecionada(null);
    setPesosReais({});
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Loading />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Separação de Pedidos
        </h1>
        <p className="text-gray-600 text-sm sm:text-base">
          Selecione um pedido para separar e registre os pesos reais
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
          <Button onClick={() => setError(null)} className="mt-2">
            Fechar
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Lista de Pedidos */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Pedidos (
              {vendas.filter((v) => v.situacao_pedido === "A separar").length}{" "}
              para separar,{" "}
              {vendas.filter((v) => v.situacao_pedido === "Separado").length}{" "}
              separados)
            </h2>
          </div>

          <div className="divide-y divide-gray-200">
            {vendas.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                Nenhum pedido aguardando separação
              </div>
            ) : (
              vendas.map((venda) => (
                <div
                  key={venda.id}
                  className={`p-6 cursor-pointer hover:bg-gray-50 ${
                    vendaSelecionada?.id === venda.id
                      ? "bg-blue-50 border-l-4 border-blue-500"
                      : ""
                  }`}
                  onClick={() => selecionarVenda(venda)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        Pedido #{venda.id}
                      </h3>
                      <p className="text-sm text-gray-900 font-medium">
                        {obterNomeCliente(venda)}
                      </p>
                      <p className="text-sm text-gray-600">
                        Data: {formatarData(obterDataPedido(venda))}
                      </p>
                      <p className="text-sm text-gray-600">
                        {venda.itens?.length || 0} produtos
                      </p>
                      {venda.funcionario_separacao && (
                        <p className="text-sm text-green-600">
                          Separado por: {venda.funcionario_separacao.nome}
                        </p>
                      )}
                      {venda.data_separacao && (
                        <p className="text-sm text-green-600">
                          Em: {formatarDataHora(venda.data_separacao)}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        R$ {formatarMoeda(venda.total_venda)}
                      </p>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          venda.situacao_pedido === "A separar"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {venda.situacao_pedido}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Detalhes da Separação */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              {vendaSelecionada
                ? `Separar Pedido #${vendaSelecionada.id}`
                : "Selecione um Pedido"}
            </h2>
          </div>

          {vendaSelecionada ? (
            <div className="p-6">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {obterNomeCliente(vendaSelecionada)}
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">
                      <span className="font-medium">Data do Pedido:</span>{" "}
                      {formatarData(obterDataPedido(vendaSelecionada))}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium">Valor Total:</span> R${" "}
                      {formatarMoeda(vendaSelecionada.total_venda)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">
                      <span className="font-medium">Status:</span>{" "}
                      <span
                        className={`font-medium ${
                          vendaSelecionada.situacao_pedido === "A separar"
                            ? "text-yellow-600"
                            : "text-green-600"
                        }`}
                      >
                        {vendaSelecionada.situacao_pedido}
                      </span>
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium">Produtos:</span>{" "}
                      {vendaSelecionada.itens?.length || 0}
                    </p>
                  </div>
                </div>

                {vendaSelecionada.funcionario_separacao && (
                  <div className="mt-4 p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-800">
                      <strong>Separado por:</strong>{" "}
                      {vendaSelecionada.funcionario_separacao.nome}
                    </p>
                    {vendaSelecionada.data_separacao && (
                      <p className="text-sm text-green-800">
                        <strong>Data/Hora:</strong>{" "}
                        {formatarDataHora(vendaSelecionada.data_separacao)}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-4 mb-6">
                <h4 className="font-medium text-gray-900">
                  Produtos para Separar:
                </h4>

                {vendaSelecionada.itens?.map((item) => (
                  <div
                    key={item.produto_id}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h5 className="font-medium text-gray-900">
                          {item.produto?.nome ||
                            item.produto_nome ||
                            `Produto ID: ${item.produto_id}`}
                        </h5>
                        <p className="text-sm text-gray-500 mb-1">
                          ID: {item.produto_id}
                        </p>
                        <p className="text-sm text-gray-600">
                          Quantidade pedida: {item.quantidade}{" "}
                          {item.tipo_medida}
                        </p>
                        <p className="text-sm text-gray-600">
                          Valor unitário: R${" "}
                          {formatarMoeda(item.valor_unitario)}
                        </p>
                        {item.quantidade_real && (
                          <p className="text-sm text-green-600">
                            Quantidade separada: {item.quantidade_real}{" "}
                            {item.tipo_medida}
                          </p>
                        )}
                      </div>
                    </div>

                    {vendaSelecionada.situacao_pedido === "A separar" && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Peso/Quantidade Real:
                        </label>
                        <Input
                          type="number"
                          step="0.001"
                          min="0"
                          value={
                            pesosReais[item.produto_id] !== undefined
                              ? pesosReais[item.produto_id]
                              : toNumber(item.quantidade)
                          }
                          onChange={(e) => {
                            const valor = parseFloat(e.target.value);
                            if (!isNaN(valor) && valor >= 0) {
                              atualizarPesoReal(item.produto_id, valor);
                            }
                          }}
                          placeholder={`Peso real em ${item.tipo_medida}`}
                          className="w-full"
                          required
                        />
                        {pesosReais[item.produto_id] !== undefined && 
                         pesosReais[item.produto_id] <= 0 && (
                          <p className="text-red-500 text-sm mt-1">
                            O peso deve ser maior que zero
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {vendaSelecionada.situacao_pedido === "A separar" && (
                <div className="flex space-x-4">
                  <Button
                    onClick={confirmarSeparacao}
                    disabled={processando}
                    className="flex-1"
                  >
                    {processando ? "Processando..." : "✅ Confirmar Separação"}
                  </Button>

                  <Button
                    onClick={cancelarSeparacao}
                    variant="outline"
                    disabled={processando}
                  >
                    Cancelar
                  </Button>
                </div>
              )}

              {vendaSelecionada.situacao_pedido === "Separado" && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-800 text-center font-medium">
                    ✅ Pedido já foi separado
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 text-center text-gray-500">
              <p>
                Selecione um pedido da lista ao lado para iniciar a separação
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
