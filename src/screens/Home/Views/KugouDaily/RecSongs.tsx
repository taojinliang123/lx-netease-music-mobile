import { memo, useEffect, useState, useRef, useCallback } from 'react'
import { View, Modal, TextInput, TouchableOpacity, StyleSheet } from 'react-native'
import Text from '@/components/common/Text'
import OnlineList, { type OnlineListType } from '@/components/OnlineList'
import kgApi from '@/utils/musicSdk/kg'
import { useSettingValue } from '@/store/setting/hook'
import { updateSetting } from '@/core/common'
import { useTheme } from '@/store/theme/hook'
import { toast } from '@/utils/tools'

export default memo(() => {
  const listRef = useRef<OnlineListType>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [tempCookie, setTempCookie] = useState('')
  
  const kgCookie = useSettingValue('common.kg_cookie') || ''
  // 🚀 核心对接：读取全局设置里的“自动切换播放列表”开关
  const isAutoPlay = useSettingValue('common.isAutoPlay') || false
  const theme = useTheme()

  const loadData = useCallback(() => {
    setIsLoading(true)
    setErrorMsg('')
    
    kgApi.dailyRec.getList().then((result: any) => {
      const songs = result?.list || []
      if (songs.length === 0) {
        setErrorMsg('酷狗接口返回为空（可能是Cookie失效或签名错误）')
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

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleSaveCookie = () => {
    updateSetting({ 'common.kg_cookie': tempCookie })
    setShowModal(false)
    toast('酷狗 Cookie 已保存！')
    setTimeout(loadData, 500)
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme['c-content-background'] }}>
      {/* 顶栏精装修：去掉绿条，融入系统主题色 */}
      <View style={[styles.toolbar, { borderBottomColor: theme['c-border-background'], borderBottomWidth: 1 }]}>
        <TouchableOpacity style={[styles.btn, { backgroundColor: theme['c-primary-light-100-alpha-300'] }]} onPress={() => { setTempCookie(kgCookie); setShowModal(true) }}>
          <Text color={theme['c-primary-font']} size={14}>设置酷狗 Cookie</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, { backgroundColor: theme['c-primary-light-100-alpha-300'] }]} onPress={loadData}>
          <Text color={theme['c-primary-font']} size={14}>刷新</Text>
        </TouchableOpacity>
      </View>

      {errorMsg ? (
        <View style={{ padding: 20 }}>
          <Text size={14} color={theme['c-primary']}>{errorMsg}</Text>
        </View>
      ) : null}

      <OnlineList
        ref={listRef}
        listId="dailyrec_kg"
        forcePlayList={isAutoPlay} // 🚀 核心修改：不再是写死的 true，而是跟随系统设置
        rowType="medium" 
        onLoadMore={() => {}}
        checkHomePagerIdle
      />

      <Modal visible={showModal} transparent={true} animationType="fade" onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalBg}>
          <View style={[styles.modalContent, { backgroundColor: theme['c-content-background'] }]}>
            <Text size={16} style={{ marginBottom: 10 }} color={theme['c-font']}>粘贴酷狗音乐 Cookie</Text>
            <TextInput
              style={[styles.input, { color: theme['c-font'], borderColor: theme['c-border-background'] }]}
              multiline={true}
              value={tempCookie}
              onChangeText={setTempCookie}
              placeholder="在此处粘贴完整的酷狗 Cookie"
              placeholderTextColor="#999"
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 15 }}>
              <TouchableOpacity style={{ padding: 10 }} onPress={() => setShowModal(false)}>
                <Text color={theme['c-font']}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ padding: 10 }} onPress={handleSaveCookie}>
                <Text color={theme['c-primary']}>保存</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
})

const styles = StyleSheet.create({
  toolbar: { flexDirection: 'row', padding: 10, alignItems: 'center' },
  btn: { paddingHorizontal: 15, paddingVertical: 8, marginRight: 10, borderRadius: 5 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '90%', padding: 20, borderRadius: 10 },
  input: { height: 120, borderWidth: 1, borderRadius: 5, padding: 10, textAlignVertical: 'top' },
})
