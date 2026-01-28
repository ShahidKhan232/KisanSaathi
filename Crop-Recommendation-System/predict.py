import pandas as pd
import joblib
import numpy as np

model = joblib.load("crop_model.pkl")

FEATURES = ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"]

def predict_top3(user_input):
    df = pd.DataFrame([user_input], columns=FEATURES)

    probs = model.predict_proba(df)[0]
    classes = model.classes_

    results = list(zip(classes, probs))
    results = sorted(results, key=lambda x: x[1], reverse=True)

    top3 = results[:3]
    return [(crop, round(prob * 100, 2)) for crop, prob in top3]

if __name__ == "__main__":
    sample = [90, 40, 40, 25.5, 75, 6.8, 180]
    print(predict_top3(sample))
