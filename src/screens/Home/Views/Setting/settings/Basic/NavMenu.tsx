import { memo, useMemo } from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { useSettingValue } from '@/store/setting/hook';
import { useI18n } from '@/lang';
import { updateSetting } from '@/core/common';
import { NAV_MENUS, NAV_ID_Type } from '@/config/constant';

const Item = ({ id, name }: { id: NAV_ID_Type; name: string }) => {
  const navStatus = useSettingValue('common.navStatus');
  const isChecked = useMemo(() => navStatus[id] ?? true, [navStatus, id]);
  const isDisabled = useMemo(() => id === 'nav_search' || id === 'nav_setting', [id]);

  const handleChange = () => {
    if (isDisabled) return;
    updateSetting({ 'common.navStatus': { ...navStatus, [id]: !isChecked } });
  };

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
      <Text style={{ fontSize: 16, color: isChecked ? '#007AFF' : '#999', marginRight: 4 }}>
        {isChecked ? '[√]' : '[ ]'}
      </Text>
      <Text style={{ fontSize: 16 }}>{name}</Text>
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
