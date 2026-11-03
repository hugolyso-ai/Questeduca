export const INACTIVITY_LIMIT_MS = 30 * 60 * 1000
export const INACTIVITY_CHECK_MS = 15 * 1000
export const ACTIVITY_EVENTS = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click']

const KEEP_SESSION_KEY = 'questeduca_keep_session'

export const isInstalledApp = () =>
  window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true

export const getKeepSessionChoice = () => localStorage.getItem(KEEP_SESSION_KEY)

export const setKeepSessionChoice = (choice) => localStorage.setItem(KEEP_SESSION_KEY, choice)
