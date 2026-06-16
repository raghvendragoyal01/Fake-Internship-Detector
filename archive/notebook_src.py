# Install only if these libraries are not already installed
# pandas is used for handling dataset tables
# scikit-learn is used for machine learning models
# openpyxl is used for reading Excel files
# joblib is used for saving trained models
# imbalanced-learn is used for SMOTE to handle class imbalance

!pip install pandas scikit-learn openpyxl joblib imbalanced-learn

# pandas helps us read and work with Excel data
import pandas as pd

# numpy helps with numerical operations
import numpy as np

# re is used for cleaning text using patterns
import re

# matplotlib is used for simple graphs
import matplotlib.pyplot as plt

# train_test_split divides data into training and testing parts
# StratifiedKFold and cross_val_predict are used for stronger cross validation checking
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score, cross_val_predict

# TF-IDF converts text into numerical values
from sklearn.feature_extraction.text import TfidfVectorizer

# These are machine learning models
from sklearn.linear_model import LogisticRegression
from sklearn.naive_bayes import MultinomialNB
from sklearn.ensemble import RandomForestClassifier

# Pipeline keeps text conversion and model training together
# FeatureUnion joins TF-IDF features with manual scam keyword features
from sklearn.pipeline import Pipeline, FeatureUnion

# BaseEstimator and TransformerMixin help us create a custom feature extractor
from sklearn.base import BaseEstimator, TransformerMixin

# SMOTE creates synthetic samples for the minority class only on training data
from imblearn.over_sampling import SMOTE
from imblearn.pipeline import Pipeline as ImbPipeline

# These are used to check model performance
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
from sklearn.metrics import classification_report, confusion_matrix

# joblib saves the final model
import joblib

# Load the dataset
# Your file may look like Excel but it is actually CSV format
# So we use read_csv instead of read_excel

df = pd.read_excel(r"C:\Users\hp\Desktop\ml_ready_data.xlsx")

# Show first 5 rows
df.head()

# Check how many rows and columns are present
print("Dataset shape:", df.shape)

# Show all column names
print("Columns in dataset:")
print(df.columns)

# Check missing values in every column
# Missing values can create errors during model training

print(df.isnull().sum())

# Check total rows and columns
print("Dataset shape:", df.shape)

# Check column names
print("Columns:", df.columns.tolist())

# Check missing values
print(df.isnull().sum())

# Check how many safe and scam jobs are present
print(df["label"].value_counts())

# Remove duplicates and reset index
df = df.drop_duplicates().reset_index(drop=True)

# check for duplicate job rows
print("Duplicate rows:", df.duplicated().sum())

before = len(df)

df = df.drop_duplicates(subset=['job_description']).reset_index(drop=True)

after = len(df)

print("Rows before:", before)
print("Rows after:", after)
print("Duplicate descriptions removed:", before - after)

# check for duplicate job descriptions
print("Duplicate descriptions:",
      df['job_description'].duplicated().sum())

# check for duplicate combined text
print("Duplicate combined_text:",
      df['combined_text'].duplicated().sum())

print(df['job_description'].nunique())
print(len(df))

duplicate_desc = df[df.duplicated('job_description', keep=False)]

print("Rows involved in duplicate descriptions:",
      len(duplicate_desc))

df = df.drop_duplicates(subset=['job_description'])
print(df.shape)

# For the improved NLP part, we create a better text column manually.
# We do NOT use company and location here because they can make the model memorize names and places.
# For fake-job detection, job title, salary, skills and job description are more useful.
# This reduces noise and helps the model learn scam language patterns.

# These are possible column names that may exist in your dataset.
# The code checks each name safely, so it will not crash if one column is missing.
important_text_columns = [
    "title", "job_title", "Job Title",
    "salary", "Salary",
    "skills", "Skills",
    "job_description", "description", "Job Description"
]

# Keep only the columns that are actually present in your dataset.
available_text_columns = [col for col in important_text_columns if col in df.columns]

print("Columns used for improved NLP text:", available_text_columns)

# Create improved combined text from selected useful columns only.
df["improved_combined_text"] = ""

for col in available_text_columns:
    df["improved_combined_text"] = df["improved_combined_text"] + " " + df[col].fillna("").astype(str)

# For NLP part, we need improved text and label.
df_nlp = df[["improved_combined_text", "label"]].copy()

# Remove rows where text or label is missing.
df_nlp = df_nlp.dropna(subset=["improved_combined_text", "label"])

# Convert text column into string type.
df_nlp["improved_combined_text"] = df_nlp["improved_combined_text"].astype(str)

# Convert label into integer type.
df_nlp["label"] = df_nlp["label"].astype(int)

# Rename improved text column as combined_text so the rest of the notebook remains easy to follow.
df_nlp = df_nlp.rename(columns={"improved_combined_text": "combined_text"})

df_nlp.head()

# Duplicate rows can make the model memorize repeated data
# This can cause data leakage and fake high accuracy
# So we remove duplicate job descriptions before splitting the data

print("Duplicate text rows before removing:", df_nlp['combined_text'].duplicated().sum())

df_nlp = df_nlp.drop_duplicates(subset=['combined_text'])

print("Duplicate text rows after removing:", df_nlp['combined_text'].duplicated().sum())

print("New dataset shape:", df_nlp.shape)

# This checks how many real and fake jobs are present
# If one class is much larger than the other, accuracy alone is not enough

print(df_nlp['label'].value_counts())

print("\nPercentage:")
print(df_nlp['label'].value_counts(normalize=True) * 100)

# This function cleans job text.
# It makes text lowercase.
# It removes website links.
# It keeps numbers because salary amounts like 50000 can be useful for scam detection.
# It removes extra symbols.
# It removes extra spaces.
# Important: We are NOT removing stop words here because words like no and not are important.

def clean_text(text):
    text = str(text).lower()
    text = re.sub(r'http\S+|www\S+', ' ', text)
    text = re.sub(r'[^a-zA-Z₹0-9\s]', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

# Apply cleaning to combined_text.
df_nlp['clean_text'] = df_nlp['combined_text'].apply(clean_text)

# Manual scam keyword list.
# These are common suspicious phrases seen in fake job or fake internship posts.
# This feature helps the model because TF-IDF alone may miss the importance of these patterns.
scam_keywords = [
    "registration fee", "joining fee", "processing fee", "security deposit",
    "payment required", "pay before", "pay now", "fee required", "training fee",
    "internship fee", "refundable fee", "deposit required", "application fee",
    "earn money", "easy money", "daily income", "weekly payout", "high salary",
    "limited seats", "limited vacancies", "urgent hiring", "immediate joining",
    "no interview", "direct selection", "instant joining", "guaranteed job",
    "work from home", "whatsapp", "telegram", "contact hr", "send resume on whatsapp",
    "part time income", "freelance income", "less work", "2 hours", "3 hours"
]

# Count how many suspicious phrases are present in each job post.
def count_scam_keywords(text):
    text = str(text).lower()
    return sum(keyword in text for keyword in scam_keywords)

# Add keyword count only for analysis and explanation.
# The final model will calculate this automatically inside the pipeline also.
df_nlp["scam_keyword_count"] = df_nlp["clean_text"].apply(count_scam_keywords)

df_nlp[['combined_text', 'clean_text', 'scam_keyword_count', 'label']].head()

# Remove rows where text became empty after cleaning
df_nlp = df_nlp[df_nlp["clean_text"] != ""]

# Remove duplicate text rows
# This helps reduce data leakage because same text should not appear in both train and test data
df_nlp = df_nlp.drop_duplicates(subset=["clean_text"])

# Check final shape
print("Final NLP dataset shape:", df_nlp.shape)

# Check label count again
print(df_nlp["label"].value_counts())

# X contains input text
# y contains output labels

X = df_nlp['clean_text']
y = df_nlp['label']

# Train-test split must happen before TF-IDF
# This prevents data leakage
# stratify=y keeps the same real/fake ratio in train and test data

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y
)

print("Training rows:", X_train.shape[0])
print("Testing rows:", X_test.shape[0])

# TOKENIZATION STEP
# Tokenization means breaking one full sentence into small words called tokens.
# We do this after text cleaning because clean text gives better tokens.
# This code does not change your old model code.
# It only creates a separate token list so you can show tokenization in your project.

from sklearn.feature_extraction.text import ENGLISH_STOP_WORDS

# This function converts one cleaned job description into useful words.
def tokenize_text(text):
    # Convert the text into string and lowercase it for safety.
    text = str(text).lower()
    
    # Keep only alphabets and spaces.
    text = re.sub(r"[^a-zA-Z\s]", " ", text)
    
    # Split the sentence into separate words.
    tokens = text.split()
    
    # Remove very small words and common English words like the, is, and, for.
    tokens = [word for word in tokens if word not in ENGLISH_STOP_WORDS and len(word) > 2]
    
    return tokens

# Apply tokenization on the cleaned text column.
df_nlp["tokens"] = df_nlp["clean_text"].apply(tokenize_text)

# Show original clean text and its tokens.
df_nlp[["clean_text", "tokens", "label"]].head()


# TF-IDF VECTORIZATION STEP
# TF-IDF converts text into numbers so that machine learning models can understand it.
# This separate TF-IDF cell is only for explanation and keyword extraction.
# Important changes:
# 1. stop_words=None keeps words like no and not.
# 2. max_features=15000 keeps more useful words and phrases.
# 3. ngram_range=(1,3) captures single words, two-word phrases and three-word phrases.
# 4. sublinear_tf=True reduces the effect of repeated words and improves generalization.

separate_tfidf = TfidfVectorizer(
    stop_words=None,
    max_features=15000,
    min_df=2,
    max_df=0.95,
    ngram_range=(1, 3),
    sublinear_tf=True
)

# Learn vocabulary only from training text.
X_train_tfidf = separate_tfidf.fit_transform(X_train)

# Convert test text using the same TF-IDF vocabulary learned from training text.
X_test_tfidf = separate_tfidf.transform(X_test)

# Show the shape of the TF-IDF output.
print("Training TF-IDF shape:", X_train_tfidf.shape)
print("Testing TF-IDF shape:", X_test_tfidf.shape)

# Show some TF-IDF feature names.
feature_names = separate_tfidf.get_feature_names_out()
print("First 30 TF-IDF features:")
print(feature_names[:30])

# KEYWORD EXTRACTION STEP
# This finds important words and phrases from scam job descriptions.
# We use only training data here to avoid looking at test data.
# The top words help explain what the model sees as suspicious language.

# Convert y_train into an array so we can filter scam rows easily.
y_train_array = np.array(y_train)

# Select only scam job rows from the TF-IDF training matrix.
scam_tfidf_matrix = X_train_tfidf[y_train_array == 1]

# Calculate average TF-IDF score of each word/phrase in scam jobs.
mean_scam_tfidf = np.asarray(scam_tfidf_matrix.mean(axis=0)).ravel()

# Get indexes of top 25 words/phrases with highest average TF-IDF score.
top_keyword_indexes = mean_scam_tfidf.argsort()[-25:][::-1]

# Create a table of important scam keywords.
keyword_extraction_df = pd.DataFrame({
    "Keyword_or_Phrase": feature_names[top_keyword_indexes],
    "Average_TFIDF_Score": mean_scam_tfidf[top_keyword_indexes]
})

keyword_extraction_df


# TEXT CLASSIFICATION STEP
# This is a separate simple classifier for explanation only.
# The final improved model below uses TF-IDF + manual scam features + SMOTE.

text_classifier = LogisticRegression(
    max_iter=2000,
    class_weight="balanced",
    C=0.5,
    solver="liblinear",
    random_state=42
)

# Train the text classifier using TF-IDF training data.
text_classifier.fit(X_train_tfidf, y_train)

# Predict labels for test data.
y_pred_text_classifier = text_classifier.predict(X_test_tfidf)

# Predict scam probability for test data.
y_prob_text_classifier = text_classifier.predict_proba(X_test_tfidf)[:, 1]

# Show classification result.
print("Separate TF-IDF + Text Classification Results")
print("Accuracy:", accuracy_score(y_test, y_pred_text_classifier))
print(classification_report(y_test, y_pred_text_classifier))
print("Confusion Matrix:")
print(confusion_matrix(y_test, y_pred_text_classifier))

# Check how scam keyword counts are distributed in real and fake jobs.
# Fake jobs should usually have a higher average count than real jobs.

df_nlp.groupby("label")["scam_keyword_count"].describe()

# Show some posts with high scam keyword count.
# This helps you explain why the manual scam feature is useful.

df_nlp.sort_values("scam_keyword_count", ascending=False)[["clean_text", "scam_keyword_count", "label"]].head(10)

# FINAL IMPROVED LOGISTIC REGRESSION MODEL
# This model includes all main improvements:
# 1. Better TF-IDF settings
# 2. No English stop-word removal, so no/not are preserved
# 3. One-word, two-word and three-word phrases
# 4. Manual scam keyword features
# 5. SMOTE to balance fake-job samples only inside the training process
# 6. Tuned Logistic Regression with C=0.5 and solver='liblinear'

class ScamKeywordTransformer(BaseEstimator, TransformerMixin):
    # This custom transformer creates extra numerical features from job text.
    # These features are joined with TF-IDF features using FeatureUnion.
    def __init__(self, keywords=None):
        self.keywords = keywords if keywords is not None else scam_keywords

    def fit(self, X, y=None):
        # No training is needed for keyword counting.
        return self

    def transform(self, X):
        feature_rows = []

        for text in X:
            text = str(text).lower()

            # Count total scam keyword phrase matches.
            keyword_count = sum(keyword in text for keyword in self.keywords)

            # Extra focused flags for very suspicious patterns.
            fee_flag = int(any(word in text for word in ["fee", "payment", "deposit", "pay now"]))
            whatsapp_flag = int("whatsapp" in text or "telegram" in text)
            no_interview_flag = int("no interview" in text or "direct selection" in text)
            urgent_flag = int("urgent" in text or "immediate joining" in text or "limited" in text)
            unrealistic_money_flag = int(bool(re.search(r"\b(50000|60000|70000|80000|90000|100000)\b", text)))

            feature_rows.append([
                keyword_count,
                fee_flag,
                whatsapp_flag,
                no_interview_flag,
                urgent_flag,
                unrealistic_money_flag
            ])

        return np.array(feature_rows)

# Join TF-IDF text features with manual scam keyword features.
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

# imblearn Pipeline allows SMOTE to be applied after feature creation and before model training.
# SMOTE is applied only during training folds, so it does not leak test data.
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

# Train the model only on training data.
logistic_model.fit(X_train, y_train)

# Predict using normal 50% threshold first.
y_pred_lr_default = logistic_model.predict(X_test)

# Predict probabilities so we can apply our safer custom threshold.
y_prob_lr = logistic_model.predict_proba(X_test)[:, 1]

# Threshold tuning: scam is predicted only if scam probability is 65% or above.
# You can change 0.65 to 0.60 or 0.70 after checking precision and recall.
SCAM_THRESHOLD = 0.65
y_pred_lr = (y_prob_lr >= SCAM_THRESHOLD).astype(int)

print("Improved Logistic Regression Results with 65% Threshold")
print(classification_report(y_test, y_pred_lr))
print("Confusion Matrix:")
print(confusion_matrix(y_test, y_pred_lr))

print("\nDefault 50% Threshold F1:", f1_score(y_test, y_pred_lr_default))
print("Custom 65% Threshold F1:", f1_score(y_test, y_pred_lr))

# Naive Bayes model with improved TF-IDF settings.
# Note: Naive Bayes does not use SMOTE here because it is mainly kept for comparison.

nb_model = Pipeline([
    ("tfidf", TfidfVectorizer(
        stop_words=None,
        max_features=15000,
        ngram_range=(1, 3),
        min_df=2,
        max_df=0.95,
        sublinear_tf=True
    )),
    ("model", MultinomialNB(alpha=1.0))
])

# Train the model.
nb_model.fit(X_train, y_train)

# Predict test data.
y_pred_nb = nb_model.predict(X_test)

# Show performance.
print("Naive Bayes Results")
print(classification_report(y_test, y_pred_nb))

# Random Forest model with improved TF-IDF settings.
# Random Forest is kept for comparison, but Logistic Regression is usually better for TF-IDF text classification.

rf_model = Pipeline([
    ("tfidf", TfidfVectorizer(
        stop_words=None,
        max_features=5000,
        ngram_range=(1, 2),
        min_df=2,
        max_df=0.95,
        sublinear_tf=True
    )),
    ("model", RandomForestClassifier(
        n_estimators=150,
        max_depth=25,
        min_samples_leaf=4,
        class_weight="balanced",
        random_state=42,
        n_jobs=-1
    ))
])

# Train the model.
rf_model.fit(X_train, y_train)

# Predict test data.
y_pred_rf = rf_model.predict(X_test)

# Show performance.
print("Random Forest Results")
print(classification_report(y_test, y_pred_rf))

# This function calculates important evaluation scores
# Accuracy tells total correct predictions
# Precision tells how many predicted scams were actually scams
# Recall tells how many real scams the model caught
# F1 score balances precision and recall

def evaluate_model(name, y_true, y_pred):
    return {
        "Model": name,
        "Accuracy": accuracy_score(y_true, y_pred),
        "Precision": precision_score(y_true, y_pred, zero_division=0),
        "Recall": recall_score(y_true, y_pred, zero_division=0),
        "F1 Score": f1_score(y_true, y_pred, zero_division=0)
    }

results = pd.DataFrame([
    evaluate_model("Logistic Regression", y_test, y_pred_lr),
    evaluate_model("Naive Bayes", y_test, y_pred_nb),
    evaluate_model("Random Forest", y_test, y_pred_rf)
])

results

# Confusion matrix shows correct and wrong predictions
# For fake job detection, recall is very important
# Because missing a fake job can be risky

cm = confusion_matrix(y_test, y_pred_lr)

print("Confusion Matrix for Logistic Regression:")
print(cm)

print("\nMeaning:")
print("[[Correct Real Jobs, Wrongly Marked as Fake],")
print(" [Fake Jobs Missed, Correct Fake Jobs]]")

# Cross validation checks model stability.
# Important: Because our final prediction uses a 65% threshold, we should also evaluate CV using the same threshold.
# cross_val_predict gives out-of-fold probabilities for every row.
# This means each prediction is made by a model that did not train on that row.

skf = StratifiedKFold(
    n_splits=5,
    shuffle=True,
    random_state=42
)

# Default F1 from cross_val_score uses the normal 50% threshold.
cv_scores_default = cross_val_score(
    logistic_model,
    X,
    y,
    cv=skf,
    scoring="f1"
)

# Probability-based cross validation allows custom threshold checking.
cv_probabilities = cross_val_predict(
    logistic_model,
    X,
    y,
    cv=skf,
    method="predict_proba"
)[:, 1]

# Apply the same threshold used in the final prediction function.
cv_predictions_threshold = (cv_probabilities >= SCAM_THRESHOLD).astype(int)
cv_f1_threshold = f1_score(y, cv_predictions_threshold)

print("Cross Validation F1 Scores using default 50% threshold:")
print(cv_scores_default)
print("Mean F1 with default 50% threshold:", cv_scores_default.mean())
print("Standard Deviation:", cv_scores_default.std())

print("\nCross Validation F1 using custom 65% threshold:", cv_f1_threshold)
print("\nClassification report using cross-validated 65% threshold predictions:")
print(classification_report(y, cv_predictions_threshold))

# Overfitting means the model performs very well on training data
# but performs much worse on testing data.
# Here we check overfitting using both default 50% threshold and custom 65% threshold.

# Default 50% threshold predictions.
train_pred_default = logistic_model.predict(X_train)
test_pred_default = logistic_model.predict(X_test)

# Custom 65% threshold predictions.
train_prob = logistic_model.predict_proba(X_train)[:, 1]
test_prob = logistic_model.predict_proba(X_test)[:, 1]

train_pred_threshold = (train_prob >= SCAM_THRESHOLD).astype(int)
test_pred_threshold = (test_prob >= SCAM_THRESHOLD).astype(int)

print("Default 50% Threshold")
print("Training F1:", f1_score(y_train, train_pred_default))
print("Testing F1:", f1_score(y_test, test_pred_default))
print("Difference:", f1_score(y_train, train_pred_default) - f1_score(y_test, test_pred_default))

print("\nCustom 65% Threshold")
print("Training F1:", f1_score(y_train, train_pred_threshold))
print("Testing F1:", f1_score(y_test, test_pred_threshold))
print("Difference:", f1_score(y_train, train_pred_threshold) - f1_score(y_test, test_pred_threshold))

# Small difference means the model is stable.
# Very large difference means overfitting.

df['label'].value_counts(normalize=True) * 100

# This function checks a new job description.
# It returns whether the job is safe or scam.
# It also gives scam probability percentage.
# It uses the same 65% threshold used during model evaluation.

def predict_job_scam(job_text, threshold=SCAM_THRESHOLD):
    cleaned = clean_text(job_text)

    scam_probability = logistic_model.predict_proba([cleaned])[0][1]
    scam_percentage = scam_probability * 100

    if scam_probability >= threshold:
        prediction = "Scam/Fake Job"
    else:
        prediction = "Safe/Real Job"

    if scam_percentage <= 30:
        risk = "Low Risk"
    elif scam_percentage < threshold * 100:
        risk = "Medium Risk"
    else:
        risk = "High Risk"

    return {
        "Prediction": prediction,
        "Scam Probability": round(scam_percentage, 2),
        "Risk Level": risk,
        "Threshold Used": threshold
    }

sample_text = """
Work from home internship. Earn 50000 per month.
No interview. Registration fee required. Limited seats only.
Contact HR on WhatsApp for instant joining.
"""

predict_job_scam(sample_text)

# Save the final improved trained model.
# This model includes TF-IDF, scam keyword features, SMOTE and Logistic Regression.
# The threshold is saved separately because threshold is used in prediction logic, not inside Logistic Regression itself.

joblib.dump(logistic_model, "fake_job_nlp_model_improved.pkl")
joblib.dump(SCAM_THRESHOLD, "fake_job_threshold.pkl")

print("Improved model saved successfully.")
print("Saved files: fake_job_nlp_model_improved.pkl and fake_job_threshold.pkl")

# Load the saved improved model and threshold.
loaded_model = joblib.load("fake_job_nlp_model_improved.pkl")
loaded_threshold = joblib.load("fake_job_threshold.pkl")

# Test loaded model with a real-looking job description.
test_text = """
Software Developer Internship at Infosys.
Selected candidates will undergo online assessment and technical interview.
No payment required during recruitment.
"""

cleaned_test_text = clean_text(test_text)

probability = loaded_model.predict_proba([cleaned_test_text])[0][1]

if probability >= loaded_threshold:
    prediction = "Scam/Fake Job"
else:
    prediction = "Safe/Real Job"

print("Prediction:", prediction)
print("Scam Probability:", round(probability * 100, 2), "%")
print("Threshold Used:", loaded_threshold)



