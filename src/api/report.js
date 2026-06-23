import client from './client'

// AI 분석 리포트 API
export const reportApi = {
  // 저장된 리포트 조회 (없으면 data=null → 생성 버튼 노출)
  get: (ticker, bsnsYear, reprtCode = '11011') =>
    client.get(`/stocks/${ticker}/report`, { params: { bsnsYear, reprtCode } }),

  // 생성 + 저장(있으면 갱신)
  generate: (ticker, bsnsYear, reprtCode = '11011') =>
    client.post(`/stocks/${ticker}/report`, null, { params: { bsnsYear, reprtCode } }),

  // 저장된 분기 목록(최신순)
  getPeriods: (ticker) => client.get(`/stocks/${ticker}/report/periods`),
  // DART에 실제 존재하는 보고서 목록
  getAvailable: (ticker) => client.get(`/stocks/${ticker}/report/available`),
}
