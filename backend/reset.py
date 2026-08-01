from database import SessionLocal
from models import User
from auth import get_password_hash

db = SessionLocal()
user = db.query(User).filter(User.email == 'demo@tallai.com').first()
if user:
    user.password_hash = get_password_hash('demo123')
    db.commit()
    print('Password reset successfully!')
else:
    new_user = User(
        name='Demo Business',
        email='demo@tallai.com',
        password_hash=get_password_hash('demo123'),
        business_name='Sharma General Store'
    )
    db.add(new_user)
    db.commit()
    print('User created!')
db.close()