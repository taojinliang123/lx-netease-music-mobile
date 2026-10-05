import { memo } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useI18n } from '@/lang';
import { useSettingValue } from '@/store/setting/hook';
import { updateSetting } from '@/core/common';

export default memo(() => {
  const t = useI18n();
  const cookie = useSettingValue('common.kg_cookie') || '';

  const setCookie = (val: string) => {
    updateSetting({ 'common.kg_cookie': val });
  };

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
    </View>
  );
});

const styles = StyleSheet.create({
  container: { padding: 15, marginBottom: 10 },
  label: { fontSize: 14, fontWeight: 'bold', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 5, padding: 10, fontSize: 14, marginBottom: 12 },
});
