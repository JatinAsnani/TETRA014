import sys
import os

# Add backend folder path to sys.path for Vercel Python serverless handler
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))

from main import app
