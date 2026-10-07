import { useSettingValue } from '@/store/setting/hook';
import { updateSetting } from '@/core/common';
import InputItem from '../../components/InputItem';
import { createStyle, toast } from '@/utils/tools';
import { memo, useCallback, useEffect } from 'react';
import { View } from 'react-native';
import { useI18n } from '@/lang';

export default memo(() => {
  const t = useI18n();
  const kgCookie = useSettingValue('common.kg_cookie');

  const handleKgCookieChanged = useCallback(
    (text: string) => {
      updateSetting({ 'common.kg_cookie': text });
      if (text && text.length > 50) {
        toast('酷狗音乐 Cookie 已保存');
      }
    },
    [],
  );

  useEffect(() => {
    const handleCookieSet = (cookie: string) => {
      updateSetting({ 'common.kg_cookie': cookie });
    };

    (global.app_event as any).on('kg-cookie-set', handleCookieSet);
    return () => {
      (global.app_event as any).off('kg-cookie-set', handleCookieSet);
    };
  }, []);

  return (
    <View style={styles.content}>
      <InputItem
        value={kgCookie}
        label="酷狗音乐 Cookie"
        onChanged={handleKgCookieChanged}
        placeholder="在此处粘贴你的酷狗音乐 Cookie"
      />
    </View>
  );
});

const styles = createStyle({
  content: {},
});
