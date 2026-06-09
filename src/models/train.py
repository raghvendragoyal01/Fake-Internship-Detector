import pandas as pd
import numpy as np
import joblib
import random
from scipy.sparse import csr_matrix, hstack
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, average_precision_score
from xgboost import XGBClassifier

from src.preprocessing import JobScamPreprocessor

# Set random seeds for reproducibility
SEED = 42
random.seed(SEED)
np.random.seed(SEED)

def main():
    print("Loading raw data...")
    df = pd.read_csv("Final_dataset.csv")

    print("Preprocessing data...")
    # Re-build combined_text just to be safe and consistent
    df["combined_text"] = (
        df["job_title"].fillna("") + " " +
        df["company_name"].fillna("") + " " +
        df["job_description"].fillna("")
    )
    
    # Clean text using the unified logic
    df["combined_text"] = df["combined_text"].apply(JobScamPreprocessor.clean_text)
    
    # Drop duplicates and short texts exactly as in original 02_data_cleaning
    df.drop_duplicates(subset=["combined_text"], inplace=True)
    df = df[df["combined_text"].str.len() > 30]
    df.reset_index(drop=True, inplace=True)
    
    print("Extracting handcrafted features...")
    # Apply feature extraction uniformly
    features_list = df.apply(
        lambda row: JobScamPreprocessor.extract_features(row["combined_text"], row.get("salary", "")),
        axis=1
    )
    
    features_df = pd.DataFrame(
        features_list.tolist(), 
        columns=JobScamPreprocessor.get_feature_names()
    )
    
    X_manual = csr_matrix(features_df.values)
    y = df["label"].values

    print("Splitting dataset into Train/Val/Test...")
    # 70/15/15 split
    train_idx, temp_idx = train_test_split(
        np.arange(len(df)), test_size=0.3, random_state=SEED, stratify=y
    )
    val_idx, test_idx = train_test_split(
        temp_idx, test_size=0.5, random_state=SEED, stratify=y[temp_idx]
    )

    df_train, df_val, df_test = df.iloc[train_idx], df.iloc[val_idx], df.iloc[test_idx]
    X_manual_train, X_manual_val, X_manual_test = X_manual[train_idx], X_manual[val_idx], X_manual[test_idx]
    y_train, y_val, y_test = y[train_idx], y[val_idx], y[test_idx]
    
    print("Fitting TF-IDF on Training data only...")
    tfidf = TfidfVectorizer(
        max_features=5000,
        stop_words="english",
        ngram_range=(1,2),
        min_df=2,
        max_df=0.95,
        sublinear_tf=True
    )
    
    X_text_train = tfidf.fit_transform(df_train["combined_text"])
    X_text_val = tfidf.transform(df_val["combined_text"])
    X_text_test = tfidf.transform(df_test["combined_text"])
    
    X_train = hstack([X_text_train, X_manual_train])
    X_val = hstack([X_text_val, X_manual_val])
    X_test = hstack([X_text_test, X_manual_test])
    
    scale_pos_weight = (y_train == 0).sum() / (y_train == 1).sum()
    print(f"Scale Pos Weight: {scale_pos_weight:.2f}")

    print("Training XGBoost with regularization and early stopping...")
    model = XGBClassifier(
        n_estimators=1000,
        learning_rate=0.05,
        max_depth=4,  # Reduced to prevent overfitting
        min_child_weight=5,  # Increased to prevent overfitting
        subsample=0.8,
        colsample_bytree=0.8,
        gamma=0.2,
        reg_lambda=1.5, # L2 regularization
        scale_pos_weight=scale_pos_weight,
        eval_metric="logloss",
        early_stopping_rounds=50,
        random_state=SEED,
        n_jobs=-1
    )
    
    model.fit(
        X_train, y_train,
        eval_set=[(X_val, y_val)],
        verbose=50
    )
    
    print("\nEvaluating on held-out TEST set...")
    pred = model.predict(X_test)
    prob = model.predict_proba(X_test)[:, 1]
    
    print(classification_report(y_test, pred))
    print("Confusion Matrix:\n", confusion_matrix(y_test, pred))
    print("ROC AUC:", roc_auc_score(y_test, prob))
    print("PR AUC:", average_precision_score(y_test, prob))
    print("F1 Score:", f1_score(y_test, pred))
    
    print("\nSaving artifacts...")
    joblib.dump(model, "best_model.pkl")
    joblib.dump(tfidf, "tfidf_vectorizer.pkl")
    print("Done!")

if __name__ == "__main__":
    main()
