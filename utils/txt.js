export function safeString(field) {
  let txt = String(field).toLowerCase()
  txt = txt.replace(/ /g, '_')
  txt = txt.replace(/ä/g, 'ae')
  txt = txt.replace(/ö/g, 'oe')
  txt = txt.replace(/ü/g, 'ue')
  txt = txt.replace(/ß/g, 'ss')
  txt = txt.replace(/&/g, 'und')
  txt = txt.replace(/\?|!|`|´|'|"|\*|\(|\)|\[|\]|{|}|#|@/g, '')
  txt = txt.replace(/\.|,|-/g, '_')
  return txt
}

export function cleanString(field) {
  let txt = String(field).toLowerCase()
  txt = txt.replace(/ /g, '-')
  txt = txt.replace(/–|—/g, '-')
  txt = txt.replace(/ä|æ/g, 'ae')
  txt = txt.replace(/à|á|â|ã|å/g, 'a')
  txt = txt.replace(/è|é|ê|ë/g, 'e')
  txt = txt.replace(/ñ/g, 'n')
  txt = txt.replace(/ö/g, 'oe')
  txt = txt.replace(/ò|ó|ô|õ|ø/g, 'o')
  txt = txt.replace(/ü/g, 'ue')
  txt = txt.replace(/ù|ú|ú/g, 'u')
  txt = txt.replace(/ß/g, 'ss')
  txt = txt.replace(/&/g, 'und')
  txt = txt.replace(/\?|!|`|´|'|"|\*|\(|\)|\[|\]|{|}|#|@/g, '')
  txt = txt.replace(/«|»|‹|›|\^|°|"|"|„|'|'|‚/g, '')
  txt = txt.replace(/\.|,|-+/g, '-')
  return txt
}

export function titleize(sentence) {
  if (!sentence || !sentence.split) return sentence
  const _titleizeWord = (string) =>
    string.charAt(0).toUpperCase() + `${string.slice(1)}`.toLowerCase()
  const result = []
  sentence.split(' ').forEach((w) => result.push(_titleizeWord(w)))
  return result.join(' ')
}

export function truncate(str, length = 100, ending = ' ...') {
  if (!str) return ''
  if (str.length > length) {
    const arr = str.substring(0, length - ending.length).split(' ')
    arr.pop()
    return arr.join(' ') + ending
  }
  return str
}

export function humanNumber(num) {
  let that = String(num)
  if ([String(parseFloat(num)), String(parseInt(num))].indexOf(that) === -1) return num
  let komma = false
  if (that.split('.').length > 1) {
    komma = that.split('.')[1]
    that = that.split('.')[0]
  }
  const count = that.split('').length
  const arr = that.split('').reverse()
  if (count > 3) arr.splice(3, 0, '.')
  if (count > 6) arr.splice(7, 0, '.')
  if (count > 9) arr.splice(11, 0, '.')
  if (count > 12) arr.splice(15, 0, '.')
  if (komma) return `${arr.reverse().join('')},${komma}`
  return `${arr.reverse().join('')}`
}

export function humanPrize(num, currency = 'USD') {
  let that = String(num)
  if (isNaN(that)) return num
  let komma = false
  if (String(parseFloat(num).toFixed(2)).split('.').length > 1) {
    komma = parseFloat(num).toFixed(2).split('.')[1]
    that = that.split('.')[0]
  }
  const count = that.split('').length
  const arr = that.split('').reverse()
  let niceNum = ''
  if (count > 3) arr.splice(3, 0, '.')
  if (count > 6) arr.splice(7, 0, '.')
  if (komma && parseInt(komma) > 0) {
    niceNum = `${arr.reverse().join('')},${komma}`
  } else {
    niceNum = `${arr.reverse().join('')},-`
  }
  if (currency === 'EUR') return `${niceNum} €`
  if (currency === 'CHF') return `${niceNum} CHF`
  return `$ ${niceNum}`
}
