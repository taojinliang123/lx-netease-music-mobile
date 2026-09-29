import { View } from 'react-native'
import { useState, useEffect, useRef, useImperativeHandle, forwardRef, useMemo } from 'react'
import ConfirmAlert, { type ConfirmAlertType } from '@/components/common/ConfirmAlert'
import Text from '@/components/common/Text'
import { createStyle } from '@/utils/tools'
import CheckBox from '@/components/common/CheckBox'
import { getLastSelectQuality, saveLastSelectQuality } from '@/utils/data'
import { addTask as addDownloadTask } from '@/core/download';
import { fetchAndApplyDetailedQuality } from "@/utils/musicSdk/wy/musicDetail.js";
import { useSettingValue } from '@/store/setting/hook'
import settingState from '@/store/setting/state'

interface TitleType {
  updateTitle: (musicInfo: LX.Music.MusicInfo) => void
}
const Title = forwardRef<TitleType, {}>((props, ref) => {
  const [title, setTitle] = useState('')
  useImperativeHandle(ref, () => ({
    updateTitle(musicInfo) {
      setTitle(
        global.i18n.t('download_music_title', { name: musicInfo.name, artist: musicInfo.singer })
      )
    },
  }))

  return <Text style={{ marginBottom: 5 }}>{title}</Text>
})

export interface SelectInfo {
  musicInfo: LX.Music.MusicInfo
  selectedList: LX.Music.MusicInfo[]
  index: number
  listId: string
  single: boolean
}
const initSelectInfo = {}

interface MusicDownloadModalProps {
  onDownloadInfo: (info: LX.Music.MusicInfo) => void
}

export interface MusicDownloadModalType {
  show: (info: LX.Music.MusicInfo) => void
}

export default forwardRef<MusicDownloadModalType, MusicDownloadModalProps>(
  ({ onDownloadInfo }, ref) => {
    const alertRef = useRef<ConfirmAlertType>(null)
    const titleRef = useRef<TitleType>(null)
    const selectedInfo = useRef<LX.Music.MusicInfo>(initSelectInfo as LX.Music.MusicInfo)
    const [selectedQuality, setSelectedQuality] = useState<LX.Quality>('128k')
    const [selectedTarget, setSelectedTarget] = useState<'local' | 'onedrive'>('local')
    const [playQualityList, setPlayQualityList] = useState<MusicOption[]>([])
    const [visible, setVisible] = useState(false)
    const showOneDriveDownload = useSettingValue('menu.downloadOneDrive')

    interface QualityMap {
      [key: string]: MusicOption
    }

    interface MusicOption {
      id: LX.Quality
      name: string
      size?: string | null
      key?: string
    }

    useEffect(() => {
      if (!visible || !playQualityList.length) return

      const applyLastQuality = async() => {
        const lastQuality = await getLastSelectQuality()
        const qualityExists = playQualityList.some(q => q.id === lastQuality)
        if (qualityExists) {
          setSelectedQuality(lastQuality)
        } else {
          setSelectedQuality(playQualityList[0].id)
        }
      }

      void applyLastQuality()
    }, [visible, playQualityList])

    const calcQualitys = (musicInfo: LX.Music.MusicInfo) => {
      const map = new Map()

      map.set('128k', global.i18n.t('128k') || '128K')
      map.set('192k', global.i18n.t('192k') || '192K')
      map.set('320k', global.i18n.t('320k') || '320K')
      map.set('flac', global.i18n.t('flac') || 'FLAC')
      map.set('hires', global.i18n.t('hires') || 'Hi-Res')
      map.set('atmos', global.i18n.t('atmos') || '全景声')
      map.set('atmos_plus', global.i18n.t('atmos_plus') || '全景声Plus')
      map.set('master', global.i18n.t('master') || '母带')
      map.set('master_plus', global.i18n.t('master_plus') || '臻品母带')

      // ⭐ 优先读取自定义源挂载的全局音质列表
      let qualitys: any[] = musicInfo.meta?.qualitys || []
      
      if ((global as any).lx?.qualityList && (global as any).lx.qualityList[musicInfo.source]) {
        const customQualitys = (global as any).lx.qualityList[musicInfo.source]
        
        // 兼容自定义源可能返回纯字符串数组 ['128k', '320k'] 的情况
        if (Array.isArray(customQualitys) && typeof customQualitys[0] === 'string') {
          qualitys = customQualitys.map(q => ({ type: q, size: null }))
        } else if (Array.isArray(customQualitys)) {
          qualitys = customQualitys
        }
      }

      const qualityMap: QualityMap = {}
      for (const element of qualitys) {
        if (!element || !element.type) continue;

        // ⭐ 如果音源没有提供 size，就用时长和码率估算
        let displaySize = element.size
        if (!displaySize && musicInfo.interval) {
          const parts = musicInfo.interval.split(':')
          if (parts.length === 2) {
            const totalSeconds = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10)
            let kbps = 128
            if (element.type === '320k') kbps = 320
            else if (element.type === 'flac') kbps = 800
            else if (element.type === 'hires') kbps = 1500
            else if (element.type === 'master') kbps = 2000
            if (totalSeconds > 0) {
              displaySize = `${(totalSeconds * kbps / 8 / 1024).toFixed(2)}MB`
            }
          }
        }

        const temp: MusicOption = {
          id: element.type,
          name: map.has(element.type) ? map.get(element.type) : '未知',
          size: displaySize,
          key: element.type,
        }
        qualityMap[element.type] = temp
      }
      setPlayQualityList(Object.values(qualityMap))
    }

    useImperativeHandle(ref, () => ({
      async show(info) {
        selectedInfo.current = info
        titleRef.current?.updateTitle(info)
        calcQualitys(info)

        if (visible) {
          alertRef.current?.setVisible(true)
        } else {
          setVisible(true)
        }

        // ⭐ 判断当前是否在使用自定义源
        const isCustomSource = /^user_api/.test(settingState.setting['common.apiSource']);

        // ⭐ 只有官方网易云且未开启自定义源时，才去请求详细数据
        if (info.source === 'wy' && !info.meta?._full && !isCustomSource) {
          try {
            const detailedInfo = await fetchAndApplyDetailedQuality(info as LX.Music.MusicInfoOnline);
            if (detailedInfo.meta?._full) {
              selectedInfo.current = detailedInfo;
              calcQualitys(detailedInfo);
            }
          } catch (e) {
            console.log('获取网易云详细音质失败', e)
          }
        }
      },
    }))

    useEffect(() => {
      if (visible) {
        alertRef.current?.setVisible(true)
      }
    }, [visible])

    const handleDownloadMusic = async() => {
      const target = showOneDriveDownload && selectedTarget === 'onedrive' ? 'onedrive' : 'local'
      void saveLastSelectQuality(selectedQuality)
      alertRef.current?.setVisible(false)
      addDownloadTask(
        selectedInfo.current,
        selectedQuality,
        false,
        target
      );
      setTimeout(() => {
        setSelectedQuality('128k')
        setSelectedTarget('local')
      }, 300)
    }

    const useActive = (id: LX.Quality) => {
      return useMemo(() => selectedQuality === id, [selectedQuality, id])
    }

    const Item = ({ id, name }: { id: LX.Quality; name: string }) => {
      const isActive = useActive(id)
      return (
        <CheckBox
          marginRight={8}
          check={isActive}
          label={name}
          onChange={() => {
            setSelectedQuality(id)
          }}
          need
        />
      )
    }

    return visible ? (
      <ConfirmAlert
        ref={alertRef}
        onConfirm={handleDownloadMusic}
        onHide={() => setVisible(false) }
      >
        <View style={styles.content}>
          <Title ref={titleRef} />
          {showOneDriveDownload ? (
            <View style={styles.targetList}>
              <CheckBox
                marginRight={8}
                check={selectedTarget === 'local'}
                label="下载到本地"
                onChange={() => setSelectedTarget('local')}
                need
              />
              <CheckBox
                marginRight={8}
                check={selectedTarget === 'onedrive'}
                label="下载到 OneDrive"
                onChange={() => setSelectedTarget('onedrive')}
                need
              />
            </View>
          ) : null}
          <View style={styles.list}>
            {playQualityList.map((item) => (
              <Item name={item.name + (item.size ? ` (${item.size})` : '')} id={item.id} key={item.key} />
            ))}
          </View>
        </View>
      </ConfirmAlert>
    ) : null
  }
)

const styles = createStyle({
  content: {
    flexGrow: 1,
    flexShrink: 1,
    flexDirection: 'column',
  },
  input: {
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 260,
    borderRadius: 4,
  },
  list: {
    flexDirection: 'column',
    flexWrap: 'nowrap',
  },
  targetList: {
    flexDirection: 'column',
    flexWrap: 'nowrap',
    marginBottom: 8,
  },
})
