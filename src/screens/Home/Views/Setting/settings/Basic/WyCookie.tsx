import { memo, useEffect } from 'react';
import { View } from 'react-native';
import InputItem, { type InputItemProps } from '../../components/InputItem';
import { useI18n } from '@/lang';
import { useSettingValue } from '@/store/setting/hook';
import { updateSetting } from '@/core/common';
import { createStyle, toast } from '@/utils/tools';
import Button from '../../components/Button';
import CookieManager from '@react-native-cookies/cookies';

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
    toast('Cookie 同步失败', 'long');
  }
};

export default memo(() => {
  const t = useI18n();
  
  // 网易云数据
  const wyCookie = useSettingValue('common.wy_cookie') || '';
  const serpApiKey = useSettingValue('common.wy_serpapi_key') || '';

  // 酷狗数据 (新增)
  const kgCookie = useSettingValue('common.kg_cookie') || '';

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

  // 酷狗数据变更 (新增)
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
    global.app_event.on('kg-cookie-set', handleKgCookieSet); // 监听酷狗

    return () => {
      global.app_event.off('wy-cookie-set', handleWyCookieSet);
      global.app_event.off('kg-cookie-set', handleKgCookieSet);
    };
  }, []);

  return (
    <View style={styles.content}>
      {/* 网易云板块 */}
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

      {/* 酷狗板块 (新增) */}
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
  content: {
    // marginTop: 10,
  },
  btnContainer: {
    marginBottom: 5,
    paddingLeft: 20,
    flexDirection: 'row',
  },
});
