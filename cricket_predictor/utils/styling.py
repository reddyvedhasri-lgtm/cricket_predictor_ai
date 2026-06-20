import streamlit as st

# Color Palette (Cricket Green & Stadium Theme)
COLORS = {
    'primary_green': '#22c55e',      # Cricket green
    'sky_blue': '#38bdf8',            # Sky blue
    'gold': '#f59e0b',                # Trophy gold
    'white': '#ffffff',               # White
    'dark_gray': '#1f2937',           # Dark gray
    'light_gray': '#f3f4f6',          # Light gray
    'text_dark': '#1f2937',           # Dark text
    'text_light': '#6b7280',          # Light text
    'success': '#10b981',             # Success green
    'warning': '#f97316',             # Warning orange
}

def init_styling():
    """Initialize Streamlit styling and custom CSS."""
    st.set_page_config(
        page_title="Cricket Score Predictor",
        page_icon="🏏",
        layout="wide",
        initial_sidebar_state="expanded"
    )
    
    # Custom CSS
    custom_css = f"""
    <style>
    :root {{
        --primary-green: {COLORS['primary_green']};
        --sky-blue: {COLORS['sky_blue']};
        --gold: {COLORS['gold']};
    }}
    
    * {{
        font-family: 'Inter', 'Segoe UI', sans-serif;
    }}
    
    body {{
        background-color: {COLORS['white']};
        color: {COLORS['text_dark']};
    }}
    
    .stApp {{
        background-color: {COLORS['light_gray']};
    }}
    
    .stTabs [data-baseweb="tab-list"] button [data-testid="stMarkdownContainer"] p {{
        font-size: 1.1rem;
        font-weight: 600;
    }}
    
    .prediction-card {{
        background: linear-gradient(135deg, {COLORS['primary_green']}15 0%, {COLORS['sky_blue']}15 100%);
        border-left: 4px solid {COLORS['primary_green']};
        padding: 20px;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    }}
    
    .metric-box {{
        background: {COLORS['white']};
        padding: 16px;
        border-radius: 10px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.08);
        border-top: 3px solid {COLORS['sky_blue']};
    }}
    
    .hero-text {{
        background: linear-gradient(135deg, {COLORS['primary_green']}, {COLORS['sky_blue']});
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        font-weight: 700;
    }}
    
    .stat-highlight {{
        color: {COLORS['primary_green']};
        font-weight: 600;
    }}
    
    .accent-gold {{
        color: {COLORS['gold']};
    }}
    </style>
    """
    st.markdown(custom_css, unsafe_allow_html=True)

def render_header():
    """Render the main header section."""
    col1, col2 = st.columns([3, 1])
    
    with col1:
        st.markdown(f"""
        <h1 style='color: {COLORS["primary_green"]}; margin-bottom: 5px;'>
            🏏 Cricket Score Predictor
        </h1>
        <p style='color: {COLORS["text_light"]}; font-size: 16px; margin: 0;'>
            AI-Powered Match Analysis & Score Prediction Engine
        </p>
        """, unsafe_allow_html=True)
    
    with col2:
        st.markdown(f"""
        <div style='text-align: right; padding-top: 15px;'>
            <p style='color: {COLORS["gold"]}; font-weight: 600; margin: 0;'>
                Powered by Machine Learning
            </p>
        </div>
        """, unsafe_allow_html=True)

def render_prediction_card(prediction_data):
    """Render the prediction result card."""
    st.markdown(f"""
    <div class='prediction-card'>
        <div style='display: flex; justify-content: space-between; align-items: center;'>
            <div>
                <p style='color: {COLORS["text_light"]}; margin: 0; font-size: 12px; text-transform: uppercase;'>
                    Predicted Final Score
                </p>
                <h2 style='color: {COLORS["primary_green"]}; margin: 10px 0; font-size: 48px; font-weight: 700;'>
                    {prediction_data['predicted_score']}
                </h2>
            </div>
            <div style='text-align: right;'>
                <p style='color: {COLORS["text_light"]}; margin: 0; font-size: 12px; text-transform: uppercase;'>
                    Confidence Range
                </p>
                <p style='color: {COLORS["sky_blue"]}; margin: 10px 0; font-size: 22px; font-weight: 600;'>
                    {prediction_data['confidence_lower']}-{prediction_data['confidence_upper']}
                </p>
            </div>
        </div>
        <div style='margin-top: 16px;'>
            <div style='background-color: rgba(255,255,255,0.5); height: 6px; border-radius: 3px; overflow: hidden;'>
                <div style='background: linear-gradient(90deg, {COLORS["primary_green"]}, {COLORS["sky_blue"]}); 
                            height: 100%; width: {int(prediction_data["confidence_level"] * 100)}%;'></div>
            </div>
            <p style='color: {COLORS["text_light"]}; margin: 8px 0 0 0; font-size: 12px;'>
                Model Confidence: {int(prediction_data['confidence_level'] * 100)}%
            </p>
        </div>
    </div>
    """, unsafe_allow_html=True)

def render_stat_metric(label, value, suffix=""):
    """Render a stat metric box."""
    st.markdown(f"""
    <div class='metric-box'>
        <p style='color: {COLORS["text_light"]}; margin: 0; font-size: 12px; text-transform: uppercase;'>
            {label}
        </p>
        <h3 style='color: {COLORS["primary_green"]}; margin: 8px 0 0 0; font-size: 28px; font-weight: 700;'>
            {value}{suffix}
        </h3>
    </div>
    """, unsafe_allow_html=True)
