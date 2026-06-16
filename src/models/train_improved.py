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
            stop_words=None,
            max_features=15000,
            ngram_range=(1, 3),
            min_df=2,
            max_df=0.95,
            sublinear_tf=True
        )),
        ("scam_features", ScamKeywordTransformer())
    ])

    logistic_model = ImbPipeline([
        ("features", feature_builder),
        ("smote", SMOTE(random_state=42, k_neighbors=3)),
        ("model", LogisticRegression(
            max_iter=2000,
            class_weight=None,
            C=0.5,
            penalty="l2",
            solver="liblinear",
            random_state=42
        ))
    ])

    print("Training model...")
    logistic_model.fit(X_train, y_train)

    SCAM_THRESHOLD = 0.65
    
    print("Saving model...")
    joblib.dump(logistic_model, "models/saved/fake_job_nlp_model_improved.pkl")
    joblib.dump(SCAM_THRESHOLD, "models/saved/fake_job_threshold.pkl")

    print("Training complete and models saved to models/saved/")

if __name__ == "__main__":
    main()
