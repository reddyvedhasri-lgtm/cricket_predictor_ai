# Cricket Score Predictor - Data Directory

This directory contains sample data and training datasets for the Cricket Score Predictor.

## Sample Data Generation

The predictor automatically generates 500+ IPL-style cricket match samples on startup for model training. This includes:

- **Match Conditions**: Overs bowled, current score, wickets down, run rate
- **Venue Information**: 12 different cricket grounds with unique scoring patterns
- **Teams**: 10 IPL teams with individual performance characteristics
- **Final Scores**: Target variable for model training

## Data Structure

Sample CSV format for training data:

```
overs,balls_faced,current_score,wickets_down,run_rate,venue,batting_team,final_score
10,60,75,2,7.5,Wankhede Stadium,Mumbai Indians,165
12,70,90,1,8.2,Eden Gardens,Chennai Super Kings,175
...
```

## Features Used

1. **overs**: Number of overs bowled (0-20)
2. **balls_faced**: Total balls faced so far
3. **current_score**: Runs scored up to this point
4. **wickets_down**: Number of wickets lost
5. **run_rate**: Current scoring pace (runs per over)
6. **venue**: Cricket ground name (encoded)
7. **batting_team**: Team name (encoded)
8. **final_score**: Target - final match score

## Model Training

The Linear Regression model is trained with 5-fold cross-validation to ensure robust predictions across different match scenarios.

## Extending the Dataset

To add real match data:

1. Collect historical match data from IPL/cricket APIs
2. Format it to match the structure above
3. Update `data_generator.py` to include real data alongside synthetic samples
4. Retrain the model

## Notes

- All sample data is synthetic and generated for demonstration purposes
- Venue impact multipliers range from 0.85x to 1.15x
- Run rates are capped at realistic maximums (15 RPO)
- Final scores range from 50 to 250 runs
