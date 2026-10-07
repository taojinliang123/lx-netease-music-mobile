import { memo, useEffect, useRef, useState } from 'react'
import { View } from 'react-native'
import OnlineList, { type OnlineListType } from '@/components/OnlineList'
import kgApi from '@/utils/musicSdk/kg'
import { useI18n } from '@/lang'

export default memo(() => {
  const listRef = useRef<OnlineListType>(null)
  const [isLoading, setIsLoading] = useState(true)
  const t = useI18n()

  useEffect(() => {
    setIsLoading(true)
    listRef.current?.setStatus('loading')
    
    kgApi.dailyRec.getList().then((result: any) => {
      listRef.current?.setList(result.list || [], false)
      listRef.current?.setStatus('idle')
    }).catch((err: any) => {
      console.error('[KugouDaily] 加载失败', err)
      // 如果加载失败，直接显示空列表并结束加载，绝对不红框
      listRef.current?.setList([], false)
      listRef.current?.setStatus('idle')
    }).finally(() => {
      setIsLoading(false)
    })
  }, [])

  return (
    <View style={{ flex: 1 }}>
      <OnlineList
        ref={listRef}
        listId="dailyrec_kg"
        forcePlayList={true}
        onLoadMore={() => {}}
        checkHomePagerIdle
      />
    </View>
  )
})
