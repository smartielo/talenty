import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import NotFound from "./pages/NotFound.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import FeedPage from "./pages/FeedPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import ServiceFormPage from "./pages/ServiceFormPage.jsx";
import ServiceDetailPage from "./pages/ServiceDetailPage.jsx";
import MyServicesPage from "./pages/MyServicesPage.jsx";
import OrdersPage from "./pages/OrdersPage.jsx";
import OrderDetailPage from "./pages/OrderDetailPage.jsx";
import AdminPage from "./pages/AdminPage.jsx";
import { AuthProvider } from "./contexts/AuthContext.jsx";
import "./styles.css";

const pathname = window.location.pathname.replace(/\/+$/, "") || "/";
const routes = {
  "/": <App />,
  "/login": <AuthPage />,
  "/cadastro": <AuthPage initialMode="signup" />,
  "/esqueci-minha-senha": <ForgotPassword />,
  "/home": <FeedPage />,
  "/perfil": <ProfilePage />,
  "/servicos/novo": <ServiceFormPage />,
  "/meus-servicos": <MyServicesPage />,
  "/pedidos": <OrdersPage />,
  "/mensagens": <OrdersPage messages />,
  "/admin": <AdminPage />,
};

let page = routes[pathname];
const parts = pathname.split("/").filter(Boolean);
if (!page && parts.length === 2) {
  if (parts[0] === "servicos") page = <ServiceDetailPage id={parts[1]} />;
  if (parts[0] === "pedidos") page = <OrderDetailPage id={parts[1]} />;
  if (parts[0] === "prestadores") page = <ProfilePage uid={parts[1]} />;
}
if (
  !page &&
  parts.length === 3 &&
  parts[0] === "servicos" &&
  parts[2] === "editar"
)
  page = <ServiceFormPage id={parts[1]} />;

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>{page || <NotFound />}</AuthProvider>
  </React.StrictMode>,
);
