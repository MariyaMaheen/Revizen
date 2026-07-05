from typing import List, Dict, Any, Optional
from fastapi import Request


def get_chroma_client(request: Request):
    return request.app.state.chroma_client


def get_collection(client, user_id: int):
    collection_name = f"user_{user_id}"
    return client.get_or_create_collection(
        name=collection_name,
        metadata={"hnsw:space": "cosine"},
    )


def upsert_chunks(
    client,
    user_id: int,
    texts: List[str],
    embeddings: List[List[float]],
    metadatas: List[Dict[str, Any]],
    ids: List[str],
):
    collection = get_collection(client, user_id)
    collection.upsert(
        documents=texts,
        embeddings=embeddings,
        metadatas=metadatas,
        ids=ids,
    )


def query_collection(
    client,
    user_id: int,
    query_embedding: List[float],
    n_results: int = 5,
    where: Optional[Dict] = None,
) -> Dict:
    collection = get_collection(client, user_id)
    count = collection.count()
    if count == 0:
        return {"documents": [[]], "distances": [[]], "metadatas": [[]]}

    actual_n = min(n_results, count)
    kwargs = {
        "query_embeddings": [query_embedding],
        "n_results": actual_n,
        "include": ["documents", "distances", "metadatas"],
    }
    if where:
        kwargs["where"] = where
    return collection.query(**kwargs)


def delete_by_filename(client, user_id: int, filename: str):
    collection = get_collection(client, user_id)
    results = collection.get(where={"filename": filename})
    if results["ids"]:
        collection.delete(ids=results["ids"])
    return len(results["ids"])


def list_documents(client, user_id: int) -> List[Dict]:
    collection = get_collection(client, user_id)
    results = collection.get(include=["metadatas"])
    seen = {}
    for meta in results["metadatas"]:
        fname = meta.get("filename", "unknown")
        if fname not in seen:
            seen[fname] = {
                "filename": fname,
                "chunk_count": 0,
                "upload_timestamp": meta.get("upload_timestamp", ""),
            }
        seen[fname]["chunk_count"] += 1
    return list(seen.values())
