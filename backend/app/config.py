"""Carrega a configuração única do projeto a partir de ``/.env``."""
import os
from pathlib import Path

from dotenv import load_dotenv


ROOT_DIR = Path(__file__).resolve().parents[2]
ENV_FILE = ROOT_DIR / ".env"


def carregar_configuracao():
    """Lê o .env da raiz e resolve o caminho da credencial do Firebase."""
    load_dotenv(ENV_FILE)
    credential = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    if credential and not Path(credential).is_absolute():
        os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = str(
            (ROOT_DIR / credential).resolve()
        )

