import client from './client'

export const authApi = {
  signup: (data) => client.post('/auth/signup', data),
  login: (email, password) => client.post('/auth/login', { email, password }),
  logout: () => client.post('/auth/logout'),
  checkEmail: (email) => client.post('/auth/check-email', null, { params: { email } }),
  refresh: () => client.post('/auth/refresh'),
}
