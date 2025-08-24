// Função para gerar PDF a partir do HTML estilizado e compartilhar
import html2canvas from "html2canvas";

// Função para gerar HTML estilizado da venda e abrir em nova aba

import React, { useEffect, useState } from "react";
import {
  vendasService,
  clientesService,
  produtosService,
} from "@/services/api";
import type {
  Venda,
  Cliente,
  SituacaoPagamento,
  Produto,
  FormItemVenda,
} from "@/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

import jsPDF from "jspdf";
import "jspdf-autotable";

// Estendendo a interface do jsPDF para incluir o autoTable e evitar erros de TypeScript
// (declarado em src/types/jspdf-autotable.d.ts)

const PAGE_SIZE = 20;
const situacoesPagamento: SituacaoPagamento[] = ["Pago", "Pendente"];

async function compartilharHTMLComoPDF(venda: Venda) {
  // Cria o HTML estilizado em um elemento oculto
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-9999px";
  container.style.top = "0";
  container.style.width = "800px";
  container.style.background = "#fff";
  container.innerHTML = compartilharVendaComoHTMLString(venda);
  document.body.appendChild(container);

  // Usa html2canvas para capturar o HTML
  const canvas = await html2canvas(container, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#fff",
  });
  document.body.removeChild(container);

  // Define tamanho da página A4 em pixels (jsPDF usa 1pt = 1/72in, mas aqui usamos mm -> px)
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // Calcula escala para caber na largura da página
  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  // Adiciona a imagem e faz quebra de página se necessário
  let remainingHeight = imgHeight;
  let pageCanvasHeight = canvas.height;
  let pageCanvasWidth = canvas.width;
  let sY = 0;
  const pagePxHeight = (canvas.width / imgWidth) * pageHeight;

  while (remainingHeight > 0) {
    // Cria um canvas temporário para cada página
    const pageCanvas = document.createElement("canvas");
    pageCanvas.width = pageCanvasWidth;
    pageCanvas.height = Math.min(pagePxHeight, pageCanvasHeight - sY);
    const ctx = pageCanvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
      ctx.drawImage(
        canvas,
        0,
        sY,
        pageCanvasWidth,
        pageCanvas.height,
        0,
        0,
        pageCanvasWidth,
        pageCanvas.height
      );
      const pageImgData = pageCanvas.toDataURL("image/png");
      pdf.addImage(
        pageImgData,
        "PNG",
        0,
        0,
        imgWidth,
        (pageCanvas.height * imgWidth) / pageCanvasWidth
      );
      sY += pageCanvas.height;
      remainingHeight -= (pageCanvas.height * imgWidth) / pageCanvasWidth;
      if (remainingHeight > 0) pdf.addPage();
    } else {
      break;
    }
  }

  // Compartilha ou faz download
  const pdfBlob = pdf.output("blob");
  const pdfFile = new File([pdfBlob], `Pedido_${venda.id}.pdf`, {
    type: "application/pdf",
  });
  if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
    try {
      await navigator.share({
        files: [pdfFile],
        title: `Pedido de Venda #${venda.id}`,
        text: `Segue o pedido de venda #${venda.id}`,
      });
      return;
    } catch (err) {
      // fallback
    }
  }
  // Fallback: download
  pdf.save(`Pedido_${venda.id}.pdf`);
}

// Função que retorna o HTML estilizado como string (sem abrir nova aba)
function compartilharVendaComoHTMLString(venda: Venda) {
  const dataVenda = new Date(venda.data_venda).toLocaleString("pt-BR");
  const itensHtml = venda.itens
    .map(
      (item) => `
    <tr>
      <td>${
        item.produto?.nome || item.produto_nome || `ID ${item.produto_id}`
      }</td>
      <td style="text-align:center">${item.quantidade} ${item.tipo_medida}</td>
      <td style="text-align:right">R$ ${Number(
        item.valor_unitario ?? 0
      ).toFixed(2)}</td>
      <td style="text-align:right">R$ ${(
        Number(item.quantidade ?? 0) * Number(item.valor_unitario ?? 0)
      ).toFixed(2)}</td>
    </tr>
  `
    )
    .join("");
  // Caminho da logo (ajuste se necessário)
  const logoUrl = "/public/logoFrutosDaTerra.png";
  return `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; background: #f4f8fb; color: #222; max-width: 700px; margin: 32px auto; background: #fff; border-radius: 18px; box-shadow: 0 4px 24px #0002; padding: 40px 32px 32px 32px; border: 1.5px solid #e0e7ef;">
      <div style="display: flex; align-items: center; gap: 18px; margin-bottom: 18px;">
        <img src="${logoUrl}" alt="Logo Frutos da Terra" style="height: 70px; width: 70px; object-fit: contain; border-radius: 12px; box-shadow: 0 2px 8px #0001; background: #fff; border: 1px solid #e0e0e0;" />
        <div>
          <h1 style="color: #2980b9; font-size: 2.1rem; margin: 0; font-weight: 700; letter-spacing: 1px;">Frutos da Terra</h1>
          <div style="font-size: 1.1rem; color: #6b7280; font-weight: 500;">Hortifruti - Ceasa</div>
        </div>
      </div>
      <div style="margin-bottom: 24px; border-bottom: 1.5px solid #e0e7ef; padding-bottom: 12px;">
        <span style="font-size: 1.3rem; color: #2980b9; font-weight: 600;">Pedido de Venda #${
          venda.id
        }</span>
      </div>
      <div style="margin-bottom: 18px; display: flex; flex-wrap: wrap; gap: 24px;">
        <div style="min-width: 220px;"><strong style="color: #555;">Cliente:</strong> ${
          venda.cliente?.nome || venda.cliente_nome || "-"
        }</div>
        <div style="min-width: 120px;"><strong style="color: #555;">Data:</strong> ${dataVenda}</div>
        <div style="min-width: 120px;"><strong style="color: #555;">Situação:</strong> ${
          venda.situacao_pagamento
        }</div>
      </div>
      <table style="width: 100%; border-collapse: collapse; margin-top: 18px; font-size: 1.05rem;">
        <thead>
          <tr>
            <th style="background: #2980b9; color: #fff; text-align: left; padding: 10px 8px; border-radius: 6px 0 0 0;">Produto</th>
            <th style="background: #2980b9; color: #fff; text-align: center; padding: 10px 8px;">Qtd</th>
            <th style="background: #2980b9; color: #fff; text-align: right; padding: 10px 8px;">Vl. Unitário</th>
            <th style="background: #2980b9; color: #fff; text-align: right; padding: 10px 8px; border-radius: 0 6px 0 0;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itensHtml}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="3" style="text-align:right; font-weight:bold; color:#2980b9; border-top:2px solid #2980b9; padding:12px 8px; font-size:1.1rem;">TOTAL DO PEDIDO:</td>
            <td style="text-align:right; font-weight:bold; color:#2980b9; border-top:2px solid #2980b9; padding:12px 8px; font-size:1.1rem;">R$ ${Number(
              venda.total_venda ?? 0
            ).toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>
      ${
        {}.hasOwnProperty.call(venda, "observacoes") && venda.observacoes
          ? `<div style="margin-top:28px; background:#f1f5f9; padding:14px 18px; border-radius:8px; color:#555; font-size:1.05rem; border-left: 4px solid #2980b9;"><strong>Observações:</strong> ${venda.observacoes}</div>`
          : ""
      }
      <div style="margin-top:38px; text-align:center; color:#2980b9; font-size:1.05rem; font-weight: 600; letter-spacing: 1px;">Pedido gerado por Frutos da Terra - Ceasa</div>
    </div>
  `;
}
type FiltrosVendas = {
  cliente_id: string;
  situacao_pagamento: SituacaoPagamento | "";
};

export function VendasPage() {
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [filtros, setFiltros] = useState<FiltrosVendas>({
    cliente_id: "",
    situacao_pagamento: "",
  });
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [abrirModal, setAbrirModal] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [formVenda, setFormVenda] = useState({
    cliente_id: "",
    observacoes: "",
    itens: [] as FormItemVenda[],
  });
  const [novoItem, setNovoItem] = useState<Partial<FormItemVenda>>({});
  const [salvando, setSalvando] = useState(false);
  const [erroForm, setErroForm] = useState<string | null>(null);
  const [vendaSelecionada, setVendaSelecionada] = useState<Venda | null>(null);

  useEffect(() => {
    clientesService
      .listar({ limit: 100 })
      .then((res) => setClientes(res.clientes));
    produtosService
      .listar({ limit: 100 })
      .then((res) => setProdutos(res.produtos));
  }, []);

  useEffect(() => {
    buscarVendas();
    // eslint-disable-next-line
  }, [pagina]);

  function buscarVendas() {
    setCarregando(true);
    vendasService
      .listar({
        skip: (pagina - 1) * PAGE_SIZE,
        limit: PAGE_SIZE,
        cliente_id: filtros.cliente_id ? Number(filtros.cliente_id) : undefined,
        situacao_pagamento: filtros.situacao_pagamento || undefined,
      })
      .then((res) => {
        setVendas(res.vendas);
        setTotalPaginas(Math.max(1, Math.ceil(res.total / PAGE_SIZE)));
      })
      .finally(() => setCarregando(false));
  }

  function handleFiltroChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    setFiltros((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  function aplicarFiltros(e: React.FormEvent) {
    e.preventDefault();
    setPagina(1);
    buscarVendas();
  }

  function handleProdutoChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const produtoId = Number(e.target.value);
    const produto = produtos.find((p) => p.id === produtoId);
    setNovoItem((i) => ({
      ...i,
      produto_id: produtoId || undefined,
      valor_unitario: produto ? produto.preco_venda : undefined,
      tipo_medida: produto ? produto.tipo_medida : undefined,
    }));
  }

  function adicionarItem() {
    if (
      !novoItem.produto_id ||
      novoItem.quantidade === undefined ||
      !novoItem.tipo_medida ||
      novoItem.valor_unitario === undefined ||
      novoItem.custo === undefined
    ) {
      setErroForm("Preencha todos os campos do item.");
      return;
    }
    if (
      formVenda.itens.some((item) => item.produto_id === novoItem.produto_id)
    ) {
      setErroForm("Este produto já foi adicionado ao pedido.");
      return;
    }
    const quantidade = Number(novoItem.quantidade);
    const valor_unitario = Number(novoItem.valor_unitario);
    const custo = Number(novoItem.custo);
    const lucro_bruto = (valor_unitario - custo) * quantidade;
    setFormVenda((f) => ({
      ...f,
      itens: [
        ...f.itens,
        {
          produto_id: Number(novoItem.produto_id),
          quantidade,
          tipo_medida: novoItem.tipo_medida as string,
          valor_unitario,
          custo,
          lucro_bruto,
        },
      ],
    }));
    setNovoItem({});
    setErroForm(null);
  }

  function removerItem(idx: number) {
    setFormVenda((f) => ({
      ...f,
      itens: f.itens.filter((_, i) => i !== idx),
    }));
  }

  async function salvarVenda(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErroForm(null);
    try {
      if (!formVenda.cliente_id || formVenda.itens.length === 0) {
        setErroForm("Selecione o cliente e adicione pelo menos um item.");
        setSalvando(false);
        return;
      }
      await vendasService.criar({
        ...formVenda,
        cliente_id: Number(formVenda.cliente_id),
        situacao_pagamento: "Pendente",
      });
      setAbrirModal(false);
      setFormVenda({
        cliente_id: "",
        observacoes: "",
        itens: [],
      });
      setPagina(1);
      buscarVendas();
    } catch (err: any) {
      setErroForm(err?.message || "Erro ao salvar venda");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Vendas</h1>
          <Button className="mt-2 sm:mt-0" onClick={() => setAbrirModal(true)}>
            + Nova Venda
          </Button>
        </header>

        {/* Filtros */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <form
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end"
            onSubmit={aplicarFiltros}
          >
            <div className="w-full">
              <label className="text-sm font-medium text-gray-600">
                Cliente
              </label>
              <select
                name="cliente_id"
                value={filtros.cliente_id}
                onChange={handleFiltroChange}
                className="w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todos os clientes</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-full">
              <label className="text-sm font-medium text-gray-600">
                Situação
              </label>
              <select
                name="situacao_pagamento"
                value={filtros.situacao_pagamento}
                onChange={handleFiltroChange}
                className="w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todas as situações</option>
                {situacoesPagamento.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-start-4 flex justify-end">
              <Button type="submit" className="w-full sm:w-auto">
                Filtrar
              </Button>
            </div>
          </form>
        </div>

        {/* Grade de Vendas */}
        {carregando ? (
          <div className="text-center py-10 text-gray-500">
            Carregando vendas...
          </div>
        ) : vendas.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-lg shadow-sm">
            <h3 className="text-lg font-medium text-gray-800">
              Nenhuma venda encontrada
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Tente ajustar os filtros ou crie uma nova venda.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {vendas.map((venda) => (
              <div
                key={venda.id}
                className="bg-white rounded-lg shadow-md p-5 border-l-4 border-transparent hover:border-blue-500 cursor-pointer transition-all duration-300 flex flex-col justify-between"
                onClick={() => setVendaSelecionada(venda)}
              >
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-bold text-lg text-gray-800">
                      Venda #{venda.id}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        venda.situacao_pagamento === "Pago"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {venda.situacao_pagamento}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    <span className="font-medium text-gray-800">Cliente:</span>{" "}
                    {venda.cliente?.nome ||
                      venda.cliente_nome ||
                      "Não informado"}
                  </div>
                  <div className="text-xs text-gray-400 mb-4">
                    {new Date(venda.data_venda).toLocaleString("pt-BR", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </div>
                  <div className="flex justify-between items-baseline border-t pt-3">
                    <span className="font-semibold text-gray-600">Total:</span>
                    <span className="text-blue-600 text-xl font-bold">
                      R$ {Number(venda.total_venda).toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 mt-4">
                  {venda.situacao_pagamento === "Pendente" && (
                    <button
                      type="button"
                      className="w-full sm:w-auto px-4 py-2 rounded-md border-2 border-blue-500 bg-blue-50 text-blue-800 font-semibold hover:bg-blue-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300"
                      onClick={async (e) => {
                        e.stopPropagation();
                        await vendasService.marcarComoPago(venda.id);
                        buscarVendas();
                      }}
                    >
                      Marcar como Pago
                    </button>
                  )}
                  <button
                    type="button"
                    className="w-full sm:w-auto px-4 py-2 rounded-md border-2 border-red-500 bg-red-50 text-red-700 font-semibold hover:bg-red-100 transition-colors focus:outline-none focus:ring-2 focus:ring-red-300"
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (
                        window.confirm(
                          "Tem certeza que deseja excluir esta venda?"
                        )
                      ) {
                        await vendasService.excluir(venda.id);
                        buscarVendas();
                      }
                    }}
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Paginação */}
        <div className="flex justify-between items-center mt-6 bg-white px-4 py-3 rounded-lg shadow-sm">
          <span className="text-sm text-gray-600">
            Página {pagina} de {totalPaginas}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={pagina === 1}
              onClick={() => setPagina((p) => Math.max(1, p - 1))}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              disabled={pagina === totalPaginas}
              onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
            >
              Próxima
            </Button>
          </div>
        </div>
      </div>

      {/* Modal de Detalhes da Venda */}
      <Dialog
        open={!!vendaSelecionada}
        onOpenChange={() => setVendaSelecionada(null)}
      >
        <DialogContent className="max-w-3xl">
          <DialogTitle className="text-2xl font-bold text-gray-800 flex items-center justify-between">
            <span>Detalhes da Venda #{vendaSelecionada?.id}</span>
            {vendaSelecionada && (
              <>
                <button
                  type="button"
                  className="ml-4 px-3 py-1 rounded-md border-2 border-purple-500 bg-purple-50 text-purple-800 font-semibold hover:bg-purple-100 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-300 text-sm"
                  onClick={() => compartilharHTMLComoPDF(vendaSelecionada)}
                  title="Compartilhar PDF estilizado"
                >
                  Compartilhar
                </button>
              </>
            )}
          </DialogTitle>
          {vendaSelecionada && (
            <div className="mt-4 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="bg-gray-50 p-3 rounded-md">
                  <span className="font-semibold text-gray-600 block">
                    Cliente
                  </span>{" "}
                  <span className="text-gray-800">
                    {vendaSelecionada.cliente?.nome ||
                      vendaSelecionada.cliente_nome ||
                      "-"}
                  </span>
                </div>
                <div className="bg-gray-50 p-3 rounded-md">
                  <span className="font-semibold text-gray-600 block">
                    Data
                  </span>{" "}
                  <span className="text-gray-800">
                    {new Date(vendaSelecionada.data_venda).toLocaleString(
                      "pt-BR"
                    )}
                  </span>
                </div>
                <div className="bg-gray-50 p-3 rounded-md">
                  <span className="font-semibold text-gray-600 block">
                    Pagamento
                  </span>{" "}
                  <span className="text-gray-800">
                    {vendaSelecionada.situacao_pagamento}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <span className="font-semibold text-blue-800 block text-md">
                    Total do Pedido
                  </span>
                  <span className="text-blue-900 text-2xl font-bold">
                    R$ {Number(vendaSelecionada.total_venda).toFixed(2)}
                  </span>
                </div>
                {vendaSelecionada.lucro_bruto_total !== undefined &&
                  vendaSelecionada.lucro_bruto_total !== null && (
                    <div className="bg-green-50 p-4 rounded-lg text-center">
                      <span className="font-semibold text-green-800 block text-md">
                        Lucro Bruto Total
                      </span>
                      <span className="text-green-900 text-2xl font-bold">
                        R${" "}
                        {Number(vendaSelecionada.lucro_bruto_total).toFixed(2)}
                      </span>
                    </div>
                  )}
              </div>

              <div>
                <h3 className="font-semibold text-lg text-gray-700 mb-2">
                  Itens do Pedido
                </h3>
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="text-left p-2 font-medium text-gray-600">
                          Produto
                        </th>
                        <th className="text-center p-2 font-medium text-gray-600">
                          Qtd
                        </th>
                        <th className="text-center p-2 font-medium text-gray-600">
                          Vl. Unit.
                        </th>
                        <th className="text-center p-2 font-medium text-gray-600">
                          Custo
                        </th>
                        <th className="text-center p-2 font-medium text-gray-600">
                          Lucro
                        </th>
                        <th className="text-right p-2 font-medium text-gray-600">
                          Total Item
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {vendaSelecionada.itens.map((item, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="p-2">
                            {item.produto?.nome ||
                              item.produto_nome ||
                              `ID ${item.produto_id}`}
                          </td>
                          <td className="p-2 text-center">{item.quantidade}</td>
                          <td className="p-2 text-center">
                            R$ {Number(item.valor_unitario ?? 0).toFixed(2)}
                          </td>
                          <td className="p-2 text-center">
                            R${" "}
                            {item.custo !== undefined
                              ? Number(item.custo).toFixed(2)
                              : "-"}
                          </td>
                          <td className="p-2 text-center text-green-600">
                            R${" "}
                            {item.lucro_bruto !== undefined
                              ? Number(item.lucro_bruto).toFixed(2)
                              : "-"}
                          </td>
                          <td className="p-2 text-right font-medium">
                            R${" "}
                            {item.valor_total_produto !== undefined
                              ? Number(item.valor_total_produto).toFixed(2)
                              : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Nova Venda */}
      <Dialog open={abrirModal} onOpenChange={setAbrirModal}>
        <DialogContent className="max-w-4xl">
          <DialogTitle className="text-2xl font-bold text-gray-800">
            Criar Nova Venda
          </DialogTitle>
          <form onSubmit={salvarVenda} className="mt-4 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Cliente
              </label>
              <select
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                value={formVenda.cliente_id}
                onChange={(e) =>
                  setFormVenda((f) => ({ ...f, cliente_id: e.target.value }))
                }
                required
              >
                <option value="">Selecione um cliente</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="border rounded-lg p-4 space-y-4">
              <h3 className="font-medium text-gray-800">Itens da Venda</h3>
              <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
                <select
                  className="md:col-span-2 border-gray-300 rounded-md shadow-sm"
                  value={novoItem.produto_id || ""}
                  onChange={handleProdutoChange}
                >
                  <option value="">Selecione um produto</option>
                  {produtos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min={0.01}
                  step={0.01}
                  placeholder="Qtd"
                  className="border-gray-300 rounded-md shadow-sm w-full"
                  value={novoItem.quantidade ?? ""}
                  onChange={(e) =>
                    setNovoItem((i) => ({
                      ...i,
                      quantidade:
                        e.target.value === ""
                          ? undefined
                          : Number(e.target.value),
                    }))
                  }
                />
                <input
                  type="text"
                  placeholder="Medida"
                  className="border-gray-300 rounded-md shadow-sm bg-gray-100 w-full"
                  value={novoItem.tipo_medida || ""}
                  disabled
                />
                <input
                  type="text"
                  placeholder="Preço Venda"
                  className="border-gray-300 rounded-md shadow-sm bg-gray-100 w-full"
                  value={
                    novoItem.valor_unitario !== undefined &&
                    novoItem.valor_unitario !== null
                      ? `R$ ${Number(novoItem.valor_unitario).toFixed(2)}`
                      : ""
                  }
                  disabled
                />
                <input
                  type="number"
                  min={0.01}
                  step={0.01}
                  placeholder="Custo"
                  className="border-gray-300 rounded-md shadow-sm w-full"
                  value={novoItem.custo ?? ""}
                  onChange={(e) =>
                    setNovoItem((i) => ({
                      ...i,
                      custo:
                        e.target.value === ""
                          ? undefined
                          : Number(e.target.value),
                    }))
                  }
                />
                <Button
                  type="button"
                  onClick={adicionarItem}
                  className="w-full"
                >
                  Adicionar
                </Button>
              </div>
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-2 text-left font-medium text-gray-600">
                        Produto
                      </th>
                      <th className="p-2 text-center font-medium text-gray-600">
                        Qtd
                      </th>
                      <th className="p-2 text-center font-medium text-gray-600">
                        Vl. Unit.
                      </th>
                      <th className="p-2 text-right font-medium text-gray-600">
                        Total
                      </th>
                      <th className="p-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {formVenda.itens.map((item, idx) => {
                      const prod = produtos.find(
                        (p) => p.id === item.produto_id
                      );
                      const totalItem =
                        (item.quantidade ?? 0) * (item.valor_unitario ?? 0);
                      return (
                        <tr key={idx} className="border-t">
                          <td className="p-2">
                            {prod?.nome || item.produto_id}
                          </td>
                          <td className="p-2 text-center">
                            {item.quantidade} {item.tipo_medida}
                          </td>
                          <td className="p-2 text-center">
                            R$ {Number(item.valor_unitario).toFixed(2)}
                          </td>
                          <td className="p-2 text-right font-medium">
                            R$ {totalItem.toFixed(2)}
                          </td>
                          <td className="p-2 text-center">
                            <Button
                              type="button"
                              size="sm"
                              variant="danger"
                              onClick={() => removerItem(idx)}
                            >
                              X
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Observações
              </label>
              <textarea
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                value={formVenda.observacoes}
                onChange={(e) =>
                  setFormVenda((f) => ({ ...f, observacoes: e.target.value }))
                }
                rows={3}
                placeholder="Adicione qualquer observação relevante para esta venda..."
              />
            </div>
            {erroForm && (
              <div className="text-red-600 bg-red-50 p-3 rounded-md text-sm">
                {erroForm}
              </div>
            )}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAbrirModal(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={salvando}>
                {salvando ? "Salvando..." : "Salvar Venda"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
