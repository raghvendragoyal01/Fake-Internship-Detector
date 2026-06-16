import os

base_dir = r'c:\Users\Raghvendra Goyal\Downloads\Fake job Scam System\fake_job_scam_system\frontend'
dash_path = os.path.join(base_dir, 'dashboard.html')
index_path = os.path.join(base_dir, 'index.html')

with open(dash_path, 'r', encoding='utf-8') as f:
    dash_content = f.read()

app_start = dash_content.find('<div id="app-container"')
app_end = dash_content.find('<!-- Auth Modal -->')
if app_start != -1 and app_end != -1:
    app_part = dash_content[app_start:app_end].strip()
    
    with open(index_path, 'r', encoding='utf-8') as f:
        idx_content = f.read()
    
    insert_pos = idx_content.find('</section>') + 10
    new_idx_content = idx_content[:insert_pos] + '\n\n' + app_part + '\n\n' + idx_content[insert_pos:]
    
    with open(index_path, 'w', encoding='utf-8') as f:
        f.write(new_idx_content)
    print('Successfully merged dashboard back into index.html')
else:
    print('Could not find boundaries')
