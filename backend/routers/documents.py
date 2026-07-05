from fastapi import APIRouter, Depends, Request, HTTPException

from services.auth import get_current_user
from services.vector_store import list_documents, delete_by_filename, get_chroma_client
from services.insights import remove_document

router = APIRouter()


@router.get("/documents")
async def get_documents(
    request: Request,
    current_user=Depends(get_current_user),
):
    chroma_client = get_chroma_client(request)
    user_id = current_user["id"]
    docs = list_documents(chroma_client, user_id)
    return {"documents": docs}


@router.delete("/documents/{filename:path}")
async def delete_document(
    filename: str,
    request: Request,
    current_user=Depends(get_current_user),
):
    chroma_client = get_chroma_client(request)
    user_id = current_user["id"]
    deleted_count = delete_by_filename(chroma_client, user_id, filename)
    if deleted_count == 0:
        raise HTTPException(status_code=404, detail="Document not found")
    remove_document(user_id, filename)
    return {"message": f"Deleted {deleted_count} chunks for '{filename}'"}
