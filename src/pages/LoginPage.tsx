// src/pages/LoginPage.tsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { formatCpfCnpj } from "@/lib/utils";

// Componentes de UI
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox"; // Precisamos deste novo componente

// Ícones
import { Eye, EyeOff, Loader2 } from "lucide-react";
import logoFrutos from "../assets/logo-frutos-da-terra.png";

// --- Esquema de Validação ---
const loginSchema = z.object({
  cpf: z
    .string()
    .min(1, "CPF é obrigatório")
    .refine((val) => val.replace(/\D/g, "").length === 11, {
      message: "CPF deve conter 11 dígitos numéricos",
    }),
  senha: z
    .string()
    .min(1, "Senha é obrigatória")
    .min(6, "A senha deve ter pelo menos 6 caracteres."),
  lembrar: z
    .boolean()
    .default(false)
    .transform((v) => v ?? false),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema) as any,
    defaultValues: {
      cpf: localStorage.getItem("rememberedCpf") || "",
      lembrar: !!localStorage.getItem("rememberedCpf"),
    },
  });

  // Máscara dinâmica para CPF

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError("");

    // Remove qualquer caractere não numérico do CPF antes de enviar
    const cpfNumeros = data.cpf.replace(/\D/g, "");

    try {
      await login(cpfNumeros, data.senha);

      // Salva ou remove o CPF do localStorage (mantém formatado para o input)
      if (data.lembrar) {
        localStorage.setItem("rememberedCpf", data.cpf);
      } else {
        localStorage.removeItem("rememberedCpf");
      }

      navigate("/dashboard");
    } catch (err: any) {
      setError(
        err.message || "CPF ou senha inválidos. Por favor, tente novamente."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2">
      {/* Coluna Esquerda: Imagem/Destaque */}
      <div className="hidden bg-gray-100 lg:flex lg:items-center lg:justify-center p-8">
        <div className="text-center">
          <img
            src="https://img.freepik.com/free-vector/business-analytics-concept-illustration_114360-1587.jpg"
            alt="Ilustração de um dashboard com gráficos"
            className="mx-auto rounded-lg shadow-2xl"
          />
          <h2 className="mt-8 text-3xl font-bold text-gray-800">
            Transforme Dados em Decisões
          </h2>
          <p className="mt-2 text-lg text-gray-600">
            Gerencie suas vendas, estoque e finanças de forma integrada e
            eficiente.
          </p>
        </div>
      </div>

      {/* Coluna Direita: Formulário de Login */}
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <div className="flex flex-col items-center text-center">
            <img
              src={logoFrutos}
              alt="Logo Frutos da Terra Hortifruti"
              className="w-32 h-32 object-contain mb-2 drop-shadow-md"
              style={{ background: "transparent" }}
            />
            {/* <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
              Acesse sua Conta
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Bem-vindo de volta! Insira suas credenciais.
            </p> */}
          </div>

          <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
            {error && (
              <div className="mb-4 rounded-md bg-red-50 p-3 text-center">
                <p className="text-sm font-medium text-red-700">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="cpf">CPF</Label>
                <Controller
                  name="cpf"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="cpf"
                      placeholder="Digite seu CPF (apenas números)"
                      maxLength={14}
                      value={field.value}
                      onChange={(e) =>
                        field.onChange(formatCpfCnpj(e.target.value))
                      }
                      disabled={isLoading}
                      autoComplete="username"
                      className={errors.cpf ? "border-red-500" : ""}
                    />
                  )}
                />
                {errors.cpf && (
                  <p className="text-sm text-red-600">{errors.cpf.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="senha">Senha</Label>
                <div className="relative">
                  <Input
                    id="senha"
                    type={showPassword ? "text" : "password"}
                    placeholder="Digite sua senha"
                    {...register("senha")}
                    disabled={isLoading}
                    autoComplete="current-password"
                    className={errors.senha ? "border-red-500" : ""}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
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
              </div>

              <div className="flex items-center">
                <Checkbox id="lembrar" {...register("lembrar")} />
                <Label
                  htmlFor="lembrar"
                  className="ml-2 block text-sm text-gray-800 font-normal cursor-pointer"
                >
                  Lembrar-me
                </Label>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  "Entrar"
                )}
              </Button>
            </form>
          </div>

          <p className="text-center text-xs text-gray-500">
            &copy; {new Date().getFullYear()} Frutos da Terra. Todos os direitos
            reservados.
          </p>
        </div>
      </div>
    </div>
  );
}
