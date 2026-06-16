import json
with open('Fake_Job_Detection_NLP_Improved.ipynb', encoding='utf-8') as f:
    nb = json.load(f)

with open('notebook_src.py', 'w', encoding='utf-8') as f:
    for cell in nb['cells']:
        if cell['cell_type'] == 'code':
            f.write(''.join(cell['source']) + '\n\n')
