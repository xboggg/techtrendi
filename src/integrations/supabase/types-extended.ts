// Extended database types for new tables
// These extend the auto-generated types from Supabase

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// ============================================
// BOOKMARKS
// ============================================
export interface BookmarkRow {
  id: string
  user_id: string
  content_type: 'review' | 'article' | 'tool' | 'guide'
  content_id: string
  created_at: string
}

export interface BookmarkInsert {
  id?: string
  user_id: string
  content_type: 'review' | 'article' | 'tool' | 'guide'
  content_id: string
  created_at?: string
}

// ============================================
// COLLECTIONS
// ============================================
export interface CollectionRow {
  id: string
  user_id: string
  name: string
  description: string | null
  is_public: boolean
  cover_image: string | null
  created_at: string
  updated_at: string
}

export interface CollectionInsert {
  id?: string
  user_id: string
  name: string
  description?: string | null
  is_public?: boolean
  cover_image?: string | null
  created_at?: string
  updated_at?: string
}

export interface CollectionItemRow {
  id: string
  collection_id: string
  content_type: 'review' | 'article' | 'tool' | 'guide'
  content_id: string
  added_at: string
  notes: string | null
}

// ============================================
// READING HISTORY
// ============================================
export interface ReadingHistoryRow {
  id: string
  user_id: string
  content_type: 'review' | 'article' | 'tool' | 'guide'
  content_id: string
  read_at: string
  read_percentage: number
  time_spent_seconds: number
}

// ============================================
// SAVED SEARCHES
// ============================================
export interface SavedSearchRow {
  id: string
  user_id: string
  query: string
  filters: Json
  name: string | null
  notify_new_results: boolean
  last_checked_at: string | null
  created_at: string
}

// ============================================
// NOTIFICATIONS
// ============================================
export type NotificationType = 'comment_reply' | 'new_review' | 'price_alert' | 'mention' | 'system' | 'subscription'

export interface NotificationRow {
  id: string
  user_id: string
  type: NotificationType
  title: string
  message: string
  link: string | null
  is_read: boolean
  metadata: Json
  created_at: string
}

export interface NotificationInsert {
  id?: string
  user_id: string
  type: NotificationType
  title: string
  message: string
  link?: string | null
  is_read?: boolean
  metadata?: Json
  created_at?: string
}

// ============================================
// FORUM
// ============================================
export interface ForumCategoryRow {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
  color: string | null
  sort_order: number
  is_active: boolean
  created_at: string
}

export interface ForumThreadRow {
  id: string
  category_id: string
  user_id: string
  title: string
  slug: string
  content: string
  is_pinned: boolean
  is_locked: boolean
  is_solved: boolean
  views: number
  reply_count: number
  last_reply_at: string | null
  last_reply_user_id: string | null
  created_at: string
  updated_at: string
}

export interface ForumThreadInsert {
  id?: string
  category_id: string
  user_id: string
  title: string
  slug: string
  content: string
  is_pinned?: boolean
  is_locked?: boolean
  is_solved?: boolean
  views?: number
  reply_count?: number
  last_reply_at?: string | null
  last_reply_user_id?: string | null
  created_at?: string
  updated_at?: string
}

export interface ForumReplyRow {
  id: string
  thread_id: string
  user_id: string
  parent_reply_id: string | null
  content: string
  is_solution: boolean
  upvotes: number
  downvotes: number
  created_at: string
  updated_at: string
}

export interface ForumReplyInsert {
  id?: string
  thread_id: string
  user_id: string
  parent_reply_id?: string | null
  content: string
  is_solution?: boolean
  upvotes?: number
  downvotes?: number
  created_at?: string
  updated_at?: string
}

export interface ForumVoteRow {
  id: string
  user_id: string
  reply_id: string
  vote_type: 'up' | 'down'
  created_at: string
}

// ============================================
// PRICE TRACKING
// ============================================
export interface PriceHistoryRow {
  id: string
  review_id: string
  retailer: string
  price: number
  currency: string
  url: string | null
  in_stock: boolean
  recorded_at: string
}

export interface PriceAlertRow {
  id: string
  user_id: string
  review_id: string
  target_price: number
  is_active: boolean
  triggered_at: string | null
  created_at: string
}

export interface PriceAlertInsert {
  id?: string
  user_id: string
  review_id: string
  target_price: number
  is_active?: boolean
  triggered_at?: string | null
  created_at?: string
}

// ============================================
// USER PREFERENCES
// ============================================
export type ThemeType = 'light' | 'dark' | 'system'
export type FrequencyType = 'daily' | 'weekly' | 'monthly'

export interface AccessibilitySettings {
  reducedMotion?: boolean
  highContrast?: boolean
  largeText?: boolean
  screenReader?: boolean
  dyslexiaFont?: boolean
  [key: string]: boolean | undefined
}

export interface ContentPreferences {
  categories?: string[]
  hideAds?: boolean
  autoplayVideos?: boolean
  showPrices?: boolean
  currency?: string
  [key: string]: string | string[] | boolean | undefined
}

export interface UserPreferencesRow {
  id: string
  user_id: string
  theme: ThemeType
  language: string
  notifications_email: boolean
  notifications_push: boolean
  notifications_marketing: boolean
  font_size: number
  accessibility_settings: AccessibilitySettings
  content_preferences: ContentPreferences
  created_at: string
  updated_at: string
}

export interface UserPreferencesInsert {
  id?: string
  user_id: string
  theme?: ThemeType
  language?: string
  notifications_email?: boolean
  notifications_push?: boolean
  notifications_marketing?: boolean
  font_size?: number
  accessibility_settings?: AccessibilitySettings
  content_preferences?: ContentPreferences
  created_at?: string
  updated_at?: string
}

// ============================================
// ARTICLE REACTIONS
// ============================================
export type ReactionType = 'like' | 'love' | 'insightful' | 'funny' | 'fire'

export interface ArticleReactionRow {
  id: string
  user_id: string
  article_id: string
  reaction_type: ReactionType
  created_at: string
}

// ============================================
// NEWSLETTER
// ============================================
export interface NewsletterSubscriptionRow {
  id: string
  email: string
  user_id: string | null
  topics: string[]
  frequency: FrequencyType
  is_verified: boolean
  verification_token: string | null
  is_active: boolean
  created_at: string
  unsubscribed_at: string | null
}

export interface NewsletterSubscriptionInsert {
  id?: string
  email: string
  user_id?: string | null
  topics?: string[]
  frequency?: FrequencyType
  is_verified?: boolean
  verification_token?: string | null
  is_active?: boolean
  created_at?: string
  unsubscribed_at?: string | null
}

// ============================================
// EXTENDED DATABASE TYPE
// ============================================
export interface ExtendedTables {
  bookmarks: {
    Row: BookmarkRow
    Insert: BookmarkInsert
    Update: Partial<BookmarkInsert>
  }
  collections: {
    Row: CollectionRow
    Insert: CollectionInsert
    Update: Partial<CollectionInsert>
  }
  collection_items: {
    Row: CollectionItemRow
    Insert: Omit<CollectionItemRow, 'id' | 'added_at'>
    Update: Partial<CollectionItemRow>
  }
  reading_history: {
    Row: ReadingHistoryRow
    Insert: Omit<ReadingHistoryRow, 'id' | 'read_at'>
    Update: Partial<ReadingHistoryRow>
  }
  saved_searches: {
    Row: SavedSearchRow
    Insert: Omit<SavedSearchRow, 'id' | 'created_at'>
    Update: Partial<SavedSearchRow>
  }
  notifications: {
    Row: NotificationRow
    Insert: NotificationInsert
    Update: Partial<NotificationInsert>
  }
  forum_categories: {
    Row: ForumCategoryRow
    Insert: Omit<ForumCategoryRow, 'id' | 'created_at'>
    Update: Partial<ForumCategoryRow>
  }
  forum_threads: {
    Row: ForumThreadRow
    Insert: ForumThreadInsert
    Update: Partial<ForumThreadInsert>
  }
  forum_replies: {
    Row: ForumReplyRow
    Insert: ForumReplyInsert
    Update: Partial<ForumReplyInsert>
  }
  forum_votes: {
    Row: ForumVoteRow
    Insert: Omit<ForumVoteRow, 'id' | 'created_at'>
    Update: Partial<ForumVoteRow>
  }
  price_history: {
    Row: PriceHistoryRow
    Insert: Omit<PriceHistoryRow, 'id' | 'recorded_at'>
    Update: Partial<PriceHistoryRow>
  }
  price_alerts: {
    Row: PriceAlertRow
    Insert: PriceAlertInsert
    Update: Partial<PriceAlertInsert>
  }
  user_preferences: {
    Row: UserPreferencesRow
    Insert: UserPreferencesInsert
    Update: Partial<UserPreferencesInsert>
  }
  article_reactions: {
    Row: ArticleReactionRow
    Insert: Omit<ArticleReactionRow, 'id' | 'created_at'>
    Update: Partial<ArticleReactionRow>
  }
  newsletter_subscriptions: {
    Row: NewsletterSubscriptionRow
    Insert: NewsletterSubscriptionInsert
    Update: Partial<NewsletterSubscriptionInsert>
  }
}
