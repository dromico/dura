#!/usr/bin/env python3
"""
Script to fix mobile responsiveness issues in HTML files
- Adds viewport meta tag
- Updates jQuery references to HTTPS
"""

import os
import re
import glob

def fix_html_file(filepath):
    """Fix a single HTML file"""
    print(f"Processing {filepath}...")
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    # Add viewport meta tag if missing
    if 'viewport' not in content:
        # Find the charset meta tag and add viewport after it
        charset_pattern = r'(<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />)'
        if re.search(charset_pattern, content):
            content = re.sub(
                charset_pattern,
                r'\1\n<meta name="viewport" content="width=device-width, initial-scale=1.0">',
                content
            )
            print(f"  ✓ Added viewport meta tag")
    
    # Fix HTTP jQuery references
    http_jquery_patterns = [
        (r'http://www\.asiapacific\.my/mobilehosting/durafloor/jquery\.js', 
         'https://ajax.googleapis.com/ajax/libs/jquery/3.6.0/jquery.min.js'),
        (r'http://www\.asiapacific\.my/mobilehosting/durafloor/mobileversion_encrypted\.js',
         'https://www.asiapacific.my/mobilehosting/durafloor/mobileversion_encrypted.js'),
        (r'http://ajax\.googleapis\.com/ajax/libs/jquery/1\.3\.2/jquery\.min\.js',
         '<!-- jQuery already loaded above -->')
    ]
    
    for pattern, replacement in http_jquery_patterns:
        if re.search(pattern, content):
            content = re.sub(pattern, replacement, content)
            print(f"  ✓ Fixed HTTP jQuery reference")
    
    # Write back if changed
    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"  ✓ Updated {filepath}")
    else:
        print(f"  - No changes needed for {filepath}")

def main():
    """Main function"""
    # List of HTML files to process (excluding already processed ones)
    html_files = [
        'akirasport.html',
        'antistatic.html', 
        'deluxecommercial.html',
        'duratilexlmarblin.html',
        'hetrogrnous.html',
        'profile.html',
        'r10.html',
        'rubberfloor.html',
        'uniquecommercial.html',
        'index1.html'
    ]
    
    for html_file in html_files:
        if os.path.exists(html_file):
            fix_html_file(html_file)
        else:
            print(f"File not found: {html_file}")
    
    print("\nMobile responsiveness fixes completed!")

if __name__ == "__main__":
    main()
