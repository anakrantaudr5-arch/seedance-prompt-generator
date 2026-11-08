from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(title="Seedance Prompt Generator API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PromptRequest(BaseModel):
    project: str = "Untitled video"
    style: str = "Cinematic realism"
    aspect_ratio: str = "16:9"
    scenes: list[dict] = Field(default_factory=list)
    characters: list[dict] = Field(default_factory=list)
    negative_prompt: str = ""

@app.get("/health")
def health():
    return {"status": "ok", "service": "seedance-prompt-generator"}

@app.post("/api/prompt/validate")
def validate_prompt(payload: PromptRequest):
    # V1 API validates structured prompt data; frontend currently builds prompt locally.
    warnings = []
    if not payload.scenes:
        warnings.append("Tambahkan minimal satu scene.")
    if not payload.characters:
        warnings.append("Tambahkan karakter atau pastikan video memang tanpa karakter.")
    return {
        "valid": len(warnings) == 0,
        "warnings": warnings,
        "scene_count": len(payload.scenes),
        "character_count": len(payload.characters),
    }
