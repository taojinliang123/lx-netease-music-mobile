import { useState, useImperativeHandle, forwardRef, useRef } from 'react'
import { View, TouchableOpacity } from 'react-native'
import Text from '@/components/common/Text'
import Dialog, { type DialogType } from '@/components/common/Dialog' // ⭐ 引入 Dialog
import { getLastSelectQuality, saveLastSelectQuality } from '@/utils/data'
import { addTask as addDownloadTask } from '@/core/download';
import { fetchAndApplyDetailedQuality } from "@/utils/musicSdk/wy/musicDetail.js";
import settingState from '@/store/setting/state'
import { useTheme } from '@/store/theme/hook'
import { createStyle } from '@/utils/tools'

export interface MusicDownloadModalType {
  show: (info: LX.Music.MusicInfo) => void
}

interface MusicDownloadModalProps {
  onDownloadInfo: (info: LX.Music.MusicInfo) => void
}

interface MusicOption {
  id: LX.Quality
  name: string
  size?: string | null
  key?: string
}

export default forwardRef<MusicDownloadModalType, MusicDownloadModalProps>(
  ({ onDownloadInfo }, ref) => {
    const [visible, setVisible] = useState(false)
    const [musicInfo, setMusicInfo] = useState<LX.Music.MusicInfo | null>(null)
    const [playQualityList, setPlayQualityList] = useState<MusicOption[]>([])
    const dialogRef = useRef<DialogType>(null)
    const theme = useTheme()

    const QUALITY_ORDER = ['128k', '192k', '320k', 'flac', 'hires', 'atmos', 'atmos_plus', 'master', 'master_plus'];

    const calcQualitys = (info: LX.Music.MusicInfo) => {
      const nameMap = new Map()
      nameMap.set('128k', global.i18n.t('128k') || '128K')
      nameMap.set('192k', global.i18n.t('192k') || '192K')
      nameMap.set('320k', global.i18n.t('320k') || '320K')
      nameMap.set('flac', global.i18n.t('flac') || 'FLAC')
      nameMap.set('hires', global.i18n.t('hires') || 'Hi-Res')
      nameMap.set('atmos', global.i18n.t('atmos') || '全景声')
      nameMap.set('atmos_plus', global.i18n.t('atmos_plus') || '全景声Plus')
      nameMap.set('master', global.i18n.t('master') || '母带')
      nameMap.set('master_plus', global.i18n.t('master_plus') || '臻品母带')

      let qualitys: any[] = info.meta?.qualitys || []
      if ((global as any).lx?.qualityList && (global as any).lx.qualityList[info.source]) {
        const customQualitys = (global as any).lx.qualityList[info.source]
        if (Array.isArray(customQualitys) && typeof customQualitys[0] === 'string') {
          qualitys = customQualitys.map(q => ({ type: q, size: null }))
        } else if (Array.isArray(customQualitys)) {
          qualitys = customQualitys
        }
      }

      const qualityMap: Record<string, MusicOption> = {}
      for (const element of qualitys) {
        if (!element || !element.type) continue;
        
        const displayName = nameMap.has(element.type) ? nameMap.get(element.type) : element.type.toUpperCase();

        let displaySize = element.size;
        if (!displaySize && info.interval) {
          const parts = info.interval.split(':');
          if (parts.length === 2) {
            const totalSeconds = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
            let kbps = 128;
            if (element.type === '320k') kbps = 320;
            else if (element.type === 'flac') kbps = 800;
            else if (element.type === 'hires') kbps = 1800;
            else if (element.type === 'master' || element.type === 'jymaster' || element.type === 'master_plus') kbps = 2000;
            else if (['jyeffect', 'sky', 'dolby', 'atmos', 'atmos_plus', '臻品音质'].includes(element.type)) kbps = 1500;

            if (totalSeconds > 0) {
              displaySize = `${(totalSeconds * kbps / 8 / 1024).toFixed(2)}MB`;
            }
          }
        }

        qualityMap[element.type] = {
          id: element.type,
          name: displayName,
          size: displaySize,
          key: element.type,
        }
      }

      const sortedList = Object.values(qualityMap).sort((a, b) => {
        const indexA = QUALITY_ORDER.indexOf(a.id);
        const indexB = QUALITY_ORDER.indexOf(b.id);
        return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB);
      });

      setPlayQualityList(sortedList)
    }

    useImperativeHandle(ref, () => ({
      async show(info) {
        setMusicInfo(info)
        calcQualitys(info)
        setVisible(true)
        // ⭐ 开启 Dialog
        setTimeout(() => {
          dialogRef.current?.setVisible(true)
        }, 0)

        const isCustomSource = /^user_api/.test(settingState.setting['common.apiSource']);
        if (info.source === 'wy' && !info.meta?._full && !isCustomSource) {
          try {
            const detailedInfo = await fetchAndApplyDetailedQuality(info as LX.Music.MusicInfoOnline);
            if (detailedInfo.meta?._full) {
              setMusicInfo(detailedInfo)
              calcQualitys(detailedInfo)
            }
          } catch (e) {
            console.log('获取网易云详细音质失败', e)
          }
        }
      },
    }))

    const handleDownloadMusic = (qualityId: LX.Quality) => {
      void saveLastSelectQuality(qualityId)
      dialogRef.current?.setVisible(false) // ⭐ 关闭 Dialog
      setVisible(false)
      
      if (musicInfo) {
        addDownloadTask(musicInfo, qualityId);
        onDownloadInfo?.(musicInfo)
      }
    }

    const handleHide = () => {
      setVisible(false)
    }

    if (!visible || !musicInfo) return null

    return (
      <Dialog ref={dialogRef} onHide={handleHide}>
        <View style={styles.content}>
          {/* 标题部分：歌名和歌手居中 */}
          <View style={styles.titleArea}>
            <Text size={16} style={styles.songName} color={theme['c-font']} numberOfLines={1}>{musicInfo.name}</Text>
            <Text size={12} style={styles.artistName} color={theme['c-font-label']} numberOfLines={1}>{musicInfo.singer}</Text>
          </View>

          {/* 音质列表 */}
          <View style={styles.listContainer}>
            {playQualityList.length > 0 ? (
              playQualityList.map((item) => (
                <TouchableOpacity
                  key={item.key || item.id}
                  style={[styles.qualityButton, { backgroundColor: theme['c-button-background'] }]}
                  activeOpacity={0.7}
                  onPress={() => handleDownloadMusic(item.id)}
                >
                  <Text style={[styles.qualityText, { color: theme['c-button-font'] }]}>
                    {item.name} {item.size ? `- ${item.size}` : ''}
                  </Text>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyBox}>
                <Text style={[styles.emptyText, { color: theme['c-font-label'] }]}>该音源暂无可下载的音质</Text>
              </View>
            )}
          </View>
        </View>
      </Dialog>
    )
  }
)

const styles = createStyle({
  content: {
    flexShrink: 1,
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 20,
    flexDirection: 'column',
  },
  titleArea: {
    alignItems: 'center',
    marginBottom: 15,
    paddingTop: 5,
  },
  songName: {
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  artistName: {
    textAlign: 'center',
  },
  listContainer: {
    width: '100%',
  },
  qualityButton: {
    borderRadius: 4,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  qualityText: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyBox: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
  },
})
