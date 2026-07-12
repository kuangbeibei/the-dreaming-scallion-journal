/** All sticker kinds, in picker order. */
export const STICKER_KINDS = [
  'sun', 'cloud', 'rain', 'moon', 'star', 'scallion', 'baby', 'heart', 'dreamnight',
  'starface', 'cloudhappy', 'cloudsleepy', 'cloudcozy', 'chmorning', 'chwhatt', 'chhuh',
  'chreminding', 'chsleepy', 'chwow', 'chapproved', 'chnice', 'chheyyou', 'chachoo',
  'changry', 'chhuhhh', 'chtoocute', 'chcoolyet', 'chyummy', 'chgrumpy', 'chgoodnight',
  'chcutetoo', 'approved', 'good-morning', 'good-night', 'heart-wink', 'hey-you', 'nice',
  'too-cute', 'wow',
] as const

/** Stickers that spawn at a larger default size. */
export const BIG_STICKERS = [
  'approved', 'good-morning', 'good-night', 'heart-wink', 'hey-you', 'nice', 'too-cute',
  'wow', 'chmorning', 'chwhatt', 'chhuh', 'chreminding', 'chsleepy', 'chwow', 'chapproved',
  'chnice', 'chheyyou', 'chachoo', 'changry', 'chhuhhh', 'chtoocute', 'chcoolyet', 'chyummy',
  'chgrumpy', 'chgoodnight', 'chcutetoo',
]

/** Height/width ratio for each sticker image, used to keep aspect on resize. */
export const STICKER_ASPECT: Record<string, number> = {
  scallion: 1.262, cloud: 0.646, rain: 0.749, moon: 0.943, baby: 0.746, sun: 0.851,
  star: 0.863, heart: 0.945, dreamnight: 0.608, starface: 0.677, cloudhappy: 0.588,
  cloudsleepy: 0.655, cloudcozy: 0.51, chmorning: 0.935, chwhatt: 1.041, chhuh: 1.092,
  chreminding: 0.861, chsleepy: 0.973, chwow: 1.015, chapproved: 0.977, chnice: 1.054,
  chheyyou: 0.818, chachoo: 0.85, changry: 0.887, chhuhhh: 0.895, chtoocute: 0.698,
  chcoolyet: 0.769, chyummy: 0.715, chgrumpy: 0.694, chgoodnight: 0.697, chcutetoo: 0.661,
  approved: 0.814, 'good-morning': 0.926, 'good-night': 0.74, 'heart-wink': 0.743,
  'hey-you': 0.777, nice: 0.718, 'too-cute': 0.718, wow: 0.831,
}

export const BG_COLORS = [
  '#F7F4EE', '#FFF9F2', '#FFF1D6', '#F3E6C9', '#DFF2D8', '#CFE7F5',
  '#D6ECFF', '#DCD6F7', '#F6C1C7', '#FFD6C9', '#EADBC8', '#B8C0CC',
]

export const INK_COLORS = [
  '#3a3730', '#1F3A5F', '#3C5A78', '#4a6b45', '#6FBF5F',
  '#BFA58A', '#8a5a1a', '#F497B6', '#7ED1C6', '#5f6ea6',
]

/** Section-tab palette (cycles). */
export const TAB_PALETTE = ['#E48BA0', '#E4B45E', '#5FB3B0', '#8E8FD8']

/** Page geometry. */
export const PW = 540
export const PH = 540
export const GUT = 2

/** Animation timings (ms). */
export const FLIP_DUR_MS = 820
export const COVER_MS = 950

export const STORAGE_KEY = 'journal.v3'
