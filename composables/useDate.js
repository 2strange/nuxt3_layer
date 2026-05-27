import dayjs from 'dayjs'
import 'dayjs/locale/de'

dayjs.locale('de')

// Replaces the old dateMixin. Use:  const { date, dateTime } = useDate()
export function useDate() {
  function force2digit(n) {
    return parseInt(n) < 10 ? `0${n}` : `${n}`
  }

  function date(datetime) {
    if (!datetime) return '---'
    return dayjs(datetime).format('DD. MMM YYYY')
  }

  function dateToday() {
    return dayjs().format('DD.MM.YYYY')
  }

  function time(datetime) {
    if (!datetime) return '---'
    return dayjs(datetime).format('HH:mm') + ' Uhr'
  }

  function dateTime(datetime) {
    if (!datetime) return '---'
    return dayjs(datetime).format('DD.MM.YYYY - HH:mm') + ' Uhr'
  }

  function thisYear() {
    return dayjs().format('YYYY')
  }

  return { force2digit, date, dateToday, time, dateTime, thisYear }
}
