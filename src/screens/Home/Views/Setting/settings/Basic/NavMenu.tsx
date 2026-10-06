import { memo, useMemo } from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { useSettingValue } from '@/store/setting/hook';
import { useI18n } from '@/lang';
import { updateSetting } from '@/core/common';
import { NAV_MENUS, NAV_ID_Type } from '@/config/constant';
import { useTheme } from '@/store/theme/hook';

const Item = ({ id, name }: { id: NAV_ID_Type; name: string }) => {
  const navStatus = useSettingValue('common.navStatus');
  const theme = useTheme();
  const isChecked = useMemo(() => navStatus[id] ?? true, [navStatus, id]);
  const isDisabled = useMemo(() => id === 'nav_search' || id === 'nav_setting', [id]);

  const handleChange = () => {
    if (isDisabled) return;
    updateSetting({ 'common.navStatus': { ...navStatus, [id]: !isChecked } });
  };

  // 👇 安全提取颜色的神器：不管主题返回的是字符串、对象还是CSS变量，都能安全退回默认颜色
  const getColor = (key: string, fallback: string) => {
    const val = theme?.[key];
    if (typeof val === 'string') return val;
    if (val && typeof val === 'object' && typeof val.color === 'string') return val.color;
    return fallback;
  };

  // 使用提取器获取颜色。如果主题取不到，就会使用括号里的兜底颜色
  const checkColor = isChecked
    ? (isDisabled ? getColor('c-primary-alpha-600', '#2EB981') : getColor('c-primary', '#2EB981'))
    : (isDisabled ? getColor('c-400', '#999') : getColor('c-600', '#999'));

  const textColor = getColor('c-500', '#333');

  return (
    <Pressable
      onPress={handleChange}
      disabled={isDisabled}
      style={{
        marginRight: 8,
        marginBottom: 8,
        flexDirection: 'row',
        alignItems: 'center',
        opacity: isDisabled ? 0.5 : 1
      }}
    >
      <Text style={{ fontSize: 16, color: checkColor, marginRight: 4 }}>
        {isChecked ? '[√]' : '[ ]'}
      </Text>
      <Text style={{ fontSize: 16, color: textColor }}>{name}</Text>
    </Pressable>
  );
};

export default memo(() => {
  const t = useI18n();
  const menuList = useMemo(() => {
    return NAV_MENUS
      .filter(item => item.id !== 'nav_play_history')
      .map((item) => ({ id: item.id, name: t(item.id) }));
  }, [t]);

  return (
    <View style={styles.container}>
      <Text style={styles.subTitle}>{t('setting_basic_nav_menu')}</Text>
      <View style={styles.list}>
        {menuList.map(({ id, name }) => (
          <Item key={id} id={id} name={name} />
        ))}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: { marginBottom: 15 },
  subTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 8, opacity: 0.7 },
  list: { flexDirection: 'row', flexWrap: 'wrap' },
});
