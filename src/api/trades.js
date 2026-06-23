import client from './client'

export const tradesApi = {
  orderStock: (data) => client.post('/trades/buy', data),
  sellStock: (data) => client.post('/trades/sell', data),
  getBuyStock: (ticker) => client.get(`/trades/buy/${ticker}`),
  getSellStock: (ticker) => client.get(`/trades/sell/${ticker}`),
  getTradeHistory: (month) => client.get('/trades', { params: month }),
  getTradeHistoryByStockId: (sid) => client.get(`/trades/stocks/${sid}`),
  getTradeHistoryById: (tid) => client.get(`/trades/${tid}`),
  getPortfolio: () => client.get('/portfolio'),
}
