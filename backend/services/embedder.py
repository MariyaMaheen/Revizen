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

def embed_texts(embedder, texts: List[str], batch_size: int = 32) -> List[List[float]]:
    model = get_model()
    results = []
    for i in range(0, len(texts), batch_size):
        batch = texts[i:i + batch_size]
        embeddings = list(model.embed(batch))
        results.extend([e.tolist() for e in embeddings])
    return results

def embed_query(embedder, text: str) -> List[float]:
    model = get_model()
    embeddings = list(model.embed([text]))
    return embeddings[0].tolist()
