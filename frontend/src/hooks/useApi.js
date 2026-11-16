import { useEffect, useState } from "react";
import { api } from "../services/api.js";

// Hook reutilizável para consultas GET. Ele padroniza os três estados que toda
// tela precisa apresentar: carregando, dados recebidos e erro.
export default function useApi(path, authenticated = false) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);
  useEffect(() => {
    // ``active`` evita atualizar o estado de um componente que já saiu da tela
    // enquanto a resposta ainda estava viajando pela rede.
    let active = true;
    setLoading(true);
    setError("");
    setData(null);
    api(path, { protected: authenticated })
      .then((result) => {
        if (active) setData(result);
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [path, authenticated, version]);
  // Alterar version executa o efeito novamente sem recarregar a página inteira.
  return { data, error, loading, reload: () => setVersion((v) => v + 1) };
}
