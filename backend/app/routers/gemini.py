from typing import Union

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.config import settings

# Import Gemini client
genai_client = None
if settings.gemini_api_key:
    try:
        import google.genai as genai_module
        genai_client = genai_module.Client(api_key=settings.gemini_api_key)
    except ImportError:
        print("Warning: google-genai not installed, AI analysis disabled")

router = APIRouter(prefix="/gemini", tags=["Gemini AI"])

class GenerateImageRequest(BaseModel):
    prompt: str

class ExplainArticleRequest(BaseModel):
    article_num: Union[str, int]
    article_text: str
    chapter_title: str
    is_bis: bool = False

@router.post("/generate-image")
async def generate_image(request: GenerateImageRequest):
    """Mock endpoint for generating creative images"""
    # Return a dummy image URL for the landing page
    return {"image_url": "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80"}

@router.post("/explain-article")
async def explain_legal_article(request: ExplainArticleRequest):
    """Explain a legal article using Gemini AI"""
    bis_text = " (مكرر)" if request.is_bis else ""
    article_num_text = str(request.article_num)

    prompt = f"""اشرح الفصل {article_num_text}{bis_text} من المجلة الجزائية التونسية - {request.chapter_title} - الذي ينص على: \"{request.article_text}\".

        قدم شرحاً قانونياً شاملاً يتضمن:
        1. شرح مفصل للنص القانوني
        2. العناصر المكونة للجريمة
        3. العقوبة المقررة والظروف المشددة أو المخففة
        4. مثال عملي واقعي
        5. أي فقه قضاء تونسي ذو صلة
        6. العلاقة مع الفصول الأخرى إن وجدت

        استخدم لغة قانونية واضحة ومبسطة في نفس الوقت."""

    if not genai_client:
        return {
            "explanation": (
                f"لا يمكن استخدام خدمة الذكاء الاصطناعي حالياً لشرح الفصل {article_num_text}{bis_text}. "
                "يرجى تكوين مفتاح Gemini API في ملف .env أو صفحة إعدادات الإدارة، ثم إعادة المحاولة."
            )
        }

    try:
        response = genai_client.models.generate_content(
            model='gemini-2.0-flash',
            contents=prompt
        )

        return {"explanation": response.text or "لم يتمكن المساعد من الشرح."}

    except Exception as e:
        print(f"Gemini API error: {str(e)}")
        return {
            "explanation": (
                f"حدث خطأ أثناء التواصل مع خدمة Gemini AI لشرح الفصل {article_num_text}{bis_text}. "
                "يرجى المحاولة مرة أخرى لاحقاً."
            )
        }

@router.get("/legal-template")
async def get_legal_template():
    """Mock endpoint for legal template generation"""
    return {"template": "Mocked legal template content here."}
