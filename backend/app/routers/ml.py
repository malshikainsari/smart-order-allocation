from fastapi import APIRouter, HTTPException
from app.schemas.schemas import ClassifyRequest, ClassifyResponse
import joblib
import os

router = APIRouter(prefix="/ml", tags=["ML"])

MODEL_PATH = os.path.join(os.path.dirname(__file__), "../../ml/model.pkl")
VECTORIZER_PATH = os.path.join(os.path.dirname(__file__), "../../ml/vectorizer.pkl")

model = None
vectorizer = None


def load_model():
    global model, vectorizer
    try:
        model = joblib.load(MODEL_PATH)
        vectorizer = joblib.load(VECTORIZER_PATH)
        print("✅ ML model loaded successfully")
    except Exception as e:
        print(f"⚠️ ML model not found: {e}")


load_model()


@router.post("/classify", response_model=ClassifyResponse)
def classify_message(payload: ClassifyRequest):
    if model is None or vectorizer is None:
        raise HTTPException(
            status_code=503,
            detail="ML model not available. Please train the model first."
        )

    if not payload.message.strip():
        raise HTTPException(
            status_code=400,
            detail="Message cannot be empty"
        )

    # Transform input
    X = vectorizer.transform([payload.message])

    # Get prediction and confidence
    prediction = model.predict(X)[0]
    probabilities = model.predict_proba(X)[0]
    confidence = round(float(max(probabilities)) * 100, 2)

    CONFIDENCE_THRESHOLD = 60.0
    is_confident = confidence >= CONFIDENCE_THRESHOLD

    if not is_confident:
        prediction = "Unclassified (Low Confidence)"

    return ClassifyResponse(
        category=prediction,
        confidence=confidence,
        is_confident=is_confident,
    )