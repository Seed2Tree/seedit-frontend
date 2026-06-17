import client from './client'

export const tradesApi = {
  orderStock: (data) => client.post('/trades/buy', data),
  sellStock: (data) => client.post('/trade/sell', data),
  getBuyStock: (ticker) => client.get(`/trades/buy/${ticker}`),
  getSellStock: (ticker) => client.get(`/trades/sell/${ticker}`),
  getTradeHistory: () => client.get('/trades'),
  getTradeHistoryByStockId: (sid) => client.get(`/trades/stocks/${sid}`),
  getTradeHistoryById: (tid) => client.get(`/trades/${tid}`),
  getPortfolio: () => client.get('/portfolio'),
}
