//src/types/index.ts

// Tipos de usuário
export type TipoUsuario = "administrador" | "funcionario";

// Interface do usuário
export interface Usuario {
  id: number;
  nome: string;
  email: string;
  cpf_ou_cnpj: string; // Campo confirmado pela API
  tipo: TipoUsuario;
  ativo: boolean;
  criado_em: string;
  atualizado_em?: string | null; // Adicionado
}

// Interface para o formulário de criação de usuário
export interface FormUsuarioCreate {
  nome: string;
  cpf_ou_cnpj: string;
}

// Interface para o formulário de alteração de senha (simplificado)
export interface FormUsuarioChangePassword {
  nova_senha: string;
}

// Interface para paginação - usuários (não é paginado pela API, mas mantemos para consistência)
export interface ListaPaginadaUsuarios {
  usuarios: Usuario[];
  total: number;
  // skip e limit não são usados por esta API específica, mas mantemos a estrutura
  skip: number;
  limit: number;
}

// Filtros para pesquisa de usuários (não suportado pela API, mas pode ser usado para filtro no frontend)
export interface FiltroUsuarios {
  nome?: string;
  email?: string;
  tipo?: TipoUsuario;
  ativo?: boolean;
  skip?: number;
  limit?: number;
}

// Tipos de medida - valores padronizados conforme backend
export type TipoMedida =
  | "kg"
  | "unidade"
  | "litro"
  | "caixa"
  | "saco"
  | "duzia";

// Status do pedido

// Status do pagamento
export type SituacaoPagamento = "Pago" | "Pendente";

// Interface do cliente
export interface Cliente {
  id: number;
  nome: string;
  nome_fantasia?: string;
  cpf_ou_cnpj: string;
  endereco: string;
  ponto_referencia?: string;
  email?: string;
  telefone1: string;
  telefone2?: string;
  ativo: boolean;
  criado_em: string;
  atualizado_em?: string;
}

// Interface do produto
export interface Produto {
  id: number;
  nome: string;
  descricao?: string; // Campo opcional conforme documentação da API
  preco_venda: number;
  tipo_medida: TipoMedida;
  estoque_minimo: number;
  imagem?: string;
  ativo: boolean;
  criado_em: string;
}

// Interface do detalhamento de lucro por produto
export interface DetalheLucroProduto {
  produto_id: number;
  produto_nome: string;
  quantidade_vendida: number;
  receita_produto: number;
  custo_produto: number;
  lucro_produto: number;
  margem_produto: number;
}

// Interface do lucro bruto da venda
export interface LucroBruto {
  receita_total: number;
  custo_total: number;
  lucro_bruto: number;
  margem_bruta_percentual: number;
  detalhes_produtos: DetalheLucroProduto[];
}

// Interface do item da venda
export interface ItemVenda {
  id?: number;
  produto_id: number;
  quantidade: string | number;
  tipo_medida: string;
  valor_unitario: string | number;
  valor_cust?: string | number; // legado, pode vir da API antiga
  custo?: string | number; // novo campo, pode vir da API
  lucro_bruto?: string | number; // novo campo, pode vir da API
  valor_total_produto?: string | number;
  venda_id?: number;
  produto?: {
    id: number;
    nome: string;
    descricao?: string;
    preco_venda: string | number;
    tipo_medida: string;
    estoque_minimo: string | number;
    ativo: boolean;
    imagem?: string | null;
    criado_em: string;
    atualizado_em?: string | null;
  };
  criado_em?: string;
  atualizado_em?: string;
  produto_nome?: string;
}

// Interface da venda
export interface Venda {
  id: number;
  cliente_id: number;
  observacoes?: string;
  total_venda: string | number;
  lucro_bruto_total?: string | number; // novo campo
  situacao_pagamento: SituacaoPagamento;
  data_venda: string;
  cliente?: {
    id: number;
    nome: string;
    nome_fantasia?: string | null;
    cpf_ou_cnpj: string;
    endereco: string;
    ponto_referencia?: string | null;
    email?: string | null;
    telefone1: string;
    telefone2?: string | null;
    ativo: boolean;
    criado_em: string;
    atualizado_em?: string | null;
  };
  itens: ItemVenda[];
  criado_em?: string;
  atualizado_em?: string;
  cliente_nome?: string;
}

export interface VendaRapidaPayload {
  produtos: {
    produto_id: number;
    quantidade: number;
    tipo_medida: string;
  }[];
  cliente_id?: number | null;
  observacoes?: string;
}

// Interface da entrada de estoque
export interface EntradaEstoque {
  id: number;
  produto_id: number;
  produto_nome?: string;
  quantidade: number;
  preco_custo: number;
  fornecedor: string;
  observacoes?: string;
  data_entrada: string;
  valor_total?: string | number;
  tipo_medida?: string;
  produto?: {
    id: number;
    nome: string;
    descricao?: string;
    preco_venda: string | number;
    tipo_medida: string;
    estoque_minimo: string | number;
    ativo: boolean;
    imagem?: string | null;
    criado_em: string;
    atualizado_em?: string | null;
  };
  criado_em?: string;
  atualizado_em?: string | null;
}

// Interface do inventário
export interface Inventario {
  produto_id: number;
  tipo_medida: string;
  quantidade_atual: string;
  valor_unitario: string;
  observacoes?: string;
  id: number;
  valor_total: string;
  data_ultima_atualizacao: string;
  produto: {
    descricao: string;
    id: number;
    imagem?: string;
    ativo: boolean;
    criado_em: string;
    atualizado_em?: string;
  };
  criado_em: string;
  atualizado_em?: string;
}

// Interface para resumo do estoque
export interface ResumoEstoque {
  produto_id: number;
  produto_nome: string;
  quantidade_total: number;
  valor_total: number;
  ultima_entrada?: string;
  ultimo_inventario?: string;
}

// Interface para formulários
export interface FormCliente {
  nome: string;
  nome_fantasia?: string;
  cpf_ou_cnpj: string;
  endereco: string;
  ponto_referencia?: string;
  email?: string;
  telefone1: string;
  telefone2?: string;
  ativo?: boolean;
}

export interface FormProduto {
  nome: string;
  descricao?: string; // Campo opcional conforme documentação da API
  preco_venda: number;
  tipo_medida: TipoMedida;
  estoque_minimo: number;
  ativo?: boolean;
  imagem?: File;
}

export interface FormItemVenda {
  produto_id: number;
  quantidade: number;
  tipo_medida: string; // "kg", "un", etc.
  valor_unitario: number;
  custo: number; // custo unitário informado na venda
  lucro_bruto: number;
}

export interface FormVenda {
  cliente_id: number;
  observacoes?: string;
  itens: FormItemVenda[];
  situacao_pagamento: SituacaoPagamento;
}

export interface FormEntradaEstoque {
  produto_id: number;
  tipo_medida: string;
  quantidade: number;
  preco_custo: number;
  fornecedor: string;
  observacoes?: string;
}

export interface FormInventario {
  produto_id: number;
  quantidade_atual: number;
  observacoes?: string;
}

export interface FormCorrecaoInventario {
  quantidade_atual: number;
  observacoes: string;
}

// Interfaces para resposta da API
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  message: string;
  code: string;
  details?: Record<string, any>;
}

// Interface para paginação - clientes
export interface ListaPaginadaClientes {
  clientes: Cliente[];
  total: number;
  skip: number;
  limit: number;
}

// Interface para paginação - produtos
export interface ListaPaginadaProdutos {
  produtos: Produto[];
  total: number;
  skip: number;
  limit: number;
}

// Interface para paginação - vendas
export interface ListaPaginadaVendas {
  vendas: Venda[];
  total: number;
  skip: number;
  limit: number;
}

// Interface para paginação - entradas de estoque
export interface ListaPaginadaEntradas {
  entradas: EntradaEstoque[];
  total: number;
  skip: number;
  limit: number;
}

// Interface para paginação - inventário
export interface ListaPaginadaInventario {
  inventario: Inventario[];
  total: number;
  skip: number;
  limit: number;
}

// Filtros para pesquisa
export interface FiltroClientes {
  nome?: string;
  cpf_ou_cnpj?: string;
  ativo?: boolean;
  skip?: number;
  limit?: number;
}

export interface FiltroProdutos {
  nome?: string;
  tipo_medida?: TipoMedida;
  ativo?: boolean;
  skip?: number;
  limit?: number;
}

export interface FiltroVendas {
  cliente_id?: number;
  data_inicio?: string;
  data_fim?: string;
  situacao_pagamento?: SituacaoPagamento;
  skip?: number;
  limit?: number;
}

export interface FiltroEstoque {
  idProduto?: string;
  dataInicio?: Date;
  dataFim?: Date;
}

// Interfaces para fluxo de caixa FIFO
export interface MovimentacaoCaixa {
  id: number;
  produto_id: number;
  tipo: "entrada" | "saida";
  quantidade: string;
  preco_unitario: string;
  valor_total: string;
  data: string;
  observacoes?: string;
}

export interface FluxoCaixa {
  total_entradas: string | number;
  total_saidas: string | number;
  saldo: string | number;
  lucro_bruto_total: string | number;
  margem_media: string;
  quantidade_vendas: number;
  movimentacoes: MovimentacaoCaixa[];
}

// Interfaces para rentabilidade
export interface VendaRentabilidade {
  venda_id: number;
  data_venda: string;
  quantidade_vendida: number;
  receita: number;
  custo_fifo: number;
  lucro: number;
  margem: string;
  cliente_nome: string;
}

export interface ProdutoRentabilidade {
  produto: {
    id: number;
    nome: string;
    descricao?: string;
  };
  quantidade_vendida: string;
  receita_total: string;
  custo_total: string;
  lucro_bruto: string;
  vendas: number;
  margem_bruta: string;
}

export interface ResumoRentabilidade {
  total_vendas: string;
  total_custos: string;
  lucro_bruto_total: string;
  margem_bruta_geral: string;
  produtos_vendidos: number;
}

export interface Rentabilidade {
  periodo: {
    inicio: string;
    fim: string;
  };
  resumo: ResumoRentabilidade;
  produtos: ProdutoRentabilidade[];
}

// Interfaces para alertas de estoque
export interface ProdutoEstoqueBaixo {
  produto: string;
  produto_id: number;
  quantidade_atual: string;
  estoque_minimo: string;
}

export interface ProdutoSemEstoque {
  produto: string;
  produto_id: number;
  estoque_minimo: string;
}

export interface AlertasEstoque {
  data: {
    produtos_estoque_baixo: ProdutoEstoqueBaixo[];
    produtos_sem_estoque: ProdutoSemEstoque[];
  };
  total_alertas: number;
  message: string;
  success: boolean;
}

// Interfaces para dashboard
export interface EstatisticasDashboard {
  pedidos_hoje: number;
  vendas_mes: number;
  clientes_ativos: number;
  produtos_estoque: number;
}

export interface PedidoPendente {
  id: number;
  cliente_nome: string;
  quantidade_produtos: number;
  situacao_pedido: "A separar" | "Separado";
  data_criacao: string;
}

export interface DadosDashboard {
  estatisticas: EstatisticasDashboard;
  pedidos_pendentes: PedidoPendente[];
  alertas_estoque: ProdutoEstoqueBaixo[];
}

// ===== INTERFACES DE RELATÓRIOS FINANCEIROS =====

export interface RelatorioClientePendente {
  cliente: {
    id: number;
    nome: string;
    nome_fantasia?: string;
    email?: string;
    telefone1?: string;
  };
  vendas_pendentes: {
    id: number;
    data_venda: string;
    total_venda: number;
    situacao_pedido: string;
    observacoes?: string;
    dias_pendente: number;
  }[];
  total_pendente: number;
  quantidade_vendas: number;
}

export interface RelatorioResumoGeral {
  total_geral_pendente: number;
  quantidade_clientes: number;
  quantidade_vendas_pendentes: number;
}

export interface RelatorioPagamentosPendentes {
  clientes: RelatorioClientePendente[];
  resumo: RelatorioResumoGeral;
}

export interface RelatorioHistoricoVenda {
  id: number;
  data_venda: string;
  data_separacao?: string;
  total_venda: number;
  situacao_pedido: string;
  situacao_pagamento: string;
  observacoes?: string;
  funcionario_separacao?: {
    id: number;
    nome: string;
    email: string;
  };
  quantidade_itens: number;
}

export interface RelatorioEstatisticasCliente {
  total_vendido: number;
  ticket_medio: number;
  quantidade_vendas: number;
  total_pendente: number;
  total_pago: number;
}

export interface RelatorioHistoricoVendas {
  cliente: Cliente;
  vendas: RelatorioHistoricoVenda[];
  estatisticas: RelatorioEstatisticasCliente;
  paginacao: {
    pagina: number;
    itens_por_pagina: number;
    total_itens: number;
    total_paginas: number;
  };
}

export interface RelatorioResumoFinanceiro {
  cliente: Cliente;
  estatisticas_gerais: {
    total_historico: number;
    ticket_medio: number;
    total_vendas: number;
    total_pendente: number;
    total_pago: number;
    primeira_compra: string;
    ultima_compra: string;
    percentual_inadimplencia: number;
  };
  produtos_favoritos: {
    nome: string;
    quantidade_total: number;
    valor_total: number;
    vezes_comprado: number;
  }[];
  evolucao_mensal: {
    mes: string;
    total_vendido: number;
    quantidade_vendas: number;
  }[];
  vendas_pendentes_recentes: {
    id: number;
    data_venda: string;
    total_venda: number;
    dias_pendente: number;
    observacoes?: string;
  }[];
}

export interface RelatorioDashboardVendas {
  periodo: {
    data_inicio: string;
    data_fim: string;
    gerado_em: string;
  };
  kpis: {
    faturamento_total: number;
    ticket_medio: number;
    total_vendas: number;
    total_pago: number;
    total_pendente: number;
    taxa_inadimplencia: number;
    vendas_separadas: number;
    vendas_a_separar: number;
    taxa_separacao: number;
  };
  top_clientes: {
    nome: string;
    nome_fantasia?: string;
    total_comprado: number;
    quantidade_compras: number;
    valor_pendente: number;
  }[];
  top_produtos: {
    nome: string;
    quantidade_vendida: number;
    faturamento: number;
  }[];
  performance_funcionarios: {
    nome: string;
    email: string;
    vendas_separadas: number;
    valor_separado: number;
  }[];
}

export interface RelatorioClienteInadimplente {
  cliente: {
    id: number;
    nome: string;
    nome_fantasia?: string;
    email?: string;
    telefone1?: string;
  };
  divida: {
    total_devido: number;
    vendas_pendentes: number;
    venda_mais_antiga: string;
    venda_mais_recente: string;
    dias_atraso_maximo: number;
  };
}

export interface RelatorioClientesInadimplentes {
  clientes_inadimplentes: RelatorioClienteInadimplente[];
  resumo: {
    total_devido_geral: number;
    quantidade_clientes: number;
    criterios: {
      dias_minimo_atraso: number;
      valor_minimo?: number;
      ordenacao: string;
    };
  };
}

// Tipos para Dashboard de Vendas
export interface VendaDashboard {
  id: number;
  cliente: string;
  valor: number;
  data_venda: string;
  data_separacao?: string;
}

export interface DashboardVendas {
  periodo: {
    data_inicio: string;
    data_fim: string;
    descricao: string;
  };
  vendas_periodo: {
    total_vendas: number;
    valor_total: number;
    em_separacao: {
      quantidade: number;
      valor: number;
      vendas: VendaDashboard[];
    };
    separadas: {
      quantidade: number;
      valor: number;
      vendas: VendaDashboard[];
    };
  };
  estatisticas_clientes: {
    total_clientes: number;
    clientes_ativos: number;
    clientes_inativos: number;
  };
  vendas_mensais: {
    mes_atual: {
      mes: number;
      ano: number;
      quantidade: number;
      valor_total: number;
    };
    mes_anterior: {
      mes: number;
      ano: number;
      quantidade: number;
      valor_total: number;
    };
    comparacao: {
      diferenca_quantidade: number;
      diferenca_valor: number;
      crescimento_percentual: number;
    };
  };
  pagamentos_pendentes: {
    quantidade_vendas: number;
    valor_total: number;
    vendas: Array<{
      id: number;
      cliente: string;
      valor: number;
      data_venda: string;
      dias_pendente: number;
    }>;
  };
}
