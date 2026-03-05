"""
Test that CSP headers are NOT applied to /docs endpoint
"""
import requests

def test_docs_no_csp():
    """Test that /docs endpoint has no CSP header"""
    response = requests.head("http://localhost:8000/docs")
    
    print("Response Headers:")
    for key, value in response.headers.items():
        print(f"  {key}: {value}")
    
    if "content-security-policy" in response.headers:
        print("\n❌ FAIL: CSP header found on /docs endpoint")
        print(f"CSP: {response.headers['content-security-policy']}")
        return False
    else:
        print("\n✅ PASS: No CSP header on /docs endpoint")
        return True

def test_api_has_csp():
    """Test that API endpoints DO have CSP header"""
    response = requests.head("http://localhost:8000/api/venues")
    
    print("\nAPI Endpoint Headers:")
    for key, value in response.headers.items():
        print(f"  {key}: {value}")
    
    if "content-security-policy" in response.headers:
        print("\n✅ PASS: CSP header found on API endpoint")
        print(f"CSP: {response.headers['content-security-policy']}")
        return True
    else:
        print("\n❌ FAIL: No CSP header on API endpoint")
        return False

if __name__ == "__main__":
    print("Testing CSP Headers Configuration\n")
    print("=" * 60)
    
    docs_ok = test_docs_no_csp()
    print("\n" + "=" * 60)
    api_ok = test_api_has_csp()
    
    print("\n" + "=" * 60)
    if docs_ok and api_ok:
        print("✅ ALL TESTS PASSED")
    else:
        print("❌ SOME TESTS FAILED")
        print("\nMake sure backend is restarted:")
        print("  cd backend")
        print("  python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000")
