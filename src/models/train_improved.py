import pandas as pd
import numpy as np
import re
import joblib
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import FeatureUnion
from imblearn.over_sampling import SMOTE
from imblearn.pipeline import Pipeline as ImbPipeline
from src.data.preprocess import ScamKeywordTransformer, clean_text_v2

def main():
    print("Loading data...")
    df = pd.read_excel(r"C:\Users\Raghvendra Goyal\OneDrive\Creative Cloud Files\Desktop\Graphura Internship\ml_ready_data.xlsx")
    
    important_text_columns = [
        "title", "job_title", "Job Title",
        "salary", "Salary",
        "skills", "Skills",
        "job_description", "description", "Job Description"
    ]
    available_text_columns = [col for col in important_text_columns if col in df.columns]

    df["improved_combined_text"] = ""
    for col in available_text_columns:
        df["improved_combined_text"] = df["improved_combined_text"] + " " + df[col].fillna("").astype(str)

    df_nlp = df[["improved_combined_text", "label"]].copy()
    df_nlp = df_nlp.dropna(subset=["improved_combined_text", "label"])
    df_nlp["improved_combined_text"] = df_nlp["improved_combined_text"].astype(str)
    df_nlp["label"] = df_nlp["label"].astype(int)
    df_nlp = df_nlp.rename(columns={"improved_combined_text": "combined_text"})

    df_nlp = df_nlp.drop_duplicates(subset=['combined_text'])
    
    print("Cleaning text...")
    df_nlp['clean_text'] = df_nlp['combined_text'].apply(clean_text_v2)
    df_nlp = df_nlp[df_nlp["clean_text"] != ""]
    df_nlp = df_nlp.drop_duplicates(subset=["clean_text"])

    X = df_nlp['clean_text']
    y = df_nlp['label']

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    print("Building pipeline...")
    feature_builder = FeatureUnion([
        ("tfidf", TfidfVectorizer(
            stop_words="english",
            max_features=25000,
            ngram_range=(1, 4),
            min_df=2,
            max_df=0.85,
            sublinear_tf=True
        )),
        ("scam_features", ScamKeywordTransformer())
    ])

    logistic_model = ImbPipeline([
        ("features", feature_builder),
        ("smote", SMOTE(random_state=42, k_neighbors=3)),
        ("model", LogisticRegression(
            max_iter=2000,
            class_weight='balanced',
            C=5.0,
            penalty="l2",
            solver="liblinear",
            random_state=42
        ))
    ])

    print("Training model...")
    logistic_model.fit(X_train, y_train)

    print("Evaluating model...")
    from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, classification_report
    y_pred = logistic_model.predict(X_test)
    
    accuracy = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred)
    recall = recall_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred)
    
    print("\n" + "="*30)
    print("MODEL EVALUATION METRICS:")
    print("="*30)
    print(f"Accuracy:  {accuracy * 100:.2f}%")
    print(f"Precision: {precision * 100:.2f}%")
    print(f"Recall:    {recall * 100:.2f}%")
    print(f"F1 Score:  {f1 * 100:.2f}%")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred))
    print("="*30 + "\n")

    SCAM_THRESHOLD = 0.65
    
    print("Saving model...")
    joblib.dump(logistic_model, "models/saved/fake_job_nlp_model_improved.pkl")
    joblib.dump(SCAM_THRESHOLD, "models/saved/fake_job_threshold.pkl")

    print("Training complete and models saved to models/saved/")

if __name__ == "__main__":
    main()
