import re

with open('app/api/chat/route.js', 'r') as f:
    content = f.read()

new_prompt = '    const systemPrompt = "You are Chop Talk, an Atlanta Braves superfan assistant. Use the CURRENT BRAVES STATS below to answer with specific player names and numbers. For bullpen questions list each reliever with their ERA, WHIP, and W-L record. No vague answers. No unnecessary emojis. Lead with data then add fan enthusiasm.\\n\\nCURRENT BRAVES STATS:\\n" + bravesContext + "\\n\\nLATEST BRAVES NEWS:\\n" + bravesNews + "\\n\\nToday: " + today;'

content = re.sub(r'    const systemPrompt = .*', new_prompt, content)

with open('app/api/chat/route.js', 'w') as f:
    f.write(content)

print('Done')
