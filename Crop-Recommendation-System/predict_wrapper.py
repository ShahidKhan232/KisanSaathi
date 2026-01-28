import sys
import json
import joblib
import pandas as pd
import os

# Load model relative to current script path
current_dir = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(current_dir, "crop_model.pkl")

try:
    model = joblib.load(model_path)
except Exception as e:
    print(json.dumps({"error": f"Failed to load model: {str(e)}"}))
    sys.exit(1)

FEATURES = ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"]

def predict(args):
    try:
        # Parse inputs
        # Expected args: N P K temperature humidity ph rainfall
        if len(args) != 7:
            raise ValueError("Expected 7 features: N, P, K, temperature, humidity, ph, rainfall")
            
        inputs = [float(x) for x in args]
        
        # Create DataFrame
        df = pd.DataFrame([inputs], columns=FEATURES)
        
        # Predict probability
        probs = model.predict_proba(df)[0]
        classes = model.classes_
        
        results = list(zip(classes, probs))
        results = sorted(results, key=lambda x: x[1], reverse=True)
        
        # Top 3
        top3 = [
            {"crop": crop, "probability": round(prob * 100, 2)}
            for crop, prob in results[:3]
        ]
        
        print(json.dumps({"success": True, "recommendations": top3}))
        
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))

if __name__ == "__main__":
    # Skipping script name in argv
    predict(sys.argv[1:])
