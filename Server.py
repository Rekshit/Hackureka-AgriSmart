# ==========================================
# IMPORT LIBRARIES
# ==========================================
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import pandas as pd
import numpy as np
from xgboost import XGBRegressor
import os
import logging
import json
import bcrypt
import jwt
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app)

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# JWT secret and settings
JWT_SECRET = os.environ.get('JWT_SECRET', 'dev-secret-change-me')
JWT_ALGO = 'HS256'
JWT_EXP_DAYS = 7

# Bookings storage (simple JSON file)
BOOKINGS_FILE = os.path.join(os.getcwd(), 'bookings.json')

def load_bookings():
    try:
        if os.path.exists(BOOKINGS_FILE):
            with open(BOOKINGS_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
    except Exception as e:
        logger.error(f'Failed to load bookings: {e}')
    return []

def save_booking(b):
    try:
        data = load_bookings()
        data.append(b)
        with open(BOOKINGS_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        return True
    except Exception as e:
        logger.error(f'Failed to save booking: {e}')
        return False

# ==========================================
# FUNCTION TO TRAIN MODEL AND PREDICT NEXT 15 DAYS
# ==========================================
def train_and_predict(file_path, crop_name):
    try:
        # Load Excel once
        logger.info(f"Loading data from {file_path}")
        df = pd.read_excel(file_path)
        
        if df.empty:
            raise ValueError(f"No data found in {file_path}")
        
        logger.info(f"Loaded {len(df)} rows for {crop_name}")

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
        
        if daily_df.empty:
            raise ValueError("Insufficient data after processing (all rows dropped)")

        features = ['RainFall', 'Year', 'Month_Number', 'Day',
                    'price_lag1', 'RainFall_lag1',
                    'price_lag2', 'RainFall_lag2',
                    'price_roll3', 'RainFall_roll3']

        X = daily_df[features]
        y = daily_df['price']
        
        if len(X) < 10:
            raise ValueError("Insufficient training data")

        # Train XGBoost model
        logger.info(f"Training XGBoost model for {crop_name}")
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

        logger.info(f"Generating 15-day predictions for {crop_name}")
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
            
            if not isinstance(predicted_price, (int, float)) or np.isnan(predicted_price):
                raise ValueError(f"Invalid prediction: {predicted_price}")

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

        logger.info(f"Successfully generated predictions for {crop_name}")
        return future_predictions
    except Exception as e:
        logger.error(f"Error in train_and_predict for {crop_name}: {str(e)}")
        raise

# ==========================================
# ROUTES
# ==========================================
@app.route("/")
def home():
    try:
        return jsonify({
            "status": "ok",
            "message": "Crop Prediction API Running",
            "version": "1.0"
        }), 200
    except Exception as e:
        logger.error(f"Error in home route: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500


# ----------------------
# Authentication endpoints
# ----------------------
@app.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json() or {}
        name = data.get('name')
        email = data.get('email')
        password = data.get('password')
        if not name or not email or not password:
            return jsonify({'error': 'name,email,password required'}), 400

        # store users in a simple JSON in workspace (demo only)
        users_file = os.path.join(os.getcwd(), 'users.json')
        users = []
        if os.path.exists(users_file):
            try:
                with open(users_file, 'r', encoding='utf-8') as f:
                    users = json.load(f)
            except Exception:
                users = []

        if any(u.get('email') == email for u in users):
            return jsonify({'error': 'user_exists'}), 409

        pw_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        user = {'id': int(datetime.utcnow().timestamp()), 'name': name, 'email': email, 'password': pw_hash}
        users.append(user)
        with open(users_file, 'w', encoding='utf-8') as f:
            json.dump(users, f, indent=2)

        token = jwt.encode({'sub': email, 'exp': datetime.utcnow() + timedelta(days=JWT_EXP_DAYS)}, JWT_SECRET, algorithm=JWT_ALGO)
        return jsonify({'token': token, 'user': {'name': name, 'email': email}})
    except Exception as e:
        logger.error(f'register error: {e}')
        return jsonify({'error': 'server_error'}), 500


@app.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json() or {}
        email = data.get('email')
        password = data.get('password')
        if not email or not password:
            return jsonify({'error': 'email,password required'}), 400

        users_file = os.path.join(os.getcwd(), 'users.json')
        users = []
        if os.path.exists(users_file):
            try:
                with open(users_file, 'r', encoding='utf-8') as f:
                    users = json.load(f)
            except Exception:
                users = []

        user = next((u for u in users if u.get('email') == email), None)
        if not user:
            return jsonify({'error': 'invalid_credentials'}), 401

        stored = user.get('password') or user.get('passwordHash') or ''
        if not bcrypt.checkpw(password.encode('utf-8'), stored.encode('utf-8')):
            return jsonify({'error': 'invalid_credentials'}), 401

        token = jwt.encode({'sub': email, 'exp': datetime.utcnow() + timedelta(days=JWT_EXP_DAYS)}, JWT_SECRET, algorithm=JWT_ALGO)
        return jsonify({'token': token, 'user': {'name': user.get('name'), 'email': email}})
    except Exception as e:
        logger.error(f'login error: {e}')
        return jsonify({'error': 'server_error'}), 500


@app.route('/book', methods=['POST'])
def book():
    try:
        data = request.get_json() or {}
        item = data.get('item')
        dates = data.get('dates') or data.get('date') or datetime.utcnow().isoformat()
        cost = data.get('cost') or 0
        if not item:
            return jsonify({'error': 'item required'}), 400
        booking = {'id': int(datetime.utcnow().timestamp()), 'item': item, 'dates': dates, 'cost': cost}
        ok = save_booking(booking)
        if not ok:
            return jsonify({'error': 'save_failed'}), 500
        return jsonify({'status': 'ok', 'booking': booking})
    except Exception as e:
        logger.error(f'book error: {e}')
        return jsonify({'error': 'server_error'}), 500


@app.route('/assets/<path:p>')
def assets(p):
    # Serve Pictures/ folder and other static files if needed
    static_dir = os.path.join(os.getcwd(), 'x')
    return send_from_directory(static_dir, p)

@app.route("/predict", methods=["GET"])
def predict():
    try:
        file_map = {
            "Wheat": os.path.join(os.getcwd(), "wheat.xlsx"),
            "Millet": os.path.join(os.getcwd(), "millet.xlsx"),
            "Sunflower": os.path.join(os.getcwd(), "sunflower.xlsx"),
            "Cotton": os.path.join(os.getcwd(), "cotton.xlsx"),
            "Maize": os.path.join(os.getcwd(), "maize.xlsx")
        }

        crop = request.args.get("crop", "").strip()
        if not crop:
            logger.warning("Missing crop parameter")
            return jsonify({"error": "Crop parameter required", "valid_crops": list(file_map.keys())}), 400
        
        logger.info(f"Received prediction request for crop: {crop}")

        if crop not in file_map:
            logger.warning(f"Invalid crop selected: {crop}")
            return jsonify({"error": f"Invalid crop '{crop}'. Valid crops: {list(file_map.keys())}"}), 400

        file_path = file_map[crop]
        
        if not os.path.exists(file_path):
            logger.error(f"Data file not found: {file_path}")
            return jsonify({"error": f"Data file for {crop} not available. Please check server setup."}), 503
        
        logger.info(f"Processing file: {file_path}")

        predictions = train_and_predict(file_path, crop)
        logger.info(f"Generated {len(predictions)} predictions for {crop}")
        return jsonify(predictions)
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        return jsonify({"error": f"Data error: {str(e)}"}), 422
    except Exception as e:
        logger.error(f"Unexpected error in predict: {str(e)}")
        return jsonify({"error": "Prediction failed. Please try again later."}), 500

# ==========================================
# ERROR HANDLERS
# ==========================================
@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Endpoint not found"}), 404

@app.errorhandler(500)
def internal_error(error):
    logger.error(f"Internal error: {str(error)}")
    return jsonify({"error": "Internal server error"}), 500

# ==========================================
# RUN SERVER
# ==========================================
if __name__ == "__main__":
    try:
        port = int(os.environ.get("PORT", 5000))
        logger.info(f"Starting Crop Prediction API on port {port}")
        app.run(host="0.0.0.0", port=port, debug=False)
    except Exception as e:
        logger.error(f"Failed to start server: {str(e)}")
        raise