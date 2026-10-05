import { memo, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native'; 
import { useI18n } from '@/lang';
import { useSettingValue } from '@/store/setting/hook';
import { updateSetting } from '@/core/common';

export default memo(() => {
  const t = useI18n();
  const cookie = useSettingValue('common.kg_cookie') || ''; // 因为底层地基已打好，这里是安全的

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
      {/* 咱们暂时把登录按钮藏起来，等“会客室”盖好了再放出来 */}
      {/* <Pressable onPress={() => global.app_event.emit('showKugouWebLogin')}>...</Pressable> */}
    </View>
  );
});
// ... styles 保持不变 ...
