import { RouterProvider } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { router } from "@/lib/router";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
      <PWAInstallPrompt />
    </AuthProvider>
  );
}

export default App;
