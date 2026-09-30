import { memo } from 'react'
import { View, TouchableOpacity } from 'react-native'

import { Icon } from '@/components/common/Icon'
import { pop } from '@/navigation'
import StatusBar from '@/components/common/StatusBar'
import { useI18n } from '@/lang'
import { createStyle } from '@/utils/tools'
import Text from '@/components/common/Text'
import { HEADER_HEIGHT as _HEADER_HEIGHT } from '@/config/constant'
import { scaleSizeH } from '@/utils/pixelRatio'
import commonState from '@/store/common/state'
import { useStatusbarHeight } from '@/store/common/hook'

const HEADER_HEIGHT = scaleSizeH(_HEADER_HEIGHT)

export default memo(({ musicInfo }: { musicInfo: LX.Music.MusicInfo }) => {
  const t = useI18n()
  const statusBarHeight = useStatusbarHeight()

  const back = () => {
    // ⭐ 修改：使用导航栈最顶层的 ID，避免因 componentIds.comment 为空导致失效
    void pop(commonState.componentIds[commonState.componentIds.length - 1]?.id!)
  }

  return (
    <View style={{ height: HEADER_HEIGHT + statusBarHeight, paddingTop: statusBarHeight }}>
      <StatusBar />
      <View style={{ ...styles.container }}>
        <TouchableOpacity onPress={back} style={{ ...styles.button, width: HEADER_HEIGHT }}>
          <Icon name="chevron-left" size={18} />
        </TouchableOpacity>
        <Text numberOfLines={1} size={16} style={styles.title}>
          {t('comment_title', { name: musicInfo.name, singer: musicInfo.singer })}
        </Text>
      </View>
    </View>
  )
})

const styles = createStyle({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
    paddingRight: 40,
  },
  button: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    flex: 1,
    textAlign: 'center',
  },
  icon: {
    paddingLeft: 4,
    paddingRight: 4,
  },
})
