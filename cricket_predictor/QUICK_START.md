# Cricket Score Predictor - Quick Start

Get the app running in 5 minutes!

## 1. Install (1 minute)

### macOS/Linux
```bash
cd cricket_predictor
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Windows
```bash
cd cricket_predictor
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

## 2. Run (30 seconds)

```bash
streamlit run streamlit_app.py
```

The app opens at `http://localhost:8501`

## 3. Make Predictions (1 minute)

1. **Fill in match conditions**:
   - Overs bowled: 10
   - Current score: 80
   - Wickets down: 2
   - Run rate: 7.5
   - Select venue and team

2. **Click "Predict Final Score"**

3. **View results**:
   - Predicted score
   - Confidence range
   - Match insights
   - Analytics

## 4. Explore Features (2 minutes)

- **Analytics Tab**: View prediction distributions
- **Match History Tab**: Track all predictions
- **Venue Insights Tab**: Compare grounds
- **About Tab**: Learn about the model

## Common Issues

### "Command not found: python3"
Use `python` instead on Windows, or install Python from https://python.org

### "No module named streamlit"
Make sure virtual environment is activated:
- macOS/Linux: `source venv/bin/activate`
- Windows: `venv\Scripts\activate`

### App won't open
Try manually visiting `http://localhost:8501`

## Next Steps

- **Customize**: Edit colors in `utils/styling.py`
- **Deploy**: Follow `DEPLOYMENT.md` for cloud hosting
- **Extend**: Add more features in `utils/` directory
- **Learn**: Read `README.md` for full documentation

## Need Help?

Check `INSTALLATION.md` for detailed troubleshooting.

## Files Overview

```
cricket_predictor/
├── streamlit_app.py      ← Main app (run this!)
├── README.md             ← Full documentation
├── INSTALLATION.md       ← Detailed setup
├── DEPLOYMENT.md         ← How to deploy
│
├── models/predictor.py   ← ML model
├── utils/                ← Helper modules
├── data/                 ← Sample data
└── requirements.txt      ← Dependencies
```

---

Ready? Run: `streamlit run streamlit_app.py`

Enjoy! 🏏
