import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import type { TipoUsuario } from "@/types";

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: TipoUsuario[];
  redirectTo?: string;
}

export function RoleGuard({
  children,
  allowedRoles,
  redirectTo = "/dashboard",
}: RoleGuardProps) {
  const { user, isAuthenticated } = useAuth();

  // Se não estiver autenticado, redireciona para login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Se o tipo de usuário não for permitido, redireciona
  if (!user?.tipo || !allowedRoles.includes(user.tipo)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}
