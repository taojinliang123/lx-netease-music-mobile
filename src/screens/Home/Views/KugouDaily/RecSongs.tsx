import { memo, useEffect, useRef, useState } from 'react'
import { View } from 'react-native'
import OnlineList, { type OnlineListType } from '@/components/OnlineList'
import kgApi from '@/utils/musicSdk/kg' // 👈 酷狗引擎
import { useI18n } from '@/lang'
import { toast } from '@/utils/tools'
import { usePlayerMusicInfo } from '@/store/player/hook'
import { handlePlay } from '@/utils/player' // 👈 改用公共播放逻辑，防止网易云专属逻辑崩溃

export default memo(() => {
  const listRef = useRef<OnlineListType>(null)
  const [isLoading, setIsLoading] = useState(true)
  const t = useI18n()
  const playerMusicInfo = usePlayerMusicInfo()

  useEffect(() => {
    setIsLoading(true)
    listRef.current?.setStatus('loading')
    
    // 👈 直接调用酷狗API，不依赖任何网易云的缓存和后台任务
    kgApi.dailyRec.getList().then((result: any) => {
      listRef.current?.setList(result.list || [], false)
      listRef.current?.setStatus('idle')
    }).catch((err: any) => {
      console.error('[KugouDaily] 加载失败', err)
      toast(t('load_failed'), 'long')
      listRef.current?.setStatus('error')
    }).finally(() => {
      setIsLoading(false)
    })
  }, [t])

  return (
    <View style={{ flex: 1 }}>
      <OnlineList
        ref={listRef}
        listId="dailyrec_kg" // 👈 专属酷狗的列表ID
        forcePlayList={true}
        playingId={playerMusicInfo.id}
        onPlayList={(index) => {
          const list = listRef.current?.getList()
          if (!list) return
          handlePlay(list, index)
        }}
        onRefresh={() => {
          listRef.current?.setStatus('refreshing')
          kgApi.dailyRec.getList().then((result: any) => {
            listRef.current?.setList(result.list || [], false)
          }).catch((err: any) => {
            console.error(err)
            toast(t('load_failed'), 'long')
          }).finally(() => {
            listRef.current?.setStatus('idle')
          })
        }}
        onLoadMore={() => {}}
        checkHomePagerIdle
      />
    </View>
  )
})
