import client from './client'

export const newsApi = {
  //  종목별 뉴스 조회
  getAllByCompanyName: (companyName) => client.get('/news', { params: { companyName } }),

  // 날짜별 뉴스 조회
  getAllByDate: (date) => client.get(`/news/date`, { params: { date } }),
}
