import { memo, useEffect, useState } from 'react'
import { View } from 'react-native'
import Text from '@/components/common/Text'
import OnlineList, { type OnlineListType } from '@/components/OnlineList'
import kgApi from '@/utils/musicSdk/kg'

export default memo(() => {
  const [list, setList] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const listRef = useRef<OnlineListType>(null)

  useEffect(() => {
    setIsLoading(true)
    setErrorMsg('')
    
    kgApi.dailyRec.getList().then((result: any) => {
      const songs = result?.list || []
      setList(songs)
      if (songs.length === 0) {
        setErrorMsg('请求成功，但没有返回歌曲（可能是Cookie/签名不对）')
      }
    }).catch((err: any) => {
      setErrorMsg(`请求失败: ${err.message || '未知错误'}`)
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

  if (list.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text size={16} color="#999" style={{ textAlign: 'center' }}>
          {errorMsg || '暂无数据'}
        </Text>
        <Text size={14} color="#999" style={{ marginTop: 10, textAlign: 'center' }}>
          （只要看到这行字，就说明页面没崩，咱们的架子是稳的！）
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
