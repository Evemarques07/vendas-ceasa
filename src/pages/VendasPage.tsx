// Modal de produtos da venda

import React, { useState, useEffect } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/Input";
import { Loading } from "@/components/Loading";
import {
  vendasService,
  clientesService,
  produtosService,
} from "@/services/api";
import { toast } from "@/components/ui/use-toast";
import type {
  Venda,
  Cliente,
  Produto,
  FormVenda,
  FormItemVenda,
  TipoMedida,
} from "@/types";
import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

export function VendasPage() {
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [formProcessing, setFormProcessing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [vendaDetalhes, setVendaDetalhes] = useState<Venda | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [filtroPagamento, setFiltroPagamento] = useState<
    "Todos" | "Pago" | "Pendente"
  >("Todos");
  const [filtroSeparacao, setFiltroSeparacao] = useState<
    "Todos" | "A separar" | "Separado"
  >("Todos");

  useEffect(() => {
    carregarDados();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [produtosModal, setProdutosModal] = useState<{
    open: boolean;
    itens: any[];
  }>({ open: false, itens: [] });

  // Estado do formulário
  const [formData, setFormData] = useState<FormVenda>({
    cliente_id: 0,
    itens: [],
    observacoes: "",
  });

  // Para permitir apagar o zero, quantidade é string no input
  const [novoItem, setNovoItem] = useState<
    Omit<FormItemVenda, "quantidade"> & { quantidade: string }
  >({
    produto_id: 0,
    quantidade: "",
    tipo_medida: "kg",
    valor_unitario: 0,
  });

  // Excluir venda
  const excluirVenda = async (vendaId: number) => {
    if (
      !window.confirm(
        "Tem certeza que deseja excluir esta venda? Esta ação não pode ser desfeita e só é permitida para vendas criadas há menos de 24h."
      )
    ) {
      return;
    }
    try {
      setFormProcessing(true);
      await vendasService.excluir(vendaId);
      toast({
        title: "Venda excluída",
        description:
          "A venda foi excluída e os produtos retornaram ao estoque.",
      });
      await carregarVendas();
    } catch (error: any) {
      console.error("Erro ao excluir venda:", error);
      toast({
        title: "Erro ao excluir venda",
        description: error?.message || "Não foi possível excluir a venda.",
        variant: "destructive",
      });
    } finally {
      setFormProcessing(false);
    }
  };

  const carregarDados = async () => {
    try {
      setLoading(true);
      await Promise.all([
        carregarVendas(),
        carregarClientes(),
        carregarProdutos(),
      ]);
    } finally {
      setLoading(false);
    }
  };

  const carregarVendas = async () => {
    try {
      const resultado = await vendasService.listar();
      setVendas(resultado.vendas);
    } catch (error) {
      console.error("Erro ao carregar vendas:", error);
      setVendas([]);
    }
  };

  const carregarClientes = async () => {
    try {
      const resultado = await clientesService.listar();
      setClientes(resultado.clientes);
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
      setClientes([
        {
          id: 1,
          nome: "João Silva",
          nome_fantasia: "Mercado do João",
          cpf_ou_cnpj: "123.456.789-00",
          endereco: "Rua das Flores, 123",
          telefone1: "(11) 99999-1111",
          telefone2: "",
          ativo: true,
          criado_em: new Date().toISOString(),
        },
      ]);
    }
  };

  const carregarProdutos = async () => {
    try {
      const resultado = await produtosService.listar();
      setProdutos(resultado.produtos);
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
      setProdutos([
        {
          id: 1,
          nome: "Banana Nanica",
          descricao: "Banana nanica de primeira qualidade",
          preco_venda: 3.5,
          tipo_medida: "kg" as TipoMedida,
          estoque_minimo: 5,
          ativo: true,
          criado_em: new Date().toISOString(),
        },
      ]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validações
    if (!formData.cliente_id || formData.cliente_id === 0) {
      toast({
        title: "Atenção",
        description: "Por favor, selecione um cliente.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.itens || formData.itens.length === 0) {
      toast({
        title: "Atenção",
        description: "Por favor, adicione pelo menos um produto.",
        variant: "destructive",
      });
      return;
    }

    if (
      !window.confirm(
        "Tem certeza que deseja ENVIAR para separação esta venda?"
      )
    ) {
      return;
    }

    try {
      setFormProcessing(true);
      await vendasService.criar(formData);
      toast({
        title: "Sucesso!",
        description: "Venda enviada para separação.",
      });
      await carregarVendas();
      resetForm();
    } catch (error) {
      console.error("Erro ao criar venda:", error);
      toast({
        title: "Erro",
        description:
          "Erro ao criar venda. Verifique os dados e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setFormProcessing(false);
    }
  };

  const handleVendaRapida = async () => {
    // Validação
    if (!formData.itens || formData.itens.length === 0) {
      toast({
        title: "Atenção",
        description: "Por favor, adicione pelo menos um produto.",
        variant: "destructive",
      });
      return;
    }

    if (!window.confirm("Tem certeza que deseja GERAR uma venda rápida?")) {
      return;
    }

    const payload = {
      produtos: formData.itens.map((item) => ({
        produto_id: item.produto_id,
        quantidade: item.quantidade,
        // O backend espera o tipo de medida em maiúsculo (ex: KG, UNIDADE)
        tipo_medida: item.tipo_medida.toUpperCase(),
      })),
      // Envia null se nenhum cliente for selecionado
      cliente_id: formData.cliente_id > 0 ? formData.cliente_id : null,
      observacoes: formData.observacoes,
    };

    try {
      setFormProcessing(true);
      await vendasService.vendaRapida(payload);
      toast({
        title: "Sucesso!",
        description: "Venda rápida realizada com sucesso.",
      });
      await carregarVendas();
      resetForm();
    } catch (error: any) {
      console.error("Erro ao realizar venda rápida:", error);
      const errorMessage =
        error?.response?.data?.detail ||
        "Erro ao realizar venda. Verifique o estoque e tente novamente.";
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setFormProcessing(false);
    }
  };

  const adicionarItem = () => {
    if (!novoItem.produto_id || novoItem.produto_id === 0) {
      alert("Por favor, selecione um produto");
      return;
    }

    const quantidadeNum = parseFloat(novoItem.quantidade.replace(",", "."));
    if (!novoItem.quantidade || isNaN(quantidadeNum) || quantidadeNum <= 0) {
      alert("Por favor, informe uma quantidade válida");
      return;
    }

    // Verificar se o produto existe no array de produtos
    const produto = (produtos || []).find((p) => p.id === novoItem.produto_id);
    if (!produto) {
      alert("Produto não encontrado");
      return;
    }

    // Verificar se o produto tem preço definido
    if (!produto.preco_venda || produto.preco_venda <= 0) {
      alert("Este produto não possui preço de venda definido");
      return;
    }

    // Verificar se o produto já está na lista
    const produtoJaAdicionado = formData.itens.find(
      (item) => item.produto_id === novoItem.produto_id
    );

    if (produtoJaAdicionado) {
      alert("Este produto já foi adicionado à venda");
      return;
    }

    // Criar item com preço automático do produto e tipo de medida
    const itemCompleto: FormItemVenda = {
      produto_id: novoItem.produto_id,
      quantidade: quantidadeNum,
      tipo_medida: produto.tipo_medida, // Converter para formato da API
      valor_unitario: produto.preco_venda,
    };

    setFormData((prev) => ({
      ...prev,
      itens: [...prev.itens, itemCompleto],
    }));

    setNovoItem({
      produto_id: 0,
      quantidade: "",
      tipo_medida: "kg",
      valor_unitario: 0,
    });
  };

  const removerItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      itens: prev.itens.filter((_: any, i: number) => i !== index),
    }));
  };

  const calcularTotal = () => {
    // Calcular o total baseado nos itens já formatados com preço
    return formData.itens.reduce((total: number, item: FormItemVenda) => {
      return total + item.quantidade * item.valor_unitario;
    }, 0);
  };

  const resetForm = () => {
    setFormData({
      cliente_id: 0,
      itens: [],
      observacoes: "",
    });
    setNovoItem({
      produto_id: 0,
      quantidade: "",
      tipo_medida: "kg",
      valor_unitario: 0,
    });
    setShowForm(false);
  };

  const verDetalhes = async (vendaId: number) => {
    try {
      const venda = await vendasService.buscarPorId(vendaId);
      console.log("Dados da venda carregados:", venda);
      console.log("Situação do pedido:", venda.situacao_pedido);
      console.log("Tem lucro_bruto?", !!venda.lucro_bruto);
      console.log("Tem custos_fifo?", !!venda.custos_fifo);
      if (venda.lucro_bruto) {
        console.log("Dados do lucro_bruto:", venda.lucro_bruto);
      }
      if (venda.custos_fifo) {
        console.log("Dados do custos_fifo:", venda.custos_fifo);
      }
      setVendaDetalhes(venda);
      setShowDetails(true);
    } catch (error) {
      console.error("Erro ao carregar detalhes da venda:", error);
      alert("Erro ao carregar detalhes da venda");
    }
  };

  const marcarComoPago = async (vendaId: number) => {
    try {
      await vendasService.marcarComoPago(vendaId);
      // Atualizar a lista de vendas
      setVendas((prevVendas) =>
        prevVendas.map((venda) =>
          venda.id === vendaId
            ? { ...venda, situacao_pagamento: "Pago" }
            : venda
        )
      );
      // Se for a venda de detalhes, atualizar também
      if (vendaDetalhes && vendaDetalhes.id === vendaId) {
        setVendaDetalhes({ ...vendaDetalhes, situacao_pagamento: "Pago" });
      }
      alert("Venda marcada como paga com sucesso!");
    } catch (error) {
      console.error("Erro ao marcar venda como paga:", error);
      alert("Erro ao marcar venda como paga");
    }
  };

  const vendasFiltradas = (vendas || []).filter((venda) => {
    // Buscar o cliente pelo ID, se não houver, considerar 'Venda de Balcão'
    let cliente = (clientes || []).find((c) => c.id === venda.cliente_id);
    let clienteNome = cliente?.nome || venda.cliente_nome;
    let clienteFantasia = cliente?.nome_fantasia;

    // Se não houver cliente_id ou cliente não encontrado, tratar como Venda de Balcão
    if (!venda.cliente_id || !clienteNome) {
      clienteNome = "Venda de Balcão";
      clienteFantasia = "";
    }

    const clienteMatch =
      (clienteNome &&
        clienteNome.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (clienteFantasia &&
        clienteFantasia.toLowerCase().includes(searchTerm.toLowerCase()));

    // Filtrar por pagamento
    const pagamentoMatch =
      filtroPagamento === "Todos" ||
      venda.situacao_pagamento === filtroPagamento;

    // Filtrar por separação
    const separacaoMatch =
      filtroSeparacao === "Todos" || venda.situacao_pedido === filtroSeparacao;

    return clienteMatch && pagamentoMatch && separacaoMatch;
  });

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  };

  const formatarData = (data: Date | string | undefined | null) => {
    try {
      // Verificar se a data existe
      if (!data) {
        return "Data não informada";
      }

      const dataObj = typeof data === "string" ? new Date(data) : data;

      // Verificar se a data é válida
      if (!dataObj || isNaN(dataObj.getTime())) {
        return "Data inválida";
      }

      return new Intl.DateTimeFormat("pt-BR").format(dataObj);
    } catch (error) {
      console.error("Erro ao formatar data:", error, data);
      return "Data inválida";
    }
  };

  const formatarDataHora = (data: string | undefined | null) => {
    try {
      if (!data) {
        return "Data não informada";
      }

      const dataObj = new Date(data);
      if (isNaN(dataObj.getTime())) {
        return "Data inválida";
      }

      return new Intl.DateTimeFormat("pt-BR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }).format(dataObj);
    } catch (error) {
      console.error("Erro ao formatar data/hora:", error, data);
      return "Data inválida";
    }
  };

  const gerarPDF = async (venda: Venda) => {
    try {
      // Criar um elemento temporário para o PDF
      const pdfContent = document.createElement("div");
      pdfContent.style.padding = "15px";
      pdfContent.style.fontFamily =
        '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
      pdfContent.style.backgroundColor = "white";
      pdfContent.style.width = "210mm";
      pdfContent.style.minHeight = "297mm";
      pdfContent.style.fontSize = "11px";
      pdfContent.style.lineHeight = "1.4";

      const clienteInfo =
        venda.cliente ||
        (clientes || []).find((c) => c.id === venda.cliente_id);

      pdfContent.innerHTML = `
        <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        h1, h2, h3, h4, p { margin: 0; }
        .p-4 { padding: 20px; }
        .text-sm { font-size: 9px; }
        .font-bold { font-weight: 700; }
        .font-semibold { font-weight: 600; }
        .text-gray-500 { color: #6b7280; }
        .text-gray-700 { color: #374151; }
        .text-gray-800 { color: #1f2937; }
        .text-white { color: #ffffff; }
        .bg-gray-50 { background-color: #f9fafb; }
        .bg-blue-600 { background-color: #2563eb; }
        .rounded-lg { border-radius: 8px; }
        .shadow-sm { box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05); }
        .w-full { width: 100%; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .mb-4 { margin-bottom: 16px; }
        .mb-2 { margin-bottom: 8px; }
        .mt-8 { margin-top: 32px; }
        .grid { display: grid; }
        .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .gap-4 { gap: 16px; }
        /* Adicionado para o alinhamento do flex */
        .flex { display: flex; }
        .items-center { align-items: center; }
        .inline-flex { display: inline-flex; }
        .justify-end { justify-content: flex-end; }
        .justify-between { justify-content: space-between; }
        .w-1/3 { width: 33.333333%; }
        .w-24 { width: 6rem; } /* 96px */
        .px-2 { padding-left: 0.5rem; padding-right: 0.5rem; }
        .py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
        .text-xs { font-size: 0.75rem; } /* 12px */
        .rounded-full { border-radius: 9999px; }
        .mt-2 { margin-top: 0.5rem; }
        .border-b { border-bottom-width: 1px; }
        .border-gray-200 { border-color: #e5e7eb; }
        .border-collapse { border-collapse: collapse; }
        .border-l-4 { border-left-width: 4px; }
        .border-yellow-400 { border-color: #facc15; }
        .bg-green-100 { background-color: #d1fae5; }
        .text-green-800 { color: #065f46; }
        .bg-yellow-100 { background-color: #fef3c7; }
        .text-yellow-800 { color: #92400e; }
        .bg-red-100 { background-color: #fee2e2; }
        .text-red-800 { color: #991b1b; }
        .bg-yellow-50 { background-color: #fffbeb; }
        .text-yellow-700 { color: #b45309; }
        .bg-gray-800 { background-color: #1f2937; }
        .bg-gray-100 { background-color: #f3f4f6; }
      </style>

      <div class="p-4">
        <!-- Cabeçalho -->
        <header class="grid grid-cols-2 gap-4 mb-8 pb-4 border-b border-gray-200">
          <div>
            <h1 class="font-bold text-2xl text-blue-600">SISTEMA DE VENDAS</h1>
            <p class="text-gray-500">Relatório de Pedido de Venda</p>
          </div>
          <div class="text-right">
            <h2 class="font-semibold text-lg text-gray-800">Pedido Nº ${
              venda.id
            }</h2>
            <p class="text-gray-500">Data: ${formatarData(venda.data_venda)}</p>
          </div>
        </header>

        <!-- Informações do Cliente e Pedido -->
        <div class="grid grid-cols-2 gap-4 mb-8">
          <div class="bg-gray-50 p-4 rounded-lg shadow-sm">
            <h3 class="font-semibold text-gray-800 mb-2">Cliente</h3>
            <p class="font-bold">${
              clienteInfo?.nome || venda.cliente_nome || "N/A"
            }</p>
            ${
              clienteInfo?.nome_fantasia
                ? `<p class="text-gray-500">${clienteInfo.nome_fantasia}</p>`
                : ""
            }
            ${
              clienteInfo?.cpf_ou_cnpj
                ? `<p class="text-sm text-gray-500">CPF/CNPJ: ${clienteInfo.cpf_ou_cnpj}</p>`
                : ""
            }
            ${
              clienteInfo?.endereco
                ? `<p class="text-sm text-gray-500">${clienteInfo.endereco}</p>`
                : ""
            }
            ${
              clienteInfo?.telefone1
                ? `<p class="text-sm text-gray-500">Tel: ${clienteInfo.telefone1}</p>`
                : ""
            }
          </div>
          <div class="bg-gray-50 p-4 rounded-lg shadow-sm">
            <h3 class="font-semibold text-gray-800 mb-2">Detalhes do Pedido</h3>
            <div class="flex items-center mb-1">
              <span class="font-semibold w-24">Status:</span>
              <span class="inline-flex items-center px-2 py-1 text-xs font-bold rounded-full ${
                venda.situacao_pedido === "Separado"
                  ? "bg-green-100 text-green-800"
                  : "bg-yellow-100 text-yellow-800"
              }">
                ${venda.situacao_pedido}
              </span>
            </div>
            <div class="flex items-center">
              <span class="font-semibold w-24">Pagamento:</span>
              <span class="inline-flex items-center px-2 py-1 text-xs font-bold rounded-full ${
                venda.situacao_pagamento === "Pago"
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }">
                ${venda.situacao_pagamento || "Pendente"}
              </span>
            </div>
            ${
              venda.funcionario_separacao
                ? `<p class="text-sm text-gray-500 mt-2">Separado por: ${venda.funcionario_separacao.nome}</p>`
                : ""
            }
            ${
              venda.data_separacao
                ? `<p class="text-sm text-gray-500">Data Separação: ${formatarDataHora(
                    venda.data_separacao
                  )}</p>`
                : ""
            }
          </div>
        </div>

        <!-- Observações -->
        ${
          venda.observacoes
            ? `
          <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md mb-8">
            <h4 class="font-semibold text-yellow-800">Observações</h4>
            <p class="text-sm text-yellow-700">${venda.observacoes}</p>
          </div>
        `
            : ""
        }

        <!-- Itens do Pedido -->
        <div class="mb-8">
          <h3 class="font-semibold text-lg text-gray-800 mb-2">Itens do Pedido</h3>
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-gray-800 text-white text-sm">
                <th class="p-2 rounded-tl-lg">Produto</th>
                <th class="p-2 text-center">Qtd. Pedida</th>
                <th class="p-2 text-center">Qtd. Real</th>
                <th class="p-2 text-right">Valor Unit.</th>
                <th class="p-2 text-right rounded-tr-lg">Total</th>
              </tr>
            </thead>
            <tbody>
              ${venda.itens
                .map(
                  (item, index) => `
                <tr class="${index % 2 === 0 ? "bg-white" : "bg-gray-50"}">
                  <td class="p-2 border-b border-gray-200">${
                    item.produto?.nome || item.produto_nome || "N/A"
                  }</td>
                  <td class="p-2 border-b border-gray-200 text-center">${
                    item.quantidade
                  } ${item.tipo_medida || ""}</td>
                  <td class="p-2 border-b border-gray-200 text-center">${
                    item.quantidade_real || "-"
                  } ${item.tipo_medida || ""}</td>
                  <td class="p-2 border-b border-gray-200 text-right">${formatarMoeda(
                    Number(item.valor_unitario)
                  )}</td>
                  <td class="p-2 border-b border-gray-200 text-right font-semibold text-gray-700">${formatarMoeda(
                    Number(item.valor_total_produto) || 0
                  )}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </div>

        <!-- Total -->
        <div class="flex justify-end mb-8">
            <div class="w-1/3">
                <div class="flex justify-between p-2 bg-gray-100 rounded-lg">
                    <span class="font-semibold text-gray-800">Total do Pedido:</span>
                    <span class="font-bold text-lg text-blue-600">${formatarMoeda(
                      Number(venda.total_venda)
                    )}</span>
                </div>
            </div>
        </div>

        <!-- Rodapé -->
        <footer class="mt-8 pt-4 border-t border-gray-200 text-center text-gray-500 text-sm">
          <p>Documento gerado pelo Sistema de Vendas em ${new Date().toLocaleString(
            "pt-BR"
          )}.</p>
          <p>Gestão Inteligente de Vendas.</p>
        </footer>
      </div>
    `;

      // Adicionar ao DOM temporariamente
      document.body.appendChild(pdfContent);

      // Gerar o canvas
      const canvas = await html2canvas(pdfContent, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        width: pdfContent.offsetWidth,
        height: pdfContent.offsetHeight,
      });

      // Remover elemento temporário
      document.body.removeChild(pdfContent);

      // Criar PDF
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");

      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Fazer download
      const fileName = `pedido_${venda.id}_${
        clienteInfo?.nome?.replace(/[^a-zA-Z0-9]/g, "_") || "cliente"
      }.pdf`;

      // Converte o PDF para um Blob, que pode ser transformado em um File
      const pdfBlob = pdf.output("blob");
      const pdfFile = new File([pdfBlob], fileName, {
        type: "application/pdf",
      });

      // Dados para a Web Share API
      const shareData = {
        files: [pdfFile],
        title: `Pedido Nº ${venda.id}`,
        text: `Segue o PDF do pedido para ${clienteInfo?.nome || "cliente"}.`,
      };

      // Verifica se o navegador suporta o compartilhamento de arquivos
      if (navigator.canShare && navigator.canShare(shareData)) {
        try {
          await navigator.share(shareData);
          console.log("PDF compartilhado com sucesso!");
        } catch (err: any) {
          // O erro 'AbortError' ocorre se o usuário fechar a janela de compartilhamento
          if (err.name !== "AbortError") {
            console.error("Erro ao compartilhar:", err);
            // Se o compartilhamento falhar, oferece o download como fallback
            toast({
              title: "Compartilhamento falhou",
              description: "O download do PDF será iniciado.",
              variant: "destructive",
            });
            pdf.save(fileName);
          }
        }
      } else {
        // Fallback para navegadores que não suportam (ex: desktop)
        console.log("Web Share API não suportada, iniciando download.");
        pdf.save(fileName);
      }
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast({
        title: "Erro ao gerar PDF",
        description: "Não foi possível gerar o arquivo. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Vendas</h1>
        <Button onClick={() => setShowForm(true)} className="w-full sm:w-auto">
          + Nova Venda
        </Button>
      </div>

      {/* Busca e Filtros */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <Input
          placeholder="Buscar por cliente..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full sm:max-w-md"
        />
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <select
            value={filtroPagamento}
            onChange={(e) =>
              setFiltroPagamento(
                e.target.value as "Todos" | "Pago" | "Pendente"
              )
            }
            className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="Todos">Todos os pagamentos</option>
            <option value="Pago">Apenas pagos</option>
            <option value="Pendente">Apenas pendentes</option>
          </select>
          <select
            value={filtroSeparacao}
            onChange={(e) =>
              setFiltroSeparacao(
                e.target.value as "Todos" | "A separar" | "Separado"
              )
            }
            className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="Todos">Todas as separações</option>
            <option value="A separar">A separar</option>
            <option value="Separado">Separados</option>
          </select>
        </div>
      </div>

      {/* Modal do Formulário */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Nova Venda</h2>
                <Button variant="outline" onClick={resetForm}>
                  ✕
                </Button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Seleção do Cliente */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cliente (Opcional para Venda Rápida)
                  </label>
                  <select
                    value={formData.cliente_id}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        cliente_id: Number(e.target.value),
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    // required
                  >
                    <option value="">Selecione um cliente</option>
                    {(clientes || []).map((cliente) => (
                      <option key={cliente.id} value={cliente.id}>
                        {cliente.nome}{" "}
                        {cliente.nome_fantasia && `- ${cliente.nome_fantasia}`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Adicionar Produtos */}
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-4">Produtos</h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Produto
                      </label>
                      <select
                        value={novoItem.produto_id}
                        onChange={(e) =>
                          setNovoItem((prev) => ({
                            ...prev,
                            produto_id: Number(e.target.value),
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Selecione</option>
                        {(produtos || []).map((produto) => (
                          <option key={produto.id} value={produto.id}>
                            {produto.nome}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quantidade Pedida
                      </label>
                      <Input
                        type="text"
                        inputMode="decimal"
                        pattern="[0-9]*[.,]?[0-9]*"
                        value={novoItem.quantidade}
                        onChange={(e) =>
                          setNovoItem((prev) => ({
                            ...prev,
                            quantidade: e.target.value.replace(/[^0-9.,]/g, ""),
                          }))
                        }
                        placeholder="Quantidade"
                      />
                    </div>

                    <div className="flex items-end">
                      <Button
                        type="button"
                        onClick={adicionarItem}
                        className="w-full"
                      >
                        Adicionar
                      </Button>
                    </div>
                  </div>

                  {/* Lista de Itens Adicionados */}
                  {formData.itens.length > 0 && (
                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-2">Itens Adicionados:</h4>
                      <div className="space-y-2">
                        {formData.itens.map(
                          (item: FormItemVenda, index: number) => {
                            const produto = (produtos || []).find(
                              (p) => p.id === item.produto_id
                            );
                            const subtotal =
                              item.quantidade * item.valor_unitario;

                            return (
                              <div
                                key={index}
                                className="flex items-center justify-between bg-gray-50 p-3 rounded"
                              >
                                <div className="flex-1">
                                  <span className="font-medium">
                                    {produto?.nome}
                                  </span>
                                  <span className="text-gray-600 ml-2">
                                    {item.quantidade} {item.tipo_medida} ×{" "}
                                    {formatarMoeda(item.valor_unitario)} ={" "}
                                    {formatarMoeda(subtotal)}
                                  </span>
                                </div>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removerItem(index)}
                                  className="text-red-600"
                                >
                                  Remover
                                </Button>
                              </div>
                            );
                          }
                        )}
                      </div>
                      <div className="text-right mt-4 text-lg font-semibold">
                        Total: {formatarMoeda(calcularTotal())}
                      </div>
                    </div>
                  )}
                </div>

                {/* Observações */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Observações
                  </label>
                  <textarea
                    value={formData.observacoes || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        observacoes: e.target.value,
                      }))
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Observações sobre a venda..."
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-2 justify-end pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                    disabled={formProcessing}
                  >
                    Cancelar
                  </Button>
                  {/* Botão para Venda Rápida (balcão) */}
                  <Button
                    type="button"
                    onClick={handleVendaRapida}
                    disabled={formProcessing || formData.itens.length === 0}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {formProcessing ? <Loading /> : "Gerar Venda (Rápida)"}
                  </Button>
                  {/* Botão para Venda a ser separada */}
                  <Button
                    type="submit"
                    disabled={formProcessing || formData.itens.length === 0}
                  >
                    {formProcessing ? <Loading /> : "Enviar para Separação"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Vendas */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Versão Desktop */}
        <div className="hidden lg:block">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente / Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Itens
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Separação
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pagamento
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {vendasFiltradas.map((venda) => {
                const clienteInfo =
                  venda.cliente ||
                  (venda.cliente_id
                    ? clientes.find((c) => c.id === venda.cliente_id)
                    : null);
                return (
                  <tr
                    key={venda.id}
                    className="hover:bg-gray-50 transition-colors duration-150"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-semibold text-gray-900">
                            {clienteInfo?.nome ||
                              venda.cliente_nome ||
                              "Venda Balcão"}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatarData(venda.data_venda)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      <button
                        className="text-blue-600 hover:text-blue-800 underline"
                        onClick={() =>
                          setProdutosModal({ open: true, itens: venda.itens })
                        }
                      >
                        {venda.itens.length}{" "}
                        {venda.itens.length > 1 ? "itens" : "item"}
                      </button>
                      {/* Modal de Produtos da Venda */}
                      {produtosModal.open && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                          <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6">
                              <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-semibold">
                                  Produtos da Venda
                                </h2>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    setProdutosModal({ open: false, itens: [] })
                                  }
                                >
                                  ✕
                                </Button>
                              </div>
                              <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 text-sm">
                                  <thead className="bg-gray-50">
                                    <tr>
                                      <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">
                                        Produto
                                      </th>
                                      <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">
                                        Qtd.
                                      </th>
                                      <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">
                                        Qtd. Real
                                      </th>
                                      <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">
                                        Medida
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className="bg-white divide-y divide-gray-200">
                                    {produtosModal.itens.map((item, idx) => {
                                      const produtoInfo =
                                        item.produto ||
                                        produtos.find(
                                          (p) => p.id === item.produto_id
                                        );
                                      return (
                                        <tr key={idx}>
                                          <td className="px-4 py-2 font-medium">
                                            {produtoInfo?.nome ||
                                              item.produto_nome ||
                                              "N/A"}
                                          </td>
                                          <td className="px-4 py-2">
                                            {item.quantidade}
                                          </td>
                                          <td className="px-4 py-2">
                                            {item.quantidade_real ?? "-"}
                                          </td>
                                          <td className="px-4 py-2 text-gray-600">
                                            {item.tipo_medida ||
                                              produtoInfo?.tipo_medida}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800">
                      {formatarMoeda(Number(venda.total_venda))}
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
                        {venda.situacao_pagamento || "Pendente"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Abrir menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {/* <DropdownMenuLabel>Ações</DropdownMenuLabel> */}
                          <DropdownMenuItem
                            onClick={() => verDetalhes(venda.id)}
                          >
                            Ver Detalhes
                          </DropdownMenuItem>
                          {venda.situacao_pagamento !== "Pago" && (
                            <DropdownMenuItem
                              onClick={() => marcarComoPago(venda.id)}
                            >
                              Marcar como Pago
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => gerarPDF(venda)}>
                            Gerar PDF
                          </DropdownMenuItem>
                          {/* <DropdownMenuSeparator /> */}
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600 focus:bg-red-50"
                            onClick={() => excluirVenda(venda.id)}
                            disabled={formProcessing}
                          >
                            Excluir Venda
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Versão Mobile */}
        <div className="lg:hidden">
          {vendasFiltradas.map((venda) => {
            const clienteInfo =
              venda.cliente ||
              (clientes || []).find((c) => c.id === venda.cliente_id);
            return (
              <div key={venda.id} className="border-b border-gray-200 p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {clienteInfo?.nome ||
                        venda.cliente_nome ||
                        "Cliente não encontrado"}
                    </h3>
                    {clienteInfo?.nome_fantasia && (
                      <p className="text-sm text-gray-500">
                        {clienteInfo.nome_fantasia}
                      </p>
                    )}
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {formatarMoeda(Number(venda.total_venda))}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                  <div>
                    <span className="text-gray-500">Data:</span>
                    <p className="font-medium">
                      {formatarData(venda.data_venda)}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Status:</span>
                    <p>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          venda.situacao_pedido === "Separado"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {venda.situacao_pedido}
                      </span>
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Pagamento:</span>
                    <p>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          venda.situacao_pagamento === "Pago"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {venda.situacao_pagamento?.toUpperCase() || "PENDENTE"}
                      </span>
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Produtos:</span>
                    <p className="text-xs">
                      {(venda.itens || []).length} item(s)
                    </p>
                  </div>
                </div>

                {venda.funcionario_separacao && (
                  <div className="mb-3 text-sm">
                    <span className="text-gray-500">Separado por:</span>
                    <p className="font-medium">
                      {venda.funcionario_separacao.nome}
                    </p>
                    {venda.data_separacao && (
                      <p className="text-xs text-gray-500">
                        {formatarDataHora(venda.data_separacao)}
                      </p>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => verDetalhes(venda.id)}
                    className="flex-1 min-w-0"
                  >
                    Ver Detalhes
                  </Button>
                  {venda.situacao_pagamento === "Pendente" && (
                    <Button
                      size="sm"
                      onClick={() => marcarComoPago(venda.id)}
                      className="bg-green-600 hover:bg-green-700 text-white flex-1 min-w-0"
                    >
                      Marcar como Pago
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={() => gerarPDF(venda)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    📄 PDF
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => excluirVenda(venda.id)}
                    disabled={formProcessing}
                  >
                    Excluir
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {vendasFiltradas.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {searchTerm
              ? "Nenhuma venda encontrada"
              : "Nenhuma venda registrada"}
          </div>
        )}
      </div>

      {/* Modal de Detalhes da Venda */}
      {showDetails && vendaDetalhes && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                  Detalhes da Venda #{vendaDetalhes.id}
                </h2>
                <Button variant="outline" onClick={() => setShowDetails(false)}>
                  ✕
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-lg font-medium mb-3">
                    Informações Gerais
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Cliente:</span>{" "}
                      {(() => {
                        const clienteInfo =
                          vendaDetalhes.cliente ||
                          (clientes || []).find(
                            (c) => c.id === vendaDetalhes.cliente_id
                          );
                        return (
                          clienteInfo?.nome ||
                          vendaDetalhes.cliente_nome ||
                          "Cliente não encontrado"
                        );
                      })()}
                    </div>
                    <div>
                      <span className="font-medium">Data:</span>{" "}
                      {formatarData(
                        vendaDetalhes.data_venda || vendaDetalhes.data_pedido
                      )}
                    </div>
                    <div>
                      <span className="font-medium">Status:</span>{" "}
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          vendaDetalhes.situacao_pedido === "Separado"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {vendaDetalhes.situacao_pedido}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Pagamento:</span>{" "}
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          vendaDetalhes.situacao_pagamento === "Pago"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {vendaDetalhes.situacao_pagamento || "Pendente"}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Total:</span>{" "}
                      {formatarMoeda(Number(vendaDetalhes.total_venda))}
                    </div>
                    {vendaDetalhes.observacoes && (
                      <div>
                        <span className="font-medium">Observações:</span>{" "}
                        {vendaDetalhes.observacoes}
                      </div>
                    )}
                    {vendaDetalhes.funcionario_separacao && (
                      <div>
                        <span className="font-medium">Separado por:</span>{" "}
                        {vendaDetalhes.funcionario_separacao.nome}
                      </div>
                    )}
                    {vendaDetalhes.data_separacao && (
                      <div>
                        <span className="font-medium">Data da Separação:</span>{" "}
                        {formatarDataHora(vendaDetalhes.data_separacao)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Seção de Análise de Lucro Bruto */}
                {vendaDetalhes.lucro_bruto && (
                  <div>
                    <h3 className="text-lg font-medium mb-3">
                      💰 Análise de Lucro Bruto
                    </h3>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-600">
                              Receita Total:
                            </span>
                            <span className="font-semibold text-blue-600">
                              {formatarMoeda(
                                vendaDetalhes.lucro_bruto.receita_total
                              )}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">
                              Custo Total (FIFO):
                            </span>
                            <span className="font-semibold text-red-600">
                              {formatarMoeda(
                                vendaDetalhes.lucro_bruto.custo_total
                              )}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Lucro Bruto:</span>
                            <span className="font-bold text-green-600 text-lg">
                              {formatarMoeda(
                                vendaDetalhes.lucro_bruto.lucro_bruto
                              )}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Margem Bruta:</span>
                            <span className="font-bold text-green-600 text-lg">
                              {vendaDetalhes.lucro_bruto.margem_bruta_percentual.toFixed(
                                2
                              )}
                              %
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Detalhamento por Produto */}
                      {vendaDetalhes.lucro_bruto.detalhes_produtos.length >
                        0 && (
                        <div className="mt-4">
                          <h4 className="font-medium text-gray-800 mb-2">
                            Detalhamento por Produto:
                          </h4>
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                              <thead className="bg-gray-100">
                                <tr>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                    Produto
                                  </th>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                    Qtd
                                  </th>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                    Receita
                                  </th>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                    Custo FIFO
                                  </th>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                    Lucro
                                  </th>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                    Margem
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {vendaDetalhes.lucro_bruto.detalhes_produtos.map(
                                  (detalhe, index) => (
                                    <tr key={index}>
                                      <td className="px-3 py-2 text-gray-900 font-medium">
                                        {detalhe.produto_nome}
                                      </td>
                                      <td className="px-3 py-2 text-gray-600">
                                        {detalhe.quantidade_vendida}
                                      </td>
                                      <td className="px-3 py-2 text-blue-600 font-medium">
                                        {formatarMoeda(detalhe.receita_produto)}
                                      </td>
                                      <td className="px-3 py-2 text-red-600 font-medium">
                                        {formatarMoeda(detalhe.custo_produto)}
                                      </td>
                                      <td className="px-3 py-2 text-green-600 font-semibold">
                                        {formatarMoeda(detalhe.lucro_produto)}
                                      </td>
                                      <td className="px-3 py-2 text-green-600 font-semibold">
                                        {detalhe.margem_produto.toFixed(2)}%
                                      </td>
                                    </tr>
                                  )
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Análise FIFO legada (para compatibilidade) */}
                {!vendaDetalhes.lucro_bruto && vendaDetalhes.custos_fifo && (
                  <div>
                    <h3 className="text-lg font-medium mb-3">Análise FIFO</h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium">Custo Total:</span>{" "}
                        {formatarMoeda(vendaDetalhes.custos_fifo.custo_total)}
                      </div>
                      <div>
                        <span className="font-medium">Lucro Bruto:</span>{" "}
                        <span className="text-green-600 font-semibold">
                          {formatarMoeda(vendaDetalhes.custos_fifo.lucro_bruto)}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">Margem:</span>{" "}
                        <span className="text-blue-600 font-semibold">
                          {vendaDetalhes.custos_fifo.margem_percentual}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-lg font-medium mb-3">Itens da Venda</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Produto
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Qtd. Pedida
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Qtd. Real
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Valor Unit.
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                        {(vendaDetalhes.custos_fifo ||
                          vendaDetalhes.lucro_bruto) && (
                          <>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Custo FIFO
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Lucro
                            </th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {vendaDetalhes.itens.map((item, index) => {
                        // Priorizar produto do objeto completo da API, depois busca local
                        const produtoInfo =
                          item.produto ||
                          (produtos || []).find(
                            (p) => p.id === item.produto_id
                          );
                        return (
                          <tr key={index}>
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {produtoInfo?.nome ||
                                item.produto_nome ||
                                "Produto não encontrado"}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                              {item.quantidade}{" "}
                              {item.tipo_medida || produtoInfo?.tipo_medida}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                              {item.quantidade_real || "-"}{" "}
                              {item.tipo_medida || produtoInfo?.tipo_medida}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatarMoeda(Number(item.valor_unitario))}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {formatarMoeda(
                                Number(item.valor_total_produto) || 0
                              )}
                            </td>
                            {(vendaDetalhes.custos_fifo ||
                              vendaDetalhes.lucro_bruto) && (
                              <>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-red-600">
                                  {(() => {
                                    // Priorizar dados da nova estrutura
                                    if (vendaDetalhes.lucro_bruto) {
                                      const detalhe =
                                        vendaDetalhes.lucro_bruto.detalhes_produtos.find(
                                          (d) =>
                                            d.produto_id === item.produto_id
                                        );
                                      return detalhe
                                        ? formatarMoeda(detalhe.custo_produto)
                                        : "-";
                                    }
                                    // Fallback para estrutura legada
                                    return item.custo_fifo
                                      ? formatarMoeda(item.custo_fifo)
                                      : "-";
                                  })()}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-green-600">
                                  {(() => {
                                    // Priorizar dados da nova estrutura
                                    if (vendaDetalhes.lucro_bruto) {
                                      const detalhe =
                                        vendaDetalhes.lucro_bruto.detalhes_produtos.find(
                                          (d) =>
                                            d.produto_id === item.produto_id
                                        );
                                      return detalhe
                                        ? formatarMoeda(detalhe.lucro_produto)
                                        : "-";
                                    }
                                    // Fallback para estrutura legada
                                    return item.lucro_item
                                      ? formatarMoeda(item.lucro_item)
                                      : "-";
                                  })()}
                                </td>
                              </>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
                <Button
                  onClick={() => gerarPDF(vendaDetalhes)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  📄 Gerar PDF
                </Button>
                <Button onClick={() => setShowDetails(false)}>Fechar</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
