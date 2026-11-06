import { useEffect, useState } from "react";
import { api } from "../services/api.js";

// Uma consulta simples, com estados de carregamento e erro e botão de tentar novamente.
export default function useApi(path, authenticated = false) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);
  useEffect(() => {
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
  return { data, error, loading, reload: () => setVersion((v) => v + 1) };
}
