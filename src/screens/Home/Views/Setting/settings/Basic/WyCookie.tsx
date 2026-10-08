import { memo, useEffect } from 'react';
import { View } from 'react-native';
import InputItem, { type InputItemProps } from '../../components/InputItem';
import { useI18n } from '@/lang';
import { useSettingValue } from '@/store/setting/hook';
import { updateSetting } from '@/core/common';
import { createStyle, toast } from '@/utils/tools';
import Button from '../../components/Button';
import CookieManager from '@react-native-cookies/cookies';

// 网易云同步（保留原样，不动它）
const syncCookieToNative = async (cookie: string) => {
  const domain = 'https://music.163.com';
  try {
    await CookieManager.clearAll(true);
    if (cookie) {
      const cookiePairs = cookie.split(';').map(pair => pair.trim());
      for (const pair of cookiePairs) {
        const [name, ...valueParts] = pair.split('=');
        if (name && valueParts.length > 0) {
          await CookieManager.set(domain, {
            name: name.trim(),
            value: valueParts.join('=').trim(),
            domain: '.music.163.com',
            path: '/',
          });
        }
      }
    }
  } catch (error) {
    console.error('Failed to sync native cookie:', error);
    toast('网易云 Cookie 同步失败', 'long');
  }
};

export default memo(() => {
  const t = useI18n();
  
  const wyCookie = useSettingValue('common.wy_cookie') || '';
  const serpApiKey = useSettingValue('common.wy_serpapi_key') || '';
  const kgCookie = useSettingValue('common.kg_cookie') || ''; // 👈 酷狗数据

  const setWyCookie = (val: string) => {
    void syncCookieToNative(val).then(() => {
      updateSetting({ 'common.wy_cookie': val });
    });
  };

  const handleWyChanged: InputItemProps['onChanged'] = (text, callback) => {
    callback(text);
    setWyCookie(text);
  };

  const handleSerpApiKeyChanged: InputItemProps['onChanged'] = (text, callback) => {
    callback(text);
    updateSetting({ 'common.wy_serpapi_key': text.trim() });
  };

  const handleShowLoginModal = () => {
    global.app_event.emit('showWebLogin');
  };

  // 👈 酷狗存储（纯本地，不碰原生 CookieManager，保证不弹同步失败、不崩）
  const setKgCookie = (val: string) => {
    updateSetting({ 'common.kg_cookie': val });
  };

  const handleKgChanged: InputItemProps['onChanged'] = (text, callback) => {
    callback(text);
    setKgCookie(text);
  };

  useEffect(() => {
    const handleWyCookieSet = (cookie: string) => { setWyCookie(cookie); };
    const handleKgCookieSet = (cookie: string) => { setKgCookie(cookie); };

    global.app_event.on('wy-cookie-set', handleWyCookieSet);
    global.app_event.on('kg-cookie-set', handleKgCookieSet); 

    return () => {
      global.app_event.off('wy-cookie-set', handleWyCookieSet);
      global.app_event.off('kg-cookie-set', handleKgCookieSet);
    };
  }, []);

  return (
    <View style={styles.content}>
      <InputItem
        value={wyCookie}
        label={t('setting_basic_wy_cookie')}
        onChanged={handleWyChanged}
        placeholder={t('setting_basic_wy_cookie_placeholder')}
      />
      <InputItem
        value={serpApiKey}
        label="SerpApi API Key"
        onChanged={handleSerpApiKeyChanged}
        placeholder="用于网易云搜索补充 Google 搜索结果"
      />
      <View style={styles.btnContainer}>
        <Button onPress={handleShowLoginModal}>网页登录</Button>
      </View>

      <InputItem
        value={kgCookie}
        label="酷狗音乐 Cookie"
        onChanged={handleKgChanged}
        placeholder="在此处粘贴你的酷狗音乐 Cookie"
      />
    </View>
  );
});

const styles = createStyle({
  content: {},
  btnContainer: {
    marginBottom: 5,
    paddingLeft: 20,
    flexDirection: 'row',
  },
});
