## Problem Statement
The objective of this project is to accurately detect fraudulent job and internship postings. Due to the high risk of job scams, the system analyzes text patterns, handcrafted regex rules (such as daily salaries and suspicious emails), and semantic features to classify job listings as legitimate or fraudulent.

## Dataset
The dataset combines a master collection of job postings with an augmented dataset of known fake jobs. Features are extracted from the `job_title`, `company_name`, `job_description`, and `salary` columns. The target variable is `label` (1 = Fake, 0 = Legitimate).

## Project Structure
```text
antigravity/
├── archive/               ← Deprecated scripts and redundant pickled matrices
├── configs/               ← Hyperparameters and paths (config.yaml)
├── data/
│   ├── external/          ← Third-party evaluation data (external_test.xlsx)
│   ├── interim/           ← Intermediary datasets
│   ├── processed/         ← Final split datasets (Train/Test)
│   └── raw/               ← Original raw datasets (DO NOT MODIFY)
├── docs/                  ← Project PDFs and requirements
├── models/
│   ├── checkpoints/       ← Training checkpoints
│   └── saved/             ← Final exported models (.pkl)
├── notebooks/             ← Jupyter notebooks for EDA, prototyping, and analysis
├── reports/               ← Metrics and evaluation output CSVs
├── src/                   ← Production source code
│   ├── data/              ← Preprocessing and cleaning pipelines
│   ├── models/            ← Training and inference loops
│   └── utils/             ← Shared helpers
├── .gitignore             
├── README.md              
├── requirements.txt       
└── setup.py               
```

## Installation
1. Clone the repository and navigate to the project root.
2. Create and activate a Python virtual environment.
3. Install the dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Install the module locally (optional):
   ```bash
   pip install -e .
   ```

## Usage

### Training the Model
To re-run the full training pipeline from raw data to saved model:
```bash
python src/models/train.py
```
This script handles missing value imputation, text cleaning, feature extraction, 3-way dataset splitting, TF-IDF vectorization, and XGBoost training with early stopping.

### Running Inference
To run predictions on a new external dataset (e.g., `external_test.xlsx`):
```bash
python src/models/predict.py
```
This generates `reports/metrics/external_predictions.csv` with `predicted_fraud` and `fraud_probability`.

## Model Performance
On the strictly held-out test set (15% of the data):
* **F1 Score**: ~0.986
* **ROC AUC**: ~0.997
* **Train/Serve Skew**: Resolved. Handcrafted features and TF-IDF extraction are now fully unified.
