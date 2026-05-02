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
    
    // 用于存放所有符合条件的最终直播源
    const allExtractedStreams = [];

    // ==========================================
    // 逻辑 1：提取 ongoingLivestreams 中的“卫星Live”
    // ==========================================
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

    // ==========================================
    // 逻辑 2：提取 matchLivestreams 中的官方赛事
    // ==========================================
    const matchStreams = json.data?.matchLivestreams || [];
    matchStreams.forEach(item => {
      const match = item.result?.match;
      if (match && match.videoUrl) {
        const compName = match.competition?.name || '未知联赛';
        const homeName = match.homeTeam?.name || '未知主队';
        const awayName = match.awayTeam?.name || '未知客队';
        
        // 拼接名称格式，例如：西澳大利亚州甲级联赛:金斯利西部-VS-苏比亚科
        const name = `${compName}:${homeName}-VS-${awayName}`.replace(/\s+/g, '');
        
        // 替换清晰度标识为 1080p
        const streamUrl = match.videoUrl.replace('_autoChange.m3u8', '_1080p.m3u8');
        
        allExtractedStreams.push({ name, url: streamUrl });
      }
    });

    // ==========================================
    // 生成最终的 M3U 内容
    // ==========================================
    let m3uContent = '#EXTM3U\n';
    allExtractedStreams.forEach(stream => {
      m3uContent += `#EXTINF:-1,${stream.name}\n${stream.url}\n`;
    });

    return new NextResponse(m3uContent, {
      headers: {
        'Content-Type': 'application/vnd.apple.mpegurl; charset=utf-8',
        'Content-Disposition': 'inline; filename="live.m3u"'
      }
    });
  } catch (err) {
    return new NextResponse('Error: ' + err.message, { status: 500 });
  }
}
