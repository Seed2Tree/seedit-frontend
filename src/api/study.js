import client from './client'

export const studyApi = {
  getList: (category) =>
    client.get('/study', { params: category ? { category } : {} }),

  getDetail: (isid) => client.get(`/study/${isid}`),

  getBookmarks: () => client.get('/study/bookmarks'),
  getBookmarkIds: () => client.get('/study/bookmarks/ids'),
  addBookmark: (isid) => client.post(`/study/${isid}/bookmark`),
  removeBookmark: (isid) => client.delete(`/study/${isid}/bookmark`),
}
