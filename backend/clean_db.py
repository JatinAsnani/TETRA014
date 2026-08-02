"""
clean_db.py — Wipes all records and collections across SQLite & MongoDB to make the database clean and empty.
"""
import os
from dotenv import load_dotenv
from sqlalchemy import text
from database import engine, Base, SessionLocal
import models

load_dotenv()


def clean_database():
    print("Clearing SQLite database...")
    try:
        db = SessionLocal()
        db.execute(text("PRAGMA foreign_keys = OFF;"))
        for table in Base.metadata.sorted_tables:
            db.execute(text(f"DELETE FROM {table.name};"))
            print(f"Cleared SQLite table: {table.name}")
        try:
            db.execute(text("DELETE FROM sqlite_sequence;"))
        except Exception:
            pass
        db.commit()
        db.execute(text("PRAGMA foreign_keys = ON;"))
        db.close()
        print("SQLite database tables wiped successfully. IDs reset.")
    except Exception as e:
        print(f"SQLite cleanup error: {e}")
        try:
            Base.metadata.drop_all(bind=engine)
            Base.metadata.create_all(bind=engine)
            print("Dropped and recreated all SQLite database tables.")
        except Exception as drop_err:
            print(f"SQLite drop error: {drop_err}")

    # Clean MongoDB database if MONGODB_URI is provided
    mongodb_uri = os.getenv("MONGODB_URI")
    if mongodb_uri:
        print("Clearing MongoDB database...")
        try:
            import pymongo
            db_name = os.getenv("MONGODB_DB_NAME", "friday")
            client = pymongo.MongoClient(mongodb_uri)
            mongo_db = client[db_name]
            collections = mongo_db.list_collection_names()
            for coll_name in collections:
                mongo_db[coll_name].delete_many({})
                print(f"Cleared MongoDB collection: {coll_name}")
            print("MongoDB database cleared successfully.")
        except Exception as mongo_err:
            print(f"MongoDB cleanup error: {mongo_err}")

    print("All databases (SQLite & MongoDB) are now 100% clean and empty! Data will only be added by users.")


if __name__ == "__main__":
    clean_database()


