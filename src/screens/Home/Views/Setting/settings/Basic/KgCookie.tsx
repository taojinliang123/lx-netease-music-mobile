import { memo, useState } from 'react'
import { View } from 'react-native'
import Text from '@/components/common/Text'
import Input from '@/components/common/Input'
import Button from '../../components/Button' // 已修正为相对路径
import { useTheme } from '@/store/theme/hook'
import { createStyle } from '@/utils/tools'

export default memo(() => {
  const theme = useTheme()
  // 暂时用 useState 保证输入框能打字，稍后再修保存逻辑
  const [kgCookie, setKgCookie] = useState('')

  const handleSave = () => {
    // 暂时代码，仅用于测试打包通过
    console.log('保存酷狗 Cookie:', kgCookie)
  }

  return (
    <View style={styles.container}>
      <Text size={14} style={styles.title}>酷狗音乐 Cookie 设置</Text>
      <Text size={12} color={theme['c-500']} style={styles.desc}>
        用于获取酷狗每日推荐，请在下方粘贴完整的 Cookie。
      </Text>
      
      <View style={styles.inputWrapper}>
        <Input
          value={kgCookie}
          onChangeText={setKgCookie}
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
  container: { paddingHorizontal: 15, paddingVertical: 10, flexDirection: 'column' },
  title: { marginBottom: 5 },
  desc: { marginBottom: 10, lineHeight: 18 },
  inputWrapper: { marginBottom: 10, borderWidth: 1, borderColor: 'rgba(128,128,128,0.3)', borderRadius: 4, paddingHorizontal: 5, minHeight: 80 },
  input: { minHeight: 80, paddingTop: 8, paddingBottom: 8 },
  btnWrapper: { flexDirection: 'row', justifyContent: 'flex-end' },
})
