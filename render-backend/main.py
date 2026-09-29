from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
import io
from rembg import remove, new_session

app = FastAPI(title="Background Removal API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "background-removal-backend"}

@app.post("/remove-background")
async def remove_background(
    file: UploadFile = File(...),
    model: str = Form("u2netp")
):
    try:
        contents = await file.read()
        if not contents:
            raise HTTPException(status_code=400, detail="Empty file provided")

        session = new_session(model)
        output_image = remove(contents, session=session)

        return Response(content=output_image, media_type="image/png")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
