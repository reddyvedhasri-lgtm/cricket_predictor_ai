def generate_match_insights(input_data, prediction):
    """
    Generate AI-powered insights based on match conditions and predictions.
    """
    insights = []
    score = prediction['predicted_score']
    confidence = prediction['confidence_level']
    overs = input_data.get('overs', 0)
    wickets = input_data.get('wickets_down', 0)
    run_rate = input_data.get('run_rate', 0)
    current_score = input_data.get('current_score', 0)
    
    # Pace analysis
    if run_rate > 8.5:
        insights.append({
            'title': '⚡ High Scoring Pace',
            'description': f'Current run rate of {run_rate:.2f} suggests aggressive batting. Expected to maintain this momentum.',
            'type': 'positive'
        })
    elif run_rate < 6:
        insights.append({
            'title': '🛡️ Defensive Approach',
            'description': f'Lower run rate of {run_rate:.2f} indicates cautious batting. Potential acceleration expected.',
            'type': 'neutral'
        })
    
    # Wickets analysis
    if wickets <= 2:
        insights.append({
            'title': '✨ Strong Batting Lineup',
            'description': f'Only {wickets} wickets down - top/middle order likely intact. Good scoring prospects.',
            'type': 'positive'
        })
    elif wickets >= 6:
        insights.append({
            'title': '⚠️ Batting Collapse Risk',
            'description': f'With {wickets} wickets lost, lower-middle order batting. Final score may be limited.',
            'type': 'warning'
        })
    
    # Overs analysis
    if overs < 10:
        insights.append({
            'title': '🎯 Early Stage Match',
            'description': f'Only {overs} overs bowled. Significant potential for score changes. Prediction confidence will improve.',
            'type': 'neutral'
        })
    elif overs >= 18:
        insights.append({
            'title': '🏁 Final Stage Match',
            'description': f'{overs} overs bowled. Limited overs remaining. Current trajectory highly indicative of final score.',
            'type': 'positive'
        })
    
    # Score prediction analysis
    if score > 180:
        insights.append({
            'title': '🚀 High Score Expected',
            'description': f'Prediction of {score} runs is above average. Indicates strong batting performance.',
            'type': 'positive'
        })
    elif score < 130:
        insights.append({
            'title': '📉 Below Par Score',
            'description': f'Prediction of {score} runs is below tournament average. Bowling likely dominating.',
            'type': 'warning'
        })
    
    # Confidence analysis
    if confidence < 0.65:
        insights.append({
            'title': '🔄 High Volatility',
            'description': 'Model confidence is moderate. Score could swing based on next few overs.',
            'type': 'neutral'
        })
    
    return insights

def generate_recommendations(input_data, prediction):
    """
    Generate strategic recommendations based on analysis.
    """
    recommendations = []
    
    # Batting recommendations
    if input_data.get('run_rate', 0) < 7:
        recommendations.append('Increase scoring rate - look for boundaries in death overs')
    
    # Bowling recommendations
    if prediction['predicted_score'] > 170:
        recommendations.append('Tighten bowling in death overs - target is high')
    
    # Fielding recommendations
    if input_data.get('wickets_down', 0) <= 2:
        recommendations.append('Maintain aggressive field placements - batsmen in form')
    
    return recommendations

def get_venue_impact(venue):
    """
    Get expected impact of venue on scoring.
    """
    high_scoring_venues = [
        'Wankhede Stadium', 'Arun Jaitley Stadium', 'Narendra Modi Stadium',
        'Abu Dhabi', 'Eden Gardens'
    ]
    
    if venue in high_scoring_venues:
        return {
            'type': 'high_scoring',
            'description': f'{venue} is known for high-scoring matches',
            'multiplier': 1.1
        }
    
    return {
        'type': 'neutral',
        'description': f'{venue} - typical scoring venue',
        'multiplier': 1.0
    }

def format_confidence_text(confidence_level):
    """Format confidence level as readable text."""
    if confidence_level >= 0.85:
        return 'Very High'
    elif confidence_level >= 0.75:
        return 'High'
    elif confidence_level >= 0.65:
        return 'Moderate'
    else:
        return 'Low'
