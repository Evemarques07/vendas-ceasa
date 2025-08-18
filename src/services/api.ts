
// src/services/api.ts

import axios, { type AxiosResponse, AxiosError } from "axios";
import type {
  Usuario,
  FormUsuarioCreate,
  // FormUsuarioChangePassword,
  //ListaPaginadaUsuarios,
  //FiltroUsuarios,
  Cliente,
  Produto,
  Venda,
  EntradaEstoque,
  Inventario,
  FormCliente,
  FormProduto,
  FormVenda,
  FormSeparacaoItem,
  FormEntradaEstoque,
  FormInventario,
  ApiResponse,
  ListaPaginadaClientes,
  ListaPaginadaProdutos,
  ListaPaginadaVendas,
  ListaPaginadaEntradas,
  ListaPaginadaInventario,
  FiltroClientes,
  FiltroProdutos,
  FiltroVendas,
  FluxoCaixa,
  Rentabilidade,
  AlertasEstoque,
  TipoMedida,
  VendaRapidaPayload,
} from "@/types";

// Configuração base da API
const API_BASE_URL = "https://www.evertonmarques.com.br/api";
// const API_BASE_URL = "http://localhost:8000/api"; // Para desenvolvimento local

// Função para mapear tipos de medida do frontend para a API
function mapearTipoMedida(tipoMedida: TipoMedida): string {
  // Agora os valores são iguais, retorna direto
  return tipoMedida;
}

// Função para mapear tipos de medida da API para o frontend
function mapearTipoMedidaReverso(tipoMedidaApi: string): TipoMedida {
  const mapeamento: Record<string, TipoMedida> = {
    kg: "kg",
    unidade: "unidade",
    litro: "litro",
    caixa: "caixa",
    saco: "saco",
    duzia: "duzia",
  };

  return mapeamento[tipoMedidaApi] || "kg"; // fallback
}

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor para adicionar token de autenticação
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log de debug para criar produtos
    if (config.url?.includes("/produtos/") && config.method === "post") {
      console.log("=== INTERCEPTOR REQUEST CREATE ===");
      console.log("URL:", config.url);
      console.log("Method:", config.method);
      console.log("Headers:", config.headers);
      console.log("Data sendo enviado:", config.data);
    }

    // Log de debug para atualizar produtos
    if (config.url?.includes("/produtos/") && config.method === "put") {
      console.log("=== INTERCEPTOR REQUEST UPDATE ===");
      console.log("URL:", config.url);
      console.log("Method:", config.method);
      console.log("Headers:", config.headers);
      console.log("Data sendo enviado:", config.data);
      console.log("Token:", token ? "Presente" : "Ausente");
    }

    // Log de debug para excluir produtos
    if (config.url?.includes("/produtos/") && config.method === "delete") {
      console.log("=== INTERCEPTOR REQUEST DELETE ===");
      console.log("URL:", config.url);
      console.log("Method:", config.method);
      console.log("Headers:", config.headers);
      console.log("Token:", token ? "Presente" : "Ausente");
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratamento de respostas e erros
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log para requisições PUT de produtos
    if (
      response.config.url?.includes("/produtos/") &&
      response.config.method === "put"
    ) {
      console.log("=== INTERCEPTOR RESPONSE UPDATE ===");
      console.log("Status:", response.status);
      console.log("Data recebida:", response.data);
      console.log("Headers da resposta:", response.headers);
    }

    // Log para requisições DELETE de produtos
    if (
      response.config.url?.includes("/produtos/") &&
      response.config.method === "delete"
    ) {
      console.log("=== INTERCEPTOR RESPONSE DELETE ===");
      console.log("Status:", response.status);
      console.log("Data recebida:", response.data);
      console.log("Headers da resposta:", response.headers);
    }

    return response;
  },
  (error: AxiosError) => {
    // Log para erros em PUT de produtos
    if (
      error.config?.url?.includes("/produtos/") &&
      error.config?.method === "put"
    ) {
      console.log("=== INTERCEPTOR ERROR UPDATE ===");
      console.log("Status:", error.response?.status);
      console.log("Error data:", error.response?.data);
      console.log("Error message:", error.message);
    }

    // Log para erros em DELETE de produtos
    if (
      error.config?.url?.includes("/produtos/") &&
      error.config?.method === "delete"
    ) {
      console.log("=== INTERCEPTOR ERROR DELETE ===");
      console.log("Status:", error.response?.status);
      console.log("Error data:", error.response?.data);
      console.log("Error message:", error.message);
    }

    if (error.response?.status === 401) {
      // Token expirado ou inválido
      localStorage.removeItem("authToken");
      localStorage.removeItem("currentUser");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// === PERFIL DO PRÓPRIO USUÁRIO ===
export const perfilService = {
  async atualizarNome(novo_nome: string): Promise<Usuario> {
    try {
      // Pega o usuário logado do localStorage
      const userStr = localStorage.getItem("currentUser");
      if (!userStr) throw new Error("Usuário não autenticado");
      const user = JSON.parse(userStr) as Usuario;
      const response = await api.put<ApiResponse<Usuario>>(
        `/user/funcionarios/${user.id}/nome`,
        null,
        { params: { novo_nome } }
      );
      return response.data.data;
    } catch (error) {
      return handleApiError(error as AxiosError);
    }
  },
  async atualizarNomeAdmin(
    admin_id: number,
    novo_nome: string
  ): Promise<Usuario> {
    try {
      const response = await api.put<ApiResponse<Usuario>>(
        `/user/funcionarios/${admin_id}/nome`,
        null,
        { params: { novo_nome } }
      );
      return response.data.data;
    } catch (error) {
      return handleApiError(error as AxiosError);
    }
  },
  async alterarSenha(nova_senha: string): Promise<void> {
    try {
      await api.put("/user/me/senha", null, { params: { nova_senha } });
    } catch (error) {
      return handleApiError(error as AxiosError);
    }
  },
  async alterarSenhaAdmin(admin_id: number, nova_senha: string): Promise<void> {
    try {
      await api.put(`/user/administradores/${admin_id}/senha`, null, {
        params: { nova_senha },
      });
    } catch (error) {
      return handleApiError(error as AxiosError);
    }
  },
};

// Classe de erro customizada para a API
export class ApiErrorHandler extends Error {
  public code: string;
  public details?: Record<string, any>;

  constructor(message: string, code: string, details?: Record<string, any>) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.details = details;
  }
}

// Função helper para tratamento de erros da API
function handleApiError(error: AxiosError): never {
  console.error("Erro da API completo:", {
    status: error.response?.status,
    data: error.response?.data,
    headers: error.response?.headers,
    message: error.message,
  });

  if (error.response?.data) {
    const apiError = error.response.data as any;

    // Tratar erro 422 com detalhes de validação
    if (error.response.status === 422) {
      let message = "Erro de validação";
      let details: any = {};

      if (apiError.detail) {
        // FastAPI validation errors
        if (Array.isArray(apiError.detail)) {
          console.error(
            "Detalhes de validação completos:",
            JSON.stringify(apiError.detail, null, 2)
          );
          const validationErrors = apiError.detail
            .map((err: any) => {
              console.error("Erro individual:", err);
              const field =
                err.loc?.slice(1).join(".") || err.loc?.join(".") || "campo";
              return `${field}: ${err.msg}`;
            })
            .join(", ");
          message = `Erro de validação: ${validationErrors}`;
          details = { validation_errors: apiError.detail };
        } else if (typeof apiError.detail === "string") {
          message = apiError.detail;
        }
      } else if (apiError.message) {
        message = apiError.message;
      }

      throw new ApiErrorHandler(message, "VALIDATION_ERROR", details);
    }

    // Outros erros da API
    throw new ApiErrorHandler(
      apiError.message || apiError.detail || "Erro na API",
      apiError.code || "UNKNOWN_ERROR",
      apiError.details || apiError
    );
  }

  if (error.code === "ECONNABORTED") {
    throw new ApiErrorHandler("Timeout na requisição", "TIMEOUT_ERROR");
  }

  if (error.code === "ERR_NETWORK") {
    throw new ApiErrorHandler(
      "Erro de conexão com o servidor",
      "NETWORK_ERROR"
    );
  }

  throw new ApiErrorHandler(
    error.message || "Erro desconhecido",
    "UNKNOWN_ERROR"
  );
}

// === AUTENTICAÇÃO ===
export const authService = {
  async login(
    login: string,
    senha: string
  ): Promise<{ user: Usuario; token: string }> {
    try {
      const response = await api.post<
        ApiResponse<{ user: Usuario; token: string }>
      >("/auth/login", {
        login,
        senha,
      });
      return response.data.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      return handleApiError(axiosError);
    }
  },

  async logout(): Promise<void> {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error("Erro no logout:", error);
    } finally {
      localStorage.removeItem("authToken");
      localStorage.removeItem("currentUser");
    }
  },

  async getCurrentUser(): Promise<Usuario> {
    try {
      const response = await api.get<ApiResponse<Usuario>>("/auth/me");
      return response.data.data;
    } catch (error) {
      return handleApiError(error as AxiosError);
    }
  },
};

export const userService = {
  // Lista todos os funcionários
  async listar(): Promise<Usuario[]> {
    try {
      const response = await api.get<ApiResponse<Usuario[]>>(
        "/user/funcionarios"
      );
      return response.data.data;
    } catch (error) {
      return handleApiError(error as AxiosError);
    }
  },

  // Cria um novo funcionário
  async criar(dados: FormUsuarioCreate): Promise<Usuario> {
    try {
      const response = await api.post<ApiResponse<Usuario>>(
        "/user/funcionarios",
        dados
      );
      return response.data.data;
    } catch (error) {
      return handleApiError(error as AxiosError);
    }
  },

  // Altera o nome de um funcionário
  async atualizarNome(id: number, novo_nome: string): Promise<Usuario> {
    try {
      const response = await api.put<ApiResponse<Usuario>>(
        `/user/funcionarios/${id}/nome`,
        null,
        {
          params: { novo_nome },
        }
      );
      return response.data.data;
    } catch (error) {
      return handleApiError(error as AxiosError);
    }
  },

  // Ativa ou desativa um funcionário
  async atualizarAtivo(id: number, ativo: boolean): Promise<Usuario> {
    try {
      const response = await api.put<ApiResponse<Usuario>>(
        `/user/funcionarios/${id}/ativo`,
        null,
        {
          params: { ativo },
        }
      );
      return response.data.data;
    } catch (error) {
      return handleApiError(error as AxiosError);
    }
  },

  // Altera a senha de um funcionário
  async alterarSenha(id: number, nova_senha: string): Promise<void> {
    try {
      // Este endpoint também pode ser para administradores, então criamos uma lógica condicional
      // Mas para a tela de usuários, vamos focar no funcionário
      await api.put(`/user/funcionarios/${id}/senha`, null, {
        params: { nova_senha },
      });
    } catch (error) {
      return handleApiError(error as AxiosError);
    }
  },

  // Deleta um funcionário
  async excluir(id: number): Promise<void> {
    try {
      await api.delete(`/user/funcionarios/${id}`);
    } catch (error) {
      return handleApiError(error as AxiosError);
    }
  },
};

// === CLIENTES ===
export const clientesService = {
  async listar(filtros?: FiltroClientes): Promise<ListaPaginadaClientes> {
    try {
      const params: any = {};
      if (filtros?.skip !== undefined) params.skip = filtros.skip;
      if (filtros?.limit !== undefined) params.limit = filtros.limit;
      if (filtros?.nome) params.nome = filtros.nome;
      if (filtros?.cpf_ou_cnpj) params.cpf_ou_cnpj = filtros.cpf_ou_cnpj;
      if (filtros?.ativo !== undefined) params.ativo = filtros.ativo;

      const response = await api.get<any>("/clientes", { params });

      // Mapear a estrutura da API para o formato esperado
      const apiData = response.data.data;
      return {
        clientes: apiData.items || [],
        total: apiData.paginacao?.totalItens || 0,
        skip:
          (apiData.paginacao?.pagina - 1) * apiData.paginacao?.itensPorPagina ||
          0,
        limit: apiData.paginacao?.itensPorPagina || 20,
      };
    } catch (error) {
      return handleApiError(error as AxiosError);
    }
  },

  async buscarPorId(id: number): Promise<Cliente> {
    try {
      const response = await api.get<ApiResponse<Cliente>>(`/clientes/${id}`);
      return response.data.data;
    } catch (error) {
      return handleApiError(error as AxiosError);
    }
  },

  async criar(dados: FormCliente): Promise<Cliente> {
    try {
      // Os dados já estão no formato correto (snake_case)
      const response = await api.post<ApiResponse<Cliente>>("/clientes", dados);
      return response.data.data;
    } catch (error) {
      return handleApiError(error as AxiosError);
    }
  },

  async atualizar(id: number, dados: Partial<FormCliente>): Promise<Cliente> {
    try {
      const response = await api.put<ApiResponse<Cliente>>(
        `/clientes/${id}`,
        dados
      );
      return response.data.data;
    } catch (error) {
      return handleApiError(error as AxiosError);
    }
  },

  async excluir(id: number): Promise<void> {
    try {
      await api.delete(`/clientes/${id}`);
    } catch (error) {
      return handleApiError(error as AxiosError);
    }
  },
};

// === PRODUTOS ===
export const produtosService = {
  async listar(filtros?: FiltroProdutos): Promise<ListaPaginadaProdutos> {
    try {
      console.log("=== LISTANDO PRODUTOS ===");
      const params: any = {};
      if (filtros?.skip !== undefined) params.skip = filtros.skip;
      if (filtros?.limit !== undefined) params.limit = filtros.limit;
      if (filtros?.nome) params.nome = filtros.nome;
      if (filtros?.tipo_medida) params.tipo_medida = filtros.tipo_medida;
      if (filtros?.ativo !== undefined) params.ativo = filtros.ativo;

      console.log("Params:", params);
      console.log("URL:", `${api.defaults.baseURL}/produtos`);

      const response = await api.get<any>("/produtos", { params });
      console.log("Response listar produtos:", response.data);

      // Mapear a estrutura da API para o formato esperado
      const apiData = response.data.data;
      return {
        produtos: (apiData.items || []).map((item: any) => ({
          id: item.id,
          nome: item.nome || item.descricao || "Produto sem nome",
          descricao: item.descricao || "",
          preco_venda: Number(item.preco_venda) || 0,
          tipo_medida: mapearTipoMedidaReverso(item.tipo_medida) || "kg",
          estoque_minimo: Number(item.estoque_minimo) || 0,
          imagem: item.imagem,
          ativo: item.ativo,
          criado_em: item.criado_em,
        })),
        total: apiData.paginacao?.totalItens || 0,
        skip:
          (apiData.paginacao?.pagina - 1) * apiData.paginacao?.itensPorPagina ||
          0,
        limit: apiData.paginacao?.itensPorPagina || 20,
      };
    } catch (error) {
      console.error("Erro ao listar produtos:", error);

      // Em vez de lançar erro, retornar estrutura vazia para não quebrar o carregamento
      if (error instanceof Error) {
        console.error("Mensagem do erro:", error.message);
      }

      // Retornar estrutura válida mas vazia
      return {
        produtos: [],
        total: 0,
        skip: 0,
        limit: 20,
      };
    }
  },

  async buscarPorId(id: number): Promise<Produto> {
    try {
      const response = await api.get<ApiResponse<Produto>>(`/produtos/${id}`);
      return response.data.data;
    } catch (error) {
      return handleApiError(error as AxiosError);
    }
  },
  //const response = await api
  // agora envia a url da imagem
  async criar(dados: FormProduto): Promise<Produto> {
    try {
      console.log("=== CRIANDO PRODUTO ===");
      console.log("Dados originais:", dados);

      // Validação local dos dados obrigatórios
      if (!dados.nome || dados.nome.trim() === "") {
        throw new ApiErrorHandler(
          "Nome do produto é obrigatório",
          "VALIDATION_ERROR"
        );
      }

      if (!dados.preco_venda || dados.preco_venda <= 0) {
        throw new ApiErrorHandler(
          "Preço de venda deve ser maior que zero",
          "VALIDATION_ERROR"
        );
      }

      if (!dados.tipo_medida) {
        throw new ApiErrorHandler(
          "Tipo de medida é obrigatório",
          "VALIDATION_ERROR"
        );
      }

      if (dados.estoque_minimo === undefined || dados.estoque_minimo < 0) {
        throw new ApiErrorHandler(
          "Estoque mínimo deve ser maior ou igual a zero",
          "VALIDATION_ERROR"
        );
      }

      // Preparar dados conforme documentação da API
      const dadosParaAPI = {
        nome: dados.nome.trim(),
        descricao: (dados.descricao || "").trim(), // Garantir que seja sempre string
        preco_venda: Number(dados.preco_venda),
        tipo_medida: mapearTipoMedida(dados.tipo_medida), // Mapear para valores da API
        estoque_minimo: Number(dados.estoque_minimo),
        ativo: dados.ativo !== undefined ? dados.ativo : true,
        imagem: typeof dados.imagem === "string" ? dados.imagem : undefined,
      };

      console.log("Dados formatados para API:", dadosParaAPI);
      console.log("Tipos dos dados:", {
        nome: typeof dadosParaAPI.nome,
        descricao: typeof dadosParaAPI.descricao,
        preco_venda: typeof dadosParaAPI.preco_venda,
        tipo_medida: typeof dadosParaAPI.tipo_medida,
        estoque_minimo: typeof dadosParaAPI.estoque_minimo,
        ativo: typeof dadosParaAPI.ativo,
        imagem: typeof dadosParaAPI.imagem,
      });

      // Validar que descricao não é null
      console.log(
        "Valor da descrição:",
        dadosParaAPI.descricao,
        "Length:",
        dadosParaAPI.descricao.length
      );

      // Verificar se os números são válidos
      if (isNaN(dadosParaAPI.preco_venda)) {
        throw new ApiErrorHandler(
          "Preço de venda deve ser um número válido",
          "VALIDATION_ERROR"
        );
      }

      if (isNaN(dadosParaAPI.estoque_minimo)) {
        throw new ApiErrorHandler(
          "Estoque mínimo deve ser um número válido",
          "VALIDATION_ERROR"
        );
      }

      // Log final antes do envio
      console.log(
        "JSON que será enviado:",
        JSON.stringify(dadosParaAPI, null, 2)
      );

      // Se houver imagem, usar FormData
      // Sempre enviar como JSON, apenas com a URL da imagem (string)
      const response = await api.post<ApiResponse<Produto>>(
        "/produtos/",
        dadosParaAPI
      );
      return response.data.data;
    } catch (error) {
      console.error("Erro na função criar:", error);
      return handleApiError(error as AxiosError);
    }
  },

  async atualizar(id: number, dados: Partial<FormProduto>): Promise<Produto> {
    try {
      console.log("=== INÍCIO ATUALIZAÇÃO ===");
      console.log("ID do produto:", id);
      console.log("Dados recebidos:", dados);

      // Separar dados da imagem
      const { imagem, ...dadosProduto } = dados;

      // Mapear os dados para o formato da API
      const dadosAtualizacao: any = {};

      if (dadosProduto.nome !== undefined) {
        dadosAtualizacao.nome = dadosProduto.nome;
      }
      if (dadosProduto.descricao !== undefined) {
        dadosAtualizacao.descricao = dadosProduto.descricao;
      }
      if (dadosProduto.preco_venda !== undefined) {
        dadosAtualizacao.preco_venda = Number(dadosProduto.preco_venda);
      }
      if (dadosProduto.tipo_medida !== undefined) {
        // Mapear para formato da API
        dadosAtualizacao.tipo_medida = mapearTipoMedida(
          dadosProduto.tipo_medida
        );
      }
      if (dadosProduto.estoque_minimo !== undefined) {
        dadosAtualizacao.estoque_minimo = Number(dadosProduto.estoque_minimo);
      }
      if (dadosProduto.ativo !== undefined) {
        dadosAtualizacao.ativo = dadosProduto.ativo;
      }

      console.log("Dados para atualização:", dadosAtualizacao);
      console.log(
        "URL da requisição:",
        `${api.defaults.baseURL}/produtos/${id}`
      );

      // Verificar se há token
      const token = localStorage.getItem("authToken");
      console.log("Token disponível:", token ? "SIM" : "NÃO");

      console.log("=== ENVIANDO REQUISIÇÃO ===");
      const response = await api.put<any>(`/produtos/${id}`, dadosAtualizacao);

      console.log("=== RESPOSTA RECEBIDA ===");
      console.log("Resposta da API:", response.data);

      // Se há imagem para atualizar, fazer requisição separada (agora só URL string)
      if (
        typeof imagem === "string" &&
        imagem &&
        (imagem as string).trim() !== ""
      ) {
        console.log("=== ATUALIZANDO IMAGEM (URL) ===");
        await this.atualizarImagem(id, imagem);
      }

      // Retornar o produto atualizado mapeado
      const produtoAtualizado = response.data.data || response.data;
      return {
        id: produtoAtualizado.id,
        nome: produtoAtualizado.nome,
        descricao: produtoAtualizado.descricao || "",
        preco_venda: Number(produtoAtualizado.preco_venda) || 0,
        tipo_medida:
          mapearTipoMedidaReverso(produtoAtualizado.tipo_medida) || "kg",
        estoque_minimo: Number(produtoAtualizado.estoque_minimo) || 0,
        imagem: produtoAtualizado.imagem,
        ativo: produtoAtualizado.ativo,
        criado_em: produtoAtualizado.criado_em,
      };
    } catch (error) {
      console.error("=== ERRO NA ATUALIZAÇÃO ===");
      console.error("Erro na requisição de atualização:", error);
      return handleApiError(error as AxiosError);
    }
  },

  async atualizarImagem(id: number, imagemUrl: string): Promise<void> {
    try {
      console.log("=== ATUALIZANDO IMAGEM DO PRODUTO VIA URL ===");
      console.log("ID:", id, "URL:", imagemUrl);
      const response = await api.put(`/produtos/${id}/imagem`, null, {
        params: { imagem_url: imagemUrl },
      });
      console.log("Imagem atualizada:", response.data);
    } catch (error) {
      console.error("Erro ao atualizar imagem:", error);
      return handleApiError(error as AxiosError);
    }
  },

  async excluir(id: number): Promise<void> {
    try {
      console.log("=== INÍCIO EXCLUSÃO ===");
      console.log("ID do produto:", id);
      console.log(
        "URL da requisição:",
        `${api.defaults.baseURL}/produtos/${id}`
      );

      // Verificar se há token
      const token = localStorage.getItem("authToken");
      console.log("Token disponível:", token ? "SIM" : "NÃO");

      console.log("=== ENVIANDO REQUISIÇÃO DELETE ===");
      const response = await api.delete(`/produtos/${id}`);

      console.log("=== PRODUTO EXCLUÍDO ===");
      console.log("Status:", response.status);
      console.log("Resposta:", response.data);
    } catch (error) {
      console.error("=== ERRO NA EXCLUSÃO ===");
      console.error("Erro ao excluir produto:", error);
      return handleApiError(error as AxiosError);
    }
  },
};

// === VENDAS ===
export const vendasService = {
  async listar(filtros?: FiltroVendas): Promise<ListaPaginadaVendas> {
    try {
      console.log("=== LISTANDO VENDAS ===");
      const params: any = {};
      if (filtros?.skip !== undefined) params.skip = filtros.skip;
      if (filtros?.limit !== undefined) params.limit = filtros.limit;
      if (filtros?.cliente_id) params.cliente_id = filtros.cliente_id;
      if (filtros?.situacao_pedido)
        params.situacao_pedido = filtros.situacao_pedido;
      if (filtros?.situacao_pagamento)
        params.situacao_pagamento = filtros.situacao_pagamento;

      console.log("Params:", params);
      console.log("URL:", `${api.defaults.baseURL}/vendas`);

      const response = await api.get<any>("/vendas", { params });
      console.log("Response listar vendas:", response.data);

      // Mapear a estrutura da API para o formato esperado
      const apiData = response.data.data || response.data;
      return {
        vendas: (apiData.items || apiData || []).map((venda: any) => ({
          id: venda.id,
          cliente_id: venda.cliente_id,
          cliente_nome: venda.cliente_nome,
          cliente: venda.cliente,
          data_pedido: venda.data_pedido,
          data_venda: venda.data_venda, // Inclui data_venda
          situacao_pedido: venda.situacao_pedido,
          situacao_pagamento: venda.situacao_pagamento,
          total_venda: Number(venda.total_venda) || 0,
          observacoes: venda.observacoes,
          funcionario_separacao_id: venda.funcionario_separacao_id,
          data_separacao: venda.data_separacao,
          funcionario_separacao: venda.funcionario_separacao,
          itens: (venda.itens || []).map((item: any) => ({
            id: item.id,
            produto_id: item.produto_id,
            produto_nome: item.produto_nome,
            produto: item.produto,
            quantidade: Number(item.quantidade) || 0,
            quantidade_real: item.quantidade_real
              ? Number(item.quantidade_real)
              : undefined,
            tipo_medida: item.tipo_medida,
            valor_unitario: Number(item.valor_unitario) || 0,
            valor_total_produto: Number(item.valor_total_produto) || 0,
            custo_fifo: item.custo_fifo ? Number(item.custo_fifo) : undefined,
            lucro_item: item.lucro_item ? Number(item.lucro_item) : undefined,
          })),
          custos_fifo: venda.custos_fifo
            ? {
                custo_total: Number(venda.custos_fifo.custo_total) || 0,
                lucro_bruto: Number(venda.custos_fifo.lucro_bruto) || 0,
                margem_percentual: venda.custos_fifo.margem_percentual || "0",
              }
            : undefined,
        })),
        total:
          apiData.paginacao?.totalItens ||
          (apiData.items || apiData || []).length,
        skip: apiData.paginacao
          ? (apiData.paginacao.pagina - 1) * apiData.paginacao.itensPorPagina
          : 0,
        limit: apiData.paginacao?.itensPorPagina || 20,
      };
    } catch (error) {
      console.error("Erro ao listar vendas:", error);
      return handleApiError(error as AxiosError);
    }
  },

  async buscarPorId(id: number): Promise<Venda> {
    try {
      console.log("=== BUSCANDO VENDA POR ID ===");
      console.log("ID:", id);

      const response = await api.get<any>(`/vendas/${id}`);
      console.log("Response buscar venda:", response.data);

      const venda = response.data.data || response.data;
      return {
        id: venda.id,
        cliente_id: venda.cliente_id,
        cliente_nome: venda.cliente_nome,
        data_pedido: venda.data_pedido,
        data_venda: venda.data_venda || venda.data_pedido,
        situacao_pedido: venda.situacao_pedido,
        situacao_pagamento: venda.situacao_pagamento,
        total_venda: Number(venda.total_venda) || 0,
        observacoes: venda.observacoes,
        funcionario_separacao: venda.funcionario_separacao,
        data_separacao: venda.data_separacao,
        cliente: venda.cliente,
        itens: (venda.itens || []).map((item: any) => ({
          id: item.id,
          produto_id: item.produto_id,
          produto_nome: item.produto_nome,
          produto: item.produto,
          quantidade: Number(item.quantidade) || 0,
          quantidade_real: item.quantidade_real
            ? Number(item.quantidade_real)
            : undefined,
          tipo_medida: item.tipo_medida,
          valor_unitario: Number(item.valor_unitario) || 0,
          valor_total_produto: Number(item.valor_total_produto) || 0,
          custo_fifo: item.custo_fifo ? Number(item.custo_fifo) : undefined,
          lucro_item: item.lucro_item ? Number(item.lucro_item) : undefined,
          criado_em: item.criado_em,
          atualizado_em: item.atualizado_em,
        })),
        // Nova estrutura de lucro bruto
        lucro_bruto: venda.lucro_bruto
          ? {
              receita_total: Number(venda.lucro_bruto.receita_total) || 0,
              custo_total: Number(venda.lucro_bruto.custo_total) || 0,
              lucro_bruto: Number(venda.lucro_bruto.lucro_bruto) || 0,
              margem_bruta_percentual:
                Number(venda.lucro_bruto.margem_bruta_percentual) || 0,
              detalhes_produtos: (
                venda.lucro_bruto.detalhes_produtos || []
              ).map((detalhe: any) => ({
                produto_id: detalhe.produto_id,
                produto_nome: detalhe.produto_nome,
                quantidade_vendida: Number(detalhe.quantidade_vendida) || 0,
                receita_produto: Number(detalhe.receita_produto) || 0,
                custo_produto: Number(detalhe.custo_produto) || 0,
                lucro_produto: Number(detalhe.lucro_produto) || 0,
                margem_produto: Number(detalhe.margem_produto) || 0,
              })),
            }
          : undefined,
        // Estrutura legada para compatibilidade
        custos_fifo: venda.custos_fifo
          ? {
              custo_total: Number(venda.custos_fifo.custo_total) || 0,
              lucro_bruto: Number(venda.custos_fifo.lucro_bruto) || 0,
              margem_percentual: venda.custos_fifo.margem_percentual || "0",
            }
          : undefined,
        criado_em: venda.criado_em,
        atualizado_em: venda.atualizado_em,
      };
    } catch (error) {
      console.error("Erro ao buscar venda:", error);
      return handleApiError(error as AxiosError);
    }
  },

  async criar(dados: FormVenda): Promise<Venda> {
    try {
      console.log("=== CRIANDO VENDA ===");
      console.log("Dados recebidos:", dados);

      // Mapear os dados para o formato da API
      const dadosParaAPI = {
        cliente_id: dados.cliente_id,
        observacoes: dados.observacoes || "",
        itens: dados.itens.map((item) => ({
          produto_id: item.produto_id,
          quantidade: Number(item.quantidade),
          tipo_medida: item.tipo_medida,
          valor_unitario: Number(item.valor_unitario),
        })),
      };

      console.log("Dados para API:", dadosParaAPI);
      console.log("URL:", `${api.defaults.baseURL}/vendas`);

      const response = await api.post<any>("/vendas", dadosParaAPI);
      console.log("Venda criada:", response.data);

      const venda = response.data.data || response.data;
      return {
        id: venda.id,
        cliente_id: venda.cliente_id,
        cliente_nome: venda.cliente_nome,
        data_pedido: venda.data_pedido,
        data_venda: venda.data_venda || venda.data_pedido,
        situacao_pedido: venda.situacao_pedido,
        situacao_pagamento: venda.situacao_pagamento,
        total_venda: Number(venda.total_venda) || 0,
        observacoes: venda.observacoes,
        itens: (venda.itens || []).map((item: any) => ({
          id: item.id,
          produto_id: item.produto_id,
          produto_nome: item.produto_nome,
          quantidade: Number(item.quantidade) || 0,
          quantidade_real: item.quantidade_real
            ? Number(item.quantidade_real)
            : undefined,
          tipo_medida: item.tipo_medida,
          valor_unitario: Number(item.valor_unitario) || 0,
          valor_total_produto: Number(item.valor_total_produto) || 0,
        })),
      };
    } catch (error) {
      console.error("Erro ao criar venda:", error);
      return handleApiError(error as AxiosError);
    }
  },
  

  async atualizarSeparacao(
    id: number,
    produtos_separados: FormSeparacaoItem[]
  ): Promise<Venda> {
    try {
      console.log("=== ATUALIZANDO SEPARAÇÃO ===");
      console.log("ID da venda:", id);
      console.log("Produtos separados:", produtos_separados);

      const dadosParaAPI = {
        produtos_separados: produtos_separados.map((item) => ({
          produto_id: item.produto_id,
          quantidade_real: Number(item.quantidade_real),
        })),
      };

      console.log("Dados para API:", dadosParaAPI);

      const response = await api.put<any>(
        `/vendas/${id}/separacao`,
        dadosParaAPI
      );
      console.log("Separação atualizada:", response.data);

      const venda = response.data.data || response.data;
      return {
        id: venda.id,
        cliente_id: venda.cliente_id,
        cliente_nome: venda.cliente_nome,
        cliente: venda.cliente,
        data_pedido: venda.data_pedido,
        data_venda: venda.data_venda || venda.data_pedido,
        situacao_pedido: venda.situacao_pedido,
        situacao_pagamento: venda.situacao_pagamento,
        total_venda: Number(venda.total_venda) || 0,
        observacoes: venda.observacoes,
        funcionario_separacao_id: venda.funcionario_separacao_id,
        data_separacao: venda.data_separacao,
        funcionario_separacao: venda.funcionario_separacao,
        itens: (venda.itens || []).map((item: any) => ({
          id: item.id,
          produto_id: item.produto_id,
          produto_nome: item.produto_nome,
          produto: item.produto,
          quantidade: Number(item.quantidade) || 0,
          quantidade_real: item.quantidade_real
            ? Number(item.quantidade_real)
            : undefined,
          tipo_medida: item.tipo_medida,
          valor_unitario: Number(item.valor_unitario) || 0,
          valor_total_produto: Number(item.valor_total_produto) || 0,
          custo_fifo: item.custo_fifo ? Number(item.custo_fifo) : undefined,
          lucro_item: item.lucro_item ? Number(item.lucro_item) : undefined,
        })),
        custos_fifo: venda.custos_fifo
          ? {
              custo_total: Number(venda.custos_fifo.custo_total) || 0,
              lucro_bruto: Number(venda.custos_fifo.lucro_bruto) || 0,
              margem_percentual: venda.custos_fifo.margem_percentual || "0",
            }
          : undefined,
      };
    } catch (error) {
      console.error("Erro ao atualizar separação:", error);

      // Log detalhado do erro para debug
      if (error instanceof AxiosError) {
        console.error("Detalhes do erro HTTP:", {
          status: error.response?.status,
          statusText: error.response?.statusText,
          headers: error.response?.headers,
          config: {
            method: error.config?.method,
            url: error.config?.url,
            data: error.config?.data,
          },
        });

        // Log específico da resposta de erro
        console.error("Resposta de erro completa:", error.response?.data);

        // Se for um objeto, fazer stringify para ver o conteúdo
        if (error.response?.data && typeof error.response.data === "object") {
          console.error(
            "Erro serializado:",
            JSON.stringify(error.response.data, null, 2)
          );
        }
      }

      return handleApiError(error as AxiosError);
    }
  },

  async cancelarSeparacao(id: number): Promise<Venda> {
    try {
      console.log("=== CANCELANDO SEPARAÇÃO ===");
      console.log("ID da venda:", id);

      const response = await api.put<any>(`/vendas/${id}/cancelar-separacao`);
      console.log("Separação cancelada:", response.data);

      const venda = response.data.data || response.data;
      return {
        id: venda.id,
        cliente_id: venda.cliente_id,
        cliente_nome: venda.cliente_nome,
        data_pedido: venda.data_pedido,
        data_venda: venda.data_venda || venda.data_pedido,
        situacao_pedido: venda.situacao_pedido,
        situacao_pagamento: venda.situacao_pagamento,
        total_venda: Number(venda.total_venda) || 0,
        observacoes: venda.observacoes,
        itens: (venda.itens || []).map((item: any) => ({
          id: item.id,
          produto_id: item.produto_id,
          produto_nome: item.produto_nome,
          quantidade: Number(item.quantidade) || 0,
          quantidade_real: item.quantidade_real
            ? Number(item.quantidade_real)
            : undefined,
          tipo_medida: item.tipo_medida,
          valor_unitario: Number(item.valor_unitario) || 0,
          valor_total_produto: Number(item.valor_total_produto) || 0,
        })),
      };
    } catch (error) {
      console.error("Erro ao cancelar separação:", error);
      return handleApiError(error as AxiosError);
    }
  },

  async marcarComoPago(id: number): Promise<Venda> {
    try {
      console.log("=== MARCANDO COMO PAGO ===");
      console.log("ID da venda:", id);

      const response = await api.put<any>(`/vendas/${id}/pagamento`);
      console.log("Venda marcada como paga:", response.data);

      const venda = response.data.data || response.data;
      return {
        id: venda.id,
        cliente_id: venda.cliente_id,
        cliente_nome: venda.cliente_nome,
        data_pedido: venda.data_pedido,
        data_venda: venda.data_venda || venda.data_pedido,
        situacao_pedido: venda.situacao_pedido,
        situacao_pagamento: venda.situacao_pagamento,
        total_venda: Number(venda.total_venda) || 0,
        observacoes: venda.observacoes,
        itens: (venda.itens || []).map((item: any) => ({
          id: item.id,
          produto_id: item.produto_id,
          produto_nome: item.produto_nome,
          quantidade: Number(item.quantidade) || 0,
          quantidade_real: item.quantidade_real
            ? Number(item.quantidade_real)
            : undefined,
          tipo_medida: item.tipo_medida,
          valor_unitario: Number(item.valor_unitario) || 0,
          valor_total_produto: Number(item.valor_total_produto) || 0,
        })),
      };
    } catch (error) {
      console.error("Erro ao marcar como pago:", error);
      return handleApiError(error as AxiosError);
    }
  },

  vendaRapida: async (data: VendaRapidaPayload) => {
    const response = await api.post("/vendas/venda-rapida", data);
    return response.data;
  },
};

// === ESTOQUE ===
export const estoqueService = {
  async listarEntradas(filtros?: {
    produto_id?: number;
    data_inicio?: string;
    data_fim?: string;
    skip?: number;
    limit?: number;
  }): Promise<ListaPaginadaEntradas> {
    try {
      const params: any = {};
      if (filtros?.skip !== undefined) params.skip = filtros.skip;
      if (filtros?.limit !== undefined) params.limit = filtros.limit;
      if (filtros?.produto_id) params.produto_id = filtros.produto_id;
      if (filtros?.data_inicio) params.data_inicio = filtros.data_inicio;
      if (filtros?.data_fim) params.data_fim = filtros.data_fim;

      const response = await api.get<any>("/estoque/entradas", { params });

      // Mapear a estrutura da API para o formato esperado
      const apiData = response.data.data;
      return {
        entradas: apiData.items || [],
        total: apiData.paginacao?.totalItens || 0,
        skip:
          (apiData.paginacao?.pagina - 1) * apiData.paginacao?.itensPorPagina ||
          0,
        limit: apiData.paginacao?.itensPorPagina || 20,
      };
    } catch (error) {
      return handleApiError(error as AxiosError);
    }
  },

  async registrarEntrada(
    dados: FormEntradaEstoque,
    produtos?: Produto[]
  ): Promise<EntradaEstoque> {
    try {
      // Buscar o produto para obter tipo_medida se não fornecido
      let tipo_medida = dados.tipo_medida;

      if (!tipo_medida && produtos) {
        const produto = produtos.find((p) => p.id === dados.produto_id);
        if (produto) {
          tipo_medida = mapearTipoMedida(produto.tipo_medida);
        }
      }

      const dadosParaAPI = {
        produto_id: dados.produto_id,
        tipo_medida: tipo_medida || "kg", // fallback para kg
        quantidade: dados.quantidade,
        preco_custo: dados.preco_custo,
        fornecedor: dados.fornecedor,
        observacoes: dados.observacoes || "",
      };

      console.log("Dados enviados para API (entrada estoque):", dadosParaAPI);

      const response = await api.post<ApiResponse<EntradaEstoque>>(
        "/estoque/entradas",
        dadosParaAPI
      );
      return response.data.data;
    } catch (error) {
      return handleApiError(error as AxiosError);
    }
  },

  async obterInventario(filtros?: {
    skip?: number;
    limit?: number;
  }): Promise<ListaPaginadaInventario> {
    try {
      const params: any = {};
      if (filtros?.skip !== undefined) params.skip = filtros.skip;
      if (filtros?.limit !== undefined) params.limit = filtros.limit;

      const response = await api.get<any>("/estoque/inventario", { params });

      // Mapear a estrutura da API para o formato esperado
      const apiData = response.data.data;
      return {
        inventario: apiData.items || [],
        total: apiData.paginacao?.totalItens || 0,
        skip:
          (apiData.paginacao?.pagina - 1) * apiData.paginacao?.itensPorPagina ||
          0,
        limit: apiData.paginacao?.itensPorPagina || 20,
      };
    } catch (error) {
      return handleApiError(error as AxiosError);
    }
  },

  async atualizarInventario(id: number, dados: FormInventario): Promise<void> {
    try {
      await api.put(`/estoque/inventario/${id}`, dados);
    } catch (error) {
      return handleApiError(error as AxiosError);
    }
  },

  async consultarEstoque(
    produto_id: number
  ): Promise<Inventario & { historico_entradas: any[] }> {
    try {
      const response = await api.get<
        ApiResponse<Inventario & { historico_entradas: any[] }>
      >(`/estoque/consulta/${produto_id}`);
      return response.data.data;
    } catch (error) {
      return handleApiError(error as AxiosError);
    }
  },

  async obterAlertas(): Promise<AlertasEstoque> {
    try {
      const response = await api.get<AlertasEstoque>("/estoque/alertas");
      return response.data;
    } catch (error) {
      return handleApiError(error as AxiosError);
    }
  },

  async obterFluxoCaixa(filtros?: {
    data_inicio?: string;
    data_fim?: string;
    produto_id?: number;
    tipo_movimentacao?: "ENTRADA" | "SAIDA" | "AJUSTE";
  }): Promise<FluxoCaixa> {
    try {
      const params: any = {};
      if (filtros?.data_inicio) params.data_inicio = filtros.data_inicio;
      if (filtros?.data_fim) params.data_fim = filtros.data_fim;
      if (filtros?.produto_id) params.produto_id = filtros.produto_id;
      if (filtros?.tipo_movimentacao)
        params.tipo_movimentacao = filtros.tipo_movimentacao;

      const response = await api.get<ApiResponse<FluxoCaixa>>(
        "/estoque/fluxo-caixa",
        { params }
      );
      return response.data.data;
    } catch (error) {
      return handleApiError(error as AxiosError);
    }
  },

  async obterRentabilidade(filtros: {
    data_inicio: string;
    data_fim: string;
    produto_id?: number;
  }): Promise<Rentabilidade> {
    try {
      const params: any = {
        data_inicio: filtros.data_inicio,
        data_fim: filtros.data_fim,
      };
      if (filtros.produto_id) params.produto_id = filtros.produto_id;

      const response = await api.get<ApiResponse<Rentabilidade>>(
        "/estoque/rentabilidade",
        { params }
      );
      return response.data.data;
    } catch (error) {
      return handleApiError(error as AxiosError);
    }
  },

  // Novos métodos para verificação e exclusão de entradas
  async listarEntradasDeletaveis(produto_id?: number): Promise<{
    entradas_deletaveis: (EntradaEstoque & {
      status_exclusao: {
        pode_deletar: boolean;
        tem_fifo: boolean;
        motivo: string;
      };
    })[];
    total: number;
  }> {
    try {
      const params: any = {};
      if (produto_id) params.produto_id = produto_id;

      const response = await api.get<any>("/estoque/entradas/deletaveis", {
        params,
      });
      return response.data.data;
    } catch (error) {
      return handleApiError(error as AxiosError);
    }
  },

  async verificarStatusExclusao(entrada_id: number): Promise<{
    entrada: EntradaEstoque;
    pode_deletar: boolean;
    motivos_bloqueio?: string[];
    detalhes_fifo?: any[];
    status_inventario?: any;
    impacto_exclusao?: any;
  }> {
    try {
      const response = await api.get<any>(
        `/estoque/entradas/${entrada_id}/status-exclusao`
      );
      return response.data.data;
    } catch (error) {
      return handleApiError(error as AxiosError);
    }
  },

  async excluirEntrada(entrada_id: number): Promise<{
    entrada_deletada: EntradaEstoque;
    inventario_atualizado: {
      produto_id: number;
      quantidade_anterior: string;
      quantidade_atual: string;
      quantidade_removida: string;
    };
  }> {
    try {
      const response = await api.delete<any>(`/estoque/entradas/${entrada_id}`);
      return response.data.data;
    } catch (error) {
      return handleApiError(error as AxiosError);
    }
  },

  async corrigirInventario(
    produto_id: number,
    dados: {
      quantidade_atual: number;
      observacoes: string;
    }
  ): Promise<{
    produto_id: number;
    quantidade_anterior: string;
    quantidade_atual: string;
    observacoes: string;
    data_atualizacao: string;
  }> {
    try {
      console.log("=== CORREÇÃO DE INVENTÁRIO ===");
      console.log("Produto ID:", produto_id);
      console.log("Dados da correção:", dados);

      // Validação local dos dados obrigatórios
      if (dados.quantidade_atual === undefined || dados.quantidade_atual < 0) {
        throw new ApiErrorHandler(
          "Quantidade atual deve ser maior ou igual a zero",
          "VALIDATION_ERROR"
        );
      }

      if (!dados.observacoes || dados.observacoes.trim() === "") {
        throw new ApiErrorHandler(
          "Observações são obrigatórias para auditoria",
          "VALIDATION_ERROR"
        );
      }

      const dadosParaAPI = {
        quantidade_atual: Number(dados.quantidade_atual),
        observacoes: dados.observacoes.trim(),
      };

      console.log(
        "Dados enviados para API (correção inventário):",
        dadosParaAPI
      );

      const response = await api.put<any>(
        `/estoque/inventario/${produto_id}`,
        dadosParaAPI
      );

      console.log("✅ Correção de inventário realizada com sucesso");
      return response.data.data;
    } catch (error) {
      console.error("❌ Erro na correção de inventário:", error);
      return handleApiError(error as AxiosError);
    }
  },
};

// === TESTE DE CONECTIVIDADE ===
export const testeConectividade = {
  async verificarConexao(): Promise<boolean> {
    try {
      console.log("=== TESTANDO CONECTIVIDADE ===");
      console.log("URL base:", api.defaults.baseURL);

      // Tentar uma requisição simples para testar a conectividade
      const response = await api.get("/produtos", {
        params: { limit: 1 },
        timeout: 5000,
      });

      console.log("Conectividade OK - Status:", response.status);
      return true;
    } catch (error) {
      console.error("Erro de conectividade:", error);
      if (error instanceof Error) {
        console.error("Mensagem do erro:", error.message);
      }
      return false;
    }
  },
};


export const dashboardService = {
  async obterDadosCompletos(
    filtros?: { data_inicio?: string; data_fim?: string }
  ): Promise<any> {
    try {
      console.log("🔄 Carregando dados completos do dashboard...");

      const response = await api.get("/vendas/dashboard", {
        params: filtros, // envia data_inicio/data_fim se vier
      });

      const data = response.data.data;

      // Estatísticas simplificadas
      const estatisticas = {
        pedidos_hoje: data.vendas_periodo?.total_vendas || 0,
        vendas_mes: data.vendas_mensais?.mes_atual?.valor_total || 0,
        clientes_ativos: data.estatisticas_clientes?.clientes_ativos || 0,
        produtos_estoque: 0, // se sua API devolver no futuro, só substituir
      };

      // Pedidos pendentes (em separação + separados)
      const pedidosPendentes = [
        ...(data.vendas_periodo?.em_separacao?.vendas || []),
        ...(data.vendas_periodo?.separadas?.vendas || []),
      ].map((venda: any) => ({
        id: venda.id,
        cliente_nome: venda.cliente || "Cliente não informado",
        quantidade_produtos: venda.itens?.length || 1, // se a API não devolver itens, assume 1
        situacao_pedido: venda.data_separacao ? "Separado" : "A separar",
        situacao_pagamento: "Pendente", // pode trocar se API trouxer status real
        data_criacao: venda.data_venda,
        data_separacao: venda.data_separacao,
      }));

      // Pagamentos pendentes aproveitados como "alertas"
      const alertasEstoque =
        data.pagamentos_pendentes?.vendas?.map((venda: any) => ({
          id: venda.id,
          cliente_nome: venda.cliente,
          valor: venda.valor,
          dias_pendente: venda.dias_pendente,
        })) || [];

      // Retorno: mantém compatibilidade + novos campos
      return {
        ...data, // vendas_periodo, vendas_mensais, estatisticas_clientes, pagamentos_pendentes
        estatisticas,
        pedidos_pendentes: pedidosPendentes,
        alertas_estoque: alertasEstoque,
      };
    } catch (error) {
      console.error("❌ Erro ao carregar dados do dashboard:", error);
      return {
        vendas_periodo: {
          total_vendas: 0,
          valor_total: 0,
          em_separacao: { quantidade: 0, valor: 0, vendas: [] },
          separadas: { quantidade: 0, valor: 0, vendas: [] },
        },
        vendas_mensais: {
          mes_atual: { quantidade: 0, valor_total: 0 },
          mes_anterior: { quantidade: 0, valor_total: 0 },
          comparacao: {
            diferenca_quantidade: 0,
            diferenca_valor: 0,
            crescimento_percentual: 0,
          },
        },
        estatisticas_clientes: {
          total_clientes: 0,
          clientes_ativos: 0,
          clientes_inativos: 0,
        },
        pagamentos_pendentes: {
          quantidade_vendas: 0,
          valor_total: 0,
          vendas: [],
        },
        estatisticas: {
          pedidos_hoje: 0,
          vendas_mes: 0,
          clientes_ativos: 0,
          produtos_estoque: 0,
        },
        pedidos_pendentes: [],
        alertas_estoque: [],
      };
    }
  },
};


// Serviços de Relatórios Financeiros
export const relatoriosService = {
  async obterPagamentosPendentes(filtros?: {
    cliente_id?: number;
    ordenar_por?: "valor_desc" | "valor_asc" | "data_desc" | "data_asc";
  }): Promise<any> {
    try {
      console.log("💰 Buscando relatório de pagamentos pendentes...");

      const params: any = {};
      if (filtros?.cliente_id) params.cliente_id = filtros.cliente_id;
      if (filtros?.ordenar_por) params.ordenar_por = filtros.ordenar_por;

      const response = await api.get<any>("/relatorios/pagamentos-pendentes", {
        params,
      });
      console.log("✅ Relatório de pagamentos pendentes carregado");
      return response.data;
    } catch (error) {
      console.error(
        "❌ Erro ao buscar relatório de pagamentos pendentes:",
        error
      );
      throw error;
    }
  },

  async obterHistoricoVendas(
    clienteId: number,
    filtros?: {
      data_inicio?: string;
      data_fim?: string;
      situacao_pagamento?: "Pago" | "Pendente";
      skip?: number;
      limit?: number;
    }
  ): Promise<any> {
    try {
      console.log(`📈 Buscando histórico de vendas do cliente ${clienteId}...`);

      const params: any = {};
      if (filtros?.data_inicio) params.data_inicio = filtros.data_inicio;
      if (filtros?.data_fim) params.data_fim = filtros.data_fim;
      if (filtros?.situacao_pagamento)
        params.situacao_pagamento = filtros.situacao_pagamento;
      if (filtros?.skip !== undefined) params.skip = filtros.skip;
      if (filtros?.limit !== undefined) params.limit = filtros.limit;

      const response = await api.get<any>(
        `/relatorios/historico-vendas/${clienteId}`,
        { params }
      );
      console.log("✅ Histórico de vendas carregado");
      return response.data;
    } catch (error) {
      console.error("❌ Erro ao buscar histórico de vendas:", error);
      throw error;
    }
  },

  async obterResumoFinanceiro(clienteId: number): Promise<any> {
    try {
      console.log(`💼 Buscando resumo financeiro do cliente ${clienteId}...`);

      const response = await api.get<any>(
        `/relatorios/resumo-financeiro/${clienteId}`
      );
      console.log("✅ Resumo financeiro carregado");
      return response.data;
    } catch (error) {
      console.error("❌ Erro ao buscar resumo financeiro:", error);
      throw error;
    }
  },

  async obterDashboardVendas(filtros?: {
    data_inicio?: string;
    data_fim?: string;
  }): Promise<any> {
    try {
      console.log("📊 Buscando dashboard de vendas...");

      const params: any = {};
      if (filtros?.data_inicio) params.data_inicio = filtros.data_inicio;
      if (filtros?.data_fim) params.data_fim = filtros.data_fim;

      const response = await api.get<any>("/relatorios/dashboard-vendas", {
        params,
      });
      console.log("✅ Dashboard de vendas carregado");
      return response.data;
    } catch (error) {
      console.error("❌ Erro ao buscar dashboard de vendas:", error);
      throw error;
    }
  },

  async obterClientesInadimplentes(filtros?: {
    dias_minimo?: number;
    valor_minimo?: number;
    ordenar_por?: "valor_desc" | "valor_asc" | "dias_desc" | "dias_asc";
  }): Promise<any> {
    try {
      console.log("⚠️ Buscando clientes inadimplentes...");

      const params: any = {};
      if (filtros?.dias_minimo !== undefined)
        params.dias_minimo = filtros.dias_minimo;
      if (filtros?.valor_minimo !== undefined)
        params.valor_minimo = filtros.valor_minimo;
      if (filtros?.ordenar_por) params.ordenar_por = filtros.ordenar_por;

      const response = await api.get<any>(
        "/relatorios/clientes-inadimplentes",
        { params }
      );
      console.log("✅ Relatório de inadimplentes carregado");
      return response.data;
    } catch (error) {
      console.error("❌ Erro ao buscar clientes inadimplentes:", error);
      throw error;
    }
  },
};

export default api;
