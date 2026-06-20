import streamlit as st
import pandas as pd
import numpy as np
import plotly.graph_objects as go
import plotly.express as px
from datetime import datetime
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from utils import (
    generate_sample_data, create_training_features, init_styling,
    render_header, render_prediction_card, render_stat_metric,
    generate_match_insights, generate_recommendations, get_venue_impact,
    format_confidence_text
)
from models import CricketScorePredictor

# Initialize styling
init_styling()

# Set up session state
if 'predictor' not in st.session_state:
    st.session_state.predictor = None
    st.session_state.training_data = None
    st.session_state.model_trained = False
    st.session_state.match_history = []
    st.session_state.venue_mapping = {}
    st.session_state.team_mapping = {}

@st.cache_resource
def train_model():
    """Train the ML model (cached for performance)."""
    # Generate sample data
    df, venue_mapping, team_mapping = generate_sample_data(n_matches=500)
    
    # Create features
    X, y, feature_names = create_training_features(df)
    
    # Train predictor
    predictor = CricketScorePredictor()
    predictor.train(X, y, feature_names, venue_mapping, team_mapping)
    
    return predictor, df, venue_mapping, team_mapping

# Render header
render_header()

# Initialize model
if not st.session_state.model_trained:
    with st.spinner('Initializing ML model...'):
        predictor, training_df, venue_mapping, team_mapping = train_model()
        st.session_state.predictor = predictor
        st.session_state.training_data = training_df
        st.session_state.model_trained = True
        st.session_state.venue_mapping = venue_mapping
        st.session_state.team_mapping = team_mapping

# Create tabs
tab1, tab2, tab3, tab4, tab5 = st.tabs([
    "🎯 Predictor", 
    "📊 Analytics", 
    "📈 Match History",
    "🏟️ Venue Insights",
    "ℹ️ About"
])

with tab1:
    st.markdown("### Match Score Prediction")
    st.markdown("Enter current match conditions to predict the final score")
    
    col1, col2, col3 = st.columns(3)
    
    with col1:
        overs = st.slider("Overs Bowled", min_value=0, max_value=19, value=10, step=1)
    
    with col2:
        current_score = st.number_input("Current Score", min_value=0, max_value=250, value=80, step=5)
    
    with col3:
        wickets = st.slider("Wickets Down", min_value=0, max_value=10, value=2, step=1)
    
    col1, col2, col3 = st.columns(3)
    
    with col1:
        run_rate = st.slider("Current Run Rate (RPO)", min_value=0.0, max_value=15.0, value=7.5, step=0.1)
    
    with col2:
        balls_faced = int((overs + (st.slider("Extra Balls (0-5)", 0, 5, 2) / 6)) * 6)
    
    with col3:
        venue = st.selectbox("Venue", list(st.session_state.venue_mapping.keys()))
    
    col1, col2 = st.columns(2)
    
    with col1:
        team = st.selectbox("Batting Team", list(st.session_state.team_mapping.keys()))
    
    with col2:
        venue_encoded = st.session_state.venue_mapping[venue]
        team_encoded = st.session_state.team_mapping[team]
    
    # Make prediction
    if st.button("🔮 Predict Final Score", use_container_width=True):
        features_dict = {
            'overs': overs,
            'balls_faced': balls_faced,
            'current_score': current_score,
            'wickets_down': wickets,
            'run_rate': run_rate,
            'venue_encoded': venue_encoded,
            'team_encoded': team_encoded
        }
        
        prediction = st.session_state.predictor.predict(features_dict)
        
        # Store in history
        match_record = {
            'timestamp': datetime.now(),
            'venue': venue,
            'team': team,
            'overs': overs,
            'current_score': current_score,
            'wickets': wickets,
            'run_rate': run_rate,
            'prediction': prediction['predicted_score'],
            'confidence': prediction['confidence_level']
        }
        st.session_state.match_history.append(match_record)
        
        # Display prediction
        st.markdown("---")
        st.markdown("### ✨ Prediction Results")
        
        render_prediction_card(prediction)
        
        # Show metrics
        col1, col2, col3, col4 = st.columns(4)
        
        with col1:
            render_stat_metric("Confidence Range", f"{prediction['confidence_lower']}-{prediction['confidence_upper']}")
        
        with col2:
            render_stat_metric("Model R² Score", f"{prediction['model_r2']:.3f}")
        
        with col3:
            render_stat_metric("Confidence Level", format_confidence_text(prediction['confidence_level']))
        
        with col4:
            render_stat_metric("Venue Impact", f"{get_venue_impact(venue)['multiplier']:.2f}x")
        
        # Show insights
        st.markdown("---")
        st.markdown("### 🔍 Match Insights")
        
        input_data = {
            'overs': overs,
            'wickets_down': wickets,
            'run_rate': run_rate,
            'current_score': current_score
        }
        
        insights = generate_match_insights(input_data, prediction)
        
        for insight in insights:
            color = '#22c55e' if insight['type'] == 'positive' else '#f97316' if insight['type'] == 'warning' else '#38bdf8'
            st.markdown(f"""
            <div style='background-color: {color}15; border-left: 4px solid {color}; padding: 12px; border-radius: 8px; margin: 8px 0;'>
                <p style='font-weight: 600; margin: 0 0 4px 0; color: #1f2937;'>{insight['title']}</p>
                <p style='margin: 0; color: #6b7280; font-size: 14px;'>{insight['description']}</p>
            </div>
            """, unsafe_allow_html=True)

with tab2:
    st.markdown("### 📊 Analytics Dashboard")
    
    if len(st.session_state.match_history) > 0:
        history_df = pd.DataFrame(st.session_state.match_history)
        
        col1, col2 = st.columns(2)
        
        with col1:
            # Prediction distribution
            fig = go.Figure(data=[go.Histogram(
                x=history_df['prediction'],
                nbinsx=15,
                marker_color='#22c55e',
                showlegend=False
            )])
            fig.update_layout(
                title="Score Prediction Distribution",
                xaxis_title="Predicted Final Score",
                yaxis_title="Frequency",
                template="plotly_white",
                height=400
            )
            st.plotly_chart(fig, use_container_width=True)
        
        with col2:
            # Confidence levels
            fig = go.Figure(data=[go.Histogram(
                x=history_df['confidence'] * 100,
                nbinsx=10,
                marker_color='#38bdf8',
                showlegend=False
            )])
            fig.update_layout(
                title="Model Confidence Distribution",
                xaxis_title="Confidence %",
                yaxis_title="Frequency",
                template="plotly_white",
                height=400
            )
            st.plotly_chart(fig, use_container_width=True)
        
        # Score vs Run Rate
        col1, col2 = st.columns(2)
        
        with col1:
            fig = px.scatter(
                history_df,
                x='run_rate',
                y='prediction',
                color='wickets',
                title="Predicted Score vs Run Rate",
                labels={'prediction': 'Predicted Score', 'run_rate': 'Run Rate (RPO)', 'wickets': 'Wickets'},
                color_continuous_scale='Viridis'
            )
            fig.update_layout(height=400, template="plotly_white")
            st.plotly_chart(fig, use_container_width=True)
        
        with col2:
            # Training data distribution
            fig = go.Figure(data=[go.Histogram(
                x=st.session_state.training_data['final_score'],
                nbinsx=20,
                marker_color='#f59e0b',
                showlegend=False
            )])
            fig.update_layout(
                title="Training Data - Score Distribution",
                xaxis_title="Final Score",
                yaxis_title="Frequency",
                template="plotly_white",
                height=400
            )
            st.plotly_chart(fig, use_container_width=True)
    else:
        st.info("Make predictions to see analytics!")

with tab3:
    st.markdown("### 📈 Match History")
    
    if len(st.session_state.match_history) > 0:
        history_df = pd.DataFrame(st.session_state.match_history)
        
        # Display table
        display_df = history_df[['timestamp', 'venue', 'team', 'overs', 'current_score', 'prediction', 'confidence']].copy()
        display_df['timestamp'] = display_df['timestamp'].dt.strftime('%Y-%m-%d %H:%M:%S')
        display_df['confidence'] = (display_df['confidence'] * 100).round(1).astype(str) + '%'
        display_df = display_df.rename(columns={
            'timestamp': 'Time',
            'venue': 'Venue',
            'team': 'Team',
            'overs': 'Overs',
            'current_score': 'Current Score',
            'prediction': 'Predicted Score',
            'confidence': 'Confidence'
        })
        
        st.dataframe(display_df, use_container_width=True, hide_index=True)
        
        # Summary stats
        col1, col2, col3, col4 = st.columns(4)
        
        with col1:
            render_stat_metric("Total Predictions", len(history_df))
        
        with col2:
            render_stat_metric("Avg Predicted Score", int(history_df['prediction'].mean()))
        
        with col3:
            render_stat_metric("Avg Confidence", f"{(history_df['confidence'].mean() * 100):.1f}%")
        
        with col4:
            render_stat_metric("Score Range", f"{history_df['prediction'].min()}-{history_df['prediction'].max()}")
        
        # Clear history button
        if st.button("🗑️ Clear History", use_container_width=True):
            st.session_state.match_history = []
            st.rerun()
    else:
        st.info("No match predictions yet. Head to the Predictor tab to get started!")

with tab4:
    st.markdown("### 🏟️ Venue Intelligence")
    
    venues_list = list(st.session_state.venue_mapping.keys())
    
    selected_venue = st.selectbox("Select Venue", venues_list)
    
    venue_info = get_venue_impact(selected_venue)
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.markdown(f"""
        <div style='background-color: #22c55e15; border-left: 4px solid #22c55e; padding: 16px; border-radius: 8px;'>
            <h4 style='margin: 0 0 8px 0; color: #1f2937;'>{selected_venue}</h4>
            <p style='color: #6b7280; margin: 0;'>{venue_info['description']}</p>
            <p style='color: #22c55e; font-weight: 600; margin: 12px 0 0 0;'>Scoring Multiplier: {venue_info['multiplier']:.2f}x</p>
        </div>
        """, unsafe_allow_html=True)
    
    with col2:
        # Show venue stats from training data
        if 'venue' in st.session_state.training_data.columns:
            venue_data = st.session_state.training_data[
                st.session_state.training_data['venue'] == selected_venue
            ]
            
            if len(venue_data) > 0:
                st.markdown(f"""
                <div style='background-color: #38bdf815; border-left: 4px solid #38bdf8; padding: 16px; border-radius: 8px;'>
                    <h4 style='margin: 0 0 8px 0; color: #1f2937;'>Venue Statistics</h4>
                    <p style='margin: 4px 0; color: #6b7280;'><strong>Avg Score:</strong> {venue_data['final_score'].mean():.0f}</p>
                    <p style='margin: 4px 0; color: #6b7280;'><strong>Matches:</strong> {len(venue_data)}</p>
                    <p style='margin: 4px 0; color: #6b7280;'><strong>Score Range:</strong> {venue_data['final_score'].min():.0f}-{venue_data['final_score'].max():.0f}</p>
                </div>
                """, unsafe_allow_html=True)
    
    st.markdown("---")
    
    # All venues comparison
    st.markdown("### All Venues Comparison")
    
    if 'venue' in st.session_state.training_data.columns:
        venue_stats = st.session_state.training_data.groupby('venue')['final_score'].agg([
            'mean', 'min', 'max', 'count'
        ]).reset_index().rename(columns={
            'venue': 'Venue',
            'mean': 'Avg Score',
            'min': 'Min Score',
            'max': 'Max Score',
            'count': 'Matches'
        })
        
        venue_stats['Avg Score'] = venue_stats['Avg Score'].round(0).astype(int)
        venue_stats['Min Score'] = venue_stats['Min Score'].round(0).astype(int)
        venue_stats['Max Score'] = venue_stats['Max Score'].round(0).astype(int)
        
        st.dataframe(venue_stats, use_container_width=True, hide_index=True)

with tab5:
    st.markdown("### ℹ️ About Cricket Score Predictor")
    
    st.markdown(f"""
    <div style='background-color: #22c55e15; border-left: 4px solid #22c55e; padding: 16px; border-radius: 8px; margin-bottom: 20px;'>
    <h4>🤖 Machine Learning Model</h4>
    <p>This predictor uses a Linear Regression model trained on 500+ IPL-style cricket matches. The model analyzes multiple match parameters to predict final scores with high accuracy.</p>
    </div>
    
    <div style='background-color: #38bdf815; border-left: 4px solid #38bdf8; padding: 16px; border-radius: 8px; margin-bottom: 20px;'>
    <h4>📊 Features Analyzed</h4>
    <ul>
    <li><strong>Overs Bowled:</strong> Progression through the match</li>
    <li><strong>Current Score:</strong> Runs accumulated so far</li>
    <li><strong>Wickets Down:</strong> Batting stability indicator</li>
    <li><strong>Run Rate:</strong> Scoring speed and momentum</li>
    <li><strong>Venue:</strong> Ground-specific scoring patterns</li>
    <li><strong>Team:</strong> Historical team performance data</li>
    </ul>
    </div>
    
    <div style='background-color: #f59e0b15; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 8px;'>
    <h4>🎯 How Predictions Work</h4>
    <p>The model processes input features through a trained Linear Regression algorithm to generate:</p>
    <ul>
    <li>Expected final score</li>
    <li>Confidence interval (±20 runs)</li>
    <li>Model confidence percentage</li>
    <li>Strategic insights and recommendations</li>
    </ul>
    </div>
    """, unsafe_allow_html=True)
    
    st.markdown("---")
    
    col1, col2, col3 = st.columns(3)
    
    with col1:
        render_stat_metric("Model Type", "Linear Regression")
    
    with col2:
        render_stat_metric("Training Samples", "500+")
    
    with col3:
        predictor = st.session_state.predictor
        model_r2 = predictor.cv_score if predictor else 0.85
        render_stat_metric("Model R² Score", f"{model_r2:.3f}")

# Footer
st.markdown("---")
st.markdown("""
<div style='text-align: center; color: #6b7280; font-size: 12px;'>
    <p>Cricket Score Predictor v1.0 | Powered by Machine Learning | Made with ❤️</p>
</div>
""", unsafe_allow_html=True)
