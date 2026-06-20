# Cricket Score Predictor - Installation Guide

Complete guide to install and run the Cricket Score Predictor on your system.

## System Requirements

- **Operating System**: Windows, macOS, or Linux
- **Python**: 3.8 or higher
- **RAM**: Minimum 2GB (4GB recommended)
- **Disk Space**: 500MB free space
- **Internet**: Required for initial setup

## Step-by-Step Installation

### 1. Install Python

#### Windows
1. Visit https://www.python.org/downloads/
2. Download Python 3.11 (or latest 3.x version)
3. Run the installer
4. **Important**: Check "Add Python to PATH" during installation
5. Click "Install Now"

Verify installation:
```bash
python --version
```

#### macOS
Using Homebrew (recommended):
```bash
brew install python@3.11
```

Or download from https://www.python.org/downloads/

Verify:
```bash
python3 --version
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install python3.11 python3-pip python3-venv
```

Verify:
```bash
python3 --version
```

### 2. Clone or Download the Project

#### Option A: Using Git (Recommended)
```bash
git clone <repository-url>
cd cricket_predictor
```

#### Option B: Download ZIP
1. Download the project as ZIP
2. Extract to your desired location
3. Open terminal/command prompt in that folder

### 3. Create Virtual Environment

A virtual environment keeps project dependencies isolated.

#### Windows
```bash
python -m venv venv
venv\Scripts\activate
```

#### macOS/Linux
```bash
python3 -m venv venv
source venv/bin/activate
```

You should see `(venv)` prefix in your terminal after activation.

### 4. Install Dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

This installs:
- streamlit (web framework)
- pandas (data processing)
- numpy (numerical computing)
- scikit-learn (machine learning)
- plotly (visualization)
- requests (HTTP library)

Wait for installation to complete (typically 2-3 minutes).

### 5. Verify Installation

Check that all packages installed correctly:

```bash
python -c "import streamlit; import pandas; import plotly; print('All packages installed successfully!')"
```

## Running the Application

### Basic Start

```bash
streamlit run streamlit_app.py
```

Expected output:
```
You can now view your Streamlit app in your browser.

Local URL: http://localhost:8501
Network URL: http://192.168.x.x:8501
```

The app automatically opens in your default browser. If not, manually visit `http://localhost:8501`.

### Running from Different Directory

```bash
# If you're not in the cricket_predictor directory
streamlit run path/to/cricket_predictor/streamlit_app.py
```

### Running with Specific Configuration

```bash
streamlit run streamlit_app.py --logger.level=debug
```

## Troubleshooting Installation

### Python Not Found

**Error**: `'python' is not recognized as an internal or external command`

**Solution**:
- Python is not in PATH
- Reinstall Python and ensure "Add Python to PATH" is checked
- Or use full path: `C:\Python311\python.exe`

### Virtual Environment Issues

**Error**: `No module named 'streamlit'`

**Solution**:
```bash
# Make sure virtual environment is activated
# Windows: venv\Scripts\activate
# macOS/Linux: source venv/bin/activate

# Reinstall requirements
pip install -r requirements.txt
```

### pip Install Fails

**Error**: `ERROR: Could not find a version that satisfies the requirement`

**Solution**:
```bash
# Upgrade pip first
python -m pip install --upgrade pip

# Try installing again
pip install -r requirements.txt

# If still failing, install individually
pip install streamlit==1.40.1
pip install pandas==2.2.3
pip install numpy==1.26.4
pip install scikit-learn==1.5.2
pip install plotly==5.24.1
pip install requests==2.32.3
```

### Memory Issues

**Error**: `MemoryError` or app crashes on startup

**Solution**:
- Close other applications
- Reduce sample data size in `utils/data_generator.py`
- Upgrade system RAM
- Use a more powerful machine

### Port Already in Use

**Error**: `Address already in use. Try specifying a different port.`

**Solution**:
```bash
# Use a different port
streamlit run streamlit_app.py --server.port 8502
```

Or kill the existing process:

**Windows**:
```bash
netstat -ano | findstr :8501
taskkill /PID <PID> /F
```

**macOS/Linux**:
```bash
lsof -ti:8501 | xargs kill -9
```

## Project Structure After Installation

```
cricket_predictor/
├── streamlit_app.py          # Main application
├── requirements.txt          # Dependencies
├── README.md                 # Project documentation
├── INSTALLATION.md           # This file
├── DEPLOYMENT.md             # Deployment guide
│
├── .streamlit/
│   └── config.toml          # Streamlit configuration
│
├── .gitignore               # Git ignore file
│
├── models/
│   ├── __init__.py
│   └── predictor.py         # ML model
│
├── utils/
│   ├── __init__.py
│   ├── data_generator.py    # Data generation
│   ├── styling.py           # UI styling
│   ├── insights.py          # Match insights
│   ├── analytics.py         # Analytics charts
│   └── export.py            # Export features
│
├── data/
│   └── README.md            # Data documentation
│
└── venv/                    # Virtual environment (created after setup)
```

## First Run

### What Happens on First Start

1. **Model Training** (~30 seconds)
   - Generates 500+ sample cricket matches
   - Trains Linear Regression model
   - Caches model for future use

2. **Initial Load** (~10 seconds)
   - Loads UI assets
   - Renders interface
   - Ready for predictions

### What to Expect

- **First prediction**: May take 2-5 seconds
- **Subsequent predictions**: Near-instant
- **Memory usage**: ~300-500MB
- **CPU usage**: Low (except during model training)

## Testing Installation

### Quick Test Script

Create a file `test_installation.py`:

```python
#!/usr/bin/env python3

import sys
import subprocess

packages = [
    'streamlit',
    'pandas',
    'numpy',
    'sklearn',
    'plotly',
    'requests'
]

print("Testing installation...")
print(f"Python version: {sys.version}")
print("-" * 50)

all_good = True
for package in packages:
    try:
        __import__(package)
        print(f"✓ {package.ljust(15)} OK")
    except ImportError:
        print(f"✗ {package.ljust(15)} NOT INSTALLED")
        all_good = False

print("-" * 50)
if all_good:
    print("✓ All packages installed successfully!")
    print("\nYou can run: streamlit run streamlit_app.py")
else:
    print("✗ Some packages are missing. Run: pip install -r requirements.txt")
    sys.exit(1)
```

Run it:
```bash
python test_installation.py
```

## Updating Installation

### Update Dependencies

```bash
pip install --upgrade -r requirements.txt
```

### Update Specific Package

```bash
pip install --upgrade streamlit
```

## Uninstalling

### Remove Virtual Environment

**Windows**:
```bash
rmdir /s venv
```

**macOS/Linux**:
```bash
rm -rf venv
```

### Completely Remove Project

```bash
cd ..
rm -rf cricket_predictor
```

## Next Steps

After successful installation:

1. **Read the README**: `README.md` for features and usage
2. **Explore the App**: Try different predictions
3. **Check Deployment Guide**: To deploy online (`DEPLOYMENT.md`)
4. **Customize**: Modify colors, data, or models

## Getting Help

### If Something Goes Wrong

1. **Check Python version**
   ```bash
   python --version  # Should be 3.8+
   ```

2. **Verify virtual environment is activated**
   ```bash
   # You should see (venv) at the start of your terminal
   ```

3. **Reinstall requirements**
   ```bash
   pip install --force-reinstall -r requirements.txt
   ```

4. **Check Streamlit installation**
   ```bash
   streamlit --version
   ```

5. **Run with debug output**
   ```bash
   streamlit run streamlit_app.py --logger.level=debug
   ```

### Resources

- **Streamlit Docs**: https://docs.streamlit.io
- **Python Documentation**: https://docs.python.org/3
- **Pandas Docs**: https://pandas.pydata.org/docs
- **Scikit-learn Guide**: https://scikit-learn.org/stable

## System-Specific Notes

### Windows-Specific

- Use `python` instead of `python3`
- Use `venv\Scripts\activate` to activate environment
- File paths use backslashes (`\`)

### macOS-Specific

- May need to use `python3` and `pip3`
- Install Xcode Command Line Tools if needed:
  ```bash
  xcode-select --install
  ```

### Linux-Specific

- Use `python3` and `pip3`
- May need to install `python3-venv`:
  ```bash
  sudo apt install python3.11-venv
  ```

## Performance Optimization

### For Faster Startup

1. **Reduce dataset size**: Edit `data_generator.py`, change `n_matches=500` to smaller value
2. **Disable caching**: Remove `@st.cache_resource` decorators (not recommended)
3. **Use SSD**: Place project on SSD for faster I/O

### For Lower Memory Usage

1. **Reduce data**: Fewer samples in training data
2. **Lighter model**: Use simpler model architecture
3. **Increase swap**: May help if system runs out of RAM

## Verification Checklist

- [ ] Python 3.8+ installed
- [ ] Virtual environment created and activated
- [ ] All requirements installed (no errors)
- [ ] Streamlit runs without errors
- [ ] App opens in browser at localhost:8501
- [ ] Can make predictions successfully
- [ ] All tabs load properly

## Summary

You've successfully installed the Cricket Score Predictor! The app is ready to use.

**Next**: Run `streamlit run streamlit_app.py` and start making predictions!

---

**Version**: 1.0  
**Last Updated**: 2024  
**Status**: Ready to Use
