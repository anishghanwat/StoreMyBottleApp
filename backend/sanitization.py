"""
Input sanitization utilities to prevent XSS and injection attacks
"""
import re
import bleach
from typing import Optional


# Allowed HTML tags (empty list = strip all HTML)
ALLOWED_TAGS = []
ALLOWED_ATTRIBUTES = {}

# Allowed protocols for links (if we ever allow HTML)
ALLOWED_PROTOCOLS = ['http', 'https', 'mailto']


def sanitize_html(text: str) -> str:
    """
    Remove all HTML tags and attributes from text.
    Prevents XSS attacks by stripping any HTML/JavaScript.
    
    Args:
        text: Input text that may contain HTML
        
    Returns:
        Sanitized text with all HTML removed
    """
    if not text:
        return text
    
    # Strip all HTML tags
    cleaned = bleach.clean(
        text,
        tags=ALLOWED_TAGS,
        attributes=ALLOWED_ATTRIBUTES,
        protocols=ALLOWED_PROTOCOLS,
        strip=True
    )
    
    return cleaned


def sanitize_string(text: str, max_length: Optional[int] = None) -> str:
    """
    Sanitize a general string input.
    - Removes HTML tags
    - Trims whitespace
    - Enforces length limits
    - Removes null bytes
    
    Args:
        text: Input text to sanitize
        max_length: Maximum allowed length (optional)
        
    Returns:
        Sanitized text
    """
    if not text:
        return text
    
    # Remove null bytes (can cause issues)
    text = text.replace('\x00', '')
    
    # Strip HTML
    text = sanitize_html(text)
    
    # Trim whitespace
    text = text.strip()
    
    # Enforce length limit
    if max_length and len(text) > max_length:
        text = text[:max_length]
    
    return text


def sanitize_name(name: str) -> str:
    """
    Sanitize a name field (person, venue, bottle, etc.).
    - Removes HTML
    - Trims whitespace
    - Allows letters, numbers, spaces, and basic punctuation
    - Max 255 characters
    
    Args:
        name: Name to sanitize
        
    Returns:
        Sanitized name
    """
    if not name:
        return name
    
    # Basic sanitization
    name = sanitize_string(name, max_length=255)
    
    # Allow only safe characters: letters, numbers, spaces, and basic punctuation
    # This prevents SQL injection and command injection
    name = re.sub(r'[^\w\s\-\.,&\'()]', '', name, flags=re.UNICODE)
    
    # Remove excessive whitespace
    name = re.sub(r'\s+', ' ', name)
    
    return name.strip()


def sanitize_email(email: str) -> str:
    """
    Sanitize an email address.
    - Removes HTML
    - Trims whitespace
    - Converts to lowercase
    - Basic format validation
    
    Args:
        email: Email address to sanitize
        
    Returns:
        Sanitized email
    """
    if not email:
        return email
    
    # Basic sanitization
    email = sanitize_string(email, max_length=255)
    
    # Convert to lowercase (emails are case-insensitive)
    email = email.lower()
    
    # Remove any remaining invalid characters
    email = re.sub(r'[^\w\.\-\+@]', '', email)
    
    return email


def sanitize_phone(phone: str) -> str:
    """
    Sanitize a phone number.
    - Removes HTML
    - Trims whitespace
    - Allows only digits, spaces, +, -, (, )
    
    Args:
        phone: Phone number to sanitize
        
    Returns:
        Sanitized phone number
    """
    if not phone:
        return phone
    
    # Basic sanitization
    phone = sanitize_string(phone, max_length=20)
    
    # Allow only phone number characters
    phone = re.sub(r'[^\d\s\+\-\(\)]', '', phone)
    
    return phone.strip()


def sanitize_url(url: str) -> str:
    """
    Sanitize a URL.
    - Removes HTML
    - Trims whitespace
    - Validates protocol (http/https only)
    - Max 1000 characters
    
    Args:
        url: URL to sanitize
        
    Returns:
        Sanitized URL
    """
    if not url:
        return url
    
    # Basic sanitization
    url = sanitize_string(url, max_length=1000)
    
    # Ensure URL starts with http:// or https://
    if url and not url.startswith(('http://', 'https://')):
        # Don't auto-add protocol - let validation fail
        pass
    
    # Remove any whitespace
    url = url.replace(' ', '')
    
    return url


def sanitize_address(address: str) -> str:
    """
    Sanitize an address field.
    - Removes HTML
    - Trims whitespace
    - Allows letters, numbers, spaces, and address punctuation
    - Max 500 characters
    
    Args:
        address: Address to sanitize
        
    Returns:
        Sanitized address
    """
    if not address:
        return address
    
    # Basic sanitization
    address = sanitize_string(address, max_length=500)
    
    # Allow address-friendly characters
    address = re.sub(r'[^\w\s\-\.,#/()]', '', address, flags=re.UNICODE)
    
    # Remove excessive whitespace
    address = re.sub(r'\s+', ' ', address)
    
    return address.strip()


def sanitize_description(description: str, max_length: int = 2000) -> str:
    """
    Sanitize a description or long text field.
    - Removes HTML
    - Trims whitespace
    - Preserves newlines
    - Enforces length limit
    
    Args:
        description: Description text to sanitize
        max_length: Maximum allowed length
        
    Returns:
        Sanitized description
    """
    if not description:
        return description
    
    # Remove null bytes
    description = description.replace('\x00', '')
    
    # Strip HTML
    description = sanitize_html(description)
    
    # Normalize newlines
    description = description.replace('\r\n', '\n').replace('\r', '\n')
    
    # Remove excessive newlines (more than 2 consecutive)
    description = re.sub(r'\n{3,}', '\n\n', description)
    
    # Trim whitespace from each line
    lines = [line.strip() for line in description.split('\n')]
    description = '\n'.join(lines)
    
    # Enforce length limit
    if len(description) > max_length:
        description = description[:max_length]
    
    return description.strip()


def validate_no_sql_injection(text: str) -> bool:
    """
    Check for common SQL injection patterns.
    This is a defense-in-depth measure (we use ORM which prevents SQL injection).
    
    Args:
        text: Text to check
        
    Returns:
        True if text appears safe, False if suspicious patterns detected
    """
    if not text:
        return True
    
    # Common SQL injection patterns
    sql_patterns = [
        r"(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)",
        r"(--|#|/\*|\*/)",  # SQL comments
        r"(\bOR\b.*=.*)",  # OR 1=1
        r"(\bAND\b.*=.*)",  # AND 1=1
        r"(;.*\b(SELECT|INSERT|UPDATE|DELETE)\b)",  # Multiple statements
        r"(\bUNION\b.*\bSELECT\b)",  # UNION SELECT
    ]
    
    text_upper = text.upper()
    for pattern in sql_patterns:
        if re.search(pattern, text_upper, re.IGNORECASE):
            return False
    
    return True


def validate_no_command_injection(text: str) -> bool:
    """
    Check for common command injection patterns.
    
    Args:
        text: Text to check
        
    Returns:
        True if text appears safe, False if suspicious patterns detected
    """
    if not text:
        return True
    
    # Common command injection patterns
    command_patterns = [
        r"[;&|`$]",  # Command separators and substitution
        r"\$\(",  # Command substitution
        r"\.\./",  # Path traversal
        r"\\x[0-9a-fA-F]{2}",  # Hex encoding
    ]
    
    for pattern in command_patterns:
        if re.search(pattern, text):
            return False
    
    return True


def sanitize_and_validate(
    text: str,
    field_type: str = "string",
    max_length: Optional[int] = None,
    required: bool = False
) -> tuple[str, bool, str]:
    """
    Comprehensive sanitization and validation.
    
    Args:
        text: Input text to sanitize and validate
        field_type: Type of field (string, name, email, phone, url, address, description)
        max_length: Maximum allowed length
        required: Whether field is required
        
    Returns:
        tuple: (sanitized_text, is_valid, error_message)
    """
    # Check if required
    if required and not text:
        return "", False, "This field is required"
    
    if not text:
        return "", True, ""
    
    # Sanitize based on type
    if field_type == "name":
        sanitized = sanitize_name(text)
    elif field_type == "email":
        sanitized = sanitize_email(text)
    elif field_type == "phone":
        sanitized = sanitize_phone(text)
    elif field_type == "url":
        sanitized = sanitize_url(text)
    elif field_type == "address":
        sanitized = sanitize_address(text)
    elif field_type == "description":
        sanitized = sanitize_description(text, max_length or 2000)
    else:
        sanitized = sanitize_string(text, max_length)
    
    # Check length
    if max_length and len(sanitized) > max_length:
        return sanitized[:max_length], False, f"Text exceeds maximum length of {max_length} characters"
    
    # Check for injection attempts
    if not validate_no_sql_injection(sanitized):
        return "", False, "Invalid input detected"
    
    if not validate_no_command_injection(sanitized):
        return "", False, "Invalid input detected"
    
    return sanitized, True, ""
