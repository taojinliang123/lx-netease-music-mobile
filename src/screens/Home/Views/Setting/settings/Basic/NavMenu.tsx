import { memo, useMemo } from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { useSettingValue } from '@/store/setting/hook';
import { useI18n } from '@/lang';
import { updateSetting } from '@/core/common';
import { NAV_MENUS, NAV_ID_Type } from '@/config/constant';
import { useTheme } from '@/store/theme/hook'; // 👈 【新增】：刚刚偷来的正确路径

const Item = ({ id, name }: { id: NAV_ID_Type; name: string }) => {
  const navStatus = useSettingValue('common.navStatus');
  const theme = useTheme(); // 👈 【新增】：获取主题对象
  const isChecked = useMemo(() => navStatus[id] ?? true, [navStatus, id]);
  const isDisabled = useMemo(() => id === 'nav_search' || id === 'nav_setting', [id]);

  const handleChange = () => {
    if (isDisabled) return;
    updateSetting({ 'common.navStatus': { ...navStatus, [id]: !isChecked } });
  };

  // 👈 根据 Checkbox 的原始逻辑，计算颜色（带安全兜底）
  const checkColor = isChecked
    ? (isDisabled ? (theme['c-primary-alpha-600'] || '#007AFF') : (theme['c-primary'] || '#007AFF'))
    : (isDisabled ? (theme['c-400'] || '#999') : (theme['c-600'] || '#999'));

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
      {/* 👈 【修改】：把写死的颜色，换成根据主题变量计算出的颜色 */}
      <Text style={{ fontSize: 16, color: checkColor, marginRight: 4 }}>
        {isChecked ? '[√]' : '[ ]'}
      </Text>
      {/* 👈 【修改】：文字也跟随主题（c-500是常规文字色），如果取不到就保持默认 */}
      <Text style={{ fontSize: 16, color: theme['c-500'] || undefined }}>{name}</Text>
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
