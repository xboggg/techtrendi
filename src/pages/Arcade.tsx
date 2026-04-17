// ─── Arcade Hub — TechTrendi Gaming Arcade ───────────────────────────────────

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { SEOHead } from '@/components/seo/SEOHead';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Swords, Keyboard, Zap, Brain, Bomb, Shuffle, SquareAsterisk, Grid3X3,
  Trophy, Flame, Gamepad2, ChevronRight, User,
} from 'lucide-react';
import { ARCADE_GAMES } from '@/lib/arcade/constants';
import { usePlayerProfile } from '@/lib/arcade/usePlayerProfile';
import { useLeaderboard } from '@/lib/arcade/useLeaderboard';
import { useDailyChallenge } from '@/lib/arcade/useDailyChallenge';
import { RankBadge } from '@/components/arcade/RankBadge';
import { StreakIndicator } from '@/components/arcade/StreakIndicator';
import { Leaderboard } from '@/components/arcade/Leaderboard';
import { DailyChallengeCard } from '@/components/arcade/DailyChallengeCard';
import type { GameSlug } from '@/lib/arcade/types';

// Map icon names to actual components
const iconMap: Record<string, typeof Swords> = {
  Swords,
  Keyboard,
  SquareAsterisk,
  Zap,
  Brain,
  Bomb,
  Shuffle,
  Grid3X3,
};

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function Arcade() {
  const navigate = useNavigate();
  const { player } = usePlayerProfile();
  const {
    entries: leaderboardEntries,
    loading: lbLoading,
    timeRange,
    setTimeRange,
  } = useLeaderboard({ limit: 10 });
  const {
    timeUntilNext,
    alreadyPlayed,
    myScore,
    loading: dailyLoading,
    challenge,
  } = useDailyChallenge({});

  return (
    <Layout>
      <SEOHead
        title="Gaming Arcade"
        description="Play multiplayer games online or locally. Math battles, typing races, word chains, reflex duels, and trivia challenges. Compete, earn ranks, and climb the leaderboard."
        canonical="https://techtrendi.com/arcade"
        keywords={['arcade', 'online games', 'multiplayer', 'typing race', 'trivia', 'math game']}
      />

      {/* ─── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 dark:from-violet-900 dark:via-purple-900 dark:to-indigo-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(99,102,241,0.3),transparent_60%)]" />

        {/* Floating decorative elements */}
        <div className="absolute top-10 left-[10%] w-20 h-20 rounded-full bg-white/5 animate-bounce" style={{ animationDuration: '4s' }} />
        <div className="absolute top-24 right-[15%] w-12 h-12 rounded-full bg-white/5 animate-bounce" style={{ animationDuration: '3s', animationDelay: '1s' }} />
        <div className="absolute bottom-10 left-[30%] w-16 h-16 rounded-full bg-white/5 animate-bounce" style={{ animationDuration: '5s', animationDelay: '0.5s' }} />

        <div className="relative container py-16 sm:py-24 text-center text-white">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-sm font-medium mb-6">
              <Gamepad2 className="w-4 h-4" />
              <span>5 Games Available</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight mb-4">
              TechTrendi{' '}
              <span className="bg-gradient-to-r from-yellow-300 via-orange-300 to-red-300 bg-clip-text text-transparent">
                Arcade
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-white/80 max-w-2xl mx-auto mb-8">
              Compete online, challenge friends, or test yourself against AI.
              Earn ranks, build streaks, and climb the leaderboard.
            </p>

            {/* Quick stats */}
            {player && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="inline-flex items-center gap-4 px-5 py-3 rounded-2xl bg-white/10 backdrop-blur-sm"
              >
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-white/60" />
                  <span className="font-semibold text-sm">{player.displayName}</span>
                </div>
                <div className="w-px h-5 bg-white/20" />
                <RankBadge tier={player.rankTier} rating={player.eloRating} size="sm" showRating />
                {player.currentStreak > 0 && (
                  <>
                    <div className="w-px h-5 bg-white/20" />
                    <StreakIndicator streak={player.currentStreak} />
                  </>
                )}
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>

      {/* ─── Main Content ──────────────────────────────────────────────── */}
      <section className="container py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Games + Daily Challenge */}
          <div className="lg:col-span-2 space-y-8">
            {/* Games Grid */}
            <div>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Gamepad2 className="w-6 h-6 text-primary" />
                Choose Your Game
              </h2>

              <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 sm:grid-cols-2 gap-4"
              >
                {ARCADE_GAMES.map((game) => {
                  const Icon = iconMap[game.icon] || Gamepad2;
                  return (
                    <motion.div key={game.slug} variants={item}>
                      <Link
                        to={game.path}
                        className="group block"
                      >
                        <div
                          className={cn(
                            'relative overflow-hidden rounded-2xl p-6',
                            'bg-gradient-to-br', game.gradient,
                            'text-white shadow-lg',
                            'transition-all duration-300 ease-out',
                            'hover:scale-[1.02] hover:shadow-xl',
                            'active:scale-[0.98]',
                            'min-h-[160px] flex flex-col justify-between'
                          )}
                        >
                          {/* Decorative */}
                          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full -translate-y-8 translate-x-8 transition-transform duration-300 group-hover:scale-110" />
                          <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-tr-full translate-y-4 -translate-x-4" />

                          <div className="relative">
                            <Icon className="w-10 h-10 mb-3 drop-shadow-md" />
                            <h3 className="text-xl font-bold mb-1">{game.name}</h3>
                            <p className="text-sm text-white/80">{game.description}</p>
                          </div>

                          <div className="relative flex items-center gap-1 mt-4 text-sm font-semibold text-white/90 group-hover:text-white transition-colors">
                            Play Now
                            <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </motion.div>
            </div>

            {/* Daily Challenge */}
            <div>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Flame className="w-6 h-6 text-orange-500" />
                Daily Challenge
              </h2>
              <DailyChallengeCard
                gameSlug={challenge?.gameSlug}
                timeUntilNext={timeUntilNext}
                alreadyPlayed={alreadyPlayed}
                myScore={myScore}
                loading={dailyLoading}
                onPlay={() => {
                  if (challenge) {
                    const game = ARCADE_GAMES.find((g) => g.slug === challenge.gameSlug);
                    if (game) navigate(game.path + '?daily=true');
                  }
                }}
              />
            </div>

            {/* Your Stats (mobile - shown below fold on mobile, hidden on desktop) */}
            {player && (
              <div className="lg:hidden">
                <PlayerStatsCard player={player} />
              </div>
            )}
          </div>

          {/* Right Sidebar: Leaderboard + Stats */}
          <div className="space-y-6">
            {/* Your Stats (desktop) */}
            {player && (
              <div className="hidden lg:block">
                <PlayerStatsCard player={player} />
              </div>
            )}

            {/* Global Leaderboard */}
            <Leaderboard
              entries={leaderboardEntries}
              loading={lbLoading}
              timeRange={timeRange}
              onTimeRangeChange={setTimeRange}
              title="Global Leaderboard"
              compact
            />
          </div>
        </div>
      </section>
    </Layout>
  );
}

// ─── Player Stats Card ───────────────────────────────────────────────────────

function PlayerStatsCard({
  player,
}: {
  player: NonNullable<ReturnType<typeof usePlayerProfile>['player']>;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
        <User className="w-5 h-5 text-primary" />
        Your Stats
      </h3>

      <div className="space-y-4">
        {/* Name + Rank */}
        <div className="flex items-center justify-between">
          <span className="font-semibold">{player.displayName}</span>
          <RankBadge tier={player.rankTier} rating={player.eloRating} showRating />
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="rounded-xl bg-muted/50 p-3">
            <div className="text-2xl font-black tabular-nums">{player.totalGames}</div>
            <div className="text-xs text-muted-foreground">Games</div>
          </div>
          <div className="rounded-xl bg-green-500/10 dark:bg-green-500/5 p-3">
            <div className="text-2xl font-black tabular-nums text-green-600 dark:text-green-400">
              {player.totalWins}
            </div>
            <div className="text-xs text-muted-foreground">Wins</div>
          </div>
          <div className="rounded-xl bg-red-500/10 dark:bg-red-500/5 p-3">
            <div className="text-2xl font-black tabular-nums text-red-600 dark:text-red-400">
              {player.totalLosses}
            </div>
            <div className="text-xs text-muted-foreground">Losses</div>
          </div>
        </div>

        {/* Win rate */}
        {player.totalGames > 0 && (
          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-muted-foreground">Win Rate</span>
              <span className="font-bold">
                {Math.round((player.totalWins / player.totalGames) * 100)}%
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.round(
                    (player.totalWins / player.totalGames) * 100
                  )}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Streak */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Current Streak</span>
          {player.currentStreak > 0 ? (
            <StreakIndicator streak={player.currentStreak} />
          ) : (
            <span className="text-sm text-muted-foreground">--</span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Best Streak</span>
          <span className="font-bold tabular-nums">
            {player.bestStreak > 0 ? `${player.bestStreak} 🔥` : '--'}
          </span>
        </div>
      </div>
    </div>
  );
}
