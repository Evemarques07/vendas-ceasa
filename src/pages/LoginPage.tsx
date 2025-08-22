import { useState, useEffect } from "react";
// import { useNavigate, Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import type { Variants } from "framer-motion"; // Importamos o tipo Variants
import { useAuth } from "@/contexts/AuthContext";
import { userService } from "@/services/api";
// --- Esquema de Validação para criar admin ---
const adminSchema = z.object({
  nome: z.string().min(3, "Nome obrigatório"),
  email: z.string().email("E-mail inválido"),
  cpf_ou_cnpj: z.string().min(11, "CPF/CNPJ obrigatório"),
  senha: z.string().min(6, "A senha deve ter pelo menos 6 caracteres."),
});

type AdminFormData = z.infer<typeof adminSchema>;
import { formatCpfCnpj } from "@/lib/utils";

// Componentes de UI
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

// Ícones
import { Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import logoFrutos from "../assets/logo-frutos-da-terra.png";

// --- Esquema de Validação (Refinado) ---
const loginSchema = z.object({
  cpf: z
    .string()
    .min(1, "CPF é obrigatório")
    .refine((val) => val.replace(/\D/g, "").length === 11, {
      message: "CPF deve conter 11 dígitos",
    }),
  senha: z
    .string()
    .min(1, "Senha é obrigatória")
    .min(6, "A senha deve ter pelo menos 6 caracteres."),
  lembrar: z.preprocess((v) => (v === undefined ? false : v), z.boolean()),
});

type LoginFormData = {
  cpf: string;
  senha: string;
  lembrar: unknown;
};

// --- Variantes de Animação (Corrigidas com "as const") ---
const formVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
      staggerChildren: 0.1,
    },
  },
} as const; // <--- A MÁGICA ACONTECE AQUI

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" },
  },
} as const; // <--- E AQUI TAMBÉM

export function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [adminCheckLoading, setAdminCheckLoading] = useState(true);
  const [adminExists, setAdminExists] = useState<boolean | null>(null);
  const [adminError, setAdminError] = useState("");
  const [adminSuccess, setAdminSuccess] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  // Form login
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      cpf: localStorage.getItem("rememberedCpf") || "",
      lembrar: !!localStorage.getItem("rememberedCpf"),
    },
  });

  // Form admin
  const {
    register: registerAdmin,
    handleSubmit: handleSubmitAdmin,
    formState: { errors: errorsAdmin },
    reset: resetAdmin,
  } = useForm<AdminFormData>({
    resolver: zodResolver(adminSchema),
  });

  // Verifica se existe admin ao abrir tela
  useEffect(() => {
    setAdminCheckLoading(true);
    console.log("[LoginPage] Verificando se existe administrador...");
    userService
      .verificarAdministrador()
      .then((exists) => {
        console.log("[LoginPage] Resultado verificarAdministrador:", exists);
        setAdminExists(exists);
      })
      .catch((err) => {
        console.error("[LoginPage] Erro ao verificar administrador:", err);
        setAdminExists(null);
        setAdminError("Erro ao verificar administrador.");
      })
      .finally(() => {
        setAdminCheckLoading(false);
        console.log("[LoginPage] Fim da verificação de administrador");
      });
  }, []);

  // Cadastro do primeiro admin
  const onSubmitAdmin = async (data: AdminFormData) => {
    setIsLoading(true);
    setAdminError("");
    setAdminSuccess("");
    console.log("[LoginPage] Tentando cadastrar administrador:", data);
    try {
      const result = await userService.criarAdministrador({
        nome: data.nome,
        email: data.email,
        cpf_ou_cnpj: data.cpf_ou_cnpj,
        tipo: "administrador",
      });
      console.log("[LoginPage] Administrador cadastrado:", result);
      setAdminSuccess("Administrador cadastrado com sucesso! Faça login.");
      setAdminExists(true);
      resetAdmin();
    } catch (err: any) {
      console.error("[LoginPage] Erro ao cadastrar administrador:", err);
      setAdminError(err.message || "Erro ao cadastrar administrador.");
    } finally {
      setIsLoading(false);
    }
  };

  // Login normal
  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError("");
    const cpfNumeros = data.cpf.replace(/\D/g, "");
    const lembrarBool = Boolean(data.lembrar);
    console.log("[LoginPage] Tentando login:", {
      cpf: cpfNumeros,
      senha: data.senha,
      lembrar: lembrarBool,
    });

    try {
      await login(cpfNumeros, data.senha);
      console.log("[LoginPage] Login bem-sucedido");
      if (lembrarBool) {
        localStorage.setItem("rememberedCpf", data.cpf);
      } else {
        localStorage.removeItem("rememberedCpf");
      }
      navigate("/dashboard");
    } catch (err: any) {
      console.error("[LoginPage] Erro no login:", err);
      setError(err.message || "Credenciais inválidas. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-white">
      {/* Coluna Esquerda: Formulário de Login ou Cadastro Admin */}
      <div className="flex items-center justify-center p-6 sm:p-8 lg:p-12">
        <motion.div
          className="w-full max-w-md"
          variants={formVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div
            variants={itemVariants}
            className="flex flex-col items-center text-center mb-8"
          >
            <img
              src={logoFrutos}
              alt="Logo Frutos da Terra"
              className="w-28 h-28 object-contain mb-4"
            />
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              {adminCheckLoading
                ? "Carregando..."
                : adminExists === false
                ? "Primeiro acesso: Cadastre o Administrador"
                : "Acesse sua Conta"}
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              {adminCheckLoading
                ? "Verificando administrador..."
                : adminExists === false
                ? "Cadastre o primeiro administrador do sistema para continuar."
                : "Bem-vindo de volta! Insira suas credenciais."}
            </p>
          </motion.div>

          {/* Cadastro do primeiro administrador */}
          {/* Exibe o formulário se não está carregando e NÃO existe admin, ou se houve erro na verificação (adminExists === null) */}
          {!adminCheckLoading &&
            (adminExists === false || adminExists === null) && (
              <form
                onSubmit={handleSubmitAdmin(onSubmitAdmin)}
                className="space-y-5"
              >
                <AnimatePresence>
                  {adminError && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: "auto" }}
                      exit={{ opacity: 0, y: -10, height: 0 }}
                      className="flex items-center gap-3 rounded-md bg-red-50 p-3 text-sm font-medium text-red-700 border border-red-200"
                    >
                      <AlertCircle className="h-5 w-5 flex-shrink-0" />
                      <span>{adminError}</span>
                    </motion.div>
                  )}
                  {adminSuccess && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: "auto" }}
                      exit={{ opacity: 0, y: -10, height: 0 }}
                      className="flex items-center gap-3 rounded-md bg-green-50 p-3 text-sm font-medium text-green-700 border border-green-200"
                    >
                      <span>{adminSuccess}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
                <motion.div variants={itemVariants} className="space-y-2">
                  <Label htmlFor="nome">Nome</Label>
                  <Input
                    id="nome"
                    {...registerAdmin("nome")}
                    disabled={isLoading}
                  />
                  {errorsAdmin.nome && (
                    <p className="text-sm text-red-600">
                      {errorsAdmin.nome.message}
                    </p>
                  )}
                </motion.div>
                <motion.div variants={itemVariants} className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    {...registerAdmin("email")}
                    disabled={isLoading}
                  />
                  {errorsAdmin.email && (
                    <p className="text-sm text-red-600">
                      {errorsAdmin.email.message}
                    </p>
                  )}
                </motion.div>
                <motion.div variants={itemVariants} className="space-y-2">
                  <Label htmlFor="cpf_ou_cnpj">CPF ou CNPJ</Label>
                  <Input
                    id="cpf_ou_cnpj"
                    {...registerAdmin("cpf_ou_cnpj")}
                    disabled={isLoading}
                  />
                  {errorsAdmin.cpf_ou_cnpj && (
                    <p className="text-sm text-red-600">
                      {errorsAdmin.cpf_ou_cnpj.message}
                    </p>
                  )}
                </motion.div>
                <motion.div variants={itemVariants} className="space-y-2">
                  <Label htmlFor="senha">Senha</Label>
                  <Input
                    id="senha"
                    type="password"
                    {...registerAdmin("senha")}
                    disabled={isLoading}
                  />
                  {errorsAdmin.senha && (
                    <p className="text-sm text-red-600">
                      {errorsAdmin.senha.message}
                    </p>
                  )}
                </motion.div>
                <motion.div variants={itemVariants}>
                  <Button
                    type="submit"
                    className="w-full h-11 text-base"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      "Cadastrar Administrador"
                    )}
                  </Button>
                </motion.div>
              </form>
            )}

          {/* Formulário de login */}
          {!adminCheckLoading && adminExists === true && (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: -10, height: 0 }}
                    className="flex items-center gap-3 rounded-md bg-red-50 p-3 text-sm font-medium text-red-700 border border-red-200"
                  >
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div variants={itemVariants} className="space-y-2">
                <Label htmlFor="cpf">CPF</Label>
                <Controller
                  name="cpf"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="cpf"
                      placeholder="000.000.000-00"
                      maxLength={14}
                      value={field.value}
                      onChange={(e) =>
                        field.onChange(formatCpfCnpj(e.target.value))
                      }
                      disabled={isLoading}
                      autoComplete="username"
                      className={
                        errors.cpf
                          ? "border-red-500 focus-visible:ring-red-500"
                          : ""
                      }
                    />
                  )}
                />
                {errors.cpf && (
                  <p className="text-sm text-red-600">{errors.cpf.message}</p>
                )}
              </motion.div>

              <motion.div variants={itemVariants} className="space-y-2">
                <Label htmlFor="senha">Senha</Label>
                <div className="relative">
                  <Input
                    id="senha"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    {...register("senha")}
                    disabled={isLoading}
                    autoComplete="current-password"
                    className={
                      errors.senha
                        ? "border-red-500 focus-visible:ring-red-500"
                        : ""
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700 transition-colors"
                    aria-label={
                      showPassword ? "Ocultar senha" : "Mostrar senha"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.senha && (
                  <p className="text-sm text-red-600">{errors.senha.message}</p>
                )}
              </motion.div>

              <motion.div
                variants={itemVariants}
                className="flex items-center justify-between"
              >
                <div className="flex items-center">
                  <Checkbox id="lembrar" {...register("lembrar" as const)} />
                  <Label
                    htmlFor="lembrar"
                    className="ml-2 font-normal cursor-pointer"
                  >
                    Lembrar-me
                  </Label>
                </div>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Button
                  type="submit"
                  className="w-full h-11 text-base"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    "Entrar"
                  )}
                </Button>
              </motion.div>
            </form>
          )}

          <motion.p
            variants={itemVariants}
            className="mt-10 text-center text-xs text-gray-500"
          >
            &copy; {new Date().getFullYear()} Frutos da Terra. Todos os direitos
            reservados.
          </motion.p>
        </motion.div>
      </div>

      {/* Coluna Direita: Imagem Imersiva (Inalterada) */}
      <div className="hidden lg:block relative">
        <img
          src="/mercado.jpg"
          alt="Caixas de frutas e vegetais frescos em um mercado"
          className="h-full w-full object-cover"
        />
        {/* Overlay translúcido */}
        <div
          className="absolute inset-0 bg-black/60"
          style={{ pointerEvents: "none" }}
        />
        {/* Gradiente para o texto */}
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"
          style={{ pointerEvents: "none" }}
        />
        <div className="absolute bottom-10 left-10 text-white p-4 max-w-lg z-10">
          <h2 className="text-4xl font-bold leading-tight">
            O frescor do campo, a eficiência da tecnologia.
          </h2>
          <p className="mt-4 text-lg text-gray-200">
            Gerencie suas vendas e estoque com a precisão que seu negócio
            merece.
          </p>
        </div>
      </div>
    </div>
  );
}
