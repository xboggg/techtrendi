-- ═══════════════════════════════════════════════════════════════
-- Security Hub Features Migration
-- Tables for: Scam Reports, Daily Tips, Threat Level, Quiz Scores
-- ═══════════════════════════════════════════════════════════════

-- 1. Security Daily Tips — rotating micro-tips shown on the security page
CREATE TABLE IF NOT EXISTS security_daily_tips (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tip_text TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  emoji TEXT DEFAULT '🔒',
  source TEXT, -- e.g. "Think Before You Click, Chapter 3"
  is_published BOOLEAN DEFAULT true,
  display_date DATE, -- if set, show only on this date; null = rotation pool
  views INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Security Scam Reports — user-submitted scam reports
CREATE TABLE IF NOT EXISTS security_scam_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_name TEXT,
  reporter_email TEXT,
  scam_type TEXT NOT NULL, -- 'sms', 'whatsapp', 'email', 'phone_call', 'website', 'mobile_money', 'social_media', 'other'
  scam_title TEXT NOT NULL,
  scam_description TEXT NOT NULL,
  scam_source TEXT, -- the phone number, email, or URL of the scam
  screenshot_url TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'verified', 'published', 'rejected'
  is_published BOOLEAN DEFAULT false,
  admin_notes TEXT,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Security Threat Level — site-wide threat indicator
CREATE TABLE IF NOT EXISTS security_threat_level (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  level TEXT NOT NULL DEFAULT 'moderate', -- 'low', 'moderate', 'elevated', 'high', 'critical'
  title TEXT NOT NULL DEFAULT 'Normal Activity',
  description TEXT,
  active_threats TEXT[], -- list of current threat names
  updated_by TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Security Quiz Scores — track daily quiz attempts and streaks
CREATE TABLE IF NOT EXISTS security_quiz_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT, -- for anonymous users
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  percentage NUMERIC(5,2),
  quiz_date DATE DEFAULT CURRENT_DATE,
  time_taken_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Security Scam Alerts — admin-curated verified scam alerts (feed)
CREATE TABLE IF NOT EXISTS security_scam_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  scam_type TEXT NOT NULL, -- 'sms', 'whatsapp', 'email', 'phone_call', 'website', 'mobile_money'
  severity TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  emoji TEXT DEFAULT '⚠️',
  affected_platforms TEXT[], -- e.g. ['MTN MoMo', 'Vodafone Cash']
  what_to_do TEXT, -- advice
  is_active BOOLEAN DEFAULT true,
  is_published BOOLEAN DEFAULT true,
  views INTEGER DEFAULT 0,
  reported_count INTEGER DEFAULT 1,
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════
-- Indexes
-- ═══════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_daily_tips_published ON security_daily_tips(is_published, display_date);
CREATE INDEX IF NOT EXISTS idx_scam_reports_status ON security_scam_reports(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scam_alerts_active ON security_scam_alerts(is_active, is_published, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quiz_scores_user ON security_quiz_scores(user_id, quiz_date DESC);
CREATE INDEX IF NOT EXISTS idx_quiz_scores_date ON security_quiz_scores(quiz_date DESC);
CREATE INDEX IF NOT EXISTS idx_threat_level_active ON security_threat_level(is_active);

-- ═══════════════════════════════════════════════════════════════
-- RLS Policies
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE security_daily_tips ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_scam_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_threat_level ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_quiz_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_scam_alerts ENABLE ROW LEVEL SECURITY;

-- Public read for published content
CREATE POLICY "Anyone can read published tips" ON security_daily_tips FOR SELECT USING (is_published = true);
CREATE POLICY "Anyone can read published alerts" ON security_scam_alerts FOR SELECT USING (is_published = true);
CREATE POLICY "Anyone can read active threat level" ON security_threat_level FOR SELECT USING (is_active = true);
CREATE POLICY "Anyone can read published scam reports" ON security_scam_reports FOR SELECT USING (is_published = true);

-- Anyone can submit a scam report
CREATE POLICY "Anyone can submit scam reports" ON security_scam_reports FOR INSERT WITH CHECK (true);

-- Anyone can submit quiz scores
CREATE POLICY "Anyone can submit quiz scores" ON security_quiz_scores FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can read own quiz scores" ON security_quiz_scores FOR SELECT USING (
  user_id = auth.uid() OR session_id IS NOT NULL
);

-- Admin full access (uses existing is_admin() function)
CREATE POLICY "Admins manage daily tips" ON security_daily_tips FOR ALL USING (is_admin());
CREATE POLICY "Admins manage scam reports" ON security_scam_reports FOR ALL USING (is_admin());
CREATE POLICY "Admins manage threat level" ON security_threat_level FOR ALL USING (is_admin());
CREATE POLICY "Admins manage scam alerts" ON security_scam_alerts FOR ALL USING (is_admin());
CREATE POLICY "Admins manage quiz scores" ON security_quiz_scores FOR ALL USING (is_admin());

-- ═══════════════════════════════════════════════════════════════
-- Seed: Initial threat level
-- ═══════════════════════════════════════════════════════════════
INSERT INTO security_threat_level (level, title, description, active_threats, is_active)
VALUES (
  'moderate',
  'Stay Vigilant',
  'Mobile money scams and phishing messages are at normal levels. Always verify before you click.',
  ARRAY['MoMo PIN phishing', 'Fake job offers on WhatsApp', 'GRA tax refund scams'],
  true
);

-- ═══════════════════════════════════════════════════════════════
-- Seed: Initial daily tips pool
-- ═══════════════════════════════════════════════════════════════
INSERT INTO security_daily_tips (tip_text, category, emoji) VALUES
('Never share your MoMo PIN with anyone — not even someone claiming to be from MTN or Vodafone.', 'mobile_money', '📱'),
('If an email asks you to "verify your account urgently," it is almost certainly a scam. Real companies don''t pressure you like that.', 'phishing', '🎣'),
('Use a different password for your email, social media, and banking apps. If one gets hacked, the others stay safe.', 'passwords', '🔑'),
('Before downloading any app, check the reviews and the developer name. Fake apps steal your data.', 'mobile', '📲'),
('When you get a call from someone claiming to be your bank, hang up and call the bank directly using the number on your card.', 'phone_scam', '📞'),
('Enable two-factor authentication (2FA) on your email first — your email is the master key to all your other accounts.', 'authentication', '🔐'),
('Free Wi-Fi at hotels, airports, and cafes is not safe for banking. Use your mobile data instead.', 'network', '📶'),
('If someone sends you money "by mistake" and asks you to return it, don''t — it''s a common scam. Report it to your provider.', 'mobile_money', '💸'),
('A strong password is at least 12 characters long and mixes letters, numbers, and symbols. "Password123" is not strong.', 'passwords', '💪'),
('If a deal on social media seems too good to be true, it probably is. Scammers use fake shops to steal card details.', 'shopping', '🛒'),
('Never click links in SMS messages from unknown senders. Go directly to the website by typing the address yourself.', 'phishing', '🔗'),
('Update your phone and apps regularly. Updates fix security holes that hackers exploit.', 'mobile', '🔄'),
('Scammers can fake caller ID to look like a real company. Always verify by calling back on an official number.', 'phone_scam', '📱'),
('Back up your important photos and documents to Google Drive or iCloud. If your phone is stolen, you won''t lose everything.', 'backup', '☁️'),
('Check your bank and MoMo statements weekly. Catch unauthorized transactions early before it''s too late.', 'monitoring', '👀'),
('Don''t post your boarding pass, ID card, or work badge on social media. Scammers can use that information against you.', 'privacy', '🆔'),
('If you receive a "you''ve won a lottery" message and you never entered one, it''s a scam. Delete it immediately.', 'phishing', '🎰'),
('Children should know: never share your name, school, age, or location with strangers online.', 'family', '👨‍👩‍👧‍👦'),
('When selling items online, never share your payment details with the buyer. Use the platform''s built-in payment system.', 'shopping', '🏪'),
('Your email password is the most important password you have. Make it unique and enable 2FA.', 'passwords', '✉️'),
('Be suspicious of WhatsApp messages from friends asking for money — their account may have been hacked.', 'social_media', '💬'),
('A padlock icon in your browser address bar means the connection is encrypted, but it does NOT mean the website is trustworthy.', 'browsing', '🔒'),
('Never install software or apps that someone sent you via WhatsApp or Telegram. It could contain malware.', 'malware', '🦠'),
('If you''re not sure whether a message is real, ask someone you trust before responding. There''s no shame in asking.', 'general', '🤝'),
('Log out of your accounts on shared or public computers. Someone else could access your accounts after you leave.', 'browsing', '🚪'),
('Regularly review which apps have access to your phone''s camera, microphone, and location. Remove permissions you don''t need.', 'privacy', '⚙️'),
('If a website asks for your credit card to claim a "free" prize, it''s a scam. Close the tab immediately.', 'phishing', '💳'),
('Teach elderly family members about common scams. They are often targeted because scammers think they''re less tech-savvy.', 'family', '👴'),
('Use your phone''s built-in screen lock (PIN, fingerprint, or face recognition). An unlocked phone is an open invitation.', 'mobile', '🔓'),
('Think before you click. If something feels wrong, trust your instincts. It''s better to be cautious than to be scammed.', 'general', '🧠');

-- ═══════════════════════════════════════════════════════════════
-- Seed: Initial scam alerts
-- ═══════════════════════════════════════════════════════════════
INSERT INTO security_scam_alerts (title, description, scam_type, severity, emoji, affected_platforms, what_to_do) VALUES
(
  'Fake MTN MoMo Cashback Messages',
  'Scammers are sending SMS messages pretending to be MTN, claiming you''ve won a cashback reward. They ask you to dial a USSD code and enter your PIN. MTN has confirmed these are not from them.',
  'sms',
  'high',
  '🚨',
  ARRAY['MTN MoMo'],
  'Do NOT dial any codes or enter your PIN. Delete the message. Report to MTN by calling 100.'
),
(
  'Fake Job Offers on WhatsApp',
  'Groups of scammers are posting fake "work from home" jobs on WhatsApp, promising GHS 500-2000 daily. They ask for a registration fee or personal information upfront. No legitimate employer asks for money.',
  'whatsapp',
  'medium',
  '💼',
  ARRAY['WhatsApp'],
  'Never pay a "registration fee" for a job. Block and report the number. If interested in a job, apply through the company''s official website.'
),
(
  'GRA Tax Refund Phishing Emails',
  'Emails claiming to be from the Ghana Revenue Authority are offering tax refunds. They ask you to click a link and enter your bank details. GRA does not send refund emails with links.',
  'email',
  'high',
  '📧',
  ARRAY['Email'],
  'Do not click any links. Forward the email to GRA''s official email for verification. Check your tax status at gra.gov.gh directly.'
);
