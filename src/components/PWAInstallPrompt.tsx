import { useState, useEffect } from "react";
import { X, Download, Smartphone } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Verificar se já está instalado
    const isStandalone = window.matchMedia(
      "(display-mode: standalone)"
    ).matches;
    const isInApp = (window.navigator as any).standalone;
    setIsInstalled(isStandalone || isInApp);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const prompt = e as BeforeInstallPromptEvent;
      setDeferredPrompt(prompt);

      // Mostrar prompt após 3 segundos (menos intrusivo)
      setTimeout(() => {
        if (!isInstalled) {
          setShowPrompt(true);
        }
      }, 3000);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);

      // Mostrar feedback de sucesso
      console.log("📱 Sistema Vendas instalado com sucesso!");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [isInstalled]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === "accepted") {
        console.log("📱 Usuário aceitou a instalação");
      } else {
        console.log("❌ Usuário recusou a instalação");
      }

      setDeferredPrompt(null);
      setShowPrompt(false);
    } catch (error) {
      console.error("Erro ao instalar PWA:", error);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Mostrar novamente após 1 hora
    setTimeout(() => {
      if (deferredPrompt && !isInstalled) {
        setShowPrompt(true);
      }
    }, 60 * 60 * 1000);
  };

  if (!showPrompt || !deferredPrompt || isInstalled) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 w-80 max-w-[calc(100vw-2rem)]">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
        <div className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">
                  Instalar Sistema Vendas
                </h3>
                <p className="text-xs text-gray-600">
                  Acesso rápido na tela inicial
                </p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleInstall}
              className="flex-1 bg-green-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Instalar
            </button>
            <button
              onClick={handleDismiss}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Depois
            </button>
          </div>
        </div>

        <div className="bg-green-50 px-4 py-2 border-t border-green-100">
          <div className="flex items-center gap-2 text-xs text-green-700">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>
              Funciona offline • Notificações • Atualizações automáticas
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
