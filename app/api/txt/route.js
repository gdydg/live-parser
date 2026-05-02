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
      const nickName = (stream.nickName || '').replace(/\s/g, '');
      return stream.liveStatus === 2 && nickName === '卫星Live';
    });

    // 频道名称格式化函数
    const formatName = (rawName) => {
      if (!rawName) return '未命名直播';
      return rawName
        .replace(/\s*\|\s*/g, ':')
        .replace(/\s*VS\s*/gi, '-VS-')
        .replace(/\s+/g, '');
    };

    let txtContent = '';
    activeStreams.forEach(stream => {
      const name = formatName(stream.houseName || stream.nickName);
      const streamUrl = stream.playStreamAddress2 || stream.playStreamAddress;
      if (streamUrl) {
        txtContent += `${name},${streamUrl}\n`;
      }
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
