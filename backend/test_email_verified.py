#!/usr/bin/env python3
"""
Test script to verify email_verified field is properly loaded.
"""
import asyncio
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

async def test_email_verified():
    """Test that email_verified field is properly configured."""
    try:
        print("Testing email_verified field configuration...")
        from app.models import User
        from app.schemas.user import UserResponse
        from app.database import engine
        
        # Check User model
        if hasattr(User, 'email_verified'):
            print("✓ Field 'email_verified' exists in User model")
        else:
            print("✗ Field 'email_verified' NOT found in User model")
            return False
        
        # Check UserResponse schema
        if 'email_verified' in UserResponse.model_fields:
            print("✓ Field 'email_verified' exists in UserResponse schema")
        else:
            print("✗ Field 'email_verified' NOT found in UserResponse schema")
            return False
        
        # Check cabinet fields in schema
        cabinet_fields = ['bar_registration_number', 'office_address', 'number_of_lawyers']
        for field_name in cabinet_fields:
            if field_name in UserResponse.model_fields:
                print(f"✓ Field '{field_name}' exists in UserResponse schema")
            else:
                print(f"✗ Field '{field_name}' NOT found in UserResponse schema")
                return False
        
        # Check timestamps
        if 'created_at' in UserResponse.model_fields:
            print("✓ Field 'created_at' exists in UserResponse schema")
        else:
            print("✗ Field 'created_at' NOT found in UserResponse schema")
            return False
            
        if 'updated_at' in UserResponse.model_fields:
            print("✓ Field 'updated_at' exists in UserResponse schema")
        else:
            print("✗ Field 'updated_at' NOT found in UserResponse schema")
            return False
        
        print("\n✅ All email verification and timestamp fields are properly configured!")
        
        await engine.dispose()
        return True
        
    except Exception as e:
        print(f"❌ Test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    result = asyncio.run(test_email_verified())
    sys.exit(0 if result else 1)
