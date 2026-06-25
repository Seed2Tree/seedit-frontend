// 매수 가설 태그
export const BUY_REASON_TAGS = [
  { value: 'earnings', label: '실적 기대', emoji: '📈' },
  { value: 'news', label: '호재 뉴스', emoji: '📰' },
  { value: 'long', label: '장기 투자', emoji: '🌱' },
  { value: 'rebound', label: '단기 반등', emoji: '⚡' },
  { value: 'chart', label: '차트 패턴', emoji: '📊' },
  { value: 'etc', label: '기타', emoji: '✏️' },
]

// 매도 사유 태그
export const SELL_REASON_TAGS = [
  { value: 'target', label: '목표가 도달', emoji: '🎯' },
  { value: 'stoploss', label: '손절', emoji: '✂️' },
  { value: 'bad-news', label: '악재', emoji: '📉' },
  { value: 'switch', label: '다른 종목으로', emoji: '🔄' },
]

const TAG_MAP = Object.fromEntries(
  [...BUY_REASON_TAGS, ...SELL_REASON_TAGS].map((t) => [t.value, t]),
)

export const tagLabel = (value) => TAG_MAP[value]?.label ?? value
export const tagEmoji = (value) => TAG_MAP[value]?.emoji ?? '✏️'
