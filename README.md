# 🚫 Fake Internship & Job Scam Detection System

[![Python Version](https://img.shields.io/badge/python-3.8%2B-blue.svg)](https://www.python.org/)
[![Jupyter Notebook](https://img.shields.io/badge/Jupyter-Notebook-orange.svg?style=flat&logo=Jupyter)](https://jupyter.org/)
[![Pandas](https://img.shields.io/badge/pandas-v2.0%2B-darkblue.svg?logo=pandas)](https://pandas.pydata.org/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

## 📌 Project Overview
With the rapid growth of online recruitment platforms, internship and job scams have become a major issue, especially for college students and fresh graduates in India. This project aims to build a **Fake Internship & Job Scam Detection System** that analyzes job descriptions, metadata, and requirements to classify whether a job posting is legitimate (**Real**) or fraudulent (**Fake**).

By integrating standard NLP text preprocessing, class-balancing techniques, and machine learning models, this system provides a pipeline to inspect, augment, clean, and classify job listings.

---

## 📂 Repository Structure
```directory
├── assets/                  # Project assets and generated visual plots
├── backend/                 # API server files (FastAPI/Flask)
│   ├── app.py               # Main API application entrypoint
│   ├── routes.py            # API routes and controller logic
│   └── requirements.txt     # Python dependencies for the backend
├── dashboard/               # Streamlit web interface application
│   └── streamlit_app.py     # Main Streamlit dashboard script
├── data/                    # Project datasets (Raw, Interim, Processed)
│   ├── raw/                 # Original un-preprocessed datasets
│   │   ├── Job_Listings_India_Labelled.xlsx
│   │   └── DataSet.csv      # EMSCAD raw dataset
│   ├── interim/             # Merged and balanced datasets
│   │   └── balanced_dataset.csv
│   └── processed/           # Fully preprocessed and cleaned datasets
│       └── processed_dataset.csv
├── models/                  # Saved models and encoders (serialization)
├── notebooks/               # Step-by-step Jupyter Notebook workflow
│   ├── 01_Data_Inspection.ipynb
│   ├── 02_Dataset_Augmentation_and_Balancing.ipynb
│   └── 03_Data_Preprocessing.ipynb
├── .gitignore               # Ignored files configuration
└── README.md                # Project documentation
```

---

## 🔄 Project Workflow & Jupyter Notebooks

### 1. [01_Data_Inspection.ipynb](notebooks/01_Data_Inspection.ipynb) (EDA)
* Performs initial exploratory analysis on the `Job_Listings_India_Labelled.xlsx` dataset.
* Examines features, data types, dimensions (6,553 rows × 13 columns), and duplicate records.
* Identifies severe **class imbalance** (99.68% Real Jobs vs. 0.32% Fake Jobs) and massive missing values in `Salary_Amount` (approx. 75%).
* Concludes the necessity of dataset augmentation to provide adequate fake job samples.

### 2. [02_Dataset_Augmentation_and_Balancing.ipynb](notebooks/02_Dataset_Augmentation_and_Balancing.ipynb) (Augmentation)
* Resolves class imbalance by extracting fraudulent job listings from the global **EMSCAD dataset**.
* Performs **"Indianization"** of US-centric attributes:
  * Maps US locations (e.g., New York, California) to major Indian IT/business hubs (e.g., Delhi, Bangalore, Hyderabad, Mumbai).
  * Substitutes currency terms (USD, $, Dollars) with Indian Rupee (INR, ₹, Rupees).
* Standardizes columns and merges the datasets into `data/interim/balanced_dataset.csv`.

### 3. [03_Data_Preprocessing.ipynb](notebooks/03_Data_Preprocessing.ipynb) (Text Preprocessing)
* Imputes missing categorical attributes (e.g., "Unknown Company" for missing company names).
* Drops highly sparse features like `Salary_Amount`.
* Performs advanced NLP text cleaning on `Job Description`:
  * Removes HTML tags (using BeautifulSoup).
  * Strips URLs and email addresses.
  * Normalizes text (lowercase conversion, unicode normalization, punctuation/digit removal, and extra whitespace stripping).
* Generates a finalized dataset ready for vectorization and machine learning model training.

---

## 🚀 Getting Started

### 🔧 Installation & Setup
1. **Clone the repository:**
   ```bash
   git clone https://github.com/raghvendragoyal01/Fake-Internship-Detector.git
   cd Fake-Internship-Detector
   ```

2. **Set up a virtual environment:**
   ```bash
   python -m venv .venv
   # On Windows:
   .venv\Scripts\activate
   # On macOS/Linux:
   source .venv/bin/activate
   ```

3. **Install the required packages:**
   Create a requirements file or run:
   ```bash
   pip install pandas numpy scikit-learn beautifulsoup4 openpyxl jupyter streamlit
   ```

### 📊 Running the Notebooks
You can execute the notebooks in sequence to regenerate the datasets:
```bash
jupyter notebook notebooks/
```

---

## 🔮 Future Roadmap
- [ ] Train Machine Learning classifiers (Naive Bayes, SVM, Random Forest, or XGBoost) to categorize listings.
- [ ] Build a **FastAPI backend** to serve predictions based on a text description input.
- [ ] Design a **Streamlit frontend** dashboard allowing users to paste job descriptions and obtain immediate scam risk assessments.

---

## 📝 License
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
