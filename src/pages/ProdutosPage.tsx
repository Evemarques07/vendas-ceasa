import { useState, useEffect } from "react";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Loading } from "@/components/Loading";
import { produtosService, testeConectividade } from "@/services/api";
import type { Produto, FormProduto } from "@/types";

export function ProdutosPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduto, setEditingProduto] = useState<Produto | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Estado do formulário
  const [formData, setFormData] = useState<FormProduto>({
    nome: "",
    descricao: "",
    preco_venda: 0,
    tipo_medida: "kg",
    estoque_minimo: 0,
    ativo: true,
    imagem: undefined,
  });

  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    carregarProdutos();
  }, []);

  const carregarProdutos = async () => {
    try {
      console.log("=== CARREGANDO PRODUTOS ===");
      setLoading(true);

      // Testar conectividade primeiro
      const conectado = await testeConectividade.verificarConexao();
      if (!conectado) {
        console.error("Backend não está respondendo");
        alert(
          "❌ Erro: Backend não está respondendo. Verifique se o servidor está rodando."
        );
        setProdutos([]);
        return;
      }

      const resultado = await produtosService.listar();
      console.log("Resultado da API:", resultado);
      setProdutos(resultado.produtos || []);
      console.log("Produtos carregados:", resultado.produtos?.length || 0);

      if (!resultado.produtos || resultado.produtos.length === 0) {
        console.warn("Nenhum produto encontrado");
      }
    } catch (error) {
      console.error("=== ERRO AO CARREGAR PRODUTOS ===");
      console.error("Erro ao carregar produtos:", error);

      // Mostrar erro específico para o usuário
      if (error instanceof Error) {
        alert(`❌ Erro ao carregar produtos: ${error.message}`);
      } else {
        alert(
          "❌ Erro desconhecido ao carregar produtos. Verifique o console para mais detalhes."
        );
      }

      setProdutos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validações do frontend - seguindo a documentação da API
    if (!formData.nome.trim()) {
      alert("Nome do produto é obrigatório");
      return;
    }

    if (!formData.preco_venda || formData.preco_venda <= 0) {
      alert("Preço de venda deve ser maior que zero");
      return;
    }

    if (!formData.tipo_medida) {
      alert("Tipo de medida é obrigatório");
      return;
    }

    if (formData.estoque_minimo === undefined || formData.estoque_minimo < 0) {
      alert("Estoque mínimo deve ser maior ou igual a zero");
      return;
    }

    try {
      console.log("Dados do formulário:", formData);

      if (editingProduto) {
        await produtosService.atualizar(editingProduto.id, formData);
      } else {
        await produtosService.criar(formData);
      }
      await carregarProdutos();
      resetForm();
    } catch (error) {
      console.error("Erro ao salvar produto:", error);

      // Mostrar erro mais específico
      if (error instanceof Error) {
        alert(`Erro ao salvar produto: ${error.message}`);
      } else {
        alert("Erro desconhecido ao salvar produto");
      }
    }
  };

  const handleEdit = (produto: Produto) => {
    setEditingProduto(produto);
    setFormData({
      nome: produto.nome,
      descricao: produto.descricao,
      preco_venda: produto.preco_venda,
      tipo_medida: produto.tipo_medida,
      estoque_minimo: produto.estoque_minimo,
      ativo: produto.ativo,
      imagem: undefined, // Não podemos pré-carregar o arquivo
    });
    setPreviewImage(produto.imagem || null);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Tem certeza que deseja excluir este produto?")) {
      try {
        console.log("=== INICIANDO EXCLUSÃO DE PRODUTO ===");
        console.log("ID:", id);

        await produtosService.excluir(id);

        console.log("=== PRODUTO EXCLUÍDO COM SUCESSO ===");
        console.log("Recarregando lista de produtos...");

        await carregarProdutos();

        alert("✅ Produto excluído com sucesso!");
      } catch (error) {
        console.error("=== ERRO AO EXCLUIR PRODUTO ===");
        console.error("Erro ao excluir produto:", error);

        // Mostrar erro mais específico
        if (error instanceof Error) {
          alert(`❌ Erro ao excluir produto: ${error.message}`);
        } else {
          alert("❌ Erro desconhecido ao excluir produto");
        }
      }
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({ ...prev, imagem: file }));

      // Criar preview da imagem
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setFormData({
      nome: "",
      descricao: "",
      preco_venda: 0,
      tipo_medida: "kg",
      estoque_minimo: 0,
      ativo: true,
      imagem: undefined,
    });
    setPreviewImage(null);
    setEditingProduto(null);
    setShowForm(false);
  };

  const formatarPreco = (preco: any): string => {
    const valor = Number(preco);
    return isNaN(valor)
      ? "R$ 0,00"
      : `R$ ${valor.toFixed(2).replace(".", ",")}`;
  };

  const testarConectividade = async () => {
    console.log("=== TESTANDO CONECTIVIDADE MANUAL ===");
    const conectado = await testeConectividade.verificarConexao();
    if (conectado) {
      alert("✅ Conectividade OK! Backend está respondendo.");
    } else {
      alert("❌ Erro de conectividade! Verifique se o backend está rodando.");
    }
  };

  const produtosFiltrados = (produtos || []).filter(
    (produto) =>
      produto.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (produto.descricao ?? "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Produtos
        </h1>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Button
            onClick={testarConectividade}
            variant="outline"
            className="flex-1 sm:flex-none"
          >
            🔗 <span className="hidden sm:inline ml-1">Testar API</span>
          </Button>
          <Button
            onClick={carregarProdutos}
            variant="outline"
            className="flex-1 sm:flex-none"
          >
            🔄 <span className="hidden sm:inline ml-1">Recarregar</span>
          </Button>
          <Button
            onClick={() => setShowForm(true)}
            className="flex-1 sm:flex-none"
          >
            + <span className="hidden sm:inline ml-1">Novo Produto</span>
            <span className="sm:hidden ml-1">Novo</span>
          </Button>
        </div>
      </div>

      {/* Busca */}
      <div className="mb-6">
        <Input
          placeholder="Buscar por descrição..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full sm:max-w-md"
        />
      </div>

      {/* Modal do Formulário */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg sm:text-xl font-semibold">
                  {editingProduto ? "Editar Produto" : "Novo Produto"}
                </h2>
                <Button variant="outline" onClick={resetForm} size="sm">
                  ✕
                </Button>
              </div>

              {editingProduto && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700">
                    <strong>Editando produto:</strong> {editingProduto.nome}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Todos os campos podem ser alterados
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Nome *"
                  value={formData.nome}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      nome: e.target.value,
                    }))
                  }
                  required
                />

                <Input
                  label="Descrição"
                  value={formData.descricao}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      descricao: e.target.value,
                    }))
                  }
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Preço de Venda (R$) *"
                    type="number"
                    step="0.01"
                    value={formData.preco_venda}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        preco_venda: parseFloat(e.target.value) || 0,
                      }))
                    }
                    required
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Medida *
                    </label>
                    <select
                      value={formData.tipo_medida}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          tipo_medida: e.target.value as any,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      required
                    >
                      <option value="kg">Quilograma (kg)</option>
                      <option value="unidade">Unidade (un)</option>
                      <option value="litro">Litro (l)</option>
                      <option value="caixa">Caixa</option>
                      <option value="saco">Saco</option>
                      <option value="duzia">Dúzia</option>
                    </select>
                  </div>
                </div>

                <Input
                  label="Estoque Mínimo *"
                  type="number"
                  value={formData.estoque_minimo}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      estoque_minimo: parseInt(e.target.value) || 0,
                    }))
                  }
                  required
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Imagem do Produto
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {editingProduto && (
                    <p className="text-xs text-blue-600 mt-1">
                      Nova imagem será enviada em requisição separada
                    </p>
                  )}
                  {previewImage && (
                    <div className="mt-2">
                      <img
                        src={previewImage}
                        alt="Preview"
                        className="w-32 h-32 object-cover rounded-lg border mx-auto sm:mx-0"
                      />
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-2 justify-end pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                    className="w-full sm:w-auto"
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" className="w-full sm:w-auto">
                    {editingProduto ? "Atualizar" : "Cadastrar"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Grid de Produtos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {produtosFiltrados.map((produto) => (
          <div
            key={produto.id}
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className="aspect-square bg-gray-100 flex items-center justify-center">
              {produto.imagem ? (
                <img
                  src={produto.imagem}
                  alt={produto.descricao}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-gray-400 text-center">
                  <svg
                    className="w-16 h-16 mx-auto mb-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-sm">Sem imagem</span>
                </div>
              )}
            </div>

            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-1">
                {produto.nome}
              </h3>
              <p className="text-sm text-gray-600 mb-2">{produto.descricao}</p>
              <div className="text-sm text-gray-500 mb-3">
                <p>Preço: {formatarPreco(produto.preco_venda)}</p>
                <p>Medida: {produto.tipo_medida}</p>
                <p>Estoque mín.: {produto.estoque_minimo}</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(produto)}
                  className="flex-1 text-xs sm:text-sm"
                >
                  Editar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(produto.id)}
                  className="flex-1 text-red-600 hover:text-red-900 hover:bg-red-50 text-xs sm:text-sm"
                >
                  🗑️ Excluir
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {produtosFiltrados.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          {searchTerm
            ? "Nenhum produto encontrado"
            : "Nenhum produto cadastrado"}
        </div>
      )}
    </div>
  );
}
