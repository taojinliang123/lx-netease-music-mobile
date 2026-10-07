import { memo, useEffect, useRef, useCallback, useState } from 'react'
import { TouchableOpacity, View } from 'react-native'
import Text from '@/components/common/Text'
import OnlineList, { type OnlineListType } from '@/components/OnlineList'
import kgApi from '@/utils/musicSdk/kg' // 👈 【换芯】：改用酷狗API
import { useSettingValue } from '@/store/setting/hook'
import { toast } from '@/utils/tools'
import { useI18n } from '@/lang'
import { autoSaveDailyPlaylist, handlePlay } from './listAction'
import { usePlayerMusicInfo } from '@/store/player/hook'
import { useTheme } from '@/store/theme/hook'
import playerState from '@/store/player/state'
import listState from '@/store/list/state'
import { LIST_IDS } from '@/config/constant'
import { getDailyRecSongsCache, setDailyRecSongsCache, clearDailyRecSongsCache } from '@/core/cache'

export default memo(() => {
  const listRef = useRef<OnlineListType>(null)
  const [isLoading, setIsLoading] = useState(true)
  const t = useI18n()
  const cookie = useSettingValue('common.kg_cookie') // 👈 【换芯】：读取酷狗Cookie
  const playerMusicInfo = usePlayerMusicInfo()
  const theme = useTheme()

  useEffect(() => {
    const handleJumpPosition = () => {
      const listId = playerState.playMusicInfo.listId === LIST_IDS.TEMP
        ? listState.tempListMeta.id
        : playerState.playMusicInfo.listId

      // 👈 【换芯】：列表ID改成酷狗的
      if (!listId?.startsWith('dailyrec_kg')) return

      const musicInfo = playerState.playMusicInfo.musicInfo
      if (musicInfo) {
        listRef.current?.scrollToInfo(musicInfo as LX.Music.MusicInfoOnline)
      }
    }

    global.app_event.on('jumpListPosition', handleJumpPosition)
    return () => {
      global.app_event.off('jumpListPosition', handleJumpPosition)
    }
  }, [])

  useEffect(() => {
    const cachedSongs = getDailyRecSongsCache()
    if (cachedSongs) {
      setTimeout(() => {
        listRef.current?.setList(cachedSongs, false)
        listRef.current?.setStatus('idle')
        setIsLoading(false)
      }, 0)
    } else {
      setIsLoading(true)
      listRef.current?.setStatus('loading')
      // 👈 【换芯】：调用酷狗API，不用传cookie，底层会自己读
      kgApi.dailyRec.getList().then((result: any) => {
        listRef.current?.setList(result.list, false)
        listRef.current?.setStatus('idle')
        setDailyRecSongsCache(result.list)
        if (result.list && result.list.length > 0) {
          void autoSaveDailyPlaylist(result.list)
        }
      }).catch((err: any) => {
        console.error(err)
        toast(t('load_failed'), 'long')
        listRef.current?.setStatus('error')
      }).finally(() => {
        setIsLoading(false)
      })
    }
  }, [t])

  const handleRefresh = useCallback(() => {
    listRef.current?.setStatus('refreshing')
    clearDailyRecSongsCache()
    kgApi.dailyRec.getList().then((result: any) => {
      listRef.current?.setList(result.list, false)
      setDailyRecSongsCache(result.list)
      if (result.list && result.list.length > 0) {
        void autoSaveDailyPlaylist(result.list)
      }
    }).catch((err: any) => {
      console.error(err)
      toast(t('load_failed'), 'long')
      listRef.current?.setStatus('error')
    }).finally(() => {
      listRef.current?.setStatus('idle')
    })
  }, [t])

  return (
    <View style={{ flex: 1 }}>
      <OnlineList
        ref={listRef}
        listId="dailyrec_kg" // 👈 【换芯】：列表ID改成酷狗的
        forcePlayList={true}
        playingId={playerMusicInfo.id}
        onPlayList={(index) => {
          const list = listRef.current?.getList()
          if (!list) return
          handlePlay(list, index)
        }}
        onRefresh={handleRefresh}
        onLoadMore={() => {}}
        checkHomePagerIdle
      />
    </View>
  )
})
