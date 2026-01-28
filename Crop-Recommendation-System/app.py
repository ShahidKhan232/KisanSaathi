import streamlit as st
from predict import predict_top3

st.set_page_config(page_title="Crop Recommendation System", page_icon="🌾")

st.title("🌾 Crop Recommendation System")

N = st.number_input("Nitrogen (N)", 0, 200, 50)
P = st.number_input("Phosphorus (P)", 0, 200, 50)
K = st.number_input("Potassium (K)", 0, 200, 50)
temperature = st.number_input("Temperature (°C)", value=25.0)
humidity = st.number_input("Humidity (%)", value=70.0)
ph = st.number_input("Soil pH", value=6.5)
rainfall = st.number_input("Rainfall (mm)", value=150.0)

if st.button("Predict Crop"):
    user_input = [N, P, K, temperature, humidity, ph, rainfall]
    results = predict_top3(user_input)

    st.success("🌱 Top 3 Recommended Crops")

    for i, (crop, prob) in enumerate(results, start=1):
        st.write(f"**{i}. {crop.upper()}** — {prob}% probability")
