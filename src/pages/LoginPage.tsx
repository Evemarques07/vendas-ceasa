import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";

const loginSchema = z.object({
  cpf: z
    .string()
    .min(1, "CPF é obrigatório")
    .regex(/^\d{11}$/, "CPF deve conter 11 dígitos numéricos"),
  senha: z
    .string()
    .min(1, "Senha é obrigatória")
    .min(6, "Senha deve ter pelo menos 6 caracteres"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError("");

    try {
      await login(data.cpf, data.senha);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "Erro ao fazer login");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Sistema Vendas</h1>
          <p className="mt-2 text-sm text-gray-600">
            Controle de Pedidos, Estoque e Financeiro
          </p>
        </div>

        {/* Formulário */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Fazer Login
          </h2>

          {error && (
            <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="CPF"
              type="text"
              placeholder="Apenas números"
              maxLength={11}
              {...register("cpf")}
              error={errors.cpf?.message}
              disabled={isLoading}
            />

            <Input
              label="Senha"
              type="password"
              placeholder="Sua senha"
              {...register("senha")}
              error={errors.senha?.message}
              disabled={isLoading}
            />

            <Button
              type="submit"
              className="w-full"
              isLoading={isLoading}
              disabled={isLoading}
            >
              Entrar
            </Button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-400">
          <p>Sistema desenvolvido para controle de vendas</p>
        </div>
      </div>
    </div>
  );
}
