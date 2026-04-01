from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/gemini", tags=["Gemini AI"])

class GenerateImageRequest(BaseModel):
    prompt: str

@router.post("/generate-image")
async def generate_image(request: GenerateImageRequest):
    """Mock endpoint for generating creative images"""
    # Return a dummy image URL for the landing page
    return {"image_url": "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80"}

@router.get("/legal-template")
async def get_legal_template():
    """Mock endpoint for legal template generation"""
    return {"template": "Mocked legal template content here."}
