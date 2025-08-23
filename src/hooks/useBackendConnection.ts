import { useState, useEffect } from "react";
import axios from "axios";

interface HealthCheck {
  status: string;
  message: string;
  timestamp: string;
}

export function useBackendConnection() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [healthData, setHealthData] = useState<HealthCheck | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkConnection = async () => {
    try {
      const baseURL =
        import.meta.env.VITE_API_BASE_URL || "http://177.153.64.167:8000/api";

      // Faz uma requisição simples para testar se o servidor está rodando
      // Usamos a documentação do FastAPI para verificar se o servidor responde
      await axios.get(`${baseURL.replace("/api", "")}/docs`, {
        timeout: 5000,
      });

      // Se chegou até aqui, o servidor está rodando
      setHealthData({
        status: "online",
        message: "FastAPI Server Online",
        timestamp: new Date().toISOString(),
      });
      setIsConnected(true);
      setError(null);
    } catch (err: any) {
      setIsConnected(false);
      setHealthData(null);

      if (err.code === "ECONNABORTED") {
        setError("Timeout na conexão com o backend");
      } else if (err.code === "ERR_NETWORK") {
        setError("Erro de rede - Backend não está rodando");
      } else if (err.response?.status === 404) {
        setError(
          "Endpoint não encontrado - Verifique se o FastAPI está rodando"
        );
      } else {
        setError(err.message || "Erro desconhecido");
      }
    }
  };

  useEffect(() => {
    checkConnection();

    // Verifica a conexão a cada 30 segundos
    const interval = setInterval(checkConnection, 30000);

    return () => clearInterval(interval);
  }, []);

  return {
    isConnected,
    healthData,
    error,
    checkConnection,
  };
}
