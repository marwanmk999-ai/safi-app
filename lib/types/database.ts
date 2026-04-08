export interface Profile {
  id: string
  email: string | null
  full_name: string | null
  avatar_url: string | null
  specialty: string | null
  currency: string
  business_name: string | null
  business_logo: string | null
  onboarding_completed: boolean
  monthly_salary: number | null
  salary_currency: string | null
  created_at: string
  updated_at: string
}

export interface Income {
  id: string
  user_id: string
  amount: number
  currency: string
  description: string | null
  client_name: string | null
  client_id: string | null
  project_name: string | null
  date: string
  created_at: string
}

export interface Expense {
  id: string
  user_id: string
  amount: number
  currency: string
  description: string | null
  category: string | null
  merchant: string | null
  source: string
  raw_sms: string | null
  date: string
  created_at: string
}

export interface Client {
  id: string
  user_id: string
  name: string
  email: string | null
  phone: string | null
  company: string | null
  notes: string | null
  created_at: string
}

export interface Invoice {
  id: string
  user_id: string
  client_id: string | null
  invoice_number: string
  description: string | null
  amount: number
  currency: string
  status: "draft" | "pending" | "paid" | "overdue" | "cancelled"
  issue_date: string
  due_date: string | null
  paid_date: string | null
  notes: string | null
  items: unknown[] | null
  tax_rate: number | null
  discount: number | null
  created_at: string
  // joined
  client?: Client
}

export interface Goal {
  id: string
  user_id: string
  title: string
  target_amount: number
  current_amount: number
  currency: string
  target_date: string | null
  status: string
  monthly_percentage: number
  distribution_method: "percentage" | "fixed" | "priority"
  fixed_amount: number
  priority_order: number
  created_at: string
}

export interface BudgetLimit {
  id: string
  user_id: string
  period: "daily" | "monthly"
  amount: number
  currency: string
  category: string | null
  created_at: string
  updated_at: string
}

export interface Subscription {
  id: string
  user_id: string
  name: string
  amount: number
  currency: string
  billing_cycle: "weekly" | "monthly" | "yearly"
  next_renewal_date: string
  category: string | null
  is_active: boolean
  reminder_days_before: number
  created_at: string
}

export interface GoalAllocation {
  id: string
  user_id: string
  goal_id: string
  income_id: string | null
  amount: number
  currency: string
  method: string
  note: string | null
  created_at: string
}

export type Transaction =
  | (Income & { type: "income" })
  | (Expense & { type: "expense" })
