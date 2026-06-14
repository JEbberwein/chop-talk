import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const BRAVES_ID = 144;

async function getBravesNews() {
  try {
    const res = await fetch('https://www.mlb.com/braves/feeds/news/rss.xml');
    const xml = await res.text();
    const titles = xml.match(/CDATA\[(.*?)\]\]/g);
    if (!titles) return '';
    const headlines = titles.filter(t => !['CDATA[Braves News]', 'CDATA[en]'].includes(t)).slice(0, 8).map(t => t.replace('CDATA[', '').replace(']]', ''));
    return 'Latest Braves news: ' + headlines.join(' | ') + '.';
  } catch (err) { return ''; }
}

async function getBravesContext() {
  try {
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
    const season = 2026;
    const base = 'https://statsapi.mlb.com/api/v1';
    const [gameRes, rosterRes, hitRes, starterRes, bullpenRes] = await Promise.all([
      fetch(base + '/schedule?teamId=' + BRAVES_ID + '&sportId=1&startDate=' + today + '&endDate=' + today + '&hydrate=probablePitcher,linescore'),
      fetch(base + '/teams/' + BRAVES_ID + '/roster?rosterType=active&season=' + season),
      fetch(base + '/stats?stats=season&group=hitting&season=' + season + '&teamId=' + BRAVES_ID + '&sportId=1&limit=25'),
     fetch(base + '/stats?stats=season&group=pitching&season=' + season + '&teamId=' + BRAVES_ID + '&sportId=1&limit=30'),
      fetch(base + '/stats?stats=season&group=pitching&season=' + season + '&teamId=' + BRAVES_ID + '&sportId=1&limit=30'),
    ]);
    const [gameData, rosterData, hitData, starterData, bullpenData] = await Promise.all([gameRes.json(), rosterRes.json(), hitRes.json(), starterRes.json(), bullpenRes.json()]);
    let context = '';

    if (hitData.stats && hitData.stats[0] && hitData.stats[0].splits) {
      context += 'HITTING STATS 2026:\n' + hitData.stats[0].splits.map(p =>
        p.player.fullName + ': AVG ' + (p.stat.avg||'.000') + ' HR ' + (p.stat.homeRuns||0) + ' RBI ' + (p.stat.rbi||0) + ' OPS ' + (p.stat.ops||'.000') + ' G ' + (p.stat.gamesPlayed||0)
      ).join('\n') + '\n\n';
    }

    if (starterData.stats && starterData.stats[0] && starterData.stats[0].splits && starterData.stats[0].splits.length > 0) {
      context += 'STARTING PITCHERS 2026:\n' + starterData.stats[0].splits.map(p =>
        p.player.fullName + ': ERA ' + (p.stat.era||'-.--') + ' W-L ' + (p.stat.wins||0) + '-' + (p.stat.losses||0) + ' WHIP ' + (p.stat.whip||'-.--') + ' K ' + (p.stat.strikeOuts||0) + ' IP ' + (p.stat.inningsPitched||0)
      ).join('\n') + '\n\n';
    }

    if (bullpenData.stats && bullpenData.stats[0] && bullpenData.stats[0].splits && bullpenData.stats[0].splits.length > 0) {
      context += 'BULLPEN PITCHERS 2026:\n' + bullpenData.stats[0].splits.map(p =>
        p.player.fullName + ': ERA ' + (p.stat.era||'-.--') + ' W-L ' + (p.stat.wins||0) + '-' + (p.stat.losses||0) + ' WHIP ' + (p.stat.whip||'-.--') + ' K ' + (p.stat.strikeOuts||0) + ' SV ' + (p.stat.saves||0) + ' IP ' + (p.stat.inningsPitched||0)
      ).join('\n') + '\n\n';
    } else if (starterData.stats && starterData.stats[0] && starterData.stats[0].splits) {
      context += 'NOTE: All pitchers listed above. Bullpen filter returned no separate results.\n\n';
    }

    if (rosterData.roster) {
      const pitchers = rosterData.roster.filter(p => p.position.code === '1');
      const position = rosterData.roster.filter(p => p.position.code !== '1');
      context += 'ACTIVE PITCHERS: ' + pitchers.map(p => p.person.fullName).join(', ') + '.\n\n';
      context += 'POSITION PLAYERS: ' + position.map(p => p.person.fullName + ' (' + p.position.abbreviation + ')').join(', ') + '.\n\n';
    }

    if (!gameData.dates || gameData.dates.length === 0) {
      context += 'No Braves game today.';
    } else {
      const game = gameData.dates[0].games[0];
      const isHome = game.teams && game.teams.home && game.teams.home.team && game.teams.home.team.id === BRAVES_ID;
      const braves = isHome ? game.teams.home : game.teams.away;
      const opponent = isHome ? game.teams.away : game.teams.home;
      const status = game.status && game.status.abstractGameState;
      context += 'TODAY\'S GAME: Braves ' + (isHome ? 'vs' : '@') + ' ' + opponent.team.name + '. ' + game.status.detailedState + '. ';
      if (status === 'Live' || status === 'Final') context += 'Score: Braves ' + (braves.score||0) + '-' + (opponent.score||0) + '. ';
      if (status === 'Preview') {
        const bp = isHome ? (game.teams.home.probablePitcher && game.teams.home.probablePitcher.fullName) : (game.teams.away.probablePitcher && game.teams.away.probablePitcher.fullName);
        const op = isHome ? (game.teams.away.probablePitcher && game.teams.away.probablePitcher.fullName) : (game.teams.home.probablePitcher && game.teams.home.probablePitcher.fullName);
        context += 'Starters: ATL ' + (bp||'TBD') + ' vs ' + (op||'TBD') + '. ';
      }
    }
    return context;
  } catch (err) {
    console.error('Context error:', err.message);
    return 'Live data unavailable.';
  }
}

function stripMarkdown(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '')
    .replace(/\*(.+?)\*/g, '')
    .replace(/#{1,6}\s/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '')
    .replace(/^[-*]\s/gm, '')
    .replace(/\|/g, ' ')
    .replace(/^-{3,}$/gm, '')
    .trim();
}

export async function POST(request) {
  try {
    const { messages, selectedGame } = await request.json();
    const [bravesContext, bravesNews] = await Promise.all([getBravesContext(), getBravesNews()]);
    const today = new Date().toLocaleDateString('en-US', { timeZone: 'America/New_York', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const selectedGameContext = selectedGame?.gameTime && selectedGame?.opponentName
      ? [
          'SELECTED APP GAME:',
          `The Ask screen is referring specifically to the Braves game on ${new Date(selectedGame.gameTime).toLocaleDateString('en-US', {
            timeZone: 'America/New_York',
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })} ${selectedGame.isHome ? 'against' : 'at'} the ${selectedGame.opponentName}.`,
          `App status: ${selectedGame.status}.`,
          selectedGame.status === 'Final' || selectedGame.status === 'Live'
            ? `App score: Braves ${selectedGame.bravesScore}, ${selectedGame.opponentAbbr || selectedGame.opponentName} ${selectedGame.opponentScore}.`
            : '',
          'When the user says "this game," "the game," or taps a suggested game question, answer about this selected game. State the date when needed to prevent ambiguity.',
        ].filter(Boolean).join('\n')
      : 'SELECTED APP GAME: None.';
    const systemPrompt = [
      'You are Chop Talk, a passionate Atlanta Braves superfan assistant.',
      '',
      'RESPONSE RULES:',
      '1. Never use markdown formatting. No bold, no headers, no bullet points, no tables. Write in plain conversational sentences.',
      '2. For ANY question about stats, hitting, pitching, bullpen, or standings: read the data in CURRENT BRAVES STATS below and answer directly from it. Never say the data is unavailable.',
      '3. The BULLPEN PITCHERS section lists relievers specifically. When asked about the bullpen, list them by name with ERA, WHIP, and saves.',
      '4. Only use web_search for: injury updates, trade news, player personal info, or historical facts not in the stats.',
      '5. Write like an enthusiastic fan. Use we and us for the Braves. Keep answers to 4-6 sentences.',
      '6. Never redirect users to MLB.com or other sites when you have the data.',
      '',
      'CURRENT BRAVES STATS:',
      bravesContext,
      selectedGameContext,
      'LATEST BRAVES NEWS:',
      bravesNews,
      '',
      'Today: ' + today,
    ].join('\n');

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: systemPrompt,
      tools: [{ type: 'web_search_20250305', name: 'web_search' }],
      messages: [...messages],
    });
    const textBlocks = response.content.filter(b => b.type === "text");
    const rawReply = textBlocks.map(b => b.text).join(" ").trim();
    const reply = rawReply;
    return NextResponse.json({ reply });
  } catch (err) {
    console.error('ERROR:', err.message);
    if (err.message && err.message.toLowerCase().includes('credit balance is too low')) {
      return NextResponse.json({
        reply: "Chop Talk's AI answers are temporarily offline, but the game snapshot, standings, radio link, and recap links still work. The answer engine should be back once service credits are refreshed.",
      });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}


