// Arquivo de teste para verificar se o Tailwind CSS está funcionando
import { Button } from "@/components/ui/Button";

export function TestPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          🎉 Tailwind CSS Funcionando!
        </h1>
        <p className="text-gray-600 mb-6">
          Se você conseguir ver este card com gradiente no fundo e estilos
          aplicados, significa que o Tailwind CSS está funcionando
          perfeitamente.
        </p>
        <div className="space-y-4">
          <Button className="w-full">Botão Primary</Button>
          <Button variant="secondary" className="w-full">
            Botão Secondary
          </Button>
          <Button variant="outline" className="w-full">
            Botão Outline
          </Button>
        </div>
        <div className="mt-6 p-4 bg-green-100 rounded-lg border border-green-300">
          <p className="text-green-800 font-medium">
            ✅ Sistema está funcionando corretamente!
          </p>
        </div>
      </div>
    </div>
  );
}
