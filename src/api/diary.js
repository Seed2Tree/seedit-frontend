import client from './client'

export const diaryApi = {
  getList: () => client.get('/diaries'),
  getCalendar: (year, month) => client.get('/diaries/calendar', { params: { year, month } }),
  getByDate: (date) => client.get(`/diaries/${date}`),
  create: (diaryDate, content) => client.post('/diaries', { diaryDate, content }),
  update: (did, content) => client.patch(`/diaries/${did}`, { content }),
  delete: (did) => client.delete(`/diaries/${did}`),
}

export const tradeCalendarApi = {
  getAll: () => client.get('/trades'),
  getCalendar: (year, month) => client.get('/trades/calendar', { params: { year, month } }),
  getByDate: (date) => client.get('/trades', { params: { date } }),
}
