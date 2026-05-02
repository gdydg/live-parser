import { NextResponse } from 'next/server';

export async function GET() {
  const apiUrl = 'https://urgetwg35nbhghj439b99.k8v4dh4.app/api/c5/business/livehouse/index?lang=zh';

  try {
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      cache: 'no-store'
    });

    if (!response.ok) {
       return new NextResponse(`上游请求失败，状态码: ${response.status}`, { status: response.status });
    }

    const json = await response.json();
    const allExtractedStreams = [];

    // 1：提取 ongoingLivestreams 中的“卫星Live”
    const anchorStreams = (json.data?.ongoingLivestreams || []).filter(stream => {
      const nickName = (stream.nickName || '').replace(/\s/g, '');
      return stream.liveStatus === 2 && nickName === '卫星Live';
    });

    const formatName = (rawName) => {
      if (!rawName) return '未命名直播';
      return rawName
        .replace(/\s*\|\s*/g, ':')
        .replace(/\s*VS\s*/gi, '-VS-')
        .replace(/\s+/g, '');
    };

    anchorStreams.forEach(stream => {
      const name = formatName(stream.houseName || stream.nickName);
      const streamUrl = stream.playStreamAddress2 || stream.playStreamAddress;
      if (streamUrl) {
        allExtractedStreams.push({ name, url: streamUrl });
      }
    });

    // 2：提取 matchLivestreams 中的官方赛事
    const matchStreams = json.data?.matchLivestreams || [];
    matchStreams.forEach(item => {
      const match = item.result?.match;
      if (match && match.videoUrl) {
        const compName = match.competition?.name || '未知联赛';
        const homeName = match.homeTeam?.name || '未知主队';
        const awayName = match.awayTeam?.name || '未知客队';
        
        const name = `${compName}:${homeName}-VS-${awayName}`.replace(/\s+/g, '');
        const streamUrl = match.videoUrl.replace('_autoChange.m3u8', '_1080p.m3u8');
        
        allExtractedStreams.push({ name, url: streamUrl });
      }
    });

    // 3：生成最终的 TXT 内容
    let txtContent = '';
    allExtractedStreams.forEach(stream => {
      txtContent += `${stream.name},${stream.url}\n`;
    });

    return new NextResponse(txtContent, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': 'inline; filename="live.txt"'
      }
    });
  } catch (err) {
    return new NextResponse('Error: ' + err.message, { status: 500 });
  }
}
