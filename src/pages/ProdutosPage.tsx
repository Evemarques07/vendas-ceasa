import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/Input";
import { Loading } from "@/components/Loading";
import { produtosService } from "@/services/api";
import type {
  Produto as ProdutoOrig,
  FormProduto as FormProdutoOrig,
} from "@/types";
import {
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiX,
  FiAlertCircle,
  FiCheckCircle,
  FiPackage,
  FiTrash2,
  FiEdit,
  FiImage,
} from "react-icons/fi"; // Usando react-icons para ícones

// Componente para notificações (toast)
type NotificationProps = {
  message: string;
  type: "success" | "error";
  onDismiss: () => void;
};

const Notification = ({ message, type, onDismiss }: NotificationProps) => (
  <div
    className={`fixed top-5 right-5 z-[100] flex items-center gap-4 rounded-lg bg-white p-4 shadow-lg ring-1 ring-black ring-opacity-5 transition-transform transform ${
      type === "success" ? "text-green-700" : "text-red-700"
    }`}
  >
    {type === "success" ? (
      <FiCheckCircle className="h-6 w-6" />
    ) : (
      <FiAlertCircle className="h-6 w-6" />
    )}
    <p className="font-medium">{message}</p>
    <button onClick={onDismiss} className="text-gray-400 hover:text-gray-600">
      <FiX />
    </button>
  </div>
);

export function ProdutosPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [reloading, setReloading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingProduto, setEditingProduto] = useState<Produto | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // Estado do formulário
  // Ajuste de tipos locais para refletir imagem como string
  type Produto = Omit<ProdutoOrig, "imagem"> & { imagem?: string };
  type FormProduto = Omit<FormProdutoOrig, "imagem"> & {
    imagem?: string | undefined;
  };

  const [formData, setFormData] = useState<
    Omit<FormProduto, "preco_venda" | "estoque_minimo"> & {
      preco_venda: string;
      estoque_minimo: string;
    }
  >({
    nome: "",
    descricao: "",
    preco_venda: "",
    tipo_medida: "kg",
    estoque_minimo: "",
    ativo: true,
    imagem: "",
  });
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000); // Auto-dismiss after 5s
  };

  const carregarProdutos = useCallback(async () => {
    try {
      console.log("=== CARREGANDO PRODUTOS ===");
      setLoading(true);
      const resultado = await produtosService.listar();
      setProdutos(resultado.produtos || []);
    } catch (error) {
      console.error("=== ERRO AO CARREGAR PRODUTOS ===", error);
      showNotification(
        "Falha ao carregar produtos. Verifique a conexão com a API.",
        "error"
      );
      setProdutos([]);
    } finally {
      setLoading(false);
      setReloading(false);
    }
  }, []);

  useEffect(() => {
    carregarProdutos();
  }, [carregarProdutos]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Conversão dos campos string para número
    const precoVendaNum = parseFloat(formData.preco_venda.replace(",", "."));
    const estoqueMinNum = formData.estoque_minimo
      ? parseInt(formData.estoque_minimo)
      : 0;
    if (
      !formData.nome.trim() ||
      !formData.preco_venda ||
      isNaN(precoVendaNum) ||
      precoVendaNum <= 0 ||
      !formData.tipo_medida
    ) {
      showNotification(
        "Preencha todos os campos obrigatórios corretamente.",
        "error"
      );
      return;
    }

    try {
      const action = editingProduto ? "atualizado" : "cadastrado";
      if (editingProduto) {
        // Atualiza dados principais (exceto imagem)
        await produtosService.atualizar(editingProduto.id, {
          ...formData,
          preco_venda: precoVendaNum,
          estoque_minimo: estoqueMinNum,
          imagem: undefined, // Não enviar imagem no PUT principal
        });
        // Se a imagem foi alterada e não está vazia, atualiza via endpoint próprio
        if (
          formData.imagem &&
          formData.imagem.trim() !== "" &&
          formData.imagem !== editingProduto.imagem
        ) {
          await produtosService.atualizarImagem(
            editingProduto.id,
            formData.imagem
          );
        }
      } else {
        // Só envia o campo imagem se houver URL preenchida
        const dadosParaCriar = {
          ...formData,
          preco_venda: precoVendaNum,
          estoque_minimo: estoqueMinNum,
        };
        if (!formData.imagem || formData.imagem.trim() === "") {
          delete (dadosParaCriar as any).imagem;
        }
        await produtosService.criar(dadosParaCriar as any);
      }
      showNotification(`Produto ${action} com sucesso!`, "success");
      await carregarProdutos();
      resetForm();
    } catch (error) {
      console.error("Erro ao salvar produto:", error);
      showNotification("Erro ao salvar produto.", "error");
    }
  };

  const handleEdit = (produto: Produto) => {
    setEditingProduto(produto);
    setFormData({
      nome: produto.nome,
      descricao: produto.descricao || "",
      preco_venda: String(produto.preco_venda ?? ""),
      tipo_medida: produto.tipo_medida,
      estoque_minimo: String(produto.estoque_minimo ?? ""),
      ativo: produto.ativo,
      imagem: produto.imagem || "",
    });
    setPreviewImage(produto.imagem || null);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Tem certeza que deseja excluir este produto?")) {
      try {
        await produtosService.excluir(id);
        showNotification("Produto excluído com sucesso!", "success");
        await carregarProdutos();
      } catch (error) {
        console.error("Erro ao excluir produto:", error);
        showNotification("Erro ao excluir produto.", "error");
      }
    }
  };

  // Agora a imagem é apenas uma URL
  const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setFormData((prev) => ({ ...prev, imagem: url }));
    setPreviewImage(url || null);
  };

  const resetForm = () => {
    setFormData({
      nome: "",
      descricao: "",
      preco_venda: "",
      tipo_medida: "kg",
      estoque_minimo: "",
      ativo: true,
      imagem: "",
    });
    setPreviewImage(null);
    setEditingProduto(null);
    setShowForm(false);
  };

  const handleRecarregar = () => {
    setReloading(true);
    carregarProdutos();
  };

  const formatCurrency = (value: number | string) => {
    const numberValue = Number(value) || 0;
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(numberValue);
  };

  const produtosFiltrados =
    produtos?.filter(
      (p) =>
        p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.descricao || "").toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  if (loading) return <Loading />;

  return (
    <>
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onDismiss={() => setNotification(null)}
        />
      )}

      {/* Modal do Formulário */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit} className="flex flex-col h-full">
              <div className="p-6 border-b">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-800">
                    {editingProduto ? "Editar Produto" : "Novo Produto"}
                  </h2>
                  <Button variant="ghost" onClick={resetForm} size="sm">
                    <FiX className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              <div className="p-6 space-y-4 overflow-y-auto">
                <Input
                  label="Nome do Produto *"
                  value={formData.nome}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, nome: e.target.value }))
                  }
                  required
                />
                <Input
                  label="Descrição (Opcional)"
                  value={formData.descricao}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, descricao: e.target.value }))
                  }
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Preço de Venda *"
                    type="text"
                    inputMode="decimal"
                    pattern="[0-9]*[.,]?[0-9]*"
                    value={formData.preco_venda}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        preco_venda: e.target.value.replace(/[^0-9.,]/g, ""),
                      }))
                    }
                    placeholder="Preço de venda"
                    required
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de Medida *
                    </label>
                    <select
                      value={formData.tipo_medida}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
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
                  label="Estoque Mínimo"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={formData.estoque_minimo}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      estoque_minimo: e.target.value.replace(/[^0-9]/g, ""),
                    }))
                  }
                  placeholder="Estoque mínimo"
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL da Imagem
                  </label>
                  <div className="flex items-center gap-4">
                    {previewImage ? (
                      <img
                        src={previewImage}
                        alt="Preview"
                        className="w-20 h-20 object-cover rounded-lg border"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                        <FiImage className="w-8 h-8" />
                      </div>
                    )}
                    <Input
                      type="text"
                      placeholder="Cole a URL da imagem"
                      value={formData.imagem ?? ""}
                      onChange={handleImageUrlChange}
                      className="text-sm"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">
                    Produto Ativo
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.ativo}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, ativo: e.target.checked }))
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>

              <div className="p-4 bg-gray-50 border-t mt-auto">
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingProduto ? "Salvar Alterações" : "Cadastrar Produto"}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Gerenciar Produtos
            </h1>
            <p className="text-gray-500 mt-1">
              Adicione, edite e visualize seus produtos.
            </p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              onClick={handleRecarregar}
              variant="outline"
              disabled={reloading}
              className="flex-1 sm:flex-none"
            >
              <FiRefreshCw
                className={`h-4 w-4 ${reloading ? "animate-spin" : ""}`}
              />
            </Button>
            <Button
              onClick={() => setShowForm(true)}
              className="flex-1 sm:flex-none"
            >
              <FiPlus className="h-4 w-4 mr-2" /> Novo Produto
            </Button>
          </div>
        </header>

        {/* Busca */}
        <div className="mb-8">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Buscar por nome ou descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:max-w-md pl-10"
            />
          </div>
        </div>

        {/* Grid de Produtos */}
        {produtosFiltrados.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {produtosFiltrados.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col group transition-all hover:shadow-xl hover:-translate-y-1"
              >
                <div className="relative">
                  <div className="aspect-w-1 aspect-h-1 bg-gray-100 flex items-center justify-center">
                    {p.imagem && p.imagem.trim() !== "" ? (
                      <div className="w-28 h-28 flex items-center justify-center mx-auto">
                        <img
                          src={p.imagem}
                          alt={p.descricao || p.nome}
                          className="w-full h-full object-cover rounded-lg border"
                          style={{
                            minWidth: "7rem",
                            minHeight: "7rem",
                            maxWidth: "7rem",
                            maxHeight: "7rem",
                          }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display =
                              "none";
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-28 h-28 flex items-center justify-center mx-auto bg-gray-100 rounded-lg">
                        <FiPackage className="w-16 h-16 text-gray-300" />
                      </div>
                    )}
                  </div>
                  <span
                    className={`absolute top-2 right-2 text-xs font-bold px-2 py-1 rounded-full text-white ${
                      p.ativo ? "bg-green-500" : "bg-gray-500"
                    }`}
                  >
                    {p.ativo ? "Ativo" : "Inativo"}
                  </span>
                </div>
                <div className="p-4 flex flex-col flex-grow">
                  <h3 className="font-bold text-lg text-gray-800 mb-1 truncate">
                    {p.nome}
                  </h3>
                  <p className="text-sm text-gray-500 mb-3 flex-grow h-10">
                    {p.descricao}
                  </p>
                  <div className="text-xl font-semibold text-gray-900 mb-3">
                    {formatCurrency(p.preco_venda)}{" "}
                    <span className="text-sm font-normal text-gray-500">
                      / {p.tipo_medida}
                    </span>
                  </div>

                  {p.estoque_minimo && (
                    <div className="flex items-center gap-2 text-yellow-600 text-xs mb-3 p-2 bg-yellow-50 rounded-md">
                      <FiAlertCircle />
                      <span>Estoque mínimo: {p.estoque_minimo}</span>
                    </div>
                  )}
                </div>
                <div className="p-4 bg-gray-50/70 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(p)}
                    className="flex-1"
                  >
                    <FiEdit className="mr-2 h-4 w-4" /> Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(p.id)}
                    className="text-gray-400 hover:text-red-600 hover:bg-red-50"
                  >
                    <FiTrash2 />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 px-6 bg-gray-50 rounded-lg">
            <FiPackage className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">
              {searchTerm
                ? "Nenhum produto encontrado"
                : "Nenhum produto cadastrado"}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm
                ? "Tente uma busca diferente ou limpe o filtro."
                : "Comece adicionando seu primeiro produto."}
            </p>
            {!searchTerm && (
              <div className="mt-6">
                <Button onClick={() => setShowForm(true)}>
                  <FiPlus className="-ml-1 mr-2 h-5 w-5" />
                  Adicionar Produto
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
