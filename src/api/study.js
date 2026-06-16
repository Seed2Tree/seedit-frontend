import client from './client'

export const studyApi = {
  getList: (category) =>
    client.get('/study', { params: category ? { category } : {} }),

  getDetail: (isid) => client.get(`/study/${isid}`),
}
