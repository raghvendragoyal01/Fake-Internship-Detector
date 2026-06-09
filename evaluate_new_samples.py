import json
import joblib
import pandas as pd
import numpy as np
from scipy.sparse import csr_matrix, hstack
from src.data.preprocess import JobScamPreprocessor
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix

def main():
    with open("eval_results.txt", "w", encoding="utf-8") as out:
        out.write("STEP 1 — PIPELINE VERIFICATION\n")
        try:
            model = joblib.load("models/saved/best_model.pkl")
            tfidf = joblib.load("models/saved/tfidf_vectorizer.pkl")
            out.write(f"Model Loaded: {type(model).__name__} (XGBoost)\n")
            out.write(f"Vectorizer Loaded: {type(tfidf).__name__}\n")
            out.write("Preprocessing pipeline validated.\n")
        except Exception as e:
            out.write(f"Failed to load pipeline: {e}\n")
            return

        samples = [
            {
              "title": "Machine Learning Intern",
              "company": "DeepVision AI",
              "location": "Bangalore",
              "experience": "0-1 years",
              "salary": "25000/month",
              "remote": "Hybrid",
              "description": "Looking for interns with Python, TensorFlow and Machine Learning knowledge. 4-month internship with PPO opportunity.",
              "required_skills": "Python, TensorFlow, ML",
              "application_fee": 0,
              "true_label": 0
            },
            {
              "title": "Google AI Internship",
              "company": "Google Hiring Team",
              "location": "Remote",
              "experience": "No experience",
              "salary": "250000/month",
              "remote": "Yes",
              "description": "Guaranteed selection. Earn ₹2.5 lakh monthly from home. Pay ₹999 registration fee immediately.",
              "required_skills": "None",
              "application_fee": 999,
              "true_label": 1
            },
            {
              "title": "Backend Developer Intern",
              "company": "FinEdge Technologies",
              "location": "Pune",
              "experience": "0-1 years",
              "salary": "18000/month",
              "remote": "No",
              "description": "Interns will develop REST APIs using Node.js and MongoDB.",
              "required_skills": "Node.js, MongoDB, Git",
              "application_fee": 0,
              "true_label": 0
            },
            {
              "title": "Amazon Internship",
              "company": "Amazon Careers India",
              "location": "Remote",
              "experience": "None",
              "salary": "85000/week",
              "remote": "Yes",
              "description": "Selected without interview. Deposit ₹1500 for document verification.",
              "required_skills": "None",
              "application_fee": 1500,
              "true_label": 1
            },
            {
              "title": "Frontend Developer Intern",
              "company": "PixelSoft Technologies",
              "location": "Delhi",
              "experience": "Fresher",
              "salary": "12000/month",
              "remote": "Remote",
              "description": "Seeking interns familiar with ReactJS, HTML, CSS and JavaScript.",
              "required_skills": "ReactJS, HTML, CSS, JS",
              "application_fee": 0,
              "true_label": 0
            },
            {
              "title": "Cyber Security Internship",
              "company": "International Cyber Force",
              "location": "Remote",
              "experience": "No experience",
              "salary": "Unlimited",
              "remote": "Yes",
              "description": "Transfer ₹799 processing fee to activate internship ID and start earning.",
              "required_skills": "None",
              "application_fee": 799,
              "true_label": 1
            },
            {
              "title": "Software Development Intern",
              "company": "CodeCraft Labs",
              "location": "Hyderabad",
              "experience": "0-1 years",
              "salary": "20000/month",
              "remote": "Hybrid",
              "description": "Internship on backend APIs and web applications under senior developers.",
              "required_skills": "Python, Java, REST API",
              "application_fee": 0,
              "true_label": 0
            },
            {
              "title": "Meta AI Internship",
              "company": "Meta HR India",
              "location": "Remote",
              "experience": "Any",
              "salary": "200000/month",
              "remote": "Yes",
              "description": "WhatsApp HR now and deposit ₹999 for onboarding documents.",
              "required_skills": "None",
              "application_fee": 999,
              "true_label": 1
            },
            {
              "title": "Data Science Intern",
              "company": "TechNova Solutions",
              "location": "Bangalore",
              "experience": "Fresher",
              "salary": "15000/month",
              "remote": "Hybrid",
              "description": "Assist analytics team in data cleaning and visualization projects.",
              "required_skills": "Python, Pandas, SQL",
              "application_fee": 0,
              "true_label": 0
            },
            {
              "title": "Work From Home Internship",
              "company": "Future Success Pvt Ltd",
              "location": "Remote",
              "experience": "None",
              "salary": "100000/month",
              "remote": "Yes",
              "description": "No interview required. Earn ₹1 lakh monthly by working one hour daily. Registration fee ₹500.",
              "required_skills": "None",
              "application_fee": 500,
              "true_label": 1
            }
        ]

        out.write("\nSTEP 2 & 3 — PREPROCESS & INFERENCE\n")
        
        y_true = []
        y_pred = []
        
        for i, sample in enumerate(samples, 1):
            combined_raw = f"{sample.get('title', '')} {sample.get('company', '')} {sample.get('description', '')}"
            
            cleaned_text = JobScamPreprocessor.clean_text(combined_raw)
            features = JobScamPreprocessor.extract_features(cleaned_text, str(sample.get("salary", "")))
            
            X_manual = csr_matrix([features])
            X_text = tfidf.transform([cleaned_text])
            X = hstack([X_text, X_manual])
            
            pred = int(model.predict(X)[0])
            prob = model.predict_proba(X)[0, 1] if pred == 1 else model.predict_proba(X)[0, 0]
            
            y_true.append(sample["true_label"])
            y_pred.append(pred)
            
            out.write(f"Sample {i}\n\n")
            out.write(f"Input:\n{json.dumps(sample, indent=2)}\n\n")
            out.write(f"Preprocessed:\nText: {cleaned_text}\n")
            out.write(f"Features: {dict(zip(JobScamPreprocessor.get_feature_names(), features))}\n\n")
            out.write(f"Prediction:\n{pred}\n\n")
            out.write(f"True Label:\n{sample['true_label']}\n\n")
            out.write(f"Confidence:\n{prob:.4f}\n\n")
            out.write(f"Result:\n{'CORRECT' if pred == sample['true_label'] else 'INCORRECT'}\n")
            out.write("-" * 50 + "\n\n")

        out.write("STEP 4 — AGGREGATE METRICS\n")
        out.write(f"Accuracy: {accuracy_score(y_true, y_pred):.4f}\n")
        out.write(f"Precision: {precision_score(y_true, y_pred, zero_division=0):.4f}\n")
        out.write(f"Recall: {recall_score(y_true, y_pred, zero_division=0):.4f}\n")
        out.write(f"F1-score: {f1_score(y_true, y_pred, zero_division=0):.4f}\n")
        out.write(f"Weighted F1: {f1_score(y_true, y_pred, average='weighted', zero_division=0):.4f}\n")
        out.write(f"Confusion Matrix:\n{confusion_matrix(y_true, y_pred)}\n")

if __name__ == "__main__":
    main()
