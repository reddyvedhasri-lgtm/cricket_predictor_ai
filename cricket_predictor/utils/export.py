import pandas as pd
from datetime import datetime
import json

def export_prediction_to_json(prediction_data, match_info):
    """
    Export prediction results to JSON format.
    
    Args:
        prediction_data: Dictionary with prediction results
        match_info: Dictionary with match information
    
    Returns:
        JSON string
    """
    export_data = {
        'timestamp': datetime.now().isoformat(),
        'match_info': match_info,
        'prediction': {
            'predicted_final_score': prediction_data['predicted_score'],
            'confidence_range': f"{prediction_data['confidence_lower']}-{prediction_data['confidence_upper']}",
            'confidence_level': f"{int(prediction_data['confidence_level'] * 100)}%",
            'model_r2_score': round(prediction_data['model_r2'], 3)
        }
    }
    
    return json.dumps(export_data, indent=2)

def export_prediction_to_csv(match_history):
    """
    Export match history to CSV format.
    
    Args:
        match_history: List of match prediction dictionaries
    
    Returns:
        CSV string
    """
    df = pd.DataFrame(match_history)
    df['timestamp'] = pd.to_datetime(df['timestamp']).dt.strftime('%Y-%m-%d %H:%M:%S')
    df['confidence'] = (df['confidence'] * 100).round(1).astype(str) + '%'
    
    return df.to_csv(index=False)

def generate_match_report(prediction_data, match_info, insights):
    """
    Generate a detailed match analysis report.
    
    Args:
        prediction_data: Dictionary with prediction results
        match_info: Dictionary with match information
        insights: List of insight dictionaries
    
    Returns:
        Formatted report string
    """
    report = f"""
╔════════════════════════════════════════════════════════════════════╗
║           CRICKET SCORE PREDICTION REPORT                          ║
╚════════════════════════════════════════════════════════════════════╝

MATCH INFORMATION
─────────────────────────────────────────────────────────────────────
Venue: {match_info.get('venue', 'N/A')}
Team: {match_info.get('team', 'N/A')}
Overs Bowled: {match_info.get('overs', 'N/A')}
Current Score: {match_info.get('current_score', 'N/A')}
Wickets Down: {match_info.get('wickets', 'N/A')}
Run Rate: {match_info.get('run_rate', 'N/A')} RPO

PREDICTION RESULTS
─────────────────────────────────────────────────────────────────────
Predicted Final Score: {prediction_data['predicted_score']} runs
Confidence Range: {prediction_data['confidence_lower']}-{prediction_data['confidence_upper']} runs
Model Confidence: {int(prediction_data['confidence_level'] * 100)}%
Model R² Score: {prediction_data['model_r2']:.3f}

KEY INSIGHTS
─────────────────────────────────────────────────────────────────────
"""
    
    for i, insight in enumerate(insights, 1):
        report += f"{i}. {insight['title']}\n"
        report += f"   {insight['description']}\n\n"
    
    report += f"""
REPORT GENERATED: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
─────────────────────────────────────────────────────────────────────
"""
    
    return report

class MatchSimulator:
    """
    Simulate different match scenarios to analyze outcomes.
    """
    
    @staticmethod
    def simulate_scenarios(base_params, predictor):
        """
        Generate predictions for different scenarios.
        
        Args:
            base_params: Dictionary with base match parameters
            predictor: CricketScorePredictor instance
        
        Returns:
            Dictionary with scenario predictions
        """
        scenarios = {}
        
        # Scenario 1: Accelerated Scoring
        accelerated = base_params.copy()
        accelerated['run_rate'] = min(accelerated['run_rate'] * 1.3, 15)
        scenarios['accelerated'] = predictor.predict(accelerated)
        
        # Scenario 2: Conservative Approach
        conservative = base_params.copy()
        conservative['run_rate'] = max(accelerated['run_rate'] * 0.8, 2)
        scenarios['conservative'] = predictor.predict(conservative)
        
        # Scenario 3: Wicket Loss
        if base_params['wickets_down'] < 9:
            wicket_loss = base_params.copy()
            wicket_loss['wickets_down'] = base_params['wickets_down'] + 2
            scenarios['wicket_loss'] = predictor.predict(wicket_loss)
        
        # Scenario 4: Aggressive Finish
        aggressive = base_params.copy()
        aggressive['run_rate'] = min(aggressive['run_rate'] * 1.5, 15)
        if aggressive['overs'] < 15:
            aggressive['overs'] = 15
        scenarios['aggressive_finish'] = predictor.predict(aggressive)
        
        return scenarios

def create_recommendation_summary(scenarios):
    """
    Create a summary of recommendations based on scenarios.
    
    Args:
        scenarios: Dictionary of scenario predictions
    
    Returns:
        Dictionary with recommendations
    """
    recommendations = {
        'best_case': scenarios.get('accelerated', {}).get('predicted_score', 0),
        'worst_case': scenarios.get('conservative', {}).get('predicted_score', 0),
        'most_likely': max(
            scenarios.get('conservative', {}).get('predicted_score', 0),
            scenarios.get('accelerated', {}).get('predicted_score', 0)
        ) / 2,
        'recommended_strategy': 'Maintain current run rate while maximizing boundaries'
    }
    
    return recommendations
