import asyncio
import httpx
import json

async def test():
    test_cases = [
        {
            'name': 'Missing account_type',
            'data': {'email': 'test@ex.com', 'password': 'Test123abc', 'name': 'Test User Name', 'phone': '+21612345678'}
        },
        {
            'name': 'Invalid phone',
            'data': {'email': 'test@ex.com', 'password': 'Test123abc', 'name': 'Test User Name', 'phone': '12345', 'account_type': 'lawyer'}
        },
        {
            'name': 'Valid data',
            'data': {'email': 'valid999@ex.com', 'password': 'Test123abc', 'name': 'Test User Valid', 'phone': '+21612345678', 'account_type': 'lawyer'}
        }
    ]
    
    async with httpx.AsyncClient() as client:
        for test_case in test_cases:
            response = await client.post(
                'http://localhost:3001/api/auth/register/send-otp',
                json=test_case['data'],
                timeout=10.0
            )
            print(f"\nTest: {test_case['name']}")
            print(f"Status: {response.status_code}")
            print(f"Response: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
            print('---')

asyncio.run(test())
