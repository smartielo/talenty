# Backend Talenty — base Firebase Admin

Arquitetura: React autentica no Firebase Authentication; a API FastAPI verificará o ID token e acessará o Firestore pelo Admin SDK. Não há acesso do React ao banco nem uso de MySQL.

Esta etapa entrega a inicialização do Admin SDK e exemplos transacionais; ainda não há `app/main.py` nem endpoints para iniciar com Uvicorn. Consulte o [modelo e a configuração do Firestore](../docs/firestore-modelo.md).

Para preparar o ambiente, a partir da raiz:

```powershell
python -m venv backend/.venv
backend/.venv/Scripts/python.exe -m pip install -r backend/requirements.txt
Copy-Item backend/.env.example backend/.env
```

Configure `FIREBASE_PROJECT_ID`, o banco e uma credencial administrativa externa ao repositório. O login da Firebase CLI não configura automaticamente Application Default Credentials para Python. Não envie a chave administrativa para o frontend nem a versione.

Os testes de domínio e o plano do seed usam apenas a biblioteca padrão de Python:

```powershell
python -m unittest discover -s database/tests -v
python -m database.seed
```
