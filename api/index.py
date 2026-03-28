"""
Vercel Serverless Function Entry Point
This file wraps the FastAPI application for Vercel deployment
"""
import sys
import os

# Add backend to Python path
backend_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'backend')
sys.path.insert(0, backend_path)

# Set environment variables path
from dotenv import load_dotenv
load_dotenv(os.path.join(backend_path, '.env'))

# Import FastAPI app
from server import app

# Mangum adapter for AWS Lambda / Vercel Serverless
from mangum import Mangum

# Create handler
handler = Mangum(app, lifespan="off")

# For local testing
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
