# NOTE: Inactive/Legacy Code. The application currently runs on SQLAlchemy + SQLite (database.py, friday.db).
# Do not use this file for active datastore connections.

import os
from typing import Optional, Any
from dotenv import load_dotenv

load_dotenv()

_mongo_client = None
_mongo_db = None


def get_mongo_uri() -> str:
    """Retrieve MongoDB Atlas connection string from environment.
    No hardcoded fallback — if MONGODB_URI isn't set, callers must handle None/empty.
    """
    return os.getenv("MONGODB_URI", "").strip()


def get_mongo_db_name() -> str:
    """Retrieve target MongoDB database name."""
    return os.getenv("MONGODB_DB_NAME", "tallai").strip()


def get_mongo_client():
    """Lazy initialize and return PyMongo MongoClient for MongoDB Atlas."""
    global _mongo_client
    if _mongo_client is not None:
        return _mongo_client

    uri = get_mongo_uri()
    if not uri or "mongodb" not in uri:
        return None

    try:
        import pymongo
        _mongo_client = pymongo.MongoClient(
            uri,
            serverSelectionTimeoutMS=5000,
            connectTimeoutMS=5000
        )
        # Test connection ping
        _mongo_client.admin.command('ping')
        print(" Successfully connected to MongoDB Atlas!")
        return _mongo_client
    except Exception as exc:
        print(f"[MongoDB Atlas Note] Connection skipped or offline: {exc}")
        _mongo_client = None
        return None


def get_mongo_db():
    """Get PyMongo database object for active MongoDB Atlas connection."""
    global _mongo_db
    if _mongo_db is not None:
        return _mongo_db

    client = get_mongo_client()
    if client is None:
        return None

    db_name = get_mongo_db_name()
    _mongo_db = client[db_name]
    return _mongo_db


def sync_document_to_mongo(collection_name: str, doc_id: str, document_data: dict) -> bool:
    """Upsert a document into a MongoDB Atlas collection."""
    try:
        db = get_mongo_db()
        if db is None:
            return False
        
        coll = db[collection_name]
        coll.update_one(
            {"_id": doc_id},
            {"$set": document_data},
            upsert=True
        )
        return True
    except Exception as err:
        print(f"[MongoDB Sync Error] {collection_name}/{doc_id}: {err}")
        return False


def get_mongo_collection(collection_name: str):
    """Retrieve PyMongo collection reference."""
    db = get_mongo_db()
    if db is None:
        return None
    return db[collection_name]
