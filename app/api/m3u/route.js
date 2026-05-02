import { NextResponse } from 'next/server';

export async function GET() {
  const apiUrl = 'https://urgetwg35nbhghj439b99.k8v4dh4.app/api/c5/business/livehouse/index?lang=zh';

  try {
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      cache: 'no-store' // 禁用缓存，确保获取最新直播状态
    });

    const json = await response.json();
    const activeStreams = json.data?.ongoingLivestreams?.filter(stream => stream.liveStatus === 2) || [];

    let m3uContent = '#EXTM3U\n';
    activeStreams.forEach(stream => {
      const name = stream.houseName || stream.nickName || '未命名直播';
      const streamUrl = stream.playStreamAddress2 || stream.playStreamAddress;
      if (streamUrl) {
        m3uContent += `#EXTINF:-1,${name}\n${streamUrl}\n`;
      }
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
