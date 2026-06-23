import client from './client'

export const userApi = {
  changePassword: (payload) => client.put('/users/password', payload),
  getMe: () => client.get('/users/me'),
  updateprofile: (payload) => client.put('/users/me', payload),
  deleteprofile: () => client.delete('/users/me'),
  resetAccount: () => client.post('/users/me/reset'),
  balance_histoies: () => client.get('/balance-histories'),
  balance: (id) => client.get(`/balance-histories/${id}`),
}
