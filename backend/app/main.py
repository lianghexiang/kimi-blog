from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from app.auth.router import router as auth_router
from app.auth.oauth import oauth_callback
from app.routers.posts import router as posts_router
from app.routers.images import router as images_router
from app.routers.tags import router as tags_router
from app.routers.contacts import router as contacts_router
from app.schemas import PingResponse

app = FastAPI()

# CORS for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/ping", response_model=PingResponse)
async def ping():
    import time
    return {"ok": True, "ts": int(time.time() * 1000)}


@app.get("/api/oauth/callback")
async def oauth_callback_handler(request: Request):
    return await oauth_callback(request)


app.include_router(auth_router, prefix="/api")
app.include_router(posts_router, prefix="/api")
app.include_router(images_router, prefix="/api")
app.include_router(tags_router, prefix="/api")
app.include_router(contacts_router, prefix="/api")


@app.exception_handler(404)
async def not_found_handler(request: Request, exc):
    if request.url.path.startswith("/api/"):
        return JSONResponse(status_code=404, content={"error": "Not Found"})
    # Let SPA fallback handle non-API routes
    return JSONResponse(status_code=404, content={"error": "Not Found"})


# SPA fallback — mount static files and catch-all
import os

STATIC_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "app", "dist", "public")

if os.path.isdir(STATIC_DIR):
    from fastapi.staticfiles import StaticFiles
    app.mount("/", StaticFiles(directory=STATIC_DIR), name="static")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        if full_path.startswith("api/"):
            return JSONResponse(status_code=404, content={"error": "Not Found"})
        index_path = os.path.join(STATIC_DIR, "index.html")
        if os.path.exists(index_path):
            return FileResponse(index_path)
        return JSONResponse(status_code=404, content={"error": "Not Found"})
