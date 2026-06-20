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

export function useRevenue(page = 0, pageSize = 20) {
  const [kpis, setKpis] = useState<DashboardKpis | null>(null)
  const [payments, setPayments] = useState<
    (SubscriptionPayment & { profile?: { username: string | null; email: string | null } })[]
  >([])
  const [total, setTotal] = useState(0)
  const [overTime, setOverTime] = useState<TimeSeriesPoint[]>([])
  const [byPlan, setByPlan] = useState<RevenueByPlan[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [kpiData, paymentData, trend, planData, expenseData] = await Promise.all([
        fetchDashboardKpis(),
        fetchPayments(page, pageSize),
        fetchRevenueOverTime(30),
        fetchRevenueByPlan(30),
        fetchExpenses(),
      ])
      setKpis(kpiData)
      setPayments(paymentData.payments)
      setTotal(paymentData.total)
      setOverTime(trend)
      setByPlan(planData)
      setExpenses(expenseData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load revenue data')
    } finally {
      setLoading(false)
    }
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
    error,
    reload: load,
    addExpense,
    removeExpense,
  }
}
