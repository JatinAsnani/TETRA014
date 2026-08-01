"""
reset.py — Utility script for resetting user passwords or initializing clean database state.
"""
from clean_db import clean_database

def reset_db():
    clean_database()
    print("Database ready. Registered users can log in or create a new account.")

if __name__ == "__main__":
    reset_db()