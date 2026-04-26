with open('app/api/chat/route.js', 'r') as f:
    lines = f.readlines()

cleaned = []
skip_until_response = False
for i, line in enumerate(lines):
    if i == 70:  # line 71 in 1-indexed (0-indexed = 70)
        skip_until_response = True
    if skip_until_response:
        if 'const response = await client' in line:
            skip_until_response = False
            cleaned.append(line)
    else:
        cleaned.append(line)

with open('app/api/chat/route.js', 'w') as f:
    f.writelines(cleaned)

print('Done, lines now:', len(cleaned))
