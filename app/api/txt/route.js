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

    const processAnchors = (list) => {
      (list || []).forEach(stream => {
        const nickName = (stream.nickName || '').replace(/\s/g, '');
        if (stream.liveStatus === 2 && nickName === '卫星Live') {
          const name = formatName(stream.houseName || stream.nickName);
          const url = stream.playStreamAddress2 || stream.playStreamAddress;
          // 过滤掉假链接
          if (url && url.length > 15) {
            streamsMap.set(name, url);
          }
        }
      });
    };

    processAnchors(json.data?.ongoingLivestreams);
    processAnchors(json.data?.anchorLivestreams);
    processAnchors(json.data?.streamingAnchorRanking);

    (json.data?.matchLivestreams || []).forEach(item => {
      const match = item.result?.match;
      // 过滤掉假链接
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
    });

    let txtContent = '';
    streamsMap.forEach((url, name) => {
      txtContent += `${name},${url}\n`;
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
