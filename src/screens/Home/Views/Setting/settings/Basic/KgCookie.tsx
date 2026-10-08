import { memo, useCallback } from 'react'
import { View, TextInput, StyleSheet } from 'react-native'
import { useSettingValue } from '@/store/setting/hook'
import { updateSetting } from '@/core/common'
import Text from '@/components/common/Text'
import { useTheme } from '@/store/theme/hook'

export default memo(() => {
  const theme = useTheme()
  const kgCookie = useSettingValue('common.kg_cookie') || ''

  const handleKgCookieChanged = useCallback((text: string) => {
    // 纯内存存储，没有原生同步，杜绝“同步失败”
    updateSetting({ 'common.kg_cookie': text })
  }, [])

  return (
    <View style={styles.container}>
      <Text size={14} style={styles.label}>酷狗音乐 Cookie</Text>
      <TextInput
        style={[
          styles.input,
          { color: theme['c-font'], backgroundColor: theme['c-content-background'] }
        ]}
        multiline={true}
        value={kgCookie}
        onChangeText={handleKgCookieChanged}
        placeholder="在此处粘贴你的酷狗音乐 Cookie"
        placeholderTextColor="#999"
      />
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    marginBottom: 15,
    paddingHorizontal: 15,
  },
  label: {
    marginBottom: 8,
    fontWeight: 'bold',
  },
  input: {
    minHeight: 80,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    textAlignVertical: 'top',
    fontSize: 14,
  },
})
