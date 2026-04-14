"""
Faculty routes - provides API endpoints for fetching faculties and institutions
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models import Faculty
from app.utils.email_localization import get_user_lang
from fastapi import Request

router = APIRouter(prefix="/api/faculties", tags=["faculties"])


@router.get("/", name="list_faculties")
async def list_faculties(
    search: str = Query(None, min_length=1),
    faculty_type: str = Query(None),  # faculte, institut, ecole
    public: bool = Query(None),  # true for public, false for private
    city: str = Query(None),
    sort_by: str = Query("public_name", pattern="^(public_name|name|city|type)$"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    request: Request = None,
    db: AsyncSession = Depends(get_db),
):
    """
    List all faculties with optional filtering and search
    
    Query parameters:
    - search: Search by faculty name, university, specialities
    - faculty_type: Filter by type (faculte, institut, ecole)
    - public: Filter by access (true=public, false=private)
    - city: Filter by city
    - sort_by: Sort field (public_name, name, city, type)
    - limit: Max results per page (default 100, max 500)
    - offset: Pagination offset
    """
    try:
        query = select(Faculty)
        
        # Add search filter
        if search:
            search_term = f"%{search}%"
            query = query.where(
                (Faculty.name_ar.ilike(search_term)) |
                (Faculty.name_fr.ilike(search_term)) |
                (Faculty.university.ilike(search_term)) |
                (Faculty.city.ilike(search_term))
            )
        
        # Add type filter
        if faculty_type:
            query = query.where(Faculty.type == faculty_type)
        
        # Add public/private filter
        if public is not None:
            query = query.where(Faculty.public == public)
        
        # Add city filter
        if city:
            query = query.where(Faculty.city == city)
        
        # Add sorting - public first, then by name
        if sort_by == "public_name":
            query = query.order_by(Faculty.public.desc(), Faculty.name_ar)
        elif sort_by == "name":
            query = query.order_by(Faculty.name_ar)
        elif sort_by == "city":
            query = query.order_by(Faculty.city, Faculty.name_ar)
        elif sort_by == "type":
            query = query.order_by(Faculty.type, Faculty.name_ar)
        
        # Get total count
        count_query = select(Faculty)
        if search:
            search_term = f"%{search}%"
            count_query = count_query.where(
                (Faculty.name_ar.ilike(search_term)) |
                (Faculty.name_fr.ilike(search_term)) |
                (Faculty.university.ilike(search_term)) |
                (Faculty.city.ilike(search_term))
            )
        if faculty_type:
            count_query = count_query.where(Faculty.type == faculty_type)
        if public is not None:
            count_query = count_query.where(Faculty.public == public)
        if city:
            count_query = count_query.where(Faculty.city == city)
        
        total = await db.scalar(select(func.count(Faculty.id)).select_from(count_query.alias()))
        
        # Apply pagination
        query = query.limit(limit).offset(offset)
        
        # Detect language
        lang = get_user_lang(request)
        
        return {
            "status": "success",
            "data": [
                {
                    "id": f.id,
                    "name": f.name_fr if lang == "fr" else f.name_ar,
                    "name_ar": f.name_ar,
                    "name_fr": f.name_fr,
                    "slug": f.slug,
                    "type": f.type,
                    "domain": f.domain,
                    "specialities": f.specialities,
                    "university": f.university,
                    "city": f.city,
                    "country": f.country,
                    "public": f.public,
                    "level": f.level,
                    "description": f.description,
                    "website_url": f.website_url,
                    "phone": f.phone,
                    "email": f.email,
                }
                for f in faculties
            ],
            "total": total,
            "limit": limit,
            "offset": offset,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch faculties: {str(e)}")


@router.get("/{faculty_id}", name="get_faculty")
async def get_faculty(
    faculty_id: int,
    request: Request = None,
    db: AsyncSession = Depends(get_db),
):
    """Get a single faculty by ID"""
    try:
        result = await db.execute(select(Faculty).where(Faculty.id == faculty_id))
        faculty = result.scalar_one_or_none()
        
        if not faculty:
            raise HTTPException(status_code=404, detail="Faculty not found")
        
        # Detect language
        lang = get_user_lang(request)
        
        return {
            "status": "success",
            "data": {
                "id": faculty.id,
                "name": faculty.name_fr if lang == "fr" else faculty.name_ar,
                "name_ar": faculty.name_ar,
                "name_fr": faculty.name_fr,
                "slug": faculty.slug,
                "type": faculty.type,
                "domain": faculty.domain,
                "specialities": faculty.specialities,
                "university": faculty.university,
                "city": faculty.city,
                "country": faculty.country,
                "public": faculty.public,
                "level": faculty.level,
                "description": faculty.description,
                "website_url": faculty.website_url,
                "phone": faculty.phone,
                "email": faculty.email,
            },
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching faculty: {str(e)}")


@router.get("/search/by-slug/{slug}", name="get_faculty_by_slug")
async def get_faculty_by_slug(
    slug: str,
    request: Request = None,
    db: AsyncSession = Depends(get_db),
):
    """Get a faculty by its slug"""
    try:
        result = await db.execute(select(Faculty).where(Faculty.slug == slug))
        faculty = result.scalar_one_or_none()
        
        if not faculty:
            raise HTTPException(status_code=404, detail="Faculty not found")
        
        # Detect language
        lang = get_user_lang(request)
        
        return {
            "status": "success",
            "data": {
                "id": faculty.id,
                "name": faculty.name_fr if lang == "fr" else faculty.name_ar,
                "name_ar": faculty.name_ar,
                "name_fr": faculty.name_fr,
                "slug": faculty.slug,
                "type": faculty.type,
                "domain": faculty.domain,
                "specialities": faculty.specialities,
                "university": faculty.university,
                "city": faculty.city,
                "country": faculty.country,
                "public": faculty.public,
                "level": faculty.level,
                "description": faculty.description,
                "website_url": faculty.website_url,
                "phone": faculty.phone,
                "email": faculty.email,
            },
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching faculty: {str(e)}")


@router.get("/filter/by-type/{faculty_type}", name="list_by_type")
async def list_by_type(
    faculty_type: str,
    public: bool = Query(None),
    request: Request = None,
    db: AsyncSession = Depends(get_db),
):
    """Get faculties filtered by type (faculte, institut, ecole)"""
    try:
        query = select(Faculty).where(Faculty.type == faculty_type)
        
        if public is not None:
            query = query.where(Faculty.public == public)
        
        query = query.order_by(Faculty.public.desc(), Faculty.name)
        
        # Detect language
        lang = get_user_lang(request)
        
        return {
            "status": "success",
            "data": [
                {
                    "id": f.id,
                    "name": f.name_fr if lang == "fr" else f.name_ar,
                    "name_ar": f.name_ar,
                    "name_fr": f.name_fr,
                    "slug": f.slug,
                    "type": f.type,
                    "specialities": f.specialities,
                    "university": f.university,
                    "city": f.city,
                    "public": f.public,
                }
                for f in faculties
            ],
            "total": len(faculties),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching faculties: {str(e)}")


@router.get("/stats/overview", name="faculties_overview")
async def faculties_overview(db: AsyncSession = Depends(get_db)):
    """Get overview statistics about faculties"""
    try:
        total = await db.scalar(select(func.count(Faculty.id)))
        public = await db.scalar(select(func.count(Faculty.id)).where(Faculty.public == True))
        private = await db.scalar(select(func.count(Faculty.id)).where(Faculty.public == False))
        
        result = await db.execute(select(Faculty.city).distinct())
        cities = [row[0] for row in result.fetchall()]
        
        result = await db.execute(select(Faculty.type).distinct())
        types = [row[0] for row in result.fetchall()]
        
        return {
            "status": "success",
            "data": {
                "total_faculties": total,
                "public": public,
                "private": private,
                "cities": cities,
                "types": types,
            },
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching stats: {str(e)}")
