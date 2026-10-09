import { httpFetch } from '../../request'
import settingState from "@/store/setting/state"
import { signatureParams } from './util'
import leaderboard from './leaderboard'

const getCookieValue = (cookieStr, key) => {
  if (!cookieStr) return ''
  const match = cookieStr.match(new RegExp(`(^|;\\s*)${key}=([^;]*)`))
  return match ? match[2] : ''
}

// 酷狗数据转为列表格式
const transformSong = (item, index) => {
  try {
    const hash = item.hash || item.audio_info?.hash || ''
    const audioId = item.audio_id || item.audio_info?.audio_id || 0
    const songname = item.songname || item.audio_info?.songname || item.name || '未知歌曲'
    const singername = item.author_name || item.singername || item.audio_info?.singername || '未知歌手'
    const rawDuration = item.time_length || item.timelength || item.timelen || item.duration || 0
    const album = item.album_name || item.albumname || item.audio_info?.album_name || '未知专辑'
    
    let img = item.sizable_cover || item.image || item.audio_info?.image || ''
    if (!img && hash) {
      img = `https://imge.kugou.com/stdmusic/400/${hash.substring(0, 8)}.jpg`
    }
    
    return {
      id: `kg__${hash}`,
      name: songname,
      singer: singername,
      source: 'kg',
      img: img,
      interval: rawDuration, // 新增：时长
      album: album,          // 新增：专辑名
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
          const listData = rawSongs.map((item, i) => transformSong(item, i)).filter(Boolean)
          return { list: listData, source: 'kg' }
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
