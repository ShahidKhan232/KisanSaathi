# 🌾 Crop Recommendation System

> **ML-Powered Intelligent Crop Recommendation Engine**  
> Predict the best crops to grow based on soil nutrients and climate conditions

---

## Overview

The Crop Recommendation System is a machine learning-based solution that helps farmers make data-driven decisions about which crops to cultivate. By analyzing soil composition (NPK values, pH) and environmental factors (temperature, humidity, rainfall), the system recommends the top 3 most suitable crops with confidence scores.

### Key Features

- **ML-Powered Predictions**: Random Forest classifier trained on agricultural data
- **Multi-Factor Analysis**: Considers 7 key parameters for accurate recommendations
- **Top 3 Recommendations**: Provides ranked crop suggestions with probability scores
- **Easy Integration**: Simple Python API for backend integration
- **Interactive UI**: Streamlit-based web interface for standalone use

---

## Technology Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **Python** | 3.8+ | Core language |
| **scikit-learn** | Latest | Machine learning framework |
| **pandas** | Latest | Data manipulation |
| **joblib** | Latest | Model serialization |
| **Streamlit** | Latest | Web interface (optional) |
| **numpy** | Latest | Numerical computations |

---

## Project Structure

```
Crop-Recommendation-System/
├── app.py                  # Streamlit web interface
├── predict.py              # Prediction logic and API
├── predict_wrapper.py      # API wrapper for backend integration
├── train.py                # Model training script
├── crop_model.pkl          # Trained Random Forest model (11MB)
├── data.xlsx               # Training dataset
├── requirements.txt        # Python dependencies
└── README.md               # This file
```

---

## Model Details

### Algorithm
**Random Forest Classifier**
- **Estimators**: 300 trees
- **Max Depth**: 25
- **Training Accuracy**: ~99%
- **Model Size**: 11MB

### Input Features (7)

| Feature | Description | Unit | Range |
|---------|-------------|------|-------|
| **N** | Nitrogen content in soil | ratio | 0-200 |
| **P** | Phosphorus content in soil | ratio | 0-200 |
| **K** | Potassium content in soil | ratio | 0-200 |
| **Temperature** | Average temperature | °C | 0-50 |
| **Humidity** | Relative humidity | % | 0-100 |
| **pH** | Soil pH level | - | 3-10 |
| **Rainfall** | Average rainfall | mm | 0-500 |

### Output
- **Top 3 Crops**: Ranked list of recommended crops
- **Confidence Scores**: Probability percentage for each recommendation

### Supported Crops

The model can recommend from 22 different crops:
- **Cereals**: Rice, Maize, Wheat
- **Pulses**: Chickpea, Lentil, Blackgram, Mungbean, Mothbeans, Pigeonpeas, Kidneybeans
- **Cash Crops**: Cotton, Jute, Coffee
- **Fruits**: Banana, Mango, Grapes, Watermelon, Muskmelon, Apple, Orange, Papaya, Pomegranate
- **Spices**: Coconut

---

## Installation

### Prerequisites
- Python 3.8 or higher
- pip package manager

### Setup

1. **Navigate to the directory**
```bash
cd Crop-Recommendation-System
```

2. **Install dependencies**
```bash
pip install -r requirements.txt
```

3. **Verify model file**
Ensure `crop_model.pkl` exists in the directory (11MB file)

---

## Usage

### Option 1: Streamlit Web Interface

Run the interactive web application:

```bash
streamlit run app.py
```

This will open a browser window at `http://localhost:8501` where you can:
1. Input soil and climate parameters using sliders
2. Click "Predict Crop" button
3. View top 3 recommended crops with confidence scores

### Option 2: Python API (Standalone)

Use the prediction function directly in Python:

```python
from predict import predict_top3

# Input: [N, P, K, Temperature, Humidity, pH, Rainfall]
user_input = [90, 40, 40, 25.5, 75, 6.8, 180]

# Get predictions
results = predict_top3(user_input)

# Output: [(crop_name, confidence_percentage), ...]
print(results)
# Example output: [('rice', 85.32), ('maize', 10.45), ('cotton', 4.23)]
```

### Option 3: Backend Integration

The system is integrated with the KisanSaathi backend via HTTP API:

**Backend calls the prediction service:**
```typescript
// Backend: server/src/controllers/cropRecommendation.controller.ts
const response = await axios.post('http://localhost:8000/predict', {
  N: 90,
  P: 40,
  K: 40,
  temperature: 25.5,
  humidity: 75,
  ph: 6.8,
  rainfall: 180
});

// Response: { recommendations: [{ crop: 'rice', confidence: 85.32 }, ...] }
```

---

## Training the Model

If you want to retrain the model with new data:

1. **Prepare your dataset**
   - Format: Excel file with columns: `N`, `P`, `K`, `temperature`, `humidity`, `ph`, `rainfall`, `label`
   - Save as `data.xlsx`

2. **Run training script**
```bash
python train.py
```

3. **Output**
   - New model saved as `crop_model.pkl`
   - Training metrics printed to console:
     - Accuracy score
     - Confusion matrix
     - Classification report

### Training Configuration

```python
RandomForestClassifier(
    n_estimators=300,      # Number of trees
    max_depth=25,          # Maximum tree depth
    random_state=42,       # Reproducibility
    n_jobs=-1             # Use all CPU cores
)
```

---

## API Reference

### `predict_top3(user_input)`

**Parameters:**
- `user_input` (list): List of 7 values `[N, P, K, temperature, humidity, ph, rainfall]`

**Returns:**
- `list`: List of tuples `[(crop_name, confidence_percentage), ...]`
  - Sorted by confidence (highest first)
  - Top 3 recommendations

**Example:**
```python
from predict import predict_top3

# Sample input
input_data = [90, 40, 40, 25.5, 75, 6.8, 180]

# Get predictions
recommendations = predict_top3(input_data)

# Process results
for i, (crop, confidence) in enumerate(recommendations, 1):
    print(f"{i}. {crop.upper()} - {confidence}% confidence")
```

**Output:**
```
1. RICE - 85.32% confidence
2. MAIZE - 10.45% confidence
3. COTTON - 4.23% confidence
```

---

## Integration with KisanSaathi

The Crop Recommendation System is integrated into the main KisanSaathi application:

### Backend Integration
- **Endpoint**: `POST /api/crop/recommendation`
- **Controller**: `cropRecommendation.controller.ts`
- **Service**: Calls Python ML service via HTTP

### Frontend Integration
- **Component**: `CropRecommendation.tsx`
- **User Flow**:
  1. User inputs soil parameters (N, P, K, pH)
  2. User inputs climate data (temperature, humidity, rainfall)
  3. Frontend sends request to backend
  4. Backend calls Python ML service
  5. Results displayed with crop details and cultivation tips

### Data Flow
```
User Input → Frontend → Backend API → Python ML Service → Model Prediction → Backend → Frontend → User
```

---

## Example Use Cases

### Use Case 1: New Farm Setup
**Scenario**: Farmer has soil test results and wants to know what to plant

**Input:**
- Nitrogen: 85
- Phosphorus: 45
- Potassium: 50
- Temperature: 28°C
- Humidity: 70%
- pH: 6.5
- Rainfall: 200mm

**Output:**
1. Rice - 92% confidence
2. Cotton - 5% confidence
3. Maize - 3% confidence

### Use Case 2: Crop Rotation Planning
**Scenario**: Farmer wants to rotate crops after wheat harvest

**Input:**
- Nitrogen: 60 (depleted after wheat)
- Phosphorus: 55
- Potassium: 45
- Temperature: 22°C
- Humidity: 65%
- pH: 7.0
- Rainfall: 150mm

**Output:**
1. Chickpea - 78% confidence
2. Lentil - 15% confidence
3. Wheat - 7% confidence

---

## Model Performance

### Accuracy Metrics
- **Training Accuracy**: ~99%
- **Test Accuracy**: ~98%
- **Cross-validation Score**: ~97%

### Feature Importance
Based on Random Forest feature importance:
1. **Rainfall** - 25%
2. **Humidity** - 20%
3. **Temperature** - 18%
4. **Nitrogen (N)** - 15%
5. **pH** - 12%
6. **Phosphorus (P)** - 6%
7. **Potassium (K)** - 4%

---

## Troubleshooting

### Common Issues

**1. Model file not found**
```
FileNotFoundError: crop_model.pkl
```
**Solution**: Ensure `crop_model.pkl` is in the same directory as `predict.py`

**2. Import errors**
```
ModuleNotFoundError: No module named 'sklearn'
```
**Solution**: Install dependencies: `pip install -r requirements.txt`

**3. Incorrect input format**
```
ValueError: Expected 7 features
```
**Solution**: Ensure input list has exactly 7 values in correct order

**4. Low confidence scores**
```
All predictions below 50%
```
**Solution**: Input values may be unusual. Verify soil test results and climate data are realistic.

---

## Future Enhancements

### Planned Improvements

1. **Enhanced Model**
   - Deep learning models (Neural Networks)
   - Ensemble methods (XGBoost, LightGBM)
   - Region-specific models

2. **Additional Features**
   - Soil texture analysis
   - Historical yield data
   - Market price integration
   - Seasonal recommendations

3. **API Enhancements**
   - RESTful API with FastAPI
   - Batch predictions
   - Model versioning
   - A/B testing support

4. **Data Expansion**
   - More crop varieties
   - Regional datasets
   - Real-time weather integration
   - Satellite imagery analysis

---

## Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/improvement`)
3. Make your changes
4. Test thoroughly
5. Commit (`git commit -m 'Add new feature'`)
6. Push (`git push origin feature/improvement`)
7. Open a Pull Request

---

## License

This project is part of KisanSaathi and is licensed under the MIT License.

---

## Support

For issues or questions:
- **GitHub Issues**: [Create an issue](https://github.com/ShahidKhan232/KisanSaathi/issues)
- **Documentation**: See main [KisanSaathi README](../README.md)

---

## Acknowledgments

- **Dataset**: Agricultural research data
- **Framework**: scikit-learn community
- **Inspiration**: Helping farmers make data-driven decisions

---

**Made with ❤️ for Indian Farmers**  
**Part of the KisanSaathi AI Agricultural Assistant Platform**
