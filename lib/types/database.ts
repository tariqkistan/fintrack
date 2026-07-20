export type AccountType = "checking" | "savings" | "credit_card" | "cash";
export type CategoryType = "income" | "expense";
export type TransactionType = "income" | "expense";
export type DebitFrequency = "weekly" | "monthly" | "custom";
export type GoalType = "general" | "date_night";
export type IdeaStatus = "idea" | "planned" | "done";

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      accounts: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          type: AccountType;
          balance: number;
          currency: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          type?: AccountType;
          balance?: number;
          currency?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          type?: AccountType;
          balance?: number;
          currency?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          type: CategoryType;
          color: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          type: CategoryType;
          color?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          type?: CategoryType;
          color?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          account_id: string;
          category_id: string | null;
          amount: number;
          type: TransactionType;
          note: string | null;
          occurred_at: string;
          debit_order_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          account_id: string;
          category_id?: string | null;
          amount: number;
          type: TransactionType;
          note?: string | null;
          occurred_at?: string;
          debit_order_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          account_id?: string;
          category_id?: string | null;
          amount?: number;
          type?: TransactionType;
          note?: string | null;
          occurred_at?: string;
          debit_order_id?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      debit_orders: {
        Row: {
          id: string;
          user_id: string;
          account_id: string;
          category_id: string | null;
          name: string;
          amount: number;
          frequency: DebitFrequency;
          custom_interval_days: number | null;
          next_due_date: string;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          account_id: string;
          category_id?: string | null;
          name: string;
          amount: number;
          frequency?: DebitFrequency;
          custom_interval_days?: number | null;
          next_due_date: string;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          account_id?: string;
          category_id?: string | null;
          name?: string;
          amount?: number;
          frequency?: DebitFrequency;
          custom_interval_days?: number | null;
          next_due_date?: string;
          active?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      savings_goals: {
        Row: {
          id: string;
          user_id: string;
          account_id: string | null;
          name: string;
          goal_type: GoalType;
          target_amount: number;
          current_amount: number;
          target_date: string | null;
          monthly_budget_cap: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          account_id?: string | null;
          name: string;
          goal_type?: GoalType;
          target_amount: number;
          current_amount?: number;
          target_date?: string | null;
          monthly_budget_cap?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          account_id?: string | null;
          name?: string;
          goal_type?: GoalType;
          target_amount?: number;
          current_amount?: number;
          target_date?: string | null;
          monthly_budget_cap?: number | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      goal_contributions: {
        Row: {
          id: string;
          goal_id: string;
          user_id: string;
          amount: number;
          contributed_at: string;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          goal_id: string;
          user_id: string;
          amount: number;
          contributed_at?: string;
          note?: string | null;
          created_at?: string;
        };
        Update: {
          amount?: number;
          contributed_at?: string;
          note?: string | null;
        };
        Relationships: [];
      };
      date_night_ideas: {
        Row: {
          id: string;
          user_id: string;
          goal_id: string;
          title: string;
          estimated_cost: number;
          status: IdeaStatus;
          planned_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          goal_id: string;
          title: string;
          estimated_cost?: number;
          status?: IdeaStatus;
          planned_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          estimated_cost?: number;
          status?: IdeaStatus;
          planned_date?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      account_type: AccountType;
      category_type: CategoryType;
      transaction_type: TransactionType;
      debit_frequency: DebitFrequency;
      goal_type: GoalType;
      idea_status: IdeaStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}

export type Account = Database["public"]["Tables"]["accounts"]["Row"];
export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type Transaction = Database["public"]["Tables"]["transactions"]["Row"] & {
  account?: Account;
  category?: Category | null;
};
export type DebitOrder = Database["public"]["Tables"]["debit_orders"]["Row"] & {
  account?: Account;
  category?: Category | null;
};
export type SavingsGoal = Database["public"]["Tables"]["savings_goals"]["Row"] & {
  account?: Account | null;
};
export type GoalContribution = Database["public"]["Tables"]["goal_contributions"]["Row"];
export type DateNightIdea = Database["public"]["Tables"]["date_night_ideas"]["Row"];
