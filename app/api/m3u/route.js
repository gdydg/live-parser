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
    const streamsMap = new Map();

    const formatName = (rawName) => {
      if (!rawName) return '未命名直播';
      return rawName
        .replace(/\s*\|\s*/g, ':')
        .replace(/\s*VS\s*/gi, '-VS-')
        .replace(/\s+/g, '');
    };

    // 提取流的辅助函数
    const extractStream = (stream) => {
      const nickName = (stream.nickName || '').replace(/\s/g, '');
      const url = stream.playStreamAddress2 || stream.playStreamAddress;
      
      // 必须是卫星Live，且链接有效
      if (stream.liveStatus === 2 && nickName === '卫星Live' && url && url.length > 15) {
        const name = formatName(stream.houseName || stream.nickName);
        streamsMap.set(name, url);
      }
    };

    // 1. 扫荡三个基础主播数组
    ['ongoingLivestreams', 'anchorLivestreams', 'streamingAnchorRanking'].forEach(key => {
      (json.data?.[key] || []).forEach(extractStream);
    });

    // 2. 扫荡 matchLivestreams
    (json.data?.matchLivestreams || []).forEach(item => {
      // 2.1 检查比赛本身的官方流 (替换 1080p)
      const match = item.result?.match;
      if (match && match.videoUrl && match.videoUrl.length > 15) {
        const compName = match.competition?.name || '';
        const homeName = match.homeTeam?.name || '';
        const awayName = match.awayTeam?.name || '';
        let rawName = (compName && homeName && awayName) 
            ? `${compName} | ${homeName} VS ${awayName}` 
            : (match.name || '官方赛事');
            
        const name = formatName(rawName);
        const url = match.videoUrl.replace('_autoChange', '_1080p');
        streamsMap.set(name, url);
      }

      // 2.2 检查挂载在比赛下面的预约主播 (reservedAnchors)
      (item.reservedAnchors || []).forEach(extractStream);
      
      // 2.3 检查挂载在比赛下面的预约主播 (anchorAppointmentVoList)
      (item.anchorAppointmentVoList || []).forEach(extractStream);
    });

    // 生成最终的 M3U
    let m3uContent = '#EXTM3U\n';
    streamsMap.forEach((url, name) => {
      m3uContent += `#EXTINF:-1,${name}\n${url}\n`;
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
