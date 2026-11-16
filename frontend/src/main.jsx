import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import NotFound from "./pages/NotFound.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import FeedPage from "./pages/FeedPage.jsx";
import ServiceFormPage from "./pages/ServiceFormPage.jsx";
import ServiceDetailPage from "./pages/ServiceDetailPage.jsx";
import MyServicesPage from "./pages/MyServicesPage.jsx";
import InterestsPage from "./pages/InterestsPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import { AuthProvider } from "./contexts/AuthContext.jsx";
import "./styles.css";

// Este MVP não usa uma biblioteca de roteamento. A página é escolhida a partir
// do caminho atual e cada navegação tradicional carrega o React novamente.
const pathname = window.location.pathname.replace(/\/+$/, "") || "/";

// Rotas estáticas: o caminho corresponde diretamente a um componente.
const routes = {
  "/": <App />,
  "/login": <AuthPage />,
  "/cadastro": <AuthPage initialMode="signup" />,
  "/esqueci-minha-senha": <ForgotPassword />,
  "/home": <FeedPage />,
  "/servicos/novo": <ServiceFormPage />,
  "/meus-servicos": <MyServicesPage />,
  "/meus-interesses": <InterestsPage />,
  "/perfil": <ProfilePage />,
};

let page = routes[pathname];
const parts = pathname.split("/").filter(Boolean);

// Rotas dinâmicas precisam extrair o ID da URL. Exemplo:
// /servicos/abc123 -> <ServiceDetailPage id="abc123" />.
if (!page && parts.length === 2) {
  if (parts[0] === "servicos") page = <ServiceDetailPage id={parts[1]} />;
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {/* O provider deixa sessão, carregamento e erro disponíveis em toda a árvore. */}
    <AuthProvider>{page || <NotFound />}</AuthProvider>
  </React.StrictMode>,
);
