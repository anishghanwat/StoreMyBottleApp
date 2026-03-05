"""
Test script to verify security headers are properly set
Tests HSTS, CSP, X-Frame-Options, and other security headers
"""
import requests
from requests.packages.urllib3.exceptions import InsecureRequestWarning

# Disable SSL warnings for testing
requests.packages.urllib3.disable_warnings(InsecureRequestWarning)

BASE_URL = "http://localhost:8000"

def print_section(title):
    print("\n" + "="*70)
    print(f"  {title}")
    print("="*70)

def test_security_headers():
    """Test that security headers are present"""
    print_section("🛡️  SECURITY HEADERS TEST")
    
    try:
        response = requests.get(f"{BASE_URL}/health", verify=False)
        
        print(f"\nStatus Code: {response.status_code}")
        print("\n📋 Security Headers:")
        
        # Expected security headers
        security_headers = {
            "Strict-Transport-Security": "HSTS (HTTP Strict Transport Security)",
            "X-Content-Type-Options": "MIME Type Sniffing Protection",
            "X-Frame-Options": "Clickjacking Protection",
            "X-XSS-Protection": "XSS Filter",
            "Content-Security-Policy": "Content Security Policy",
            "Referrer-Policy": "Referrer Policy",
            "Permissions-Policy": "Permissions Policy"
        }
        
        found_headers = 0
        missing_headers = []
        
        for header, description in security_headers.items():
            if header in response.headers:
                value = response.headers[header]
                # Truncate long values
                display_value = value if len(value) < 60 else value[:57] + "..."
                print(f"  ✅ {header}")
                print(f"     {description}")
                print(f"     Value: {display_value}")
                found_headers += 1
            else:
                print(f"  ❌ {header} - MISSING")
                missing_headers.append(header)
        
        print(f"\n📊 Summary: {found_headers}/{len(security_headers)} headers present")
        
        if missing_headers:
            print(f"\n⚠️  Missing headers: {', '.join(missing_headers)}")
            return False
        else:
            print("\n✅ All security headers present!")
            return True
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False


def test_hsts_header():
    """Test HSTS header specifically"""
    print_section("🔒 HSTS (HTTP Strict Transport Security) TEST")
    
    try:
        response = requests.get(f"{BASE_URL}/health", verify=False)
        
        if "Strict-Transport-Security" in response.headers:
            hsts = response.headers["Strict-Transport-Security"]
            print(f"\n✅ HSTS Header Present")
            print(f"   Value: {hsts}")
            
            # Check for important directives
            checks = {
                "max-age": "max-age" in hsts,
                "includeSubDomains": "includeSubDomains" in hsts.lower(),
                "preload": "preload" in hsts.lower()
            }
            
            print("\n📋 HSTS Directives:")
            for directive, present in checks.items():
                status = "✅" if present else "⚠️ "
                print(f"   {status} {directive}: {'Present' if present else 'Not present'}")
            
            return True
        else:
            print("\n❌ HSTS Header NOT present")
            return False
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False


def test_csp_header():
    """Test Content Security Policy header"""
    print_section("🛡️  CONTENT SECURITY POLICY TEST")
    
    try:
        response = requests.get(f"{BASE_URL}/health", verify=False)
        
        if "Content-Security-Policy" in response.headers:
            csp = response.headers["Content-Security-Policy"]
            print(f"\n✅ CSP Header Present")
            print(f"   Value: {csp}")
            
            # Check for important directives
            directives = [
                "default-src",
                "script-src",
                "style-src",
                "img-src",
                "frame-ancestors"
            ]
            
            print("\n📋 CSP Directives:")
            for directive in directives:
                if directive in csp:
                    print(f"   ✅ {directive}")
                else:
                    print(f"   ⚠️  {directive} - Not present")
            
            return True
        else:
            print("\n❌ CSP Header NOT present")
            return False
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False


def test_clickjacking_protection():
    """Test X-Frame-Options header"""
    print_section("🎯 CLICKJACKING PROTECTION TEST")
    
    try:
        response = requests.get(f"{BASE_URL}/health", verify=False)
        
        if "X-Frame-Options" in response.headers:
            xfo = response.headers["X-Frame-Options"]
            print(f"\n✅ X-Frame-Options Header Present")
            print(f"   Value: {xfo}")
            
            if xfo.upper() in ["DENY", "SAMEORIGIN"]:
                print(f"   ✅ Secure value: {xfo}")
            else:
                print(f"   ⚠️  Unexpected value: {xfo}")
            
            return True
        else:
            print("\n❌ X-Frame-Options Header NOT present")
            return False
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False


def test_all_endpoints():
    """Test that headers are present on different endpoints"""
    print_section("🔍 TESTING MULTIPLE ENDPOINTS")
    
    endpoints = [
        "/",
        "/health",
        "/api/auth/login",
        "/docs"
    ]
    
    print("\nChecking if security headers are present on all endpoints...")
    
    all_pass = True
    for endpoint in endpoints:
        try:
            if endpoint == "/api/auth/login":
                # POST endpoint
                response = requests.post(
                    f"{BASE_URL}{endpoint}",
                    json={"email": "test@test.com", "password": "test"},
                    verify=False
                )
            else:
                # GET endpoint
                response = requests.get(f"{BASE_URL}{endpoint}", verify=False)
            
            has_hsts = "Strict-Transport-Security" in response.headers
            has_xfo = "X-Frame-Options" in response.headers
            has_csp = "Content-Security-Policy" in response.headers
            
            if has_hsts and has_xfo and has_csp:
                print(f"   ✅ {endpoint} - All headers present")
            else:
                print(f"   ⚠️  {endpoint} - Some headers missing")
                all_pass = False
                
        except Exception as e:
            print(f"   ❌ {endpoint} - Error: {str(e)}")
            all_pass = False
    
    return all_pass


def main():
    """Run all tests"""
    print("\n" + "="*70)
    print("  🛡️  SECURITY HEADERS TEST SUITE")
    print("="*70)
    print("\nTesting security headers implementation...")
    print(f"Base URL: {BASE_URL}")
    
    results = []
    
    # Run tests
    results.append(("Security Headers", test_security_headers()))
    results.append(("HSTS Header", test_hsts_header()))
    results.append(("CSP Header", test_csp_header()))
    results.append(("Clickjacking Protection", test_clickjacking_protection()))
    results.append(("Multiple Endpoints", test_all_endpoints()))
    
    # Summary
    print("\n" + "="*70)
    print("  📊 TEST SUMMARY")
    print("="*70)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅" if result else "❌"
        print(f"{status} {test_name}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 ALL TESTS PASSED!")
        print("\n✅ Security headers are properly configured")
    else:
        print(f"\n⚠️  {total - passed} TESTS FAILED")
    
    print("="*70)


if __name__ == "__main__":
    main()
