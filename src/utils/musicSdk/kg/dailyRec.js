import { httpFetch } from '../../request'
import settingState from "@/store/setting/state"
import { filterData } from './quality_detail'
import { signatureParams } from './util'
import leaderboard from './leaderboard'

// 辅助函数：从酷狗 Cookie 中提取字段
const getCookieValue = (cookieStr, key) => {
  if (!cookieStr) return ''
  const match = cookieStr.match(new RegExp(`(^|;\\s*)${key}=([^;]*)`))
  return match ? match[2] : ''
}

export default {
  _requestObj: null,
  async getList(page = 1, limit = 30, retryNum = 0) {
    if (retryNum > 2) return Promise.reject(new Error('try max num'))

    try {
      // 👇 读取你刚才粘贴的酷狗 Cookie
      const cookieStr = settingState.setting['common.kg_cookie'] || ''
      const mid = getCookieValue(cookieStr, 'kg_mid') || '-'
      const dfid = getCookieValue(cookieStr, 'kg_dfid') || '-'
      const userid = getCookieValue(cookieStr, 'KugooID') || '0'
      const token = getCookieValue(cookieStr, 'token') || getCookieValue(cookieStr, 't') || ''

      const clienttime = Math.floor(Date.now() / 1000)
      const paramsMap = {
        dfid: dfid,
        mid: mid,
        uuid: '-',
        appid: '1005',
        clientver: '20489',
        clienttime: clienttime,
        platform: 'ios',
        userid: Number(userid) || 0,
      }
      // 如果有 token，就加上
      if (token) paramsMap.token = token

      // 按酷狗的规则对参数排序并生成签名
      const paramList = Object.keys(paramsMap).sort().map(k => `${k}=${paramsMap[k]}`).join('&')
      const sig = signatureParams(paramList, 'android', '')

      // 拼接最终 URL
      const url = `https://gateway.kugou.com/everyday_song_recommend?${paramList}&signature=${sig}`

      const { body, statusCode } = await httpFetch(url, {
        method: 'POST',
        headers: {
          'User-Agent': 'Android15-1070-11440-46-0-DiscoveryDRADProtocol-wifi',
          'x-router': 'everydayrec.service.kugou.com',
          'Content-Type': 'application/json',
          'Cookie': cookieStr, // 带上完整的 Cookie 增加成功率
        },
      }).promise

      if (statusCode === 200 && (body?.status === 1 || body?.error_code === 0)) {
        const rawSongs = body?.data?.song_list || body?.data?.songs || body?.data?.list || []
        if (rawSongs.length > 0) {
          // 使用项目里现成的 filterData 处理歌曲数据，完美适配列表组件
          const listData = await filterData(rawSongs, { removeDuplicates: true })
          return {
            list: listData,
            source: 'kg',
          }
        }
      }
      throw new Error('每日推荐无数据')
    } catch (error) {
      console.log(`[KG DailyRec] 每日推荐失败，正在进行第 ${retryNum + 1} 次重试...`, error.message)
      if (retryNum < 2) return this.getList(page, limit, retryNum + 1)
      
      // 🛡️ 超级兜底：如果每日推荐彻底失败（比如 Cookie 格式不对），自动降级为 TOP500 榜单，保证界面绝不空白！
      return leaderboard.getList('8888', 1, 30)
    }
  },
}
