"""
Test script to verify input sanitization is working
Run this to test XSS and injection protection
"""
from sanitization import (
    sanitize_html,
    sanitize_name,
    sanitize_email,
    sanitize_phone,
    sanitize_url,
    sanitize_address,
    sanitize_description,
    validate_no_sql_injection,
    validate_no_command_injection
)

def test_html_sanitization():
    """Test HTML/XSS sanitization"""
    print("\n" + "="*70)
    print("🧪 HTML/XSS SANITIZATION TESTS")
    print("="*70)
    
    test_cases = [
        ('<script>alert("XSS")</script>Hello', 'Hello'),
        ('<img src=x onerror=alert(1)>', ''),
        ('<b>Bold</b> text', 'Bold text'),
        ('Normal text', 'Normal text'),
        ('<a href="javascript:alert(1)">Click</a>', 'Click'),
        ('Test<iframe src="evil.com"></iframe>', 'Test'),
    ]
    
    passed = 0
    failed = 0
    
    for input_text, expected in test_cases:
        result = sanitize_html(input_text)
        if result == expected:
            print(f"✅ PASS: '{input_text[:50]}' → '{result}'")
            passed += 1
        else:
            print(f"❌ FAIL: '{input_text[:50]}'")
            print(f"   Expected: '{expected}'")
            print(f"   Got: '{result}'")
            failed += 1
    
    return passed, failed


def test_name_sanitization():
    """Test name field sanitization"""
    print("\n" + "="*70)
    print("🧪 NAME SANITIZATION TESTS")
    print("="*70)
    
    test_cases = [
        ("John Doe", "John Doe"),
        ("John<script>alert(1)</script>Doe", "JohnscriptalertscriptDoe"),
        ("  Spaces  Around  ", "Spaces Around"),
        ("O'Brien & Sons", "O'Brien & Sons"),
        ("Test-Name (123)", "Test-Name (123)"),
        ("Test\x00Null", "TestNull"),
    ]
    
    passed = 0
    failed = 0
    
    for input_text, expected in test_cases:
        result = sanitize_name(input_text)
        if result == expected:
            print(f"✅ PASS: '{input_text}' → '{result}'")
            passed += 1
        else:
            print(f"❌ FAIL: '{input_text}'")
            print(f"   Expected: '{expected}'")
            print(f"   Got: '{result}'")
            failed += 1
    
    return passed, failed


def test_email_sanitization():
    """Test email sanitization"""
    print("\n" + "="*70)
    print("🧪 EMAIL SANITIZATION TESTS")
    print("="*70)
    
    test_cases = [
        ("test@example.com", "test@example.com"),
        ("Test@Example.COM", "test@example.com"),
        ("  test@example.com  ", "test@example.com"),
        ("test+tag@example.com", "test+tag@example.com"),
        ("test<script>@example.com", "testscript@example.com"),
    ]
    
    passed = 0
    failed = 0
    
    for input_text, expected in test_cases:
        result = sanitize_email(input_text)
        if result == expected:
            print(f"✅ PASS: '{input_text}' → '{result}'")
            passed += 1
        else:
            print(f"❌ FAIL: '{input_text}'")
            print(f"   Expected: '{expected}'")
            print(f"   Got: '{result}'")
            failed += 1
    
    return passed, failed


def test_sql_injection_detection():
    """Test SQL injection detection"""
    print("\n" + "="*70)
    print("🧪 SQL INJECTION DETECTION TESTS")
    print("="*70)
    
    test_cases = [
        ("Normal text", True, "Safe text"),
        ("SELECT * FROM users", False, "SQL SELECT statement"),
        ("'; DROP TABLE users--", False, "SQL injection attempt"),
        ("1' OR '1'='1", False, "OR injection"),
        ("admin'--", False, "Comment injection"),
        ("UNION SELECT password", False, "UNION injection"),
        ("John's Restaurant", True, "Apostrophe in name"),
    ]
    
    passed = 0
    failed = 0
    
    for input_text, should_pass, description in test_cases:
        result = validate_no_sql_injection(input_text)
        if result == should_pass:
            status = "✅ PASS" if should_pass else "✅ PASS (Blocked)"
            print(f"{status}: {description}")
            print(f"   Input: '{input_text}'")
            passed += 1
        else:
            print(f"❌ FAIL: {description}")
            print(f"   Input: '{input_text}'")
            print(f"   Expected: {'Safe' if should_pass else 'Blocked'}")
            print(f"   Got: {'Safe' if result else 'Blocked'}")
            failed += 1
    
    return passed, failed


def test_command_injection_detection():
    """Test command injection detection"""
    print("\n" + "="*70)
    print("🧪 COMMAND INJECTION DETECTION TESTS")
    print("="*70)
    
    test_cases = [
        ("Normal text", True, "Safe text"),
        ("test; rm -rf /", False, "Command separator"),
        ("test | cat /etc/passwd", False, "Pipe command"),
        ("test && echo hacked", False, "AND command"),
        ("$(whoami)", False, "Command substitution"),
        ("`whoami`", False, "Backtick substitution"),
        ("../../../etc/passwd", False, "Path traversal"),
        ("test$variable", False, "Variable substitution"),
    ]
    
    passed = 0
    failed = 0
    
    for input_text, should_pass, description in test_cases:
        result = validate_no_command_injection(input_text)
        if result == should_pass:
            status = "✅ PASS" if should_pass else "✅ PASS (Blocked)"
            print(f"{status}: {description}")
            print(f"   Input: '{input_text}'")
            passed += 1
        else:
            print(f"❌ FAIL: {description}")
            print(f"   Input: '{input_text}'")
            print(f"   Expected: {'Safe' if should_pass else 'Blocked'}")
            print(f"   Got: {'Safe' if result else 'Blocked'}")
            failed += 1
    
    return passed, failed


def test_url_sanitization():
    """Test URL sanitization"""
    print("\n" + "="*70)
    print("🧪 URL SANITIZATION TESTS")
    print("="*70)
    
    test_cases = [
        ("https://example.com", "https://example.com"),
        ("http://example.com/path", "http://example.com/path"),
        ("  https://example.com  ", "https://example.com"),
        ("https://example.com/test<script>", "https://example.com/testscript"),
    ]
    
    passed = 0
    failed = 0
    
    for input_text, expected in test_cases:
        result = sanitize_url(input_text)
        if result == expected:
            print(f"✅ PASS: '{input_text}' → '{result}'")
            passed += 1
        else:
            print(f"❌ FAIL: '{input_text}'")
            print(f"   Expected: '{expected}'")
            print(f"   Got: '{result}'")
            failed += 1
    
    return passed, failed


if __name__ == "__main__":
    print("\n" + "="*70)
    print("🔒 INPUT SANITIZATION TEST SUITE")
    print("="*70)
    
    results = []
    
    # Run all tests
    results.append(("HTML Sanitization", *test_html_sanitization()))
    results.append(("Name Sanitization", *test_name_sanitization()))
    results.append(("Email Sanitization", *test_email_sanitization()))
    results.append(("SQL Injection Detection", *test_sql_injection_detection()))
    results.append(("Command Injection Detection", *test_command_injection_detection()))
    results.append(("URL Sanitization", *test_url_sanitization()))
    
    # Print summary
    print("\n" + "="*70)
    print("📊 TEST SUMMARY")
    print("="*70)
    
    total_passed = 0
    total_failed = 0
    
    for test_name, passed, failed in results:
        total_passed += passed
        total_failed += failed
        status = "✅" if failed == 0 else "⚠️"
        print(f"{status} {test_name}: {passed} passed, {failed} failed")
    
    print(f"\nTotal: {total_passed} passed, {total_failed} failed")
    
    if total_failed == 0:
        print("\n🎉 ALL TESTS PASSED!")
    else:
        print(f"\n⚠️  {total_failed} TESTS FAILED")
    
    print("="*70)
