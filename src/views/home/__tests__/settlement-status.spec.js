import { mount, flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import TradeDetailView from '../TradeDetailView.vue'
import TradeHistoryView from '../TradeHistoryView.vue'
import { tradesApi } from '@/api/trades'
import { userApi } from '@/api/user'

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { tid: '1' } }),
  useRouter: () => ({ push: vi.fn() }),
}))
vi.mock('@/api/trades', () => ({
  tradesApi: { getTradeHistoryById: vi.fn(), getTradeHistory: vi.fn() },
}))
vi.mock('@/api/user', () => ({ userApi: { getMe: vi.fn() } }))

const trade = (settlementStatus) => ({
  tid: 1,
  companyName: '테스트',
  ticker: '000001',
  tradeType: 'SELL',
  quantity: -1,
  tradePrice: 100,
  totalAmount: 100,
  remainingBalance: 1000,
  tradeAt: new Date().toISOString(),
  settleDate: '2026-11-11',
  settlementStatus,
})

describe('매도 정산 상태', () => {
  beforeEach(() => vi.clearAllMocks())

  it.each([
    ['PENDING', '정산 예정'],
    ['SETTLED', '입금 완료'],
    ['FAILED', '정산 지연'],
  ])('상세 화면에서 %s를 구분한다', async (status, label) => {
    tradesApi.getTradeHistoryById.mockResolvedValue({ data: { trade: trade(status) } })
    const wrapper = mount(TradeDetailView)
    await flushPromises()
    expect(wrapper.get('.settle-badge').text()).toBe(label)
    if (status === 'FAILED') {
      expect(wrapper.text()).not.toContain('입금 완료')
      expect(wrapper.text()).toContain('아직 입금되지 않았어요')
    }
    wrapper.unmount()
  })

  it('거래 내역에서 FAILED를 완료 잔액 대신 정산 지연으로 표시한다', async () => {
    tradesApi.getTradeHistory.mockResolvedValue({ data: [trade('FAILED')] })
    userApi.getMe.mockResolvedValue({ data: { balance: 1000 } })
    const wrapper = mount(TradeHistoryView)
    await flushPromises()
    expect(wrapper.get('.lr-settle').text()).toBe('정산 지연 · 확인 필요')
    expect(wrapper.find('.lr-balance').exists()).toBe(false)
    wrapper.unmount()
  })
})
