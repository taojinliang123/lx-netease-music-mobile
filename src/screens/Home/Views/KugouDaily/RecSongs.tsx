import { memo, useEffect, useState } from 'react'
import { View, Modal, TextInput, TouchableOpacity, StyleSheet } from 'react-native'
import Text from '@/components/common/Text'
import kgApi from '@/utils/musicSdk/kg'
import { useSettingValue } from '@/store/setting/hook'
import { updateSetting } from '@/core/common'
import { toast } from '@/utils/tools'

export default memo(() => {
  const [songs, setSongs] = useState<any[]>([])
  const [errorMsg, setErrorMsg] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [tempCookie, setTempCookie] = useState('')
  const kgCookie = useSettingValue('common.kg_cookie') || ''

  const loadData = () => {
    setErrorMsg('正在请求酷狗...')
    setSongs([])
    
    kgApi.dailyRec.getList().then((result: any) => {
      const list = result?.list || []
      setSongs(list)
      if (list.length === 0) {
        setErrorMsg('酷狗接口返回为空（可能是Cookie失效或签名错误）')
      } else {
        setErrorMsg('')
      }
    }).catch((err: any) => {
      setErrorMsg(`请求失败: ${err.message || '未知错误'}`)
    })
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSaveCookie = () => {
    updateSetting({ 'common.kg_cookie': tempCookie })
    setShowModal(false)
    toast('酷狗 Cookie 已保存！')
    setTimeout(loadData, 500)
  }

  return (
    <View style={{ flex: 1 }}>
      {/* 顶部工具条 */}
      <View style={styles.toolbar}>
        <TouchableOpacity style={styles.btn} onPress={() => { setTempCookie(kgCookie); setShowModal(true) }}>
          <Text color="#fff" size={14}>设置酷狗 Cookie</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btn} onPress={loadData}>
          <Text color="#fff" size={14}>刷新</Text>
        </TouchableOpacity>
      </View>

      {/* 状态和错误信息 */}
      <View style={{ padding: 20 }}>
        <Text size={14} color={errorMsg.includes('为空') ? '#ff4444' : '#666'}>
          {errorMsg || `已成功获取 ${songs.length} 首歌曲`}
        </Text>
      </View>

      {/* 👇 用纯 Text 展示数据，绝对不崩 */}
      <View style={{ flex: 1, paddingHorizontal: 20 }}>
        {songs.map((s, i) => (
          <Text key={i} size={14} style={{ marginBottom: 5 }}>
            {s.name} - {s.singer || '未知歌手'}
          </Text>
        ))}
      </View>

      {/* 酷狗 Cookie 安全输入弹窗 */}
      <Modal visible={showModal} transparent={true} animationType="fade" onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <Text size={16} style={{ marginBottom: 10 }}>粘贴酷狗音乐 Cookie</Text>
            <TextInput
              style={styles.input}
              multiline={true}
              value={tempCookie}
              onChangeText={setTempCookie}
              placeholder="在此处粘贴完整的酷狗 Cookie"
              placeholderTextColor="#999"
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 15 }}>
              <TouchableOpacity style={{ padding: 10 }} onPress={() => setShowModal(false)}>
                <Text color="#666">取消</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ padding: 10 }} onPress={handleSaveCookie}>
                <Text color="#2EB981">保存</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
})

const styles = StyleSheet.create({
  toolbar: { flexDirection: 'row', padding: 10, backgroundColor: '#2EB981' },
  btn: { paddingHorizontal: 15, paddingVertical: 8, marginRight: 10, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 5 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '90%', backgroundColor: '#fff', padding: 20, borderRadius: 10 },
  input: { height: 120, borderWidth: 1, borderColor: '#ddd', borderRadius: 5, padding: 10, textAlignVertical: 'top' },
})
