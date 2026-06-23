import client from './client'

export const studyApi = {
  getList: (category) =>
    client.get('/study', { params: category ? { category } : {} }),

  getDetail: (isid) => client.get(`/study/${isid}`),

  getBookmarks: () => client.get('/study/bookmarks'),
  getBookmarkIds: () => client.get('/study/bookmarks/ids'),
  addBookmark: (isid) => client.post(`/study/${isid}/bookmark`),
  removeBookmark: (isid) => client.delete(`/study/${isid}/bookmark`),

  getComments: (isid) => client.get(`/study/${isid}/comments`),
  addComment: (isid, content) => client.post(`/study/${isid}/comments`, { content }),
  updateComment: (isid, scid, content) => client.put(`/study/${isid}/comments/${scid}`, { content }),
  deleteComment: (isid, scid) => client.delete(`/study/${isid}/comments/${scid}`),
}
