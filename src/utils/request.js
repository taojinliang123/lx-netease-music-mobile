// ... 前面的代码保持不变 ...

const handleRequestData = async (
  url,
  { method = 'get', headers = {}, format = 'json', cache = 'no-store', ...options }
) => {
  // console.log(url, options)
  headers = Object.assign(
    {
      Accept: 'application/json',
    },
    headers
  )
  // 👇 【原有网易云自动带票】
  if (url.includes('music.163.com')) {
    headers.cookie = settingState.setting['common.wy_cookie']
  }
  // 👇 【新增酷狗自动带票】：只要请求酷狗域名，自动带上 kg_cookie
  if (url.includes('kugou.com')) {
    headers.cookie = settingState.setting['common.kg_cookie']
  }
  options.cache = cache
  // ... 后面的代码全部保持不变 ...
