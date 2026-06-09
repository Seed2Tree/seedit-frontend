import client from './client'

export const watchlistApi = {
  // F07: 관심종목 목록 조회
  getList: () => client.get('/watchlist'),

  // F07: 관심종목 추가
  add: (stockId) => client.post('/watchlist', { sid: stockId }),

  // F07: 관심종목 삭제
  remove: (stockId) => client.delete(`/watchlist/${stockId}`),
}
