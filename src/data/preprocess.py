import html
import unicodedata
import re
import numpy as np
import pandas as pd

class JobScamPreprocessor:
    """
    Handles text cleaning and handcrafted feature extraction consistently 
    for both training and inference.
    """
    
    @staticmethod
    def clean_text(text: str) -> str:
        """
        Cleans text by unescaping HTML, normalizing unicode, removing URLs,
        stripping extra whitespace, and lowercasing.
        """
        if pd.isna(text):
            return ""
        text = str(text)
        text = html.unescape(text)
        text = unicodedata.normalize("NFKC", text)
        text = re.sub(r"http\S+", " ", text)
        text = re.sub(r"www\S+", " ", text)
        text = re.sub(r"<.*?>", " ", text)
        text = re.sub(r"\s+", " ", text)
        return text.strip().lower()

    @staticmethod
    def extract_features(text: str, salary_text: str = "") -> list:
        """
        Extracts 22 handcrafted features from the text.
        `text` should be the combined (and cleaned) title + company + description.
        `salary_text` should be the raw salary string.
        """
        words = text.split()
        
        char_count = len(text)
        word_count = len(words)
        
        # Sentence count formula matched to training logic
        sentence_count = len(re.findall(r"[.!?]", text)) + 1
        
        avg_word_length = np.mean([len(i) for i in words]) if words else 0
        digit_ratio = sum(c.isdigit() for c in text) / max(len(text), 1)
        special_ratio = len(re.findall(r"[^a-zA-Z0-9\s]", text)) / max(len(text), 1)
        
        exclamation_count = text.count("!")
        question_count = text.count("?")
        
        # Email matching logic mapped to the more robust training regex
        has_email = int(bool(re.search(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}", text)))
        gmail_email = int("@gmail.com" in text)
        yahoo_email = int("@yahoo" in text)
        outlook_email = int("@outlook" in text)
        
        # Salary matching logic (isolated to salary column, NOT full text)
        salary_str = str(salary_text) if not pd.isna(salary_text) else ""
        salary_present = int(bool(re.search(r"\d", salary_str)))
        salary_daily = int("day" in salary_str.lower())
        salary_monthly = int("month" in salary_str.lower())
        salary_hourly = int("hour" in salary_str.lower())
        
        avg_sentence_length = min(word_count / sentence_count, 100)
        unique_word_ratio = len(set(words)) / max(word_count, 1)
        repetition_score = 1 - unique_word_ratio
        long_word_ratio = sum(len(i) > 8 for i in words) / max(word_count, 1)
        numeric_token_ratio = sum(any(c.isdigit() for c in i) for i in words) / max(word_count, 1)

        return [
            char_count, word_count, sentence_count, avg_word_length,
            digit_ratio, special_ratio, exclamation_count, question_count,
            has_email, gmail_email, yahoo_email, outlook_email,
            salary_present, salary_daily, salary_monthly, salary_hourly,
            avg_sentence_length, unique_word_ratio, repetition_score,
            long_word_ratio, numeric_token_ratio
        ]
        
    @classmethod
    def get_feature_names(cls) -> list:
        return [
            "char_count", "word_count", "sentence_count", "avg_word_length",
            "digit_ratio", "special_ratio", "exclamation_count", "question_count",
            "has_email", "gmail_email", "yahoo_email", "outlook_email",
            "salary_present", "salary_daily", "salary_monthly", "salary_hourly",
            "avg_sentence_length", "unique_word_ratio", "repetition_score",
            "long_word_ratio", "numeric_token_ratio"
        ]
