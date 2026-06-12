import client from './client'

export const userApi = {
  changePassword: (newPassword) => client.put('/users/password', newPassword),
  getMe: () => client.get('/users/me'),
  updateprofile: (payload) => client.put('/users/me', payload),
  deleteprofile: () => client.delete('/users/me'),
  balance_histoies: () => client.get('/balance-histories'),
  balance: (id) => client.get(`/balance-histories/${id}`),
}
