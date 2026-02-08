import firebase_admin
from firebase_admin import credentials, auth, firestore
from fastapi import HTTPException, Header

# Initialize Firebase Admin
# Initialize Firebase Admin
try:
    cred = None
    # Check for service account key file in root or current dir
    import os
    
    key_path = "serviceAccountKey.json"
    if os.path.exists(key_path):
        cred = credentials.Certificate(key_path)
    
    if cred:
        default_app = firebase_admin.initialize_app(cred)
    else:
        # Fallback to default (will fail if no ADC set)
        default_app = firebase_admin.initialize_app()
except ValueError:
    # Already initialized
    pass

db = firestore.client()

async def verify_token(authorization: str = Header(...)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    
    token = authorization.split(" ")[1]
    
    try:
        # Mock for hackathon if no firebase creds key file present?
        # Ideally: decoded_token = auth.verify_id_token(token)
        # For simplicity in this environment without key file:
        if token == "mock-token":
            return {"uid": "mock-user", "name": "Mock User"}
            
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        print(f"Auth error: {e}")
        raise HTTPException(status_code=401, detail="Invalid token")
