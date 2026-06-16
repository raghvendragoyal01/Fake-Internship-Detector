import pandas as pd
from scipy.sparse import csr_matrix, hstack
from typing import Dict, Any, List

from src.data.preprocess import clean_text_v2
from src.models.model_loader import model_manager

def run_inference(job_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Takes raw dictionary input from the FastAPI route, applies the improved
    text cleaning, runs the model pipeline, and returns predictions based on
    the custom threshold.
    """
    # 1. Ensure models are loaded
    model, threshold = model_manager.load()
    
    # 2. Extract inputs
    title = str(job_data.get("job_title", "") or "")
    company = str(job_data.get("company_name", "") or "")
    description = str(job_data.get("job_description", "") or "")
    salary = str(job_data.get("salary", "") or "")
    skills = str(job_data.get("skills", "") or "")
    
    # 3. Combine useful text (Title, Salary, Skills, Description) - Excluding company name to prevent memorization
    combined_raw = f"{title} {salary} {skills} {description}"
    
    # 4. Clean text using the v2 preprocessor
    cleaned_text = clean_text_v2(combined_raw)
    
    # 5. Run prediction probabilities directly on text (Pipeline handles TFIDF + Scam Features)
    prob = float(model.predict_proba([cleaned_text])[0, 1])
    
    # 6. Apply Custom Threshold
    pred = 1 if prob >= threshold else 0
    
    return {
        "fraud_probability": prob,
        "predicted_label": pred
    }

def run_batch_inference(jobs_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Efficiently processes a batch of jobs.
    """
    model, threshold = model_manager.load()
    
    cleaned_texts = []
    
    for job_data in jobs_data:
        title = str(job_data.get("job_title", "") or "")
        description = str(job_data.get("job_description", "") or "")
        salary = str(job_data.get("salary", "") or "")
        skills = str(job_data.get("skills", "") or "")
        
        combined_raw = f"{title} {salary} {skills} {description}"
        cleaned_text = clean_text_v2(combined_raw)
        cleaned_texts.append(cleaned_text)
        
    probs = model.predict_proba(cleaned_texts)[:, 1]
    
    return [{"fraud_probability": float(prob), "predicted_label": 1 if prob >= threshold else 0} 
            for prob in probs]
