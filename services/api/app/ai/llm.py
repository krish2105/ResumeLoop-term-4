"""Local Ollama client. Never raises into routes: callers get `None` and fall back."""
import json
import os
import time

import httpx

OLLAMA_URL = os.environ.get('OLLAMA_URL', 'http://127.0.0.1:11434')
GEN_MODEL = os.environ.get('RL_GEN_MODEL', 'qwen2.5:7b')
EMBED_MODEL = os.environ.get('RL_EMBED_MODEL', 'bge-m3:567m')


class OllamaLLM:
    def __init__(self, url: str = OLLAMA_URL, gen_model: str = GEN_MODEL, embed_model: str = EMBED_MODEL):
        self.url, self.gen_model, self.embed_model = url, gen_model, embed_model
        self._status: tuple[float, dict] | None = None

    def status(self) -> dict:
        if self._status and time.monotonic() - self._status[0] < 20:
            return self._status[1]
        try:
            tags = httpx.get(self.url + '/api/tags', timeout=2).json()
            names = {m['name'] for m in tags.get('models', [])}
            result = {'available': self.gen_model in names, 'embeddings': self.embed_model in names,
                      'gen_model': self.gen_model, 'embed_model': self.embed_model, 'runtime': 'ollama (local)'}
        except (httpx.HTTPError, ValueError):
            result = {'available': False, 'embeddings': False, 'gen_model': self.gen_model,
                      'embed_model': self.embed_model, 'runtime': 'ollama (local)'}
        self._status = (time.monotonic(), result)
        return result

    def chat_json(self, system: str, user: str, timeout: float = 90) -> dict | None:
        if not self.status()['available']:
            return None
        try:
            r = httpx.post(self.url + '/api/chat', timeout=timeout, json={
                'model': self.gen_model, 'stream': False, 'format': 'json',
                'options': {'temperature': 0.1, 'num_ctx': 8192},
                'messages': [{'role': 'system', 'content': system}, {'role': 'user', 'content': user}]})
            r.raise_for_status()
            return json.loads(r.json()['message']['content'])
        except (httpx.HTTPError, ValueError, KeyError, TypeError):
            return None

    def embed(self, texts: list[str]) -> list[list[float]] | None:
        if not texts or not self.status()['embeddings']:
            return None
        try:
            r = httpx.post(self.url + '/api/embed', timeout=60, json={'model': self.embed_model, 'input': texts})
            r.raise_for_status()
            return r.json()['embeddings']
        except (httpx.HTTPError, ValueError, KeyError):
            return None


_llm: OllamaLLM | None = None


def get_llm():
    global _llm
    if _llm is None:
        _llm = OllamaLLM()
    return _llm


def set_llm(llm) -> None:
    """Tests inject a fake; production uses Ollama."""
    global _llm
    _llm = llm
