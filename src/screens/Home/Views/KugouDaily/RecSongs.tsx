import { memo, useEffect, useState, useRef } from 'react' // 👈 修复了缺失的 useRef
import { View } from 'react-native'
import Text from '@/components/common/Text'
import OnlineList, { type OnlineListType } from '@/components/OnlineList'
import kgApi from '@/utils/musicSdk/kg'

export default memo(() => {
  const listRef = useRef<OnlineListType>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    setIsLoading(true)
    setErrorMsg('')
    
    kgApi.dailyRec.getList().then((result: any) => {
      const songs = result?.list || []
      if (songs.length === 0) {
        setErrorMsg('请求成功，但没有返回歌曲（可能是Cookie格式不正确）')
      }
      listRef.current?.setList(songs, false)
      listRef.current?.setStatus('idle')
    }).catch((err: any) => {
      setErrorMsg(`请求失败: ${err.message || '未知错误'}`)
      listRef.current?.setList([], false)
      listRef.current?.setStatus('idle')
    }).finally(() => {
      setIsLoading(false)
    })
  }, [])

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text size={16}>正在加载酷狗每日推荐...</Text>
      </View>
    )
  }

  if (errorMsg) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text size={16} color="#999" style={{ textAlign: 'center' }}>
          {errorMsg}
        </Text>
      </View>
    )
  }

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
