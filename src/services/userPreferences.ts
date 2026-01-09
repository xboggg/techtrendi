import { supabase } from '@/integrations/supabase/client';

export interface UserPreferences {
  id: string;
  user_id: string;
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications_email: boolean;
  notifications_push: boolean;
  notifications_marketing: boolean;
  font_size: number;
  accessibility_settings: AccessibilitySettings;
  content_preferences: ContentPreferences;
  created_at: string;
  updated_at: string;
}

export interface AccessibilitySettings {
  reducedMotion?: boolean;
  highContrast?: boolean;
  largeText?: boolean;
  screenReader?: boolean;
  dyslexiaFont?: boolean;
}

export interface ContentPreferences {
  categories?: string[];
  hideAds?: boolean;
  autoplayVideos?: boolean;
  showPrices?: boolean;
  currency?: string;
}

const defaultPreferences: Omit<UserPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
  theme: 'system',
  language: 'en',
  notifications_email: true,
  notifications_push: true,
  notifications_marketing: false,
  font_size: 16,
  accessibility_settings: {},
  content_preferences: {},
};

export const userPreferencesService = {
  // Get user preferences
  async get(): Promise<UserPreferences | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    // Return defaults if no preferences exist
    if (!data) {
      return {
        ...defaultPreferences,
        id: '',
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as UserPreferences;
    }

    return data;
  },

  // Create or update preferences
  async save(preferences: Partial<UserPreferences>): Promise<UserPreferences> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Check if preferences exist
    const { data: existing } = await supabase
      .from('user_preferences')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (existing) {
      // Update
      const { data, error } = await supabase
        .from('user_preferences')
        .update({
          ...preferences,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      // Insert
      const { data, error } = await supabase
        .from('user_preferences')
        .insert({
          user_id: user.id,
          ...defaultPreferences,
          ...preferences,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  },

  // Update specific settings
  async updateTheme(theme: 'light' | 'dark' | 'system'): Promise<void> {
    await this.save({ theme });
  },

  async updateLanguage(language: string): Promise<void> {
    await this.save({ language });
  },

  async updateNotifications(settings: {
    email?: boolean;
    push?: boolean;
    marketing?: boolean;
  }): Promise<void> {
    await this.save({
      notifications_email: settings.email,
      notifications_push: settings.push,
      notifications_marketing: settings.marketing,
    });
  },

  async updateAccessibility(settings: Partial<AccessibilitySettings>): Promise<void> {
    const current = await this.get();
    await this.save({
      accessibility_settings: {
        ...(current?.accessibility_settings || {}),
        ...settings,
      },
    });
  },

  async updateContentPreferences(settings: Partial<ContentPreferences>): Promise<void> {
    const current = await this.get();
    await this.save({
      content_preferences: {
        ...(current?.content_preferences || {}),
        ...settings,
      },
    });
  },

  // Reset to defaults
  async reset(): Promise<UserPreferences> {
    return this.save(defaultPreferences);
  },

  // Apply theme to document
  applyTheme(theme: 'light' | 'dark' | 'system'): void {
    const root = document.documentElement;

    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', prefersDark);
    } else {
      root.classList.toggle('dark', theme === 'dark');
    }

    localStorage.setItem('theme', theme);
  },

  // Apply font size
  applyFontSize(size: number): void {
    document.documentElement.style.fontSize = `${size}px`;
    localStorage.setItem('fontSize', size.toString());
  },

  // Apply accessibility settings
  applyAccessibility(settings: AccessibilitySettings): void {
    const root = document.documentElement;

    root.classList.toggle('reduce-motion', settings.reducedMotion || false);
    root.classList.toggle('high-contrast', settings.highContrast || false);
    root.classList.toggle('large-text', settings.largeText || false);
    root.classList.toggle('dyslexia-font', settings.dyslexiaFont || false);
  },
};
