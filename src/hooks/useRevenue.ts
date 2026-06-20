import { useCallback, useEffect, useState } from 'react'
import {
  createExpense,
  deleteExpense,
  fetchExpenses,
  fetchPayments,
  fetchRevenueByPlan,
  fetchRevenueOverTime,
  type CreateExpenseInput,
} from '@/services/revenue'
import { fetchDashboardKpis } from '@/services/users'
import type { DashboardKpis, Expense, RevenueByPlan, SubscriptionPayment, TimeSeriesPoint } from '@/types'
import { EMPTY_DASHBOARD_KPIS, settle } from '@/utils/settle'

export function useRevenue(page = 0, pageSize = 20) {
  const [kpis, setKpis] = useState<DashboardKpis>(EMPTY_DASHBOARD_KPIS)
  const [payments, setPayments] = useState<
    (SubscriptionPayment & { profile?: { username: string | null; email: string | null } })[]
  >([])
  const [total, setTotal] = useState(0)
  const [overTime, setOverTime] = useState<TimeSeriesPoint[]>([])
  const [byPlan, setByPlan] = useState<RevenueByPlan[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const [kpiData, paymentData, trend, planData, expenseData] = await Promise.all([
      settle(fetchDashboardKpis(), EMPTY_DASHBOARD_KPIS, 'Revenue KPIs'),
      settle(fetchPayments(page, pageSize), { payments: [], total: 0 }, 'Payments'),
      settle(fetchRevenueOverTime(30), [], 'Revenue trend'),
      settle(fetchRevenueByPlan(30), [], 'Revenue by plan'),
      settle(fetchExpenses(), [], 'Expenses'),
    ])
    setKpis(kpiData)
    setPayments(paymentData.payments)
    setTotal(paymentData.total)
    setOverTime(trend)
    setByPlan(planData)
    setExpenses(expenseData)
    setLoading(false)
  }, [page, pageSize])

  useEffect(() => {
    void load()
  }, [load])

  const addExpense = async (input: CreateExpenseInput) => {
    await createExpense(input)
    await load()
  }

  const removeExpense = async (id: string) => {
    await deleteExpense(id)
    await load()
  }

  return {
    kpis,
    payments,
    total,
    overTime,
    byPlan,
    expenses,
    loading,
    reload: load,
    addExpense,
    removeExpense,
  }
}
