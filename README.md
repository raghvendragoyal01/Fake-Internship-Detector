# 🚫 Fake Internship & Job Scam Detection System

<div align="center">
  <img src="https://img.shields.io/badge/Python-3.8+-blue.svg" alt="Python Version">
  <img src="https://img.shields.io/badge/Machine%20Learning-Scikit--Learn%20%7C%20XGBoost-orange" alt="Machine Learning">
  <img src="https://img.shields.io/badge/NLP-TF--IDF-green" alt="NLP">
  <img src="https://img.shields.io/badge/License-MIT-darkgreen.svg" alt="License">
</div>

## 📌 Executive Summary
With the rapid proliferation of online recruitment platforms, internship and job scams have become a critical cybersecurity and user-trust issue. This project implements a robust **Machine Learning Pipeline** designed to identify fraudulent job postings by analyzing textual descriptions, semantic cues, and metadata patterns. 

The system leverages Natural Language Processing (NLP) to extract highly predictive features, effectively classifying listings into **Legitimate (Real)** or **Fraudulent (Fake)** categories while mitigating severe data imbalances and preventing target leakage.

---

## 🏗️ System Architecture & ML Pipeline

Our end-to-end Machine Learning pipeline is designed with production-readiness in mind, separated into distinct, modular stages:

### 1. Data Ingestion & Exploratory Data Analysis (EDA)
- Analyzed the raw dataset (`Job_Listings_India_Labelled.xlsx`) revealing a severe **class imbalance** (99.68% Real vs. 0.32% Fake).
- Identified missing data mechanisms and sparse categorical features (e.g., `Salary_Amount`).

### 2. Data Augmentation & Semantic Alignment
- Integrated the global **EMSCAD dataset** to inject realistic fraudulent patterns and correct the class imbalance.
- Applied **Semantic Localization**: Mapped US-centric attributes to Indian demographic distributions (e.g., currency substitutions, location mappings) to ensure the model generalizes well to the target domain.

### 3. Advanced NLP Text Preprocessing
- Constructed a rigorous text-cleaning pipeline: removing HTML/XML artifacts, normalizing unicode characters, stripping malicious URLs, and executing comprehensive tokenization.
- Aggregated disparate text fields (Job Title, Company, Field, Experience, Description) into a unified `combined_text` tensor for vectorized modeling.

### 4. Feature Engineering & Target Leakage Mitigation
- **Risk Scoring**: Engineered deterministic heuristic features (`keyword_risk_score`, `salary_risk_score`) to capture known phishing and scam methodologies (e.g., "registration fees", "Telegram onboarding").
- **Vectorization**: Transformed the unstructured text corpus into a high-dimensional sparse matrix using a **TF-IDF Vectorizer** (5000 max features).
- **Leakage Prevention**: Conducted feature importance analysis and removed highly correlated metadata (such as `domain_frequency`) that induced data leakage, forcing the model to learn structural linguistic patterns rather than memorizing high-frequency legitimate domains.

### 5. Model Training & Evaluation
- Trained a heterogeneous ensemble of classifiers optimized for sparse, high-dimensional arrays:
  - **Logistic Regression**: Serves as a highly interpretable baseline, strictly adhering to risk score coefficients.
  - **Random Forest**: Hyperparameter-tuned (`max_features=0.3`) to prevent sparsity degradation during decision tree induction.
  - **XGBoost**: Utilized `scale_pos_weight` to dynamically penalize false negatives (missed scams) during gradient boosting.
- Developed an interactive inference wrapper (`predict_job_v3()`) that ingests raw JSON/text, applies the exact preprocessing transforms, and outputs ensembled confidence intervals.

---

## 📂 Repository Structure
```directory
├── assets/                  # Architecture diagrams and performance plots
├── backend/                 # API Server (FastAPI implementation planned)
├── dashboard/               # Frontend UI (Streamlit application planned)
├── data/                    # Data version control (Raw, Interim, Processed)
├── models/                  # Serialized artifacts (.pkl objects)
├── notebooks/               # Core execution pipeline
│   ├── 01_Data_Inspection.ipynb
│   ├── 02_Dataset_Augmentation_and_Balancing.ipynb
│   ├── 03_Data_Preprocessing.ipynb
│   ├── 04_Fraud_Feature_Engineering.ipynb
│   ├── 05_Model_Preparation_v2.ipynb
│   └── 06_Model_Training.ipynb
└── README.md                # Technical Documentation
```

---

## 🚀 Deployment & Setup

### 🔧 Environment Initialization
1. **Clone the repository:**
   ```bash
   git clone https://github.com/raghvendragoyal01/Fake-Internship-Detector.git
   cd Fake-Internship-Detector
   ```

2. **Initialize a virtual environment:**
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows use: .venv\Scripts\activate
   ```

3. **Install Dependencies:**
   ```bash
   pip install pandas numpy scikit-learn beautifulsoup4 xgboost jupyter
   ```

### 📊 Model Execution
To retrain the models from scratch, execute the modular notebooks sequentially:
```bash
jupyter notebook notebooks/
```

---

## 🔮 Future Roadmap
- [x] Train Machine Learning classifiers (Logistic Regression, Random Forest, XGBoost) to categorize listings and identify scammers.
- [ ] Develop a **FastAPI backend** microservice for low-latency RESTful predictions.
- [ ] Deploy a **Streamlit/React frontend** enabling end-users to assess job description risk metrics in real-time.

---

## 📝 License
This software is released under the MIT License. See the [LICENSE](LICENSE) file for details.
