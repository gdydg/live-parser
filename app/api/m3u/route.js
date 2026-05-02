import { NextResponse } from 'next/server';

export async function GET() {
  const apiUrl = 'https://urgetwg35nbhghj439b99.k8v4dh4.app/api/c5/business/livehouse/index?lang=zh';

  try {
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      cache: 'no-store'
    });

    if (!response.ok) {
       return new NextResponse(`上游请求失败，状态码: ${response.status}`, { status: response.status });
    }

    const json = await response.json();

    // 提取并过滤直播流
    const activeStreams = (json.data?.ongoingLivestreams || []).filter(stream => {
      // 兼容官方数据中可能带空格的 "卫星 Live" 和 "卫星Live"
      const nickName = (stream.nickName || '').replace(/\s/g, '');
      return stream.liveStatus === 2 && nickName === '卫星Live';
    });

    // 频道名称格式化函数
    const formatName = (rawName) => {
      if (!rawName) return '未命名直播';
      return rawName
        .replace(/\s*\|\s*/g, ':')      // 将 " | " 替换为 ":"
        .replace(/\s*VS\s*/gi, '-VS-')  // 将 " VS " 替换为 "-VS-"
        .replace(/\s+/g, '');           // 去除其余所有空格
    };

    let m3uContent = '#EXTM3U\n';
    activeStreams.forEach(stream => {
      const name = formatName(stream.houseName || stream.nickName);
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
