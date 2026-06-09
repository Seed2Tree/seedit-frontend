import client from './client'

export const authApi = {
  login: (email, password) => client.post('/auth/login', { email, password }),
  signup: (data) => client.post('/auth/signup', data),
}
