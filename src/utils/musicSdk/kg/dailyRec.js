import { httpFetch } from '../../request'
import { formatPlayTime } from '../../index'
import { signatureParams } from './util'
import leaderboard from './leaderboard'

// 数据转换（只保留最基础的安全字段，绝不依赖额外库）
const transformSong = (item, index) => {
  try {
    const hash = item.hash || item.audio_info?.hash || ''
    const audioId = item.audio_id || item.audio_info?.audio_id || 0
    const songname = item.songname || item.audio_info?.songname || item.name || ''
    const singername = item.author_name || item.singername || item.audio_info?.singername || ''
    const albumName = item.album_name || item.audio_info?.album_name || ''
    const albumId = item.album_id || item.audio_info?.album_id || ''
    const rawDuration = item.time_length || item.timelength || item.timelen || item.duration || item.audio_info?.timelength || 0
    const duration = rawDuration > 10000 ? Math.floor(rawDuration / 1000) : rawDuration
    
    let img = item.sizable_cover || item.image || item.audio_info?.image || item.album_sizable_cover || ''
    if (!img && hash) {
      img = `https://imge.kugou.com/stdmusic/400/${hash.substring(0, 8)}.jpg`
    }
    
    return {
      id: `kg__${hash}`,
      name: songname,
      singer: singername,
      source: 'kg',
      interval: duration ? formatPlayTime(duration) : '',
      img: img,
      albumName,
      albumId: String(albumId),
      songmid: String(audioId),
      hash,
      mixSongId: item.mixsongid || item.audio_info?.mixsongid || 0,
      types: [{ type: '128k', size: null }],
      _types: { '128k': { size: null } },
      typeUrl: {},
      meta: {
        songId: String(audioId),
        albumName,
        albumId: String(albumId),
        picUrl: img,
        qualitys: [{ type: '128k', size: null }],
        _qualitys: { '128k': { size: null } },
        hash,
        mixsongid: item.mixsongid || 0,
      },
    }
  } catch (e) {
    console.log(`[KG DailyRec] transformSong 失败`, e.message)
    return null
  }
}

const transformSongList = (rawList) => {
  if (!rawList || !Array.isArray(rawList)) return []
  return rawList.map((item, i) => transformSong(item, i)).filter(Boolean)
}

// 生成酷狗需要的签名（直接调用你项目现成的 signatureParams）
const buildKgParams = (paramsMap, bodyStr = '') => {
  const paramList = Object.keys(paramsMap).sort().map(k => `${k}=${paramsMap[k]}`).join('&')
  return signatureParams(paramList, 'android', bodyStr)
}

export default {
  async getEverydayRecommend(retryNum = 0) {
    if (retryNum > 2) return Promise.reject(new Error('try max num'))
    try {
      const clienttime = Math.floor(Date.now() / 1000)
      const paramsMap = {
        dfid: '-',
        mid: '-',
        uuid: '-',
        appid: '1005',
        clientver: '20489',
        clienttime: clienttime,
        platform: 'ios',
      }
      const sig = buildKgParams(paramsMap)
      const url = `https://gateway.kugou.com/everyday_song_recommend`
      const paramString = Object.keys(paramsMap).map(k => `${k}=${paramsMap[k]}`).join('&') + `&signature=${sig}`

      const { body } = await httpFetch(url + '?' + paramString, {
        method: 'POST',
        headers: {
          'User-Agent': 'Android15-1070-11440-46-0-DiscoveryDRADProtocol-wifi',
          'x-router': 'everydayrec.service.kugou.com',
          'Content-Type': 'application/json',
        },
      }).promise

      if (body?.status === 1 || body?.error_code === 0) {
        const songs = body?.data?.song_list || body?.data?.songs || body?.data?.list || []
        if (songs.length > 0) {
          return { total: songs.length, list: transformSongList(songs), limit: 30, page: 1, source: 'kg' }
        }
      }
      throw new Error('每日推荐无数据')
    } catch (e) {
      console.log('[KG DailyRec] 每日推荐失败，降级为榜单', e.message)
      // 🛡️ 超级兜底：如果每日推荐失败（没 Cookie/没登录），自动降级为 TOP500，保证界面绝不空白！
      return leaderboard.getList('8888', 1, 30)
    }
  }
}
