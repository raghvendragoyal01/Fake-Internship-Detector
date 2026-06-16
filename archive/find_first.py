import json

log_path = r'C:\Users\Raghvendra Goyal\.gemini\antigravity-ide\brain\f1c5ef37-0b9d-4adb-811b-f8e8446ba336\.system_generated\logs\transcript.jsonl'
first_mention = None

with open(log_path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            data = json.loads(line)
            if data.get('type') == 'PLANNER_RESPONSE':
                for tc in data.get('tool_calls', []):
                    name = tc.get('name', '')
                    args = tc.get('args', {})
                    target = str(args)
                    if 'index.html' in target and not first_mention:
                        first_mention = name
        except Exception:
            pass

print(f'First tool call: {first_mention}')
