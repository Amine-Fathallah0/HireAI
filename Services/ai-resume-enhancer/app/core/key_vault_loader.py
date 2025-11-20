import os
import structlog
logger = structlog.get_logger()

def load_secrets_from_env_or_keyvault():
    """Return a dict of secrets. If `USE_AZURE_KEY_VAULT` is truthy, attempt to load from Key Vault.

    This function is intentionally defensive: if azure packages are not installed or
    credentials are missing, it falls back to environment variables.
    """
    use_kv = os.environ.get("USE_AZURE_KEY_VAULT", "false").lower() in ("1","true","yes")
    if not use_kv:
        return {k.lower(): os.environ.get(k) for k in ("CREWAI_API_KEY", "CREWAI_API_URL", "DATABASE_URL", "PINECONE_API_KEY", "PINECONE_ENV")}

    try:
        from azure.identity import DefaultAzureCredential
        from azure.keyvault.secrets import SecretClient
    except Exception as e:
        logger.error("keyvault.missing_packages", error=str(e))
        return {k.lower(): os.environ.get(k) for k in ("CREWAI_API_KEY", "CREWAI_API_URL", "DATABASE_URL", "PINECONE_API_KEY", "PINECONE_ENV")}

    vault_url = os.environ.get("AZURE_KEY_VAULT_URL")
    if not vault_url:
        logger.error("keyvault.missing_url")
        return {k.lower(): os.environ.get(k) for k in ("CREWAI_API_KEY", "CREWAI_API_URL", "DATABASE_URL", "PINECONE_API_KEY", "PINECONE_ENV")}

    try:
        cred = DefaultAzureCredential()
        client = SecretClient(vault_url=vault_url, credential=cred)
        secrets = {}
        for name in ("CREWAI_API_KEY", "CREWAI_API_URL", "DATABASE_URL", "PINECONE_API_KEY", "PINECONE_ENV"):
            try:
                s = client.get_secret(name)
                secrets[name.lower()] = s.value
            except Exception:
                secrets[name.lower()] = os.environ.get(name)
        return secrets
    except Exception as e:
        logger.error("keyvault.load_failed", error=str(e))
        return {k.lower(): os.environ.get(k) for k in ("CREWAI_API_KEY", "CREWAI_API_URL", "DATABASE_URL", "PINECONE_API_KEY", "PINECONE_ENV")}
