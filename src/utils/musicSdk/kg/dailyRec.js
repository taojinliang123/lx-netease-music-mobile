import { httpFetch } from '../../request'
import settingState from "@/store/setting/state"
import { signatureParams } from './util'
import leaderboard from './leaderboard'
import songList from './songList' // 咱们的“补全外挂”

const getCookieValue = (cookieStr, key) => {
  if (!cookieStr) return ''
  const match = cookieStr.match(new RegExp(`(^|;\\s*)${key}=([^;]*)`))
  return match ? match[2] : ''
}

// 时间格式化工具
const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return '00:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

export default {
  async getList(page = 1, limit = 30, retryNum = 0) {
    if (retryNum > 2) return Promise.reject(new Error('try max num'))

    // 🛡️ 安全锁：未登录直接返回空列表，绝不发请求，防止白屏
    const cookieStr = settingState.setting['common.kg_cookie'] || ''
    if (!cookieStr) {
      console.log('[KG DailyRec] 未登录，返回空列表')
      return { list: [], source: 'kg' }
    }

    try {
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
          
          // 🌟 方向B核心：安全偷取封面！
          let coverMap = {}
          try {
            const hashList = rawSongs.map(item => ({
              hash: item.hash || item.audio_info?.hash || ''
            })).filter(item => item.hash)

            if (hashList.length > 0) {
              // 请求洛雪的补全接口
              const enrichedList = await songList.getMusicInfos(hashList)
              if (Array.isArray(enrichedList)) {
                // 只把 hash 和 img 抠出来，存进我们的安全小口袋
                enrichedList.forEach(song => {
                  const h = song.hash || song.meta?.hash
                  const i = song.img || song.meta?.picUrl
                  if (h && i) coverMap[h] = i
                })
              }
            }
          } catch (err) {
            console.log('[KG DailyRec] 封面补全失败，使用黑胶兜底', err)
          }

          // 🛡️ 安全映射：还是用你之前确认不白屏的格式，只是把封面替换掉
          const listData = rawSongs.map((item, i) => {
            const hash = item.hash || item.audio_info?.hash || ''
            if (!hash) return null

            const audioId = item.audio_id || item.audio_info?.audio_id || 0
            const songname = item.songname || item.audio_info?.songname || item.name || '未知歌曲'
            const singername = item.author_name || item.singername || item.audio_info?.singername || '未知歌手'
            const rawDuration = item.time_length || item.timelength || item.timelen || item.duration || 0
            const album = item.album_name || item.albumname || item.audio_info?.album_name || '未知专辑'
            
            // 看看口袋里有没有偷来的封面，没有就用黑胶兜底
            let img = coverMap[hash] || item.sizable_cover || item.image || item.audio_info?.image || ''
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
          }).filter(Boolean)

          return { list: listData, source: 'kg' }
        }
      }
      throw new Error('每日推荐无数据')
    } catch (error) {
      console.log(`[KG DailyRec] 每日推荐失败`, error.message)
      if (retryNum < 2) return this.getList(page, limit, retryNum + 1)
      // 兜底：绝不白屏，返回空列表
      return { list: [], source: 'kg' } 
    }
  },
}
