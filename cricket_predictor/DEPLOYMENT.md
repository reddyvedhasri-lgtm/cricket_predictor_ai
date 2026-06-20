# Cricket Score Predictor - Deployment Guide

This guide covers deploying the Cricket Score Predictor to various platforms.

## Local Development

### Quick Start

```bash
# Navigate to the project directory
cd cricket_predictor

# Install dependencies
pip install -r requirements.txt

# Run the app
streamlit run streamlit_app.py
```

The app will be available at: `http://localhost:8501`

## Deployment Platforms

### 1. Streamlit Cloud (Recommended)

The easiest way to deploy!

#### Prerequisites
- GitHub account
- GitHub repository with cricket_predictor code
- Streamlit account (free)

#### Steps

1. **Push to GitHub**
```bash
git add .
git commit -m "Cricket Score Predictor"
git push origin main
```

2. **Deploy to Streamlit Cloud**
- Go to https://streamlit.io/cloud
- Click "New app"
- Connect your GitHub account
- Select the repository and branch
- Choose `cricket_predictor/streamlit_app.py` as the main file
- Click "Deploy"

3. **Configuration** (Optional)
Create `.streamlit/secrets.toml` in your GitHub repo:
```toml
# Add any secrets needed for your deployment
```

**Pros**: Free tier available, automatic updates, built for Streamlit  
**Cons**: Limited resources on free tier

### 2. Heroku

For a self-hosted option with more control.

#### Prerequisites
- Heroku account (paid)
- Heroku CLI installed
- GitHub repository

#### Setup

1. **Create Heroku App**
```bash
heroku login
heroku create cricket-score-predictor
```

2. **Create Procfile**
```bash
echo "web: streamlit run streamlit_app.py" > Procfile
```

3. **Create runtime.txt**
```bash
echo "python-3.11.0" > runtime.txt
```

4. **Deploy**
```bash
git push heroku main
```

5. **View Logs**
```bash
heroku logs --tail
```

**Pros**: Full control, good documentation, automatic SSL  
**Cons**: Monthly cost, requires maintenance

### 3. AWS Elastic Beanstalk

Enterprise-grade deployment.

#### Prerequisites
- AWS account
- AWS CLI configured
- EB CLI installed

#### Steps

1. **Initialize EB**
```bash
eb init -p python-3.11 cricket-predictor
```

2. **Create Environment**
```bash
eb create cricket-predictor-env
```

3. **Deploy**
```bash
eb deploy
```

#### Additional Configuration

Create `.ebextensions/python.config`:
```yaml
option_settings:
  aws:autoscaling:launchconfiguration:
    InstanceType: t3.micro
  aws:elasticbeanstalk:container:python:
    WSGIPath: streamlit_app.py
```

**Pros**: Highly scalable, enterprise features  
**Cons**: Complex setup, can be expensive

### 4. Docker + Any Cloud Provider

Containerized deployment for maximum flexibility.

#### Create Dockerfile

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Copy files
COPY requirements.txt .
COPY cricket_predictor/ .

# Install dependencies
RUN pip install -r requirements.txt

# Run app
CMD ["streamlit", "run", "streamlit_app.py", "--server.port=8501", "--server.address=0.0.0.0"]

# Expose port
EXPOSE 8501
```

#### Build and Run Locally

```bash
docker build -t cricket-predictor .
docker run -p 8501:8501 cricket-predictor
```

#### Deploy to Cloud

**Google Cloud Run**
```bash
gcloud run deploy cricket-predictor \
  --source . \
  --platform managed \
  --region us-central1 \
  --port 8501
```

**AWS EC2**
1. Launch EC2 instance
2. SSH into instance
3. Install Docker
4. Push Docker image
5. Run container

**DigitalOcean App Platform**
1. Connect GitHub repository
2. Select Dockerfile
3. Deploy

**Pros**: Works anywhere, consistent environment  
**Cons**: Requires Docker knowledge

### 5. PythonAnywhere

Simple Python-focused hosting.

1. Upload project to PythonAnywhere
2. Set up virtual environment
3. Install dependencies
4. Configure web app
5. Reload app

**Pros**: Simple setup, Python-focused  
**Cons**: Limited customization

## Environment Variables

Create `.streamlit/secrets.toml` for sensitive data:

```toml
[database]
url = "your-database-url"

[api]
key = "your-api-key"

[model]
path = "/path/to/model"
```

Access in code:
```python
import streamlit as st
db_url = st.secrets["database"]["url"]
```

## Performance Optimization

### 1. Model Caching
```python
@st.cache_resource
def load_model():
    # Load model once
    return predictor
```

### 2. Data Caching
```python
@st.cache_data
def get_training_data():
    # Fetch data once
    return data
```

### 3. Resource Limits
Set memory and CPU limits based on your platform's requirements.

### 4. Concurrent Users
- Free Streamlit Cloud: ~10 concurrent users
- Paid plans: Higher limits
- Self-hosted: Depends on server resources

## Scaling Recommendations

### Low Traffic (< 100 users/day)
- Streamlit Cloud Free
- PythonAnywhere
- Budget: $0/month

### Medium Traffic (100-1000 users/day)
- Heroku Standard
- AWS Lightsail
- Google Cloud Run (pay-per-use)
- Budget: $10-50/month

### High Traffic (> 1000 users/day)
- AWS Elastic Beanstalk with scaling
- Google Cloud Run with scaling
- AWS EC2 with load balancer
- Budget: $50+/month

## Monitoring

### Streamlit Cloud
- Built-in app health monitoring
- Automatic error logs
- Usage analytics

### Self-Hosted
Set up monitoring with:
- **Sentry** (error tracking)
- **New Relic** (performance monitoring)
- **CloudWatch** (AWS logs)
- **Datadog** (comprehensive monitoring)

## Backup Strategy

### For Cloud Deployment
1. Enable database backups (if applicable)
2. Version control all code on GitHub
3. Backup trained models periodically
4. Export match history regularly

### Backup Command
```bash
# Backup models
tar -czf backups/models_$(date +%Y%m%d).tar.gz models/

# Backup data
tar -czf backups/data_$(date +%Y%m%d).tar.gz data/
```

## SSL/HTTPS

Most platforms provide automatic SSL:
- Streamlit Cloud: ✓ Built-in
- Heroku: ✓ Built-in
- AWS: ✓ CloudFront CDN
- Docker: Requires nginx proxy

## Domain Setup

### Custom Domain on Streamlit Cloud
1. Go to app settings
2. Custom domain
3. Add your domain
4. Follow DNS instructions

### Custom Domain on Heroku
```bash
heroku domains:add www.your-domain.com
# Update DNS records
```

## Troubleshooting Deployment

### Common Issues

**App won't start**
```bash
# Check logs
streamlit run streamlit_app.py --logger.level=debug

# Verify dependencies
pip install -r requirements.txt
```

**Slow performance**
- Reduce dataset size
- Implement better caching
- Upgrade server tier
- Use CDN for static assets

**Memory errors**
- Reduce model size
- Implement data streaming
- Upgrade server resources
- Use model quantization

**Import errors**
```bash
# Reinstall all dependencies
pip install --no-cache-dir -r requirements.txt
```

## Maintenance

### Regular Tasks
1. Monitor app health (weekly)
2. Check error logs (daily)
3. Update dependencies (monthly)
4. Backup data (weekly)
5. Review usage metrics (weekly)

### Update Procedures
```bash
# Update dependencies
pip install --upgrade -r requirements.txt

# Test locally
streamlit run streamlit_app.py

# Deploy to production
git push heroku main  # or appropriate deployment command
```

## Security Best Practices

1. **Never commit secrets** to GitHub
2. **Use environment variables** for sensitive data
3. **Enable HTTPS** on all deployments
4. **Regular security updates** for dependencies
5. **Restrict access** if needed (password protection via Streamlit)
6. **Validate input** from users
7. **Sanitize output** to prevent XSS

## Cost Estimation

| Platform | Tier | Cost | Notes |
|----------|------|------|-------|
| Streamlit Cloud | Free | $0 | Limited resources |
| Streamlit Cloud | Pro | $15/month | More resources |
| Heroku | Hobby | $7-50/month | Good for small apps |
| AWS | Variable | $10-100+/month | Pay-per-use |
| Google Cloud | Variable | $5-100+/month | Pay-per-use |
| DigitalOcean | Basic | $5-40/month | Simple VPS |

## Support & Help

- **Streamlit Docs**: https://docs.streamlit.io
- **Streamlit Forum**: https://discuss.streamlit.io
- **Stack Overflow**: Tag `streamlit`
- **GitHub Issues**: Report bugs on repository

---

**Happy deploying!** 🚀
