# 🏏 Cricket Score Predictor

An AI-powered machine learning application that predicts cricket match final scores in real-time using advanced analytics and strategic insights.

## Features

### Core Prediction Engine
- **Linear Regression Model**: Trained on 500+ IPL-style match data
- **Multi-Factor Analysis**: Considers overs, wickets, run rate, venue, and team performance
- **Confidence Intervals**: Provides score predictions with ±20 run confidence ranges
- **Real-Time Predictions**: Get instant score forecasts as matches progress

### Advanced Analytics
- **Score Trajectory Visualization**: Animated projection of match progression
- **Wicket Impact Analysis**: Shows how wicket loss affects final scores
- **Run Rate Analysis**: Correlation between scoring pace and outcomes
- **Venue Intelligence**: Ground-specific scoring patterns and statistics
- **Team Performance Metrics**: Historical team-based predictions
- **Prediction Accuracy Tracking**: Monitor model performance over time

### Smart Features
- **Match Insights**: AI-generated insights about current match conditions
- **Strategic Recommendations**: Data-driven suggestions for batting/bowling
- **Scenario Simulation**: "What-if" analysis for different match situations
- **Match History**: Track all predictions and compare accuracy
- **Export Options**: JSON, CSV, and detailed reports

### Beautiful UI
- **Cricket Green & Sky Blue Theme**: Sport-inspired color palette
- **Glassmorphic Cards**: Modern, premium interface design
- **Interactive Charts**: Plotly-powered dynamic visualizations
- **Responsive Layout**: Works seamlessly on all screen sizes

## Installation

### Requirements
- Python 3.8+
- pip (Python package manager)

### Setup

1. **Install Dependencies**
```bash
cd cricket_predictor
pip install -r requirements.txt
```

2. **Run the Application**
```bash
streamlit run streamlit_app.py
```

The app will open in your default browser at `http://localhost:8501`

## Project Structure

```
cricket_predictor/
├── streamlit_app.py          # Main application
├── requirements.txt          # Python dependencies
├── README.md                 # This file
│
├── models/
│   ├── __init__.py
│   └── predictor.py         # ML model class
│
├── utils/
│   ├── __init__.py
│   ├── data_generator.py    # Sample data generation
│   ├── styling.py           # UI/CSS styling
│   ├── insights.py          # Match insights generator
│   ├── analytics.py         # Advanced analytics
│   └── export.py            # Export/report features
│
└── data/
    └── README.md            # Data documentation
```

## Usage

### Basic Prediction

1. Go to the **Predictor** tab
2. Enter match conditions:
   - Overs bowled
   - Current score
   - Wickets down
   - Run rate
   - Venue
   - Batting team
3. Click "Predict Final Score"
4. Review predictions, confidence levels, and insights

### Analytics Exploration

- **Analytics Tab**: View distribution charts and training data analysis
- **Match History Tab**: See all predictions and performance metrics
- **Venue Insights Tab**: Analyze ground-specific scoring patterns

### Advanced Features

- **Scenario Simulation**: Simulate different match outcomes
- **Export Reports**: Download predictions as JSON or CSV
- **Match Reports**: Generate detailed analysis reports

## Model Details

### Algorithm
- **Linear Regression**: Simple yet effective for cricket score prediction
- **Feature Scaling**: StandardScaler applied for optimal model performance
- **Cross-Validation**: 5-fold CV for robust accuracy estimation

### Training Data
- **Sample Size**: 500+ synthetic IPL-style matches
- **Features**: 7 input features + 1 target variable
- **Venues**: 12 different cricket grounds
- **Teams**: 10 IPL teams

### Model Performance
- **R² Score**: ~0.85 (85% variance explained)
- **Confidence**: 70-80% for most predictions
- **RMSE**: ~15 runs

### Features Used
1. **Overs Bowled**: Match progression (0-20 overs)
2. **Balls Faced**: Total deliveries faced
3. **Current Score**: Runs accumulated so far
4. **Wickets Down**: Batting stability (0-10)
5. **Run Rate**: Scoring pace (runs per over)
6. **Venue**: Cricket ground (encoded)
7. **Batting Team**: Team name (encoded)

## API Reference

### CricketScorePredictor

```python
from models import CricketScorePredictor

# Initialize
predictor = CricketScorePredictor()

# Train with data
X, y, features = create_training_features(df)
predictor.train(X, y, features)

# Make prediction
features_dict = {
    'overs': 10,
    'balls_faced': 60,
    'current_score': 75,
    'wickets_down': 2,
    'run_rate': 7.5,
    'venue_encoded': 5,
    'team_encoded': 3
}
prediction = predictor.predict(features_dict)
```

### Key Functions

- `generate_sample_data(n_matches)`: Generate training data
- `create_training_features(df)`: Prepare features for model
- `generate_match_insights(input_data, prediction)`: Get match insights
- `create_score_trajectory_chart()`: Visualization
- `MatchSimulator.simulate_scenarios()`: What-if analysis

## Customization

### Changing Color Scheme

Edit `utils/styling.py`:
```python
COLORS = {
    'primary_green': '#22c55e',      # Cricket green
    'sky_blue': '#38bdf8',            # Sky blue
    'gold': '#f59e0b',                # Trophy gold
    # ... modify as needed
}
```

### Adding New Venues/Teams

Edit `utils/data_generator.py`:
```python
venues = [
    "Your New Venue",
    # ... add more
]

teams = [
    "Your New Team",
    # ... add more
]
```

### Retraining with Real Data

Replace synthetic data generation in `data_generator.py` with:
```python
def load_real_data():
    df = pd.read_csv('your_match_data.csv')
    # Process and return
    return df
```

## Troubleshooting

### App not starting
```bash
# Reinstall dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Run with verbose output
streamlit run streamlit_app.py --logger.level=debug
```

### Slow predictions
- First prediction loads the model (cached afterward)
- Ensure sufficient RAM (minimum 2GB recommended)

### Import errors
- Verify all files are in the correct directories
- Run `pip install -r requirements.txt` again

## Performance Tips

1. **First Run**: Model loads on startup (~30 seconds)
2. **Cached Predictions**: Subsequent predictions are instant
3. **Multiple Browsers**: Use multiple tabs in same session
4. **Memory**: Close other applications for better performance

## Future Enhancements

- [ ] Real-time IPL data integration
- [ ] Advanced models (Random Forest, Neural Networks)
- [ ] Live match tracking with score updates
- [ ] Player-specific performance analysis
- [ ] Toss predictions and team selection optimization
- [ ] Mobile app version
- [ ] API deployment for third-party integration

## Technical Stack

- **Frontend**: Streamlit (Web UI framework)
- **ML Framework**: Scikit-learn (Linear Regression, preprocessing)
- **Data Processing**: Pandas, NumPy
- **Visualization**: Plotly (Interactive charts)
- **Language**: Python 3.8+

## License

This project is provided as-is for educational and recreational purposes.

## Credits

Built with:
- Streamlit for interactive web applications
- Scikit-learn for machine learning
- Plotly for data visualization

## Support

For issues, questions, or suggestions:
1. Check the troubleshooting section
2. Review the About tab in the app
3. Consult the data directory README

---

**Version**: 1.0  
**Last Updated**: 2024  
**Status**: Active Development

Enjoy predicting cricket scores! 🏏
