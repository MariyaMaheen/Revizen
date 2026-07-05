from typing import List

_model = None

def get_model():
    global _model
    if _model is None:
        from fastembed import TextEmbedding
        _model = TextEmbedding(model_name="BAAI/bge-small-en-v1.5")
    return _model

def get_embedder(request):
    return request.app.state.embedder

def embed_texts(embedder, texts: List[str]) -> List[List[float]]:
    model = get_model()
    embeddings = list(model.embed(texts))
    return [e.tolist() for e in embeddings]

def embed_query(embedder, text: str) -> List[float]:
    model = get_model()
    embeddings = list(model.embed([text]))
    return embeddings[0].tolist()