import pandas as pd
import numpy as np
from datetime import datetime, timedelta

def generate_sample_data(n_matches=500):
    """
    Generate realistic IPL-style cricket match data for model training.
    """
    np.random.seed(42)
    
    venues = [
        "Eden Gardens", "Arun Jaitley Stadium", "Narendra Modi Stadium",
        "MA Chidambaram Stadium", "Rajiv Gandhi Cricket Stadium", 
        "Wankhede Stadium", "Dr. Y.S. Rajasekhara Reddy Cricket Stadium",
        "Punjab Cricket Association Stadium", "Holkar Cricket Stadium",
        "Barabati Stadium", "ISM Cricket Ground", "Abu Dhabi"
    ]
    
    teams = [
        "Mumbai Indians", "Chennai Super Kings", "Delhi Capitals",
        "Royal Challengers Bangalore", "Kolkata Knight Riders",
        "Rajasthan Royals", "Punjab Kings", "Sunrisers Hyderabad",
        "Gujarat Titans", "Lucknow Super Giants"
    ]
    
    data = []
    
    for _ in range(n_matches):
        overs = np.random.randint(5, 20)  # Matches can be shortened
        balls_faced = np.random.randint(10, overs * 6)
        current_score = np.random.randint(20, 180)
        wickets_down = np.random.randint(0, 10)
        run_rate = current_score / (balls_faced / 6) if balls_faced > 0 else 0
        run_rate = min(run_rate, 15)  # Cap run rate at realistic maximum
        
        # Model venue impact
        venue_impact = np.random.uniform(0.85, 1.15)
        
        # Final score with some noise and correlation
        base_score = (
            current_score * 1.3 +
            max(0, (10 - wickets_down) * 2) +
            run_rate * 5 +
            np.random.normal(0, 10)
        ) * venue_impact
        
        final_score = int(max(current_score, base_score))
        final_score = min(max(final_score, 50), 250)
        
        data.append({
            'overs': overs,
            'balls_faced': balls_faced,
            'current_score': current_score,
            'wickets_down': wickets_down,
            'run_rate': run_rate,
            'venue': np.random.choice(venues),
            'batting_team': np.random.choice(teams),
            'venue_impact': venue_impact,
            'final_score': final_score
        })
    
    df = pd.DataFrame(data)
    
    # Encode categorical variables
    venue_mapping = {venue: i for i, venue in enumerate(set(df['venue']))}
    team_mapping = {team: i for i, team in enumerate(set(df['batting_team']))}
    
    df['venue_encoded'] = df['venue'].map(venue_mapping)
    df['team_encoded'] = df['batting_team'].map(team_mapping)
    
    return df, venue_mapping, team_mapping

def create_training_features(df):
    """
    Create feature matrix for model training.
    """
    features = [
        'overs', 'balls_faced', 'current_score', 
        'wickets_down', 'run_rate', 'venue_encoded', 'team_encoded'
    ]
    
    X = df[features].values
    y = df['final_score'].values
    
    return X, y, features
