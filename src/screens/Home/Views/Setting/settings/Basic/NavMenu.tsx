import { memo, useMemo } from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { useSettingValue } from '@/store/setting/hook';
import { useI18n } from '@/lang';
import { updateSetting } from '@/core/common';
import { NAV_MENUS, NAV_ID_Type } from '@/config/constant';
import { useTheme } from '@/store/theme/hook';
import Text from '@/components/common/Text'; // 👈 【关键】：改用项目自带的自定义 Text 组件

const Item = ({ id, name }: { id: NAV_ID_Type; name: string }) => {
  const navStatus = useSettingValue('common.navStatus');
  const theme = useTheme();
  const isChecked = useMemo(() => navStatus[id] ?? true, [navStatus, id]);
  const isDisabled = useMemo(() => id === 'nav_search' || id === 'nav_setting', [id]);

  const handleChange = () => {
    if (isDisabled) return;
    updateSetting({ 'common.navStatus': { ...navStatus, [id]: !isChecked } });
  };

  // 安全获取颜色，如果取不到就用兜底颜色，绝不崩溃
  const getColor = (key: string, fallback: string) => {
    const val = theme?.[key];
    return typeof val === 'string' ? val : fallback;
  };

  // 勾选符号颜色（选中变主题绿，禁用或未选中变灰）
  const checkColor = isChecked
    ? (isDisabled ? getColor('c-primary-alpha-600', '#2EB981') : getColor('c-primary', '#2EB981'))
    : (isDisabled ? getColor('c-400', '#999') : getColor('c-600', '#999'));

  // 菜单文字颜色（跟随主题字体色）
  const textColor = getColor('c-font', '#333');

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
      {/* 使用自定义 Text 的 size 和 color 属性 */}
      <Text size={16} color={checkColor} style={{ marginRight: 4 }}>
        {isChecked ? '[√]' : '[ ]'}
      </Text>
      <Text size={16} color={textColor}>{name}</Text>
    </Pressable>
  );
};

export default memo(() => {
  const t = useI18n();
  const theme = useTheme();
  const menuList = useMemo(() => {
    return NAV_MENUS
      .filter(item => item.id !== 'nav_play_history')
      .map((item) => ({ id: item.id, name: t(item.id) }));
  }, [t]);

  return (
    <View style={styles.container}>
      <Text size={14} color={theme['c-500'] || '#666'} style={styles.subTitle}>
        {t('setting_basic_nav_menu')}
      </Text>
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
  subTitle: { fontWeight: 'bold', marginBottom: 8, opacity: 0.7 },
  list: { flexDirection: 'row', flexWrap: 'wrap' },
});
