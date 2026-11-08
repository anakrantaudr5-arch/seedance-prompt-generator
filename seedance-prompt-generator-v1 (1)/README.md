# Seedance Prompt Generator

A responsive open-source prompt-building workspace for Seedance-style AI video workflows.

## Features (V1)
- Structured video prompt builder
- Multi-scene storyboard
- Character profiles and consistency notes
- Camera movement and visual direction
- Per-character dialogue, language/accent, delivery, emotion, pacing and timing
- Lip-sync direction and turn-taking notes
- Negative prompt
- Copy/export generated prompt

> This app generates text prompts. It does not call Seedance or provide video generation/API access.

## Run locally

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Backend (optional prompt API)
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\\Scripts\\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```
API docs: http://127.0.0.1:8000/docs

## License
MIT
