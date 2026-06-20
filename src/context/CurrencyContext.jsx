import { createContext, useContext, useState } from 'react'
import { supabase } from '../lib/supabase'

const Ctx = createContext({ currency: 'AUD', setCurrency: () => {} })

export function CurrencyProvider({ session, children }) {
  const [currency, _set] = useState(() =>
    localStorage.getItem('currency')
    || session?.user?.user_metadata?.currency
    || 'AUD'
  )

  async function setCurrency(c) {
    _set(c)
    localStorage.setItem('currency', c)
    if (session) await supabase.auth.updateUser({ data: { currency: c } })
  }

  return <Ctx.Provider value={{ currency, setCurrency }}>{children}</Ctx.Provider>
}

export const useCurrency = () => useContext(Ctx)
