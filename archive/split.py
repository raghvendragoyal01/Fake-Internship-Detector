import os
import re

base_dir = r'c:\Users\Raghvendra Goyal\Downloads\Fake job Scam System\fake_job_scam_system\frontend'
index_path = os.path.join(base_dir, 'index.html')
dash_path = os.path.join(base_dir, 'dashboard.html')

with open(index_path, 'r', encoding='utf-8') as f:
    content = f.read()

parts = content.split('<!-- Main Application Container -->')
if len(parts) >= 2:
    landing_part = parts[0]
    portal_part = '<!-- Main Application Container -->\n' + parts[1]
    
    # FOR INDEX.HTML (Landing Only)
    # Remove <style>...</style> and replace with <link rel="stylesheet" href="style.css">
    index_html = re.sub(r'<style>.*?</style>', '<link rel="stylesheet" href="style.css">', landing_part, flags=re.DOTALL)
    # The end of landing_part doesn't have closing body/html, so add it
    index_html += '\n  <script src="auth.js"></script>\n</body>\n</html>'
    
    # FOR DASHBOARD.HTML (Portal Only)
    # Get the head from landing_part
    head_match = re.search(r'(<!DOCTYPE html>.*?<head>.*?</head>)', landing_part, flags=re.DOTALL)
    head_part = head_match.group(1) if head_match else '<!DOCTYPE html>\n<html lang="en">\n<head>\n</head>'
    head_part = re.sub(r'<style>.*?</style>', '<link rel="stylesheet" href="style.css">', head_part, flags=re.DOTALL)
    
    # Wrap portal_part in body tag
    dash_html = head_part + '\n<body class="text-slate-100 min-h-screen flex flex-col cursor-none">\n' + portal_part
    # Change app.js script tag to dashboard.js in dashboard.html
    dash_html = dash_html.replace('<script src="app.js"></script>', '<script src="dashboard.js"></script>')
    
    with open(index_path, 'w', encoding='utf-8') as f:
        f.write(index_html)
        
    with open(dash_path, 'w', encoding='utf-8') as f:
        f.write(dash_html)
        
    print('Split successful')
else:
    print('Split failed, marker not found')
