import joblib
from pathlib import Path

class ModelLoader:
    """
    Singleton class to load and hold ML models in memory.
    This ensures models are loaded exactly once when the application starts,
    preventing overhead on every inference request.
    """
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ModelLoader, cls).__new__(cls)
            cls._instance.model = None
            cls._instance.threshold = None
        return cls._instance

    def load(self, model_path="models/saved/fake_job_nlp_model_improved.pkl", threshold_path="models/saved/fake_job_threshold.pkl"):
        """Loads models into memory if they aren't already loaded."""
        if self.model is None or self.threshold is None:
            print("Loading improved NLP models into memory...")
            # Resolve path relative to project root
            base_dir = Path(__file__).resolve().parent.parent.parent
            
            self.model = joblib.load(base_dir / model_path)
            self.threshold = joblib.load(base_dir / threshold_path)
            print("Improved NLP Models loaded successfully.")
            
        return self.model, self.threshold

# Global singleton instance to be imported by inference scripts or FastAPI app
model_manager = ModelLoader()
