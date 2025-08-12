import { useBackendConnection } from "@/hooks/useBackendConnection";
import { Button } from "./Button";

export function BackendStatus() {
  const { isConnected, healthData, error, checkConnection } =
    useBackendConnection();

  const getStatusColor = () => {
    if (isConnected === null) return "bg-gray-100 text-gray-600";
    if (isConnected) return "bg-green-100 text-green-800";
    return "bg-red-100 text-red-800";
  };

  const getStatusIcon = () => {
    if (isConnected === null) {
      return (
        <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-gray-600 rounded-full"></div>
      );
    }

    if (isConnected) {
      return (
        <svg
          className="w-4 h-4 text-green-600"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
      );
    }

    return (
      <svg
        className="w-4 h-4 text-red-600"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
          clipRule="evenodd"
        />
      </svg>
    );
  };

  const getStatusText = () => {
    if (isConnected === null) return "Verificando...";
    if (isConnected) return "Backend Conectado";
    return "Backend Desconectado";
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 border-l-4 border-l-primary-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {getStatusIcon()}
          <div>
            <h3 className="text-sm font-medium text-gray-900">
              Status do Backend
            </h3>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor()}`}
            >
              {getStatusText()}
            </span>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={checkConnection}
          disabled={isConnected === null}
        >
          <svg
            className="w-4 h-4 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Verificar
        </Button>
      </div>

      {isConnected && healthData && (
        <div className="mt-3 text-xs text-gray-500">
          <p>Servidor: {healthData.message}</p>
          <p>
            Última verificação:{" "}
            {new Date(healthData.timestamp).toLocaleString("pt-BR")}
          </p>
        </div>
      )}

      {!isConnected && error && (
        <div className="mt-3 text-xs text-red-600">
          <p>Erro: {error}</p>
          <p className="mt-1">
            Verifique se o backend FastAPI está rodando na porta 8000
          </p>
        </div>
      )}
    </div>
  );
}
