from fastapi import APIRouter

from app.api.routes import auth, blog, clients, leads, projects, users

api_router = APIRouter(prefix="/api")
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(clients.router)
api_router.include_router(projects.router)
api_router.include_router(blog.router)
api_router.include_router(leads.router)
