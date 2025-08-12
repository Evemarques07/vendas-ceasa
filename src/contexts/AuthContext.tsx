import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { authService } from "@/services/api";
import type { Usuario } from "@/types";

interface AuthContextData {
  user: Usuario | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: Usuario) => void;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!token && !!user;

  // Carrega dados salvos no localStorage ao inicializar
  useEffect(() => {
    const savedToken = localStorage.getItem("authToken");
    const savedUser = localStorage.getItem("currentUser");

    if (savedToken && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser) as Usuario;
        setToken(savedToken);
        setUser(parsedUser);
      } catch (error) {
        console.error("Erro ao carregar dados salvos:", error);
        localStorage.removeItem("authToken");
        localStorage.removeItem("currentUser");
      }
    }

    setIsLoading(false);
  }, []);

  // Valida o token periodicamente
  useEffect(() => {
    if (!token) return;

    const validateToken = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
        localStorage.setItem("currentUser", JSON.stringify(currentUser));
      } catch (error) {
        console.error("Token inválido:", error);
        await logout();
      }
    };

    // Valida o token a cada 5 minutos
    const interval = setInterval(validateToken, 5 * 60 * 1000);

    // Valida imediatamente se não temos dados do usuário
    if (!user) {
      validateToken();
    }

    return () => clearInterval(interval);
  }, [token, user]);

  const login = async (email: string, senha: string): Promise<void> => {
    setIsLoading(true);

    try {
      const { user: loggedUser, token: authToken } = await authService.login(
        email,
        senha
      );

      setUser(loggedUser);
      setToken(authToken);

      localStorage.setItem("authToken", authToken);
      localStorage.setItem("currentUser", JSON.stringify(loggedUser));
    } catch (error) {
      console.error("Erro no login:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);

    try {
      await authService.logout();
    } catch (error) {
      console.error("Erro no logout:", error);
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem("authToken");
      localStorage.removeItem("currentUser");
      setIsLoading(false);
    }
  };

  const updateUser = (updatedUser: Usuario): void => {
    setUser(updatedUser);
    localStorage.setItem("currentUser", JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextData {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }

  return context;
}
