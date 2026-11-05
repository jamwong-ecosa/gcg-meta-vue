// Each file in this folder is one namespace holding both languages side by side:
// `export default { en: { ... }, 'zh-HK': { ... } }`. `home.js` → `t('home.…')`
const modules = import.meta.glob(['./*.js', '!./index.js'], { eager: true })

const messages = { en: {}, 'zh-HK': {} }
for (const [path, mod] of Object.entries(modules)) {
  const ns = path.match(/\.\/(.+)\.js$/)[1]
  for (const [lang, msgs] of Object.entries(mod.default)) {
    messages[lang] ??= {}
    messages[lang][ns] = msgs
  }
}

export default messages
