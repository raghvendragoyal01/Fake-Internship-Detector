import pandas as pd
import numpy as np
import joblib
from scipy.sparse import csr_matrix, hstack
from src.preprocessing import JobScamPreprocessor

def load_models():
    print("Loading models...")
    model = joblib.load("best_model.pkl")
    tfidf = joblib.load("tfidf_vectorizer.pkl")
    return model, tfidf

def predict_external(file_path: str, is_excel: bool = True):
    print(f"Loading external dataset: {file_path}")
    if is_excel:
        df = pd.read_excel(file_path)
    else:
        df = pd.read_csv(file_path)
        
    print("Preprocessing data...")
    # Generate combined text
    df["combined_text"] = (
        df["job_title"].fillna("") + " " +
        df["company_name"].fillna("") + " " +
        df["job_description"].fillna("")
    )
    
    # 1. Clean the text FIRST (Critical fix!)
    df["combined_text"] = df["combined_text"].apply(JobScamPreprocessor.clean_text)
    
    print("Extracting features...")
    # 2. Extract features correctly matching the training logic
    features_list = df.apply(
        lambda row: JobScamPreprocessor.extract_features(row["combined_text"], row.get("salary", "")),
        axis=1
    )
    features_df = pd.DataFrame(
        features_list.tolist(), 
        columns=JobScamPreprocessor.get_feature_names()
    )
    X_manual = csr_matrix(features_df.values)
    
    # 3. TF-IDF Transformation
    model, tfidf = load_models()
    X_text = tfidf.transform(df["combined_text"])
    
    # Concatenate features
    X = hstack([X_text, X_manual])
    
    print("Running predictions...")
    preds = model.predict(X)
    probs = model.predict_proba(X)[:, 1]
    
    df["predicted_fraud"] = preds
    df["fraud_probability"] = probs
    
    print("Predictions complete. Distribution of predictions:")
    print(df["predicted_fraud"].value_counts())
    
    output_path = "external_predictions.csv"
    df.to_csv(output_path, index=False)
    print(f"Saved results to {output_path}")

def predict_single(job_title: str, company_name: str, job_description: str, salary: str = ""):
    """Predict on a single sample for the API"""
    combined_raw = str(job_title) + " " + str(company_name) + " " + str(job_description)
    
    cleaned_text = JobScamPreprocessor.clean_text(combined_raw)
    
    features = JobScamPreprocessor.extract_features(cleaned_text, salary)
    X_manual = csr_matrix([features])
    
    model, tfidf = load_models()
    X_text = tfidf.transform([cleaned_text])
    
    X = hstack([X_text, X_manual])
    prob = model.predict_proba(X)[0, 1]
    
    print(f"Fraud Probability: {prob:.4f}")
    return prob

if __name__ == "__main__":
    predict_external("external_test.xlsx", is_excel=True)
