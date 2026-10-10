import { memo, useEffect } from 'react';
import { View } from 'react-native';
import InputItem, { type InputItemProps } from '../../components/InputItem';
import { useI18n } from '@/lang';
import { useSettingValue } from '@/store/setting/hook';
import { updateSetting } from '@/core/common';
import { createStyle, toast } from '@/utils/tools';
import Button from '../../components/Button';
import CookieManager from '@react-native-cookies/cookies';
import Text from '@/components/common/Text';

// 注意：这个方法只给网易云用，酷狗千万别调用！
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
    console.log('Native cookie synchronized successfully.');
  } catch (error) {
    console.error('Failed to sync native cookie:', error);
    toast('Cookie 同步失败，部分请求可能异常', 'long');
  }
};

export default memo(() => {
  const t = useI18n();
  
  // 网易云状态
  const cookie = useSettingValue('common.wy_cookie');
  const serpApiKey = useSettingValue('common.wy_serpapi_key');
  
  // 👇 新增：酷狗状态读取
  const kgCookie = useSettingValue('common.kg_cookie') || '';

  // 网易云保存逻辑（带原生同步）
  const setCookie = (val: string) => {
    void syncCookieToNative(val).then(() => {
      updateSetting({ 'common.wy_cookie': val });
    });
  };

  const handleChanged: InputItemProps['onChanged'] = (text, callback) => {
    callback(text);
    setCookie(text);
  };

  const handleSerpApiKeyChanged: InputItemProps['onChanged'] = (text, callback) => {
    callback(text);
    updateSetting({ 'common.wy_serpapi_key': text.trim() });
  };

  // 👇 新增：酷狗保存逻辑（绝对不碰原生同步，只写JS内存）
  const handleKgCookieChanged: InputItemProps['onChanged'] = (text, callback) => {
    callback(text);
    updateSetting({ 'common.kg_cookie': text.trim() });
  };

  const handleShowLoginModal = () => {
    global.app_event.emit('showWebLogin');
  };

  useEffect(() => {
    const handleCookieSet = (cookie: string) => {
      setCookie(cookie);
    };
    global.app_event.on('wy-cookie-set', handleCookieSet);
    return () => {
      global.app_event.off('wy-cookie-set', handleCookieSet);
    };
  }, []);

  return (
    <View style={styles.content}>
      <InputItem
        value={cookie}
        label={t('setting_basic_wy_cookie')}
        onChanged={handleChanged}
        placeholder={t('setting_basic_wy_cookie_placeholder')}
      />
      <InputItem
        value={serpApiKey}
        label="SerpApi API Key"
        onChanged={handleSerpApiKeyChanged}
        placeholder="用于网易云搜索补充 Google 搜索结果"
      />
      
      {/* 👇 新增：酷狗 Cookie 输入框，直接使用最安全的 InputItem */}
      <InputItem
        value={kgCookie}
        label="酷狗音乐 Cookie"
        onChanged={handleKgCookieChanged}
        placeholder="粘贴完整的酷狗 Cookie（kg_mid=...; kg_dfid=...）"
      />

      <View style={styles.btnContainer}>
        <Button onPress={handleShowLoginModal}>
          <Text>网页登录</Text>
        </Button>
      </View>
    </View>
  );
});

const styles = createStyle({
  content: {
  },
  btnContainer: {
    marginBottom: 5,
    paddingLeft: 20,
    flexDirection: 'row',
  },
});
