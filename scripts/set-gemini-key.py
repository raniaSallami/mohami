"""Script to set Gemini API key in database using psycopg2"""
import psycopg2
import json

# Database connection string
CONNECTION_STRING = "postgresql://neondb_owner:npg_bvgKwtHJ72ln@ep-dry-cloud-airaa41g-pooler.c-4.us-east-1.aws.neon.tech/test_bd?sslmode=require"

def set_gemini_api_key(api_key: str):
    """Set the Gemini API key in the database"""
    # Parse connection string
    conn_params = CONNECTION_STRING.replace("postgresql://", "").split("@")
    user_pass = conn_params[0].split(":")
    host_db = conn_params[1].split("/")
    host_port = host_db[0].split(":")
    
    conn = psycopg2.connect(
        host=host_port[0],
        port=host_port[1] if len(host_port) > 1 else 5432,
        database=host_db[1].split("?")[0],
        user=user_pass[0],
        password=user_pass[1],
        sslmode="require"
    )
    
    cursor = conn.cursor()
    
    try:
        # First, check if general_settings exists
        cursor.execute("SELECT value FROM system_settings WHERE key = 'general_settings'")
        row = cursor.fetchone()
        
        if row:
            # Update existing settings
            settings = json.loads(row[0]) if isinstance(row[0], str) else row[0]
            settings['geminiApiKey'] = api_key
            cursor.execute(
                "UPDATE system_settings SET value = %s, updated_at = NOW() WHERE key = 'general_settings'",
                (json.dumps(settings),)
            )
            print(f"Updated general_settings with new API key")
        else:
            # Create new settings
            new_settings = {
                "maintenanceMode": False,
                "allowRegistrations": True,
                "appName": "المحامي",
                "geminiApiKey": api_key
            }
            cursor.execute(
                "INSERT INTO system_settings (key, value, updated_at) VALUES ('general_settings', %s, NOW())",
                (json.dumps(new_settings),)
            )
            print(f"Created general_settings with new API key")
        
        conn.commit()
        
        # Verify
        cursor.execute("SELECT value FROM system_settings WHERE key = 'general_settings'")
        row = cursor.fetchone()
        if row:
            print(f"Current settings: {row[0]}")
            
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    api_key = "AIzaSyDZ3TSN7QTjI8JlOpr9BV2AnwbFxmHMkSc"
    set_gemini_api_key(api_key)

