import { httpFetch } from '../../request'
import settingState from "@/store/setting/state"
import { signatureParams } from './util'
import leaderboard from './leaderboard'
import songList from './songList' // 抄作业：引入洛雪的歌单工具

const getCookieValue = (cookieStr, key) => {
  if (!cookieStr) return ''
  const match = cookieStr.match(new RegExp(`(^|;\\s*)${key}=([^;]*)`))
  return match ? match[2] : ''
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
          // 抄作业：调用洛雪现成的 getMusicInfos，它会自动帮我们补全封面和专辑信息！
          try {
            const enrichedList = await songList.getMusicInfos(rawSongs)
            if (enrichedList && enrichedList.length > 0) {
              return { list: enrichedList, source: 'kg' }
            }
          } catch (err) {
            console.log('[KG DailyRec] 补全封面失败，降级使用原始映射', err)
          }
          
          // 如果补全失败，还是用原来的老方法兜底，保证绝不空白
          const listData = rawSongs.map((item, i) => ({
            id: `kg__${item.hash || item.audio_info?.hash}`,
            name: item.songname || item.audio_info?.songname || '未知歌曲',
            singer: item.author_name || item.audio_info?.singername || '未知歌手',
            source: 'kg',
            hash: item.hash || item.audio_info?.hash,
            songmid: String(item.audio_id || item.audio_info?.audio_id || 0),
            types: [{ type: '128k', size: null }],
            _types: { '128k': { size: null } },
            meta: {
              songId: String(item.audio_id || item.audio_info?.audio_id || 0),
              hash: item.hash || item.audio_info?.hash,
              qualitys: [{ type: '128k', size: null }],
              _qualitys: { '128k': { size: null } },
            },
          })).filter(Boolean)
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
