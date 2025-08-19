import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/Input";
import { Loading } from "@/components/Loading";
import { produtosService } from "@/services/api";
import type {
  Produto as ProdutoApi,
  FormProduto as FormProdutoApi,
} from "@/types";
import {
  FiPlus,
  FiRefreshCw,
  FiX,
  FiAlertCircle,
  FiCheckCircle,
  FiPackage,
  FiTrash2,
  FiEdit,
  FiImage,
  FiUpload,
  FiXCircle,
} from "react-icons/fi";

const API_BASE_URL = "https://www.evertonmarques.com.br/api";
// const API_BASE_URL = "http://localhost:8000/api"; // Para desenvolvimento local

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

type Produto = ProdutoApi & { tem_imagem?: boolean };
type FormProduto = Omit<FormProdutoApi, "imagem">;

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
  });

  const [imagemArquivo, setImagemArquivo] = useState<File | null>(null);
  const [imagemRemovida, setImagemRemovida] = useState<boolean>(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const carregarProdutos = useCallback(async () => {
    try {
      setLoading(true);
      const resultado = await produtosService.listar();
      setProdutos(resultado.produtos || []);
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
      showNotification("Falha ao carregar produtos.", "error");
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
    const precoVendaNum = parseFloat(formData.preco_venda.replace(",", "."));
    const estoqueMinNum = formData.estoque_minimo
      ? parseInt(formData.estoque_minimo)
      : 0;
    if (
      !formData.nome.trim() ||
      !formData.preco_venda ||
      isNaN(precoVendaNum) ||
      precoVendaNum <= 0
    ) {
      showNotification(
        "Preencha os campos obrigatórios corretamente.",
        "error"
      );
      return;
    }
    const dadosProduto = {
      ...formData,
      preco_venda: precoVendaNum,
      estoque_minimo: estoqueMinNum,
    };
    try {
      if (editingProduto) {
        await produtosService.atualizar(editingProduto.id, dadosProduto);
        if (imagemArquivo) {
          // Se já tinha imagem, deleta antes de subir a nova
          if (editingProduto.tem_imagem) {
            await produtosService.deletarImagem(editingProduto.id);
          }
          await produtosService.uploadImagem(editingProduto.id, imagemArquivo);
        } else if (imagemRemovida) {
          await produtosService.deletarImagem(editingProduto.id);
        }
        showNotification("Produto atualizado com sucesso!", "success");
      } else {
        const response = await produtosService.criar(dadosProduto as any);
        const novoProdutoId = response.id;
        if (imagemArquivo && novoProdutoId) {
          await produtosService.uploadImagem(novoProdutoId, imagemArquivo);
        }
        showNotification("Produto cadastrado com sucesso!", "success");
      }
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
    });
    if (produto.tem_imagem) {
      setPreviewImage(
        `${API_BASE_URL}/produtos/imagem/${
          produto.id
        }?t=${new Date().getTime()}`
      );
    }
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Tem certeza que deseja excluir este produto?")) {
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImagemArquivo(file);
      setImagemRemovida(false);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    setPreviewImage(null);
    setImagemArquivo(null);
    setImagemRemovida(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const resetForm = () => {
    setFormData({
      nome: "",
      descricao: "",
      preco_venda: "",
      tipo_medida: "kg",
      estoque_minimo: "",
      ativo: true,
    });
    setPreviewImage(null);
    setEditingProduto(null);
    setShowForm(false);
    setImagemArquivo(null);
    setImagemRemovida(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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

      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit} className="flex flex-col h-full">
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold">
                  {editingProduto ? "Editar Produto" : "Novo Produto"}
                </h2>
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
                    placeholder="Ex: 10,50"
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
                  label="Estoque Mínimo (Opcional)"
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
                  placeholder="Ex: 5"
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Imagem do Produto
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 relative border">
                      {previewImage ? (
                        <>
                          <img
                            src={previewImage}
                            alt="Preview"
                            className="w-full h-full object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={handleRemoveImage}
                            className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md text-red-500 hover:bg-red-50"
                          >
                            <FiXCircle className="w-5 h-5" />
                          </button>
                        </>
                      ) : (
                        <FiImage className="w-10 h-10" />
                      )}
                    </div>
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/jpg"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <FiUpload className="mr-2 h-4 w-4" />
                        Selecionar Imagem
                      </Button>
                      <p className="text-xs text-gray-500 mt-2">
                        Envie arquivos JPG, PNG ou JPEG.
                      </p>
                    </div>
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
            >
              <FiRefreshCw
                className={`h-4 w-4 ${reloading ? "animate-spin" : ""}`}
              />
            </Button>
            <Button onClick={() => setShowForm(true)}>
              <FiPlus className="h-4 w-4 mr-2" /> Novo Produto
            </Button>
          </div>
        </header>

        <div className="mb-8">
          <Input
            placeholder="Buscar por nome ou descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:max-w-md"
          />
        </div>

        {produtosFiltrados.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {produtosFiltrados.map((p) => {
              const imageUrl = `${API_BASE_URL}/produtos/imagem/${
                p.id
              }?t=${new Date().getTime()}`;
              return (
                <div
                  key={p.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col group transition-all hover:shadow-xl hover:-translate-y-1"
                >
                  <div className="relative">
                    <div className="aspect-w-1 aspect-h-1 w-full h-48 bg-gray-100 flex items-center justify-center">
                      <img
                        src={imageUrl}
                        alt={p.nome}
                        className="w-full h-full object-cover"
                        style={{ display: "block" }}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.style.display = "none";
                          const fallback = document.createElement("div");
                          fallback.className =
                            "flex items-center justify-center w-full h-full";
                          fallback.innerHTML = `<svg class='w-16 h-16 text-gray-300' fill='none' stroke='currentColor' stroke-width='2' viewBox='0 0 24 24'><path stroke-linecap='round' stroke-linejoin='round' d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' /></svg>`;
                          e.currentTarget.parentNode?.appendChild(fallback);
                        }}
                      />
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
              );
            })}
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
                ? "Tente uma busca diferente."
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
