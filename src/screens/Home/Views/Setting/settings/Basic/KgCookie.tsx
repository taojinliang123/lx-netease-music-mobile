import { memo, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native'; // 去掉了 Pressable
import { useI18n } from '@/lang';
import { useSettingValue } from '@/store/setting/hook';
import { updateSetting } from '@/core/common';

export default memo(() => {
  const t = useI18n();
  const cookie = useSettingValue('common.kg_cookie') || '';

  const setCookie = (val: string) => {
    updateSetting({ 'common.kg_cookie': val });
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
        placeholder="在此处粘贴你的酷狗音乐 Cookie"
        placeholderTextColor="#999"
      />
      <Text style={styles.tip}>
        * 请前往酷狗 App 复制 Cookie 后粘贴到此处
      </Text>
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
    marginBottom: 8
  },
  tip: { fontSize: 12, color: '#999' }
});
