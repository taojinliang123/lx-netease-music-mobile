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
  const domain = 'https://kugou.com'; // 改为酷狗域名
  try {
    // 1. 关键步骤：清除该域名的所有原生Cookie
    await CookieManager.clearAll(true);

    if (cookie) {
      // 2. 将新的Cookie字符串拆分并逐个设置回原生Cookie Jar
      const cookiePairs = cookie.split(';').map(pair => pair.trim());
      for (const pair of cookiePairs) {
        const [name, ...valueParts] = pair.split('=');
        if (name && valueParts.length > 0) {
          await CookieManager.set(domain, {
            name: name.trim(),
            value: valueParts.join('=').trim(),
            domain: '.kugou.com', // 改为酷狗域名
            path: '/',
          });
        }
      }
    }
    console.log('Native kugou cookie synchronized successfully.');
  } catch (error) {
    console.error('Failed to sync native kugou cookie:', error);
    toast('酷狗 Cookie 同步失败，部分请求可能异常', 'long');
  }
};

export default memo(() => {
  const t = useI18n();
  const cookie = useSettingValue('common.kg_cookie'); // 新增酷狗设置项

  const setCookie = (val: string) => {
    void syncCookieToNative(val).then(() => {
      updateSetting({ 'common.kg_cookie': val });
    });
  };

  const handleChanged: InputItemProps['onChanged'] = (text, callback) => {
    callback(text);
    setCookie(text);
  };

  const handleShowLoginModal = () => {
    // 触发全局事件，注意事件名区分
    global.app_event.emit('showKugouWebLogin');
  };

  useEffect(() => {
    const handleCookieSet = (cookie: string) => {
      setCookie(cookie);
    };

    // 监听酷狗专有的返回事件
    global.app_event.on('kg-cookie-set', handleCookieSet);
    return () => {
      global.app_event.off('kg-cookie-set', handleCookieSet);
    };
  }, []);

  return (
    <View style={styles.content}>
      <InputItem
        value={cookie}
        label="酷狗音乐 Cookie"
        onChanged={handleChanged}
        placeholder="在此处粘贴你的酷狗 Cookie"
      />
      
      {/* === 方案1：暂时注释掉按钮，用于排查崩溃原因 ===
      <View style={styles.btnContainer}>
        <Button onPress={handleShowLoginModal}>酷狗网页登录</Button>
      </View>
      */}
      
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
