#!/usr/bin/env python3
"""
Test script to verify cabinet fields are properly loaded in the UserProfile model.
"""
import asyncio
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

async def test_models():
    """Test that models load correctly with new cabinet fields."""
    try:
        print("Testing UserProfile model with cabinet fields...")
        from app.models import UserProfile
        from app.database import engine
        
        # Check if model has the new fields
        fields_to_check = ['bar_registration_number', 'office_address', 'number_of_lawyers']
        
        for field_name in fields_to_check:
            if hasattr(UserProfile, field_name):
                print(f"✓ Field '{field_name}' exists in UserProfile model")
            else:
                print(f"✗ Field '{field_name}' NOT found in UserProfile model")
                return False
        
        print("\n✅ All cabinet fields are properly loaded in the model!")
        
        # Test schema
        print("\nTesting RegisterRequest schema...")
        from app.schemas.auth import RegisterRequest
        
        schema_fields = ['bar_registration_number', 'office_address', 'number_of_lawyers']
        for field_name in schema_fields:
            if field_name in RegisterRequest.model_fields:
                print(f"✓ Field '{field_name}' exists in RegisterRequest schema")
            else:
                print(f"✗ Field '{field_name}' NOT found in RegisterRequest schema")
                return False
        
        print("\n✅ All cabinet fields are properly defined in the schema!")
        
        await engine.dispose()
        return True
        
    except Exception as e:
        print(f"❌ Test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    result = asyncio.run(test_models())
    sys.exit(0 if result else 1)
