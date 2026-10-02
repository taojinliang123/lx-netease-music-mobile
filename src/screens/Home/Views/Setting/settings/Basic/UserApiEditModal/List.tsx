import { useCallback } from 'react'
import Text from '@/components/common/Text'
import { View, TouchableOpacity, ScrollView, Share } from 'react-native'
import { confirmDialog, createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'
import { useUserApiList, state as userApiState } from '@/store/userApi'
import { useSettingValue } from '@/store/setting/hook'
import { removeUserApi, setUserApiAllowShowUpdateAlert } from '@/core/userApi'
import { getUserApiScript } from '@/utils/data' // ⭐ 新增导入
import { BorderRadius } from '@/theme'
import CheckBox from '@/components/common/CheckBox'
import { Icon } from '@/components/common/Icon'
import settingState from '@/store/setting/state'
import apiSourceInfo from '@/utils/musicSdk/api-source-info'
import { setApiSource } from '@/core/apiSource'

const formatVersionName = (version: string) => {
  return /^\d/.test(version) ? `v${version}` : version
}

const ListItem = ({
  item,
  activeId,
  onRemove,
  onChangeAllowShowUpdateAlert,
  onShare,
}: {
  item: LX.UserApi.UserApiInfo
  activeId: string
  onRemove: (id: string, name: string) => void
  onChangeAllowShowUpdateAlert: (id: string, enabled: boolean) => void
  onShare: (item: LX.UserApi.UserApiInfo) => void
}) => {
  const theme = useTheme()
  const t = useI18n()
  const changeAllowShowUpdateAlert = (check: boolean) => {
    onChangeAllowShowUpdateAlert(item.id, check)
  }
  const handleRemove = () => {
    onRemove(item.id, item.name)
  }
  const handleShare = () => {
    onShare(item)
  }

  return (
    <View
      style={{
        ...styles.listItem,
        backgroundColor: activeId == item.id ? theme['c-primary-background-active'] : 'transparent',
      }}
    >
      <View style={styles.listItemLeft}>
        <Text size={14}>
          {item.name}
          {item.version ? (
            <Text size={12} color={theme['c-font-label']}>
              {'   ' + formatVersionName(item.version)}
            </Text>
          ) : null}
          {item.author ? (
            <Text size={12} color={theme['c-font-label']}>
              {'   ' + item.author}
            </Text>
          ) : null}
        </Text>
        {item.description ? (
          <Text size={12} color={theme['c-font-label']}>
            {item.description}
          </Text>
        ) : null}
        <CheckBox
          check={item.allowShowUpdateAlert}
          label={t('user_api_allow_show_update_alert')}
          onChange={changeAllowShowUpdateAlert}
          size={0.86}
        />
      </View>
      <View style={styles.listItemRight}>
        <TouchableOpacity style={styles.btn} onPress={handleShare}>
          <Icon name="share" color={theme['c-button-font']} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.btn} onPress={handleRemove}>
          <Icon name="close" color={theme['c-button-font']} />
        </TouchableOpacity>
      </View>
    </View>
  )
}

export interface UserApiEditModalProps {
  onSave: (rules: string) => void
}
export interface UserApiEditModalType {
  show: (rules: string) => void
}

export default () => {
  const userApiList = useUserApiList()
  const apiSource = useSettingValue('common.apiSource')
  const theme = useTheme()
  const t = useI18n()

  const handleRemove = useCallback(async (id: string, name: string) => {
    const confirm = await confirmDialog({
      message: global.i18n.t('user_api_remove_tip', { name }),
      cancelButtonText: global.i18n.t('cancel_button_text_2'),
      confirmButtonText: global.i18n.t('confirm_button_text'),
      bgClose: false,
    })
    if (!confirm) return
    void removeUserApi([id]).finally(() => {
      if (settingState.setting['common.apiSource'] == id) {
        let backApiId = apiSourceInfo.find((api) => !api.disabled)?.id
        if (!backApiId) backApiId = userApiState.list[0]?.id
        setApiSource(backApiId ?? '')
      }
    })
  }, [])

  const handleChangeAllowShowUpdateAlert = useCallback((id: string, enabled: boolean) => {
    void setUserApiAllowShowUpdateAlert(id, enabled)
  }, [])

  // ⭐ 修复：调用官方函数获取脚本内容并分享
  const handleShare = useCallback(async (item: LX.UserApi.UserApiInfo) => {
    try {
      const scriptContent = await getUserApiScript(item.id)
      if (!scriptContent) {
        console.warn('脚本内容为空:', item.name)
        return
      }
      await Share.share({
        title: `分享音源：${item.name}`,
        message: scriptContent,
      })
    } catch (e) {
      console.error('分享失败:', e)
    }
  }, [])

  return (
    <ScrollView style={styles.scrollView} keyboardShouldPersistTaps={'always'}>
      <View onStartShouldSetResponder={() => true}>
        {userApiList.length ? (
          userApiList.map((item) => {
            return (
              <ListItem
                key={item.id}
                item={item}
                activeId={apiSource}
                onRemove={handleRemove}
                onChangeAllowShowUpdateAlert={handleChangeAllowShowUpdateAlert}
                onShare={handleShare}
              />
            )
          })
        ) : (
          <Text style={styles.tipText} color={theme['c-font-label']}>
            {t('user_api_empty')}
          </Text>
        )}
      </View>
    </ScrollView>
  )
}

const styles = createStyle({
  scrollView: {
    paddingHorizontal: 7,
    flexGrow: 0,
  },
  list: {
    paddingBottom: 15,
    flexDirection: 'column',
  },
  listItem: {
    padding: 10,
    borderRadius: BorderRadius.normal,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  listItemLeft: {
    paddingRight: 10,
    flex: 1,
    gap: 2,
  },
  listItemRight: {
    flex: 0,
    flexDirection: 'row',
  },
  btn: {
    padding: 10,
  },
  tipText: {
    textAlign: 'center',
    marginTop: 25,
    marginBottom: 15,
  },
})
