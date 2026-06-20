import pandas as pd
import numpy as np
import plotly.graph_objects as go
import plotly.express as px
from plotly.subplots import make_subplots

def create_score_trajectory_chart(overs, current_score, wickets, run_rate):
    """
    Create a chart showing projected score trajectory.
    """
    # Simulate remaining overs
    max_overs = 20
    overs_remaining = max_overs - overs
    
    # Create trajectory
    overs_arr = np.arange(0, overs_remaining + 1)
    wicket_factor = max(0.7, 1 - (wickets / 10 * 0.3))
    
    # Conservative, realistic, and optimistic scenarios
    conservative = current_score + (overs_arr * run_rate * 0.7 * wicket_factor)
    realistic = current_score + (overs_arr * run_rate * wicket_factor)
    optimistic = current_score + (overs_arr * run_rate * 1.2 * wicket_factor)
    
    fig = go.Figure()
    
    fig.add_trace(go.Scatter(
        x=overs + overs_arr,
        y=optimistic,
        fill=None,
        mode='lines',
        line_color='rgba(34, 197, 94, 0)',
        showlegend=False
    ))
    
    fig.add_trace(go.Scatter(
        x=overs + overs_arr,
        y=conservative,
        fill='tonexty',
        mode='lines',
        line_color='rgba(34, 197, 94, 0)',
        name='Optimistic Range',
        fillcolor='rgba(34, 197, 94, 0.1)',
        showlegend=True
    ))
    
    fig.add_trace(go.Scatter(
        x=overs + overs_arr,
        y=realistic,
        mode='lines+markers',
        line=dict(color='#22c55e', width=3),
        marker=dict(size=6),
        name='Realistic Path'
    ))
    
    fig.update_layout(
        title='Score Trajectory Projection',
        xaxis_title='Overs',
        yaxis_title='Runs',
        template='plotly_white',
        height=400,
        hovermode='x unified'
    )
    
    return fig

def create_wicket_impact_chart(training_data):
    """
    Show how wicket loss impacts final score.
    """
    wicket_analysis = training_data.groupby('wickets_down')['final_score'].agg(['mean', 'std', 'count']).reset_index()
    
    fig = go.Figure()
    
    fig.add_trace(go.Bar(
        x=wicket_analysis['wickets_down'],
        y=wicket_analysis['mean'],
        error_y=dict(type='data', array=wicket_analysis['std']),
        marker_color='#38bdf8',
        name='Avg Score',
        text=wicket_analysis['mean'].round(0),
        textposition='outside'
    ))
    
    fig.update_layout(
        title='Impact of Wicket Loss on Final Score',
        xaxis_title='Wickets Down',
        yaxis_title='Average Final Score',
        template='plotly_white',
        height=400,
        showlegend=False
    )
    
    return fig

def create_run_rate_impact_chart(training_data):
    """
    Show correlation between run rate and final score.
    """
    # Create run rate bins
    training_data_copy = training_data.copy()
    training_data_copy['run_rate_bin'] = pd.cut(
        training_data_copy['run_rate'], 
        bins=5,
        labels=['Very Low', 'Low', 'Medium', 'High', 'Very High']
    )
    
    run_rate_analysis = training_data_copy.groupby('run_rate_bin', observed=True)['final_score'].agg(['mean', 'count']).reset_index()
    
    fig = go.Figure()
    
    fig.add_trace(go.Bar(
        x=run_rate_analysis['run_rate_bin'],
        y=run_rate_analysis['mean'],
        marker_color='#f59e0b',
        name='Avg Score',
        text=run_rate_analysis['mean'].round(0),
        textposition='outside'
    ))
    
    fig.update_layout(
        title='Run Rate Impact on Final Score',
        xaxis_title='Run Rate Category',
        yaxis_title='Average Final Score',
        template='plotly_white',
        height=400,
        showlegend=False
    )
    
    return fig

def create_venue_comparison_chart(training_data):
    """
    Compare scoring across venues.
    """
    venue_stats = training_data.groupby('venue')['final_score'].agg(['mean', 'count']).reset_index()
    venue_stats = venue_stats.sort_values('mean', ascending=True).tail(10)
    
    fig = go.Figure()
    
    fig.add_trace(go.Bar(
        y=venue_stats['venue'],
        x=venue_stats['mean'],
        orientation='h',
        marker_color='#22c55e',
        text=venue_stats['mean'].round(0),
        textposition='outside'
    ))
    
    fig.update_layout(
        title='Top 10 Venues by Average Score',
        xaxis_title='Average Final Score',
        yaxis_title='Venue',
        template='plotly_white',
        height=400,
        showlegend=False
    )
    
    return fig

def create_overs_vs_score_heatmap(training_data):
    """
    Create heatmap showing relationship between overs and final score.
    """
    # Create overs bins
    training_data_copy = training_data.copy()
    training_data_copy['overs_bin'] = pd.cut(training_data_copy['overs'], bins=6)
    training_data_copy['score_bin'] = pd.cut(training_data_copy['final_score'], bins=8)
    
    heatmap_data = training_data_copy.pivot_table(
        values='final_score',
        index='score_bin',
        columns='overs_bin',
        aggfunc='count',
        fill_value=0
    )
    
    fig = go.Figure(data=go.Heatmap(
        z=heatmap_data.values,
        x=[str(x) for x in heatmap_data.columns],
        y=[str(x) for x in heatmap_data.index],
        colorscale='Viridis',
        colorbar=dict(title='Match Count')
    ))
    
    fig.update_layout(
        title='Overs vs Score Distribution Heatmap',
        xaxis_title='Overs Bowled',
        yaxis_title='Final Score Range',
        template='plotly_white',
        height=400
    )
    
    return fig

def create_team_performance_chart(training_data):
    """
    Show average performance by batting team.
    """
    team_stats = training_data.groupby('batting_team')['final_score'].agg(['mean', 'count']).reset_index()
    team_stats = team_stats[team_stats['count'] >= 5].sort_values('mean', ascending=True)
    
    fig = go.Figure()
    
    fig.add_trace(go.Bar(
        y=team_stats['batting_team'],
        x=team_stats['mean'],
        orientation='h',
        marker_color='#38bdf8',
        text=team_stats['mean'].round(0),
        textposition='outside'
    ))
    
    fig.update_layout(
        title='Team Performance - Average Final Score',
        xaxis_title='Average Final Score',
        yaxis_title='Team',
        template='plotly_white',
        height=400,
        showlegend=False
    )
    
    return fig

def create_prediction_accuracy_chart(match_history):
    """
    Show prediction accuracy metrics over time.
    """
    if len(match_history) < 2:
        return None
    
    df = pd.DataFrame(match_history)
    df = df.sort_values('timestamp')
    
    # Create running average confidence
    df['confidence_pct'] = df['confidence'] * 100
    df['cumulative_avg_confidence'] = df['confidence_pct'].expanding().mean()
    
    fig = go.Figure()
    
    fig.add_trace(go.Scatter(
        x=df['timestamp'],
        y=df['confidence_pct'],
        mode='markers',
        marker=dict(size=8, color='#22c55e'),
        name='Individual Confidence',
        opacity=0.6
    ))
    
    fig.add_trace(go.Scatter(
        x=df['timestamp'],
        y=df['cumulative_avg_confidence'],
        mode='lines',
        line=dict(color='#38bdf8', width=3),
        name='Cumulative Avg Confidence'
    ))
    
    fig.update_layout(
        title='Model Confidence Over Time',
        xaxis_title='Time',
        yaxis_title='Confidence %',
        template='plotly_white',
        height=400,
        hovermode='x unified'
    )
    
    return fig

def get_statistical_summary(training_data):
    """
    Generate statistical summary of training data.
    """
    summary = {
        'total_matches': len(training_data),
        'avg_final_score': training_data['final_score'].mean(),
        'std_final_score': training_data['final_score'].std(),
        'min_final_score': training_data['final_score'].min(),
        'max_final_score': training_data['final_score'].max(),
        'median_final_score': training_data['final_score'].median(),
        'avg_run_rate': training_data['run_rate'].mean(),
        'avg_wickets_down': training_data['wickets_down'].mean(),
        'avg_current_score': training_data['current_score'].mean(),
    }
    
    return summary
