"""
Vercel Serverless Function Entry Point
"""
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import FastAPI app from local server.py
from server import app

# Mangum adapter for serverless
from mangum import Mangum

# Create the handler that Vercel will call
handler = Mangum(app, lifespan="off")
