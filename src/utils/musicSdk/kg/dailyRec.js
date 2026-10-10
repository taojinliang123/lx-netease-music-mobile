import { httpFetch } from '../../request'
import settingState from "@/store/setting/state"
import { signatureParams } from './util'
import leaderboard from './leaderboard'

const getCookieValue = (cookieStr, key) => {
  if (!cookieStr) return ''
  const match = cookieStr.match(new RegExp(`(^|;\\s*)${key}=([^;]*)`))
  return match ? match[2] : ''
}

// 时长格式化工具
const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return '00:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

// 酷狗数据转为列表格式（绝对安全版）
const transformSong = (item, index) => {
  try {
    const hash = item.hash || item.audio_info?.hash || ''
    if (!hash) return null // 安全拦截：没有 hash 直接丢弃，防止白屏

    const audioId = item.audio_id || item.audio_info?.audio_id || 0
    const songname = item.songname || item.audio_info?.songname || item.name || '未知歌曲'
    const singername = item.author_name || item.singername || item.audio_info?.singername || '未知歌手'
    const rawDuration = item.time_length || item.timelength || item.timelen || item.duration || 0
    const album = item.album_name || item.albumname || item.audio_info?.album_name || '未知专辑'
    
    // 终极封面兜底逻辑（直接使用酷狗 CDN 规则，安全无副作用）
    let img = item.sizable_cover || item.image || item.audio_info?.image || ''
    if (!img && hash) {
      img = `https://imge.kugou.com/stdmusic/400/${hash.substring(0, 8)}.jpg`
    }

    const safeSeconds = rawDuration > 10000 ? Math.floor(rawDuration / 1000) : rawDuration

    return {
      id: `kg__${hash}`,
      name: songname,
      singer: singername,
      source: 'kg',
      img: img,
      interval: formatTime(safeSeconds),
      album: album,
      hash: hash,
      songmid: String(audioId),
      mixSongId: item.mixsongid || 0,
      types: [{ type: '128k', size: null }],
      _types: { '128k': { size: null } },
      meta: {
        songId: String(audioId),
        hash: hash,
        picUrl: img,
        qualitys: [{ type: '128k', size: null }],
        _qualitys: { '128k': { size: null } },
      },
    }
  } catch (e) {
    return null
  }
}

export default {
  async getList(page = 1, limit = 30, retryNum = 0) {
    if (retryNum > 2) return Promise.reject(new Error('try max num'))

    try {
      const cookieStr = settingState.setting['common.kg_cookie'] || ''
      const mid = getCookieValue(cookieStr, 'kg_mid') || '-'
      const dfid = getCookieValue(cookieStr, 'kg_dfid') || '-'
      const userid = getCookieValue(cookieStr, 'KugooID') || '0'
      const token = getCookieValue(cookieStr, 'token') || getCookieValue(cookieStr, 't') || ''

      const clienttime = Math.floor(Date.now() / 1000)
      const paramsMap = {
        dfid: dfid, mid: mid, uuid: '-', appid: '1005',
        clientver: '20489', clienttime: clienttime, platform: 'ios',
        userid: Number(userid) || 0,
      }
      if (token) paramsMap.token = token

      const paramList = Object.keys(paramsMap).sort().map(k => `${k}=${paramsMap[k]}`).join('&')
      const sig = signatureParams(paramList, 'android', '')
      const url = `https://gateway.kugou.com/everyday_song_recommend?${paramList}&signature=${sig}`

      const { body, statusCode } = await httpFetch(url, {
        method: 'POST',
        headers: {
          'User-Agent': 'Android15-1070-11440-46-0-DiscoveryDRADProtocol-wifi',
          'x-router': 'everydayrec.service.kugou.com',
          'Content-Type': 'application/json',
          'Cookie': cookieStr,
        },
      }).promise

      if (statusCode === 200 && (body?.status === 1 || body?.error_code === 0)) {
        const rawSongs = body?.data?.song_list || body?.data?.songs || body?.data?.list || []
        if (rawSongs.length > 0) {
          // 过滤掉没有 hash 的坏数据，确保列表绝对干净
          const listData = rawSongs.map((item, i) => transformSong(item, i)).filter(Boolean)
          if (listData.length > 0) {
            return { list: listData, source: 'kg' }
          }
        }
      }
      throw new Error('每日推荐无数据')
    } catch (error) {
      console.log(`[KG DailyRec] 每日推荐失败`, error.message)
      if (retryNum < 2) return this.getList(page, limit, retryNum + 1)
      return leaderboard.getList('8888', 1, 30)
    }
  },
}
