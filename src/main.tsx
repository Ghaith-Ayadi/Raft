import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AppPage } from "@/pages/app-page";
import { AuthProvider } from "@/providers/auth-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import { ToastProvider } from "@/providers/toast-provider";
import "@/styles/globals.css";

// Service worker: installable PWA and an app shell that opens offline.
if ("serviceWorker" in navigator && import.meta.env.PROD) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("/sw.js").catch(() => {
            // Registration failed; the app works without it.
        });
    });
}

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <ThemeProvider>
            <AuthProvider>
                <ToastProvider>
                    <AppPage />
                </ToastProvider>
            </AuthProvider>
        </ThemeProvider>
    </StrictMode>,
);
