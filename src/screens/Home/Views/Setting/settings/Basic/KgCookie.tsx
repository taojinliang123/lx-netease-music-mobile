import { memo, useCallback } from 'react'
import { View } from 'react-native'
import Text from '@/components/common/Text'
import Input from '@/components/common/Input'
import Button from '../../components/Button' // 修正：改用相对路径
import { useSettingValue } from '@/store/setting/hook'
import { setSetting } from '@/core/setting'
import { useI18n } from '@/lang/i18n' // 修正：路径统一
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'

export default memo(() => {
  const t = useI18n()
  const theme = useTheme()
  // 读取酷狗 Cookie 的配置，如果没有则给空字符串
  const kgCookie = useSettingValue('common.kg_cookie') || ''

  // 当输入框内容改变时，实时写入 JS 内存，不调原生同步
  const handleChange = useCallback((text: string) => {
    setSetting('common.kg_cookie', text.trim())
  }, [])

  // 点击保存时的提示（可选，防止你按了没反应以为没保存）
  const handleSave = useCallback(() => {
    setSetting('common.kg_cookie', kgCookie.trim())
  }, [kgCookie])

  return (
    <View style={styles.container}>
      <Text size={14} style={styles.title}>酷狗音乐 Cookie 设置</Text>
      <Text size={12} color={theme['c-500']} style={styles.desc}>
        用于获取酷狗每日推荐，请在下方粘贴完整的 Cookie。
      </Text>
      
      {/* 严格使用官方的 Input 组件，内部已处理好一切，不会报红框 */}
      <View style={styles.inputWrapper}>
        <Input
          value={kgCookie}
          onChangeText={handleChange}
          placeholder="请输入 kg_mid=...; kg_dfid=... 等参数"
          clearBtn={true}
          multiline={true}
          style={styles.input}
        />
      </View>

      <View style={styles.btnWrapper}>
        <Button onPress={handleSave}>
          <Text size={14} color={theme['c-button-font']}>保存 Cookie</Text>
        </Button>
      </View>
    </View>
  )
})

const styles = createStyle({
  container: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    flexDirection: 'column',
  },
  title: {
    marginBottom: 5,
  },
  desc: {
    marginBottom: 10,
    lineHeight: 18,
  },
  inputWrapper: {
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(128,128,128,0.3)',
    borderRadius: 4,
    paddingHorizontal: 5,
    minHeight: 80, // 给多行输入框留足空间
  },
  input: {
    minHeight: 80,
    paddingTop: 8,
    paddingBottom: 8,
  },
  btnWrapper: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
})
