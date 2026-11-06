import { getAuthClient } from "./auth.js";
const base = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(
  /\/$/,
  "",
);
export async function api(
  path,
  { method = "GET", body, protected: authenticated = false } = {},
) {
  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (authenticated) {
    const { auth } = await getAuthClient();
    await auth.authStateReady();
    if (!auth.currentUser)
      throw new Error("Entre na sua conta para continuar.");
    headers.Authorization = `Bearer ${await auth.currentUser.getIdToken()}`;
  }
  let response;
  try {
    response = await fetch(`${base}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(20000),
    });
  } catch {
    throw new Error(
      "Não foi possível conectar à API. Confira se o backend está rodando.",
    );
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = Array.isArray(data.detail)
      ? data.detail.map((e) => `${e.loc.at(-1)}: ${e.msg}`).join(" • ")
      : data.detail;
    throw new Error(detail || "Não foi possível concluir a operação.");
  }
  return data;
}
export const money = (cents) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    (cents || 0) / 100,
  );
export function cents(value) {
  const normalized = String(value).trim().replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(normalized))
    throw new Error("Informe um valor com até duas casas decimais.");
  return Math.round(Number(normalized) * 100);
}
