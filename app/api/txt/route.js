import { NextResponse } from 'next/server';

// 豪华版联赛名称替换字典
const leagueMap = {
  "美国职业篮球联赛": "NBA",
  "美国女子职业篮球联赛": "WNBA",
  "中国男子篮球联赛": "CBA",
  "中国女子篮球联赛": "WCBA",
  "中国台湾男子超级篮球联赛": "SBL",
  "中国台湾女子超级篮球联赛": "WSBL",
  "中国台湾P. LEAGUE+": "PLG",
  "中国台湾T1联赛": "T1",
  "日本B1篮球联赛": "B1",
  "日本B2篮球联赛": "B2",
  "韩国职业篮球联赛": "KBL",
  "欧洲篮球联赛": "欧篮联",
  "菲律宾MPBL": "菲MPBL",
  "澳大利亚国家篮球联赛": "NBL",
  "英格兰超级联赛": "英超",
  "西班牙足球甲级联赛": "西甲",
  "意大利甲级联赛": "意甲",
  "德国甲级联赛": "德甲",
  "法国甲级联赛": "法甲",
  "英格兰冠军联赛": "英冠",
  "德国乙级联赛": "德乙",
  "法国乙级联赛": "法乙",
  "葡萄牙超级联赛": "葡超",
  "荷兰足球甲级联赛": "荷甲",
  "欧洲冠军联赛": "欧冠",
  "欧足联欧洲联赛": "欧联",
  "欧足联欧洲足协杯": "欧协联",
  "俄罗斯超级联赛": "俄超",
  "俄罗斯女子超级联赛": "俄女超",
  "中国足球协会超级联赛": "中超",
  "中国足球协会甲级联赛": "中甲",
  "中国足球协会乙级联赛": "中乙",
  "中国足球协会会员协会冠军联赛": "中冠",
  "中国女子足球超级联赛": "女超",
  "中国女子足球甲级联赛": "女甲",
  "韩国职业甲级足球联赛": "韩K联",
  "日本职业足球甲级联赛（J1）": "日职联",
  "日本职业足球乙级联赛（J2）": "日职乙",
  "澳大利亚足球超级联赛": "澳超",
  "亚足联冠军联赛": "亚冠",
  "亚冠二级联赛": "亚冠2",
  "美国职业大联盟联赛": "美职联",
  "巴西甲级联赛": "巴甲",
  "阿根廷甲级联赛": "阿甲",
  "沙特阿拉伯超级联赛": "沙特联",
  "香港足球超级联赛": "港超",
  "台湾木兰联赛": "木兰联赛",
  "俱乐部友谊赛": "友谊赛",
  "国家队友谊赛": "友谊赛",
  "英雄联盟": "LOL",
  "王者荣耀": "王者",
  "绝地求生": "PUBG",
  "刀塔2": "DOTA2",
  "无畏契约": "瓦罗兰特"
};

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

    const addStream = (name, url) => {
      if (!streamsMap.has(name)) {
        streamsMap.set(name, new Set());
      }
      streamsMap.get(name).add(url);
    };

    const extractStream = (stream) => {
      const nickName = (stream.nickName || '').replace(/\s/g, '');
      const url = stream.playStreamAddress2 || stream.playStreamAddress;
      if (stream.liveStatus === 2 && nickName === '卫星Live' && url && url.length > 15) {
        const name = formatName(stream.houseName || stream.nickName);
        addStream(name, url);
      }
    };

    ['ongoingLivestreams', 'anchorLivestreams', 'streamingAnchorRanking'].forEach(key => {
      (json.data?.[key] || []).forEach(extractStream);
    });

    (json.data?.matchLivestreams || []).forEach(item => {
      const match = item.result?.match;
      if (match && match.videoUrl && match.videoUrl.length > 15) {
        const rawCompName = match.competition?.name || '';
        const compName = leagueMap[rawCompName] || rawCompName;
        
        const homeName = match.homeTeam?.name || '';
        const awayName = match.awayTeam?.name || '';
        
        let rawName = (compName && homeName && awayName) 
            ? `${compName} | ${homeName} VS ${awayName}` 
            : (match.name || '官方赛事');
            
        const name = formatName(rawName);
        const url = match.videoUrl.replace('_autoChange', '_1080p');
        addStream(name, url);
      }

      (item.reservedAnchors || []).forEach(extractStream);
      (item.anchorAppointmentVoList || []).forEach(extractStream);
    });

    let txtContent = '原声(直连),#genre#\n';
    streamsMap.forEach((urls, name) => {
      urls.forEach(url => {
        txtContent += `${name},${url}\n`;
      });
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
