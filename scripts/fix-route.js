const fs = require('fs');
const route = fs.readFileSync('app/api/chat/route.js', 'utf8');
const lines = route.split('\n');
const fixed = lines.map(line => {
  if (line.trim().startsWith('const systemPrompt')) {
    return `    const systemPrompt = [
      "You are Chop Talk, an Atlanta Braves superfan assistant.",
      "Use the CURRENT BRAVES STATS below to answer with specific player names and numbers.",
      "For bullpen questions: list each reliever with their ERA, WHIP, and W-L record.",
      "No vague answers. No unnecessary emojis. Lead with data then add fan enthusiasm.",
      "",
      "CURRENT BRAVES STATS:",
      bravesContext,
      "",
      "LATEST BRAVES NEWS:",
      bravesNews,
      "",
      "Today: " + today
    ].join("\\n");`;
  }
  return line;
});
fs.writeFileSync('app/api/chat/route.js', fixed.join('\n'), 'utf8');
console.log('Done');
