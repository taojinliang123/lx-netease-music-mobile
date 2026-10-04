import { memo, useEffect } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native'; // 换成最基础的RN组件
import { useI18n } from '@/lang';
import { useSettingValue } from '@/store/setting/hook';
import { updateSetting } from '@/core/common';

export default memo(() => {
  const t = useI18n();
  const cookie = useSettingValue('common.kg_cookie');

  const setCookie = (val: string) => {
    updateSetting({ 'common.kg_cookie': val });
    // 暂时去掉复杂的原生 CookieManager 同步逻辑，先保证界面不崩
    // 等确认界面没问题了，我们再一步步加回来
  };

  useEffect(() => {
    const handleCookieSet = (val: string) => {
      setCookie(val);
    };
    global.app_event.on('kg-cookie-set', handleCookieSet);
    return () => {
      global.app_event.off('kg-cookie-set', handleCookieSet);
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>酷狗音乐 Cookie</Text>
      
      <TextInput
        style={styles.input}
        value={cookie}
        onChangeText={setCookie}
        placeholder="在此处粘贴你的酷狗 Cookie"
        placeholderTextColor="#999"
      />
      
      <Pressable 
        style={styles.btn} 
        onPress={() => global.app_event.emit('showKugouWebLogin')}
      >
        <Text style={styles.btnText}>酷狗网页登录</Text>
      </Pressable>
    </View>
  );
});

const styles = StyleSheet.create({
  container: { padding: 15, marginBottom: 10 },
  label: { fontSize: 14, fontWeight: 'bold', marginBottom: 8 },
  input: { 
    borderWidth: 1, 
    borderColor: '#ccc', 
    borderRadius: 5, 
    padding: 10, 
    fontSize: 14,
    marginBottom: 12
  },
  btn: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    alignItems: 'center',
    alignSelf: 'flex-start'
  },
  btnText: { color: '#fff', fontSize: 14, fontWeight: 'bold' }
});
