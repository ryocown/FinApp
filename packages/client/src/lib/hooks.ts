import { useState, useEffect } from 'react'
import type { IAccount } from '@finapp/shared/models/account'
import type { ITransaction } from '@finapp/shared/models/transaction'
import type { IBudget } from '@finapp/shared/models/budget'

const API_BASE_URL = 'http://localhost:3001/api' // Server runs on 3001 with /api prefix

export function useAccounts(userId: string) {
  const [accounts, setAccounts] = useState<IAccount[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return

    setLoading(true)
    fetch(`${API_BASE_URL}/accounts/users/${userId}/accounts`)
      .then(res => res.json())
      .then(data => {
        setAccounts(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Error fetching accounts:', err)
        setLoading(false)
      })
  }, [userId])

  return { accounts, loading }
}

export function useTransactions(userId: string, limitCount: number = 50, pageToken: string | null = null, accountId: string | null = null) {
  const [transactions, setTransactions] = useState<ITransaction[]>([])
  const [nextPageToken, setNextPageToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return

    setLoading(true)
    setError(null)
    let url = ''
    if (accountId && accountId !== 'all') {
      url = `${API_BASE_URL}/accounts/users/${userId}/accounts/${accountId}/transactions?limit=${limitCount}`
    } else {
      url = `${API_BASE_URL}/transactions/users/${userId}/transactions?limit=${limitCount}`
    }

    if (pageToken) {
      url += `&pageToken=${pageToken}`
    }

    fetch(url)
      .then(async res => {
        if (!res.ok) {
          const text = await res.text();
          try {
            const json = JSON.parse(text);
            throw new Error(json.error || `Server error: ${res.status}`);
          } catch (e) {
            throw new Error(`Server error: ${res.status} ${res.statusText}`);
          }
        }
        return res.json();
      })
      .then(data => {
        // Data is now { transactions: [], nextPageToken: string | null }
        setTransactions(data.transactions || [])
        setNextPageToken(data.nextPageToken || null)
        setLoading(false)
      })
      .catch(err => {
        console.error('Error fetching transactions:', err)
        setError(err.message)
        setLoading(false)
      })
  }, [userId, limitCount, pageToken, accountId])

  return { transactions, nextPageToken, loading, error }
}

export function useBudget(userId: string) {
  const [budget, setBudget] = useState<IBudget[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return

    setLoading(true)
    fetch(`${API_BASE_URL}/accounts/users/${userId}/budget`)
      .then(res => res.json())
      .then(data => {
        setBudget(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Error fetching budget:', err)
        setLoading(false)
      })
  }, [userId])

  return { budget, loading }
}
