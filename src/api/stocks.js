import client from './client'

export const stocksApi = {
  // F01: 종목 리스트 조회
  getList: () => client.get('/stocks'),

  // F01: 종목 상세 조회
  getDetail: (stockId) => client.get(`/stocks/${stockId}`),

  // F01: 종목 일별 시세 조회 (차트용)
  getPrices: (stockId, period = '1w') =>
    client.get(`/stocks/${stockId}/prices`, { params: { period } }),
}
