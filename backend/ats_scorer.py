import fitz  # PyMuPDF
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import re

# We will load spacy lazily to avoid slowing down startup
_nlp = None

def get_nlp():
    global _nlp
    if _nlp is None:
        import spacy
        try:
            _nlp = spacy.load("en_core_web_sm")
        except Exception as e:
            print("Downloading spacy model...")
            import subprocess
            import sys
            subprocess.check_call([sys.executable, "-m", "spacy", "download", "en_core_web_sm"])
            _nlp = spacy.load("en_core_web_sm")
    return _nlp

def extract_text_from_pdf(file_bytes: bytes) -> str:
    """
    Extracts raw text from a PDF file buffer using PyMuPDF.
    """
    try:
        text = ""
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        for page in doc:
            text += page.get_text()
        return text
    except Exception as e:
        print(f"Error parsing PDF: {e}")
        return ""

def calculate_ats_score(resume_text: str, job_description: str) -> dict:
    """
    Calculates a premium ATS match score using spaCy NLP and TF-IDF Cosine Similarity.
    """
    if not resume_text or not job_description:
        return {
            "overall_score": 0,
            "keyword_match": 0,
            "formatting_score": 0,
            "impact_metrics": 0,
            "feedback": "Empty resume or job description provided."
        }
        
    resume_clean = re.sub(r'\W+', ' ', resume_text).lower()
    job_clean = re.sub(r'\W+', ' ', job_description).lower()
    
    # 1. Base Keyword Match (TF-IDF Cosine Similarity)
    try:
        vectorizer = TfidfVectorizer(stop_words='english')
        tfidf_matrix = vectorizer.fit_transform([resume_clean, job_clean])
        cosine_sim = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
        base_keyword_score = cosine_sim * 100
    except Exception:
        base_keyword_score = 0

    # 2. Advanced NLP Analysis using spaCy
    nlp = get_nlp()
    doc_resume = nlp(resume_text)
    doc_job = nlp(job_description)
    
    # Extract Target Skills/Keywords (Noun chunks and proper nouns from JD)
    job_keywords = set([chunk.text.lower().strip() for chunk in doc_job.noun_chunks if len(chunk.text) > 3])
    resume_keywords = set([chunk.text.lower().strip() for chunk in doc_resume.noun_chunks if len(chunk.text) > 3])
    
    # Calculate Semantic Match
    if len(job_keywords) > 0:
        matched_skills = job_keywords.intersection(resume_keywords)
        semantic_score = (len(matched_skills) / len(job_keywords)) * 100
    else:
        semantic_score = base_keyword_score

    # Final Keyword Score blends TF-IDF and spaCy Semantic Match
    final_keyword_match = int((base_keyword_score * 0.4) + (semantic_score * 0.6))
    if final_keyword_match > 100: final_keyword_match = 100
        
    # 3. Formatting Score (Structural Heuristics)
    formatting_score = 60
    if len(resume_text) > 500: formatting_score += 10
    if re.search(r'(experience|education|skills|projects)', resume_clean): formatting_score += 15
    if resume_text.count('•') > 5 or resume_text.count('-') > 10: formatting_score += 10
    # Bonus for clean entity extraction (indicates well-formatted text)
    if len(doc_resume.ents) > 10: formatting_score += 5
    if formatting_score > 100: formatting_score = 100
    
    # 4. Premium Impact Metrics (spaCy Named Entity Recognition)
    # ATS systems love quantifiable achievements. We use NLP to find numbers, money, and dates.
    impact_score = 30
    dates_found = len([ent for ent in doc_resume.ents if ent.label_ == "DATE"])
    money_found = len([ent for ent in doc_resume.ents if ent.label_ == "MONEY"])
    percent_found = len([ent for ent in doc_resume.ents if ent.label_ == "PERCENT"])
    cardinals_found = len([ent for ent in doc_resume.ents if ent.label_ == "CARDINAL"])
    
    impact_score += (dates_found * 2) + (money_found * 5) + (percent_found * 5) + (cardinals_found * 1)
    if impact_score > 100: impact_score = 100
    
    # Calculate overall weighted score
    overall_score = int((final_keyword_match * 0.6) + (formatting_score * 0.2) + (impact_score * 0.2))
    
    # Generate AI Feedback
    if overall_score > 80:
        feedback = "Excellent match! Your resume is highly optimized with strong NLP entity matches and impact metrics."
    elif overall_score > 50:
        feedback = "Good start. Try to include more exact noun phrases from the job description and quantify your achievements."
    else:
        feedback = "Low match. You are missing critical NLP semantic keywords. Consider completely tailoring your resume to the posting."

    # Extract Technical Skills
    common_tech = {"python", "javascript", "react", "node.js", "aws", "docker", "kubernetes", "sql", "machine learning", "data science", "html", "css", "typescript", "java", "c++", "c#", "go", "php", "ruby", "django", "flask", "fastapi", "vue", "angular", "git", "linux", "gcp", "azure", "next.js", "mongodb", "postgresql", "mysql", "redis", "graphql", "rest api"}
    found_tech = []
    for tech in common_tech:
        if tech in resume_clean:
            found_tech.append(tech.title() if tech != "node.js" and tech != "next.js" else tech.capitalize())
            
    # Add some generic noun chunks to fill it out
    for chunk in doc_resume.noun_chunks:
        if 3 < len(chunk.text) < 20 and chunk.text.lower() not in common_tech:
            # simple filter to avoid junk
            if not any(char.isdigit() for char in chunk.text):
                found_tech.append(chunk.text.title())
        if len(found_tech) > 15:
            break
            
    found_tech = list(set(found_tech))[:15] # cap at 15 skills

    return {
        "overall_score": overall_score,
        "keyword_match": final_keyword_match,
        "formatting_score": formatting_score,
        "impact_metrics": impact_score,
        "feedback": feedback,
        "extracted_skills": found_tech
    }
