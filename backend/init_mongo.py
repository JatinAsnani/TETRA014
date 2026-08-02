"""
init_mongo.py — Initialize collections and indexes in MongoDB Atlas (tallai)
"""
import os
from dotenv import load_dotenv

load_dotenv(override=True)

MONGODB_URI = os.getenv(
    "MONGODB_URI",
    "mongodb+srv://jatinasnani03_db_user:EOcQK8kjBycePKX2@friday.zykyjos.mongodb.net/tallai?retryWrites=true&w=majority&appName=friday"
)
MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME", "tallai")

def initialize_mongodb():
    try:
        import pymongo
        print(f"Connecting to MongoDB Atlas database: '{MONGODB_DB_NAME}'...")
        client = pymongo.MongoClient(MONGODB_URI, serverSelectionTimeoutMS=10000)
        
        # Ping check
        client.admin.command('ping')
        print("Connected successfully to MongoDB Atlas!")
        
        db = client[MONGODB_DB_NAME]
        
        # Collection definitions
        collections = [
            "users",
            "customers",
            "vendors",
            "invoices",
            "purchase_invoices",
            "expenses",
            "payments",
            "stock_items",
            "activity_logs",
            "ledgers"
        ]
        
        existing = db.list_collection_names()
        print(f"Existing collections: {existing}")
        
        for coll in collections:
            if coll not in existing:
                db.create_collection(coll)
                print(f"Created collection: {coll}")
            else:
                print(f"Collection already exists: {coll}")

        # Create indexes for optimal search & lookup
        db.users.create_index("email", unique=True)
        db.customers.create_index([("user_id", pymongo.ASCENDING), ("name", pymongo.ASCENDING)])
        db.vendors.create_index([("user_id", pymongo.ASCENDING), ("name", pymongo.ASCENDING)])
        db.invoices.create_index([("user_id", pymongo.ASCENDING), ("invoice_number", pymongo.ASCENDING)])
        db.purchase_invoices.create_index([("user_id", pymongo.ASCENDING), ("bill_number", pymongo.ASCENDING)])
        db.expenses.create_index([("user_id", pymongo.ASCENDING), ("expense_date", pymongo.DESCENDING)])
        db.payments.create_index([("user_id", pymongo.ASCENDING), ("payment_date", pymongo.DESCENDING)])
        db.stock_items.create_index([("user_id", pymongo.ASCENDING), ("item_name", pymongo.ASCENDING)])
        db.activity_logs.create_index([("user_id", pymongo.ASCENDING), ("timestamp", pymongo.DESCENDING)])

        print("All MongoDB Atlas collections and indexes initialized successfully!")
        return True
    except Exception as err:
        print(f"MongoDB Initialization Error: {err}")
        return False

if __name__ == "__main__":
    initialize_mongodb()
