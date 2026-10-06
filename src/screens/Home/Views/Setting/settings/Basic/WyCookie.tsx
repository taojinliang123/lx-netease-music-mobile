import { memo, useEffect } from 'react';
import { View } from 'react-native';
import InputItem, { type InputItemProps } from '../../components/InputItem';
import { useI18n } from '@/lang';
import { useSettingValue } from '@/store/setting/hook';
import { updateSetting } from '@/core/common';
import { createStyle } from '@/utils/tools';
// import Button from '../../components/Button'; // 暂时封印按钮，防止 WebView 崩溃

export default memo(() => {
  const t = useI18n();
  const kgCookie = useSettingValue('common.kg_cookie') || '';

  const setKgCookie = (val: string) => {
    updateSetting({ 'common.kg_cookie': val });
  };

  const handleKgChanged: InputItemProps['onChanged'] = (text, callback) => {
    callback(text);
    setKgCookie(text);
  };

  useEffect(() => {
    const handleKgCookieSet = (cookie: string) => {
      setKgCookie(cookie);
    };

    global.app_event.on('kg-cookie-set', handleKgCookieSet);
    return () => {
      global.app_event.off('kg-cookie-set', handleKgCookieSet);
    };
  }, []);

  return (
    <View style={styles.content}>
      <InputItem
        value={kgCookie}
        label="酷狗音乐 Cookie"
        onChanged={handleKgChanged}
        placeholder="在此处粘贴你的酷狗音乐 Cookie"
      />
      
      {/* 网页登录按钮暂时封印，等排查完 WebView 崩溃问题后再开启 */}
      {/* <View style={styles.btnContainer}>
        <Button onPress={() => global.app_event.emit('showKugouWebLogin')}>网页登录</Button>
      </View> */}
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
