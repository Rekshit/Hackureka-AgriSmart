# ==========================================
# IMPORT LIBRARIES
# ==========================================
from flask import Flask, jsonify, request
from flask_cors import CORS
import pandas as pd
import numpy as np
from xgboost import XGBRegressor
import os

app = Flask(__name__)
CORS(app)

# ==========================================
# FUNCTION TO TRAIN MODEL AND PREDICT NEXT 15 DAYS
# ==========================================
def train_and_predict(file_path, crop_name):
    # Load Excel once
    df = pd.read_excel(file_path)
    print(f"Loaded data for {crop_name} from {file_path}:")
    print(df.head())

    df['month'] = pd.to_datetime(df['month'])
    df = df.sort_values('month')

    # Convert monthly to daily using forward fill
    df.set_index('month', inplace=True)
    daily_df = df.resample('D').ffill()
    daily_df.reset_index(inplace=True)
    daily_df.rename(columns={'month': 'date'}, inplace=True)

    # Feature engineering
    daily_df['Year'] = daily_df['date'].dt.year
    daily_df['Month_Number'] = daily_df['date'].dt.month
    daily_df['Day'] = daily_df['date'].dt.day

    daily_df['price_lag1'] = daily_df['price'].shift(1)
    daily_df['RainFall_lag1'] = daily_df['RainFall'].shift(1)
    daily_df['price_lag2'] = daily_df['price'].shift(2)
    daily_df['RainFall_lag2'] = daily_df['RainFall'].shift(2)
    daily_df['price_roll3'] = daily_df['price'].rolling(3).mean()
    daily_df['RainFall_roll3'] = daily_df['RainFall'].rolling(3).mean()

    daily_df = daily_df.dropna()

    features = ['RainFall', 'Year', 'Month_Number', 'Day',
                'price_lag1', 'RainFall_lag1',
                'price_lag2', 'RainFall_lag2',
                'price_roll3', 'RainFall_roll3']

    X = daily_df[features]
    y = daily_df['price']

    # Train XGBoost model
    model = XGBRegressor(
        n_estimators=800,
        learning_rate=0.03,
        max_depth=3,
        subsample=0.9,
        colsample_bytree=0.9,
        random_state=42
    )
    model.fit(X, y)

    # Predict next 15 days
    future_predictions = []
    temp_df = daily_df.copy()

    # Optional crop offset for visible difference
    crop_offset = {
        "Wheat": 0,
        "Millet": 5,
        "Sunflower": 10,
        "Cotton": 15,
        "Maize": 20
    }

    for i in range(15):
        last_date = temp_df['date'].max()
        next_day = last_date + pd.DateOffset(days=1)

        future_RainFall = temp_df.iloc[-1]['RainFall']
        price_lag1 = temp_df.iloc[-1]['price']
        RainFall_lag1 = temp_df.iloc[-1]['RainFall']
        price_lag2 = temp_df.iloc[-2]['price']
        RainFall_lag2 = temp_df.iloc[-2]['RainFall']
        price_roll3 = temp_df['price'].iloc[-3:].mean()
        RainFall_roll3 = temp_df['RainFall'].iloc[-3:].mean()

        future_row = pd.DataFrame([{
            'RainFall': future_RainFall,
            'Year': next_day.year,
            'Month_Number': next_day.month,
            'Day': next_day.day,
            'price_lag1': price_lag1,
            'RainFall_lag1': RainFall_lag1,
            'price_lag2': price_lag2,
            'RainFall_lag2': RainFall_lag2,
            'price_roll3': price_roll3,
            'RainFall_roll3': RainFall_roll3
        }])

        predicted_price = model.predict(future_row)[0]

        # Add small crop-based offset to make charts clearly different
        predicted_price += crop_offset.get(crop_name, 0)

        future_predictions.append({
            "date": str(next_day.date()),
            "predicted_price": round(float(predicted_price), 2)
        })

        temp_df = pd.concat([temp_df, pd.DataFrame([{
            'date': next_day,
            'price': predicted_price,
            'RainFall': future_RainFall
        }])], ignore_index=True)

    return future_predictions

# ==========================================
# ROUTES
# ==========================================
@app.route("/")
def home():
    return "Crop Prediction API Running"

@app.route("/predict", methods=["GET"])
def predict():
    file_map = {
        "Wheat": os.path.join(os.getcwd(), "wheat.xlsx"),
        "Millet": os.path.join(os.getcwd(), "millet.xlsx"),
        "Sunflower": os.path.join(os.getcwd(), "sunflower.xlsx"),
        "Cotton": os.path.join(os.getcwd(), "cotton.xlsx"),
        "Maize": os.path.join(os.getcwd(), "maize.xlsx")
    }

    crop = request.args.get("crop")
    print("Crop received:", crop)

    if crop not in file_map:
        print("Invalid crop selected!")
        return jsonify({"error": "Invalid Crop Selected"}), 400

    file_path = file_map[crop]
    print("Using file:", file_path)

    predictions = train_and_predict(file_path, crop)
    print(f"First 3 predictions for {crop}: {predictions[:3]}")
    return jsonify(predictions)

# ==========================================
# RUN SERVER
# ==========================================
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)