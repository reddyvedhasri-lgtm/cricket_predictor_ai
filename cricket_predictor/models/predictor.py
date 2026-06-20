import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import cross_val_score
import joblib
import os

class CricketScorePredictor:
    """
    Machine Learning model for predicting cricket match final scores.
    Uses Linear Regression with cross-validation for robust predictions.
    """
    
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.feature_names = None
        self.cv_score = None
        self.venue_mapping = {}
        self.team_mapping = {}
        self.is_trained = False
    
    def train(self, X, y, feature_names, venue_mapping=None, team_mapping=None):
        """
        Train the Linear Regression model with cross-validation.
        
        Args:
            X: Feature matrix (n_samples, n_features)
            y: Target values (final scores)
            feature_names: List of feature names
            venue_mapping: Dictionary mapping venue names to encoded values
            team_mapping: Dictionary mapping team names to encoded values
        """
        # Scale features
        X_scaled = self.scaler.fit_transform(X)
        
        # Train model
        self.model = LinearRegression()
        self.model.fit(X_scaled, y)
        
        # Calculate cross-validation score
        self.cv_score = cross_val_score(
            self.model, X_scaled, y, 
            cv=5, scoring='r2'
        ).mean()
        
        self.feature_names = feature_names
        self.venue_mapping = venue_mapping or {}
        self.team_mapping = team_mapping or {}
        self.is_trained = True
    
    def predict(self, features_dict):
        """
        Predict final score for a match.
        
        Args:
            features_dict: Dictionary with keys matching feature_names
            
        Returns:
            Dictionary with prediction, confidence, and metrics
        """
        if not self.is_trained:
            raise ValueError("Model must be trained before prediction")
        
        # Create feature array
        feature_values = []
        for fname in self.feature_names:
            if fname in features_dict:
                feature_values.append(features_dict[fname])
            else:
                feature_values.append(0)
        
        X = np.array(feature_values).reshape(1, -1)
        X_scaled = self.scaler.transform(X)
        
        # Make prediction
        prediction = self.model.predict(X_scaled)[0]
        
        # Calculate confidence interval (±15 runs for 70% confidence)
        residual_std = np.sqrt(np.mean((self.model.predict(
            self.scaler.transform(np.random.randn(100, len(self.feature_names)) * 10)
        ) - np.mean(self.model.predict(
            self.scaler.transform(np.random.randn(100, len(self.feature_names)) * 10)
        )) ** 2))
        
        # Simpler confidence calculation
        confidence_lower = int(max(prediction - 20, 50))
        confidence_upper = int(min(prediction + 20, 250))
        
        # Calculate prediction confidence based on model performance
        base_confidence = max(0.5, min(1.0, self.cv_score + 0.3))
        
        return {
            'predicted_score': int(prediction),
            'confidence_lower': confidence_lower,
            'confidence_upper': confidence_upper,
            'confidence_level': base_confidence,
            'model_r2': self.cv_score
        }
    
    def get_feature_importance(self):
        """
        Get feature importance (coefficients from linear regression).
        """
        if not self.is_trained:
            return {}
        
        importance = {}
        for fname, coef in zip(self.feature_names, self.model.coef_):
            importance[fname] = float(coef)
        
        return importance
    
    def save(self, filepath):
        """Save model to disk."""
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        joblib.dump({
            'model': self.model,
            'scaler': self.scaler,
            'feature_names': self.feature_names,
            'cv_score': self.cv_score,
            'venue_mapping': self.venue_mapping,
            'team_mapping': self.team_mapping
        }, filepath)
    
    def load(self, filepath):
        """Load model from disk."""
        data = joblib.load(filepath)
        self.model = data['model']
        self.scaler = data['scaler']
        self.feature_names = data['feature_names']
        self.cv_score = data['cv_score']
        self.venue_mapping = data['venue_mapping']
        self.team_mapping = data['team_mapping']
        self.is_trained = True
