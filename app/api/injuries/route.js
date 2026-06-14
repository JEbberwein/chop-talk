import { NextResponse } from 'next/server';

const SOURCE_URL = 'https://www.mlb.com/braves/news/braves-injuries-and-roster-moves';

function decodeHtml(value = '') {
  return value
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;|&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

function plainText(value = '') {
  return decodeHtml(value)
    .replace(/<forge-entity[^>]*>/g, '')
    .replace(/<\/forge-entity>/g, '')
    .replace(/<a[^>]*>.*?<\/a>/g, '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractField(markdown, label) {
  const match = markdown.match(new RegExp(`\\*\\*${label}:\\*\\*\\s*(.*?)(?:\\s{2,}\\n|$)`));
  return match ? plainText(match[1]) : null;
}

function parseInjury(markdown) {
  const player = markdown.match(/<forge-entity title="([^"]+)"[^>]*>(.*?)<\/forge-entity>/);
  if (!player) return null;

  const prefix = markdown.slice(0, player.index).trim();
  const link = markdown.match(/<a href="([^"]+)"/);
  const updated = markdown.match(/Last updated:\s*([^)]+)\)/i);
  const status = extractField(markdown, 'Status');

  return {
    position: plainText(prefix),
    name: plainText(player[1]),
    injury: extractField(markdown, 'Injury'),
    ilDate: extractField(markdown, 'IL date'),
    expectedReturn: extractField(markdown, 'Expected return') || 'TBD',
    status: status?.replace(/\s*\(Last updated:.*$/i, '').trim() || null,
    lastUpdated: updated ? plainText(updated[1]) : null,
    link: link ? decodeHtml(link[1]) : SOURCE_URL,
  };
}

export async function GET() {
  try {
    const response = await fetch(SOURCE_URL, { next: { revalidate: 1800 } });
    if (!response.ok) throw new Error('Official injury tracker is unavailable.');

    const html = await response.text();
    const markdownBlocks = [];
    const pattern = /"__typename":"Markdown","content":"((?:\\.|[^"\\])*)","type":"text"/g;
    let match;

    while ((match = pattern.exec(html)) !== null) {
      try {
        markdownBlocks.push(JSON.parse(`"${match[1]}"`));
      } catch {
        // Ignore unrelated malformed content blocks.
      }
    }

    const injuries = markdownBlocks
      .filter((block) => block.includes('**Injury:**') && block.includes('<forge-entity'))
      .map(parseInjury)
      .filter(Boolean);

    if (injuries.length === 0) throw new Error('No current injury entries were found.');

    return NextResponse.json({
      injuries,
      sourceUrl: SOURCE_URL,
      fetchedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { injuries: [], sourceUrl: SOURCE_URL, message: error.message },
      { status: 502 }
    );
  }
}
