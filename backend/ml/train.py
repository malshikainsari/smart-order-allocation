import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
import joblib
import os

# Paths
BASE_DIR = os.path.dirname(__file__)
DATASET_PATH = os.path.join(BASE_DIR, "Customer_Message_Dataset.csv")
MODEL_PATH = os.path.join(BASE_DIR, "model.pkl")
VECTORIZER_PATH = os.path.join(BASE_DIR, "vectorizer.pkl")


def train():
    print("📂 Loading dataset...")
    df = pd.read_csv(DATASET_PATH)

    # Drop rows with missing values
    df = df.dropna(subset=["message", "category"])
    print(f"✅ Dataset loaded: {len(df)} rows, {df['category'].nunique()} categories")
    print(f"Categories: {df['category'].unique().tolist()}")

    X = df["message"]
    y = df["category"]

    # Train/test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # TF-IDF Vectorizer
    print("\n🔄 Vectorizing text...")
    vectorizer = TfidfVectorizer(
        max_features=5000,
        ngram_range=(1, 2),
        stop_words="english",
        lowercase=True,
    )
    X_train_vec = vectorizer.fit_transform(X_train)
    X_test_vec = vectorizer.transform(X_test)

    # Logistic Regression
    print("🤖 Training model...")
    model = LogisticRegression(
        max_iter=1000,
        C=1.0,
        solver="lbfgs",
    )
    model.fit(X_train_vec, y_train)

    # Evaluate
    y_pred = model.predict(X_test_vec)
    accuracy = accuracy_score(y_test, y_pred)
    print(f"\n✅ Accuracy: {accuracy * 100:.2f}%")
    print("\n📊 Classification Report:")
    print(classification_report(y_test, y_pred))

    # Save model and vectorizer
    joblib.dump(model, MODEL_PATH)
    joblib.dump(vectorizer, VECTORIZER_PATH)
    print(f"\n💾 Model saved to: {MODEL_PATH}")
    print(f"💾 Vectorizer saved to: {VECTORIZER_PATH}")


if __name__ == "__main__":
    train()