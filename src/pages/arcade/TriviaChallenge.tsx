// ─── Trivia Challenge — Full Game ─────────────────────────────────────────────

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { SEOHead } from '@/components/seo/SEOHead';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  ArrowLeft, Brain, Cpu, Globe2, Landmark, MapPin, Popcorn, Trophy,
  Timer, Zap, CheckCircle2, XCircle, Shuffle, Star, Flame,
  ChevronDown, ChevronUp, Target, Clock, Award, AlertTriangle, Users,
  Dumbbell,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { GameModeSelector } from '@/components/arcade/GameModeSelector';
import { CountdownOverlay } from '@/components/arcade/CountdownOverlay';
import { GameOverScreen } from '@/components/arcade/GameOverScreen';
import { RoomLobby } from '@/components/arcade/RoomLobby';
import { useGameRoom } from '@/lib/arcade/useGameRoom';
import { usePlayerProfile } from '@/lib/arcade/usePlayerProfile';
import { useLeaderboard } from '@/lib/arcade/useLeaderboard';
import type { GameMode } from '@/lib/arcade/types';

// ─── Types ───────────────────────────────────────────────────────────────────

type Difficulty = 'easy' | 'medium' | 'hard';

type TriviaCategory =
  | 'tech-science'
  | 'general-knowledge'
  | 'history'
  | 'geography'
  | 'pop-culture'
  | 'sports';

interface TriviaQuestion {
  text: string;
  options: [string, string, string, string];
  correctIndex: number;
  difficulty: Difficulty;
  category: TriviaCategory;
  explanation?: string;
}

interface AnswerResult {
  questionIndex: number;
  selectedIndex: number | null; // null = timeout
  correct: boolean;
  timeMs: number;
  points: number;
}

type GamePhase =
  | 'mode-select'
  | 'category-select'
  | 'countdown'
  | 'playing'
  | 'answer-reveal'
  | 'local-switch'
  | 'game-over'
  | 'online-lobby';

// ─── Category Config ─────────────────────────────────────────────────────────

const CATEGORIES: {
  id: TriviaCategory | 'random';
  label: string;
  icon: typeof Brain;
  gradient: string;
  description: string;
}[] = [
  { id: 'tech-science', label: 'Tech & Science', icon: Cpu, gradient: 'from-blue-500 to-cyan-500', description: 'Computers, space, inventions' },
  { id: 'general-knowledge', label: 'General Knowledge', icon: Brain, gradient: 'from-purple-500 to-violet-500', description: 'A bit of everything' },
  { id: 'history', label: 'History', icon: Landmark, gradient: 'from-amber-500 to-orange-500', description: 'Events that shaped the world' },
  { id: 'geography', label: 'Geography', icon: MapPin, gradient: 'from-emerald-500 to-green-500', description: 'Countries, capitals, rivers' },
  { id: 'pop-culture', label: 'Pop Culture', icon: Popcorn, gradient: 'from-pink-500 to-rose-500', description: 'Movies, music, trends' },
  { id: 'sports', label: 'Sports', icon: Trophy, gradient: 'from-red-500 to-orange-500', description: 'Athletes, records, games' },
  { id: 'random', label: 'Random Mix', icon: Shuffle, gradient: 'from-indigo-500 via-purple-500 to-pink-500', description: 'Surprise me!' },
];

// ─── Scoring Constants ───────────────────────────────────────────────────────

const DIFFICULTY_POINTS: Record<Difficulty, number> = { easy: 100, medium: 200, hard: 300 };
const TIME_PER_QUESTION = 15;
const QUESTIONS_PER_GAME = 10;

function getSpeedMultiplier(timeMs: number): number {
  const seconds = timeMs / 1000;
  if (seconds < 3) return 2.0;
  if (seconds < 5) return 1.5;
  if (seconds < 8) return 1.2;
  return 1.0;
}

function getStreakMultiplier(streak: number): number {
  if (streak >= 5) return 1.5;
  if (streak >= 3) return 1.2;
  return 1.0;
}

function calculatePoints(q: TriviaQuestion, timeMs: number, streak: number): number {
  const base = DIFFICULTY_POINTS[q.difficulty];
  const speed = getSpeedMultiplier(timeMs);
  const streakBonus = getStreakMultiplier(streak);
  return Math.round(base * speed * streakBonus);
}

// ─── Question Bank (210 questions) ──────────────────────────────────────────

const QUESTION_BANK: TriviaQuestion[] = [
  // ── Tech & Science (35) ──────────────────────────────────────────────────
  { text: 'What does CPU stand for?', options: ['Central Processing Unit', 'Computer Personal Unit', 'Central Program Utility', 'Core Processing Unit'], correctIndex: 0, difficulty: 'easy', category: 'tech-science', explanation: 'CPU stands for Central Processing Unit, the primary component that executes instructions.' },
  { text: 'Who founded SpaceX?', options: ['Jeff Bezos', 'Elon Musk', 'Richard Branson', 'Bill Gates'], correctIndex: 1, difficulty: 'easy', category: 'tech-science', explanation: 'Elon Musk founded SpaceX in 2002.' },
  { text: 'What programming language was created by Brendan Eich in 10 days?', options: ['Python', 'Java', 'JavaScript', 'Ruby'], correctIndex: 2, difficulty: 'medium', category: 'tech-science', explanation: 'Brendan Eich created JavaScript in 10 days in 1995 while at Netscape.' },
  { text: 'What does HTML stand for?', options: ['HyperText Markup Language', 'High Tech Modern Language', 'Hyper Transfer Markup Logic', 'Home Tool Markup Language'], correctIndex: 0, difficulty: 'easy', category: 'tech-science', explanation: 'HTML stands for HyperText Markup Language.' },
  { text: 'What is the smallest unit of data in a computer?', options: ['Byte', 'Bit', 'Kilobyte', 'Nibble'], correctIndex: 1, difficulty: 'easy', category: 'tech-science', explanation: 'A bit (binary digit) is the smallest unit of data, representing 0 or 1.' },
  { text: 'Who is known as the father of the World Wide Web?', options: ['Vint Cerf', 'Tim Berners-Lee', 'Steve Jobs', 'Alan Turing'], correctIndex: 1, difficulty: 'medium', category: 'tech-science', explanation: 'Tim Berners-Lee invented the World Wide Web in 1989.' },
  { text: 'What does GPU stand for?', options: ['General Purpose Unit', 'Graphics Processing Unit', 'Global Processing Utility', 'Graphical Power Unit'], correctIndex: 1, difficulty: 'easy', category: 'tech-science', explanation: 'GPU stands for Graphics Processing Unit.' },
  { text: 'Which company developed the Android operating system?', options: ['Apple', 'Microsoft', 'Google', 'Samsung'], correctIndex: 2, difficulty: 'easy', category: 'tech-science', explanation: 'Android was developed by Android Inc., later acquired by Google.' },
  { text: 'What is the speed of light approximately?', options: ['300,000 km/s', '150,000 km/s', '500,000 km/s', '1,000,000 km/s'], correctIndex: 0, difficulty: 'medium', category: 'tech-science', explanation: 'The speed of light is approximately 300,000 km/s (299,792 km/s).' },
  { text: 'What gas do plants absorb from the atmosphere?', options: ['Oxygen', 'Nitrogen', 'Carbon Dioxide', 'Hydrogen'], correctIndex: 2, difficulty: 'easy', category: 'tech-science', explanation: 'Plants absorb carbon dioxide (CO2) for photosynthesis.' },
  { text: 'What planet is known as the Red Planet?', options: ['Venus', 'Mars', 'Jupiter', 'Saturn'], correctIndex: 1, difficulty: 'easy', category: 'tech-science', explanation: 'Mars is called the Red Planet due to its reddish appearance from iron oxide.' },
  { text: 'What does RAM stand for?', options: ['Random Access Memory', 'Read Access Module', 'Rapid Application Memory', 'Run Access Memory'], correctIndex: 0, difficulty: 'easy', category: 'tech-science', explanation: 'RAM stands for Random Access Memory.' },
  { text: 'Which element has the chemical symbol "Fe"?', options: ['Fluorine', 'Iron', 'Francium', 'Fermium'], correctIndex: 1, difficulty: 'medium', category: 'tech-science', explanation: 'Fe is the chemical symbol for Iron, from the Latin "ferrum".' },
  { text: 'What programming language is often used for AI and machine learning?', options: ['C++', 'Java', 'Python', 'PHP'], correctIndex: 2, difficulty: 'easy', category: 'tech-science', explanation: 'Python is the most popular language for AI and machine learning.' },
  { text: 'Who co-founded Apple with Steve Jobs?', options: ['Bill Gates', 'Steve Wozniak', 'Paul Allen', 'Mark Zuckerberg'], correctIndex: 1, difficulty: 'medium', category: 'tech-science', explanation: 'Steve Wozniak co-founded Apple Computer with Steve Jobs in 1976.' },
  { text: 'What is the hardest natural substance on Earth?', options: ['Gold', 'Iron', 'Diamond', 'Platinum'], correctIndex: 2, difficulty: 'easy', category: 'tech-science', explanation: 'Diamond is the hardest known natural material.' },
  { text: 'What does "HTTP" stand for?', options: ['HyperText Transfer Protocol', 'High Tech Transfer Program', 'Hyper Transfer Text Protocol', 'Home Text Transfer Protocol'], correctIndex: 0, difficulty: 'medium', category: 'tech-science', explanation: 'HTTP stands for HyperText Transfer Protocol.' },
  { text: 'How many bones are in the adult human body?', options: ['186', '206', '256', '306'], correctIndex: 1, difficulty: 'medium', category: 'tech-science', explanation: 'The adult human body has 206 bones.' },
  { text: 'What is the chemical formula for water?', options: ['CO2', 'H2O', 'NaCl', 'O2'], correctIndex: 1, difficulty: 'easy', category: 'tech-science', explanation: 'Water is H2O — two hydrogen atoms and one oxygen atom.' },
  { text: 'What does "IoT" stand for?', options: ['Internet of Things', 'Integration of Technology', 'Internal Operations Tool', 'Internet of Transfers'], correctIndex: 0, difficulty: 'medium', category: 'tech-science', explanation: 'IoT stands for Internet of Things.' },
  { text: 'Which scientist developed the theory of relativity?', options: ['Isaac Newton', 'Niels Bohr', 'Albert Einstein', 'Stephen Hawking'], correctIndex: 2, difficulty: 'easy', category: 'tech-science', explanation: 'Albert Einstein published the theory of relativity in 1905 and 1915.' },
  { text: 'What is the largest organ in the human body?', options: ['Liver', 'Brain', 'Skin', 'Lungs'], correctIndex: 2, difficulty: 'medium', category: 'tech-science', explanation: 'The skin is the largest organ of the human body.' },
  { text: 'What does SSD stand for in computing?', options: ['Solid State Drive', 'Super Speed Disk', 'System Storage Device', 'Sequential Storage Drive'], correctIndex: 0, difficulty: 'medium', category: 'tech-science', explanation: 'SSD stands for Solid State Drive.' },
  { text: 'What is the closest star to Earth?', options: ['Proxima Centauri', 'Sirius', 'The Sun', 'Alpha Centauri'], correctIndex: 2, difficulty: 'medium', category: 'tech-science', explanation: 'The Sun is the closest star to Earth.' },
  { text: 'What does API stand for?', options: ['Application Programming Interface', 'Advanced Program Integration', 'Automated Process Interface', 'Application Process Integration'], correctIndex: 0, difficulty: 'medium', category: 'tech-science', explanation: 'API stands for Application Programming Interface.' },
  { text: 'What language is most of the Linux kernel written in?', options: ['Java', 'Python', 'C', 'Rust'], correctIndex: 2, difficulty: 'hard', category: 'tech-science', explanation: 'The Linux kernel is primarily written in the C programming language.' },
  { text: 'What does DNS stand for?', options: ['Domain Name System', 'Digital Network Service', 'Data Name Server', 'Dynamic Network System'], correctIndex: 0, difficulty: 'hard', category: 'tech-science', explanation: 'DNS stands for Domain Name System.' },
  { text: 'Which company created the first commercially successful smartphone?', options: ['Nokia', 'Apple', 'BlackBerry', 'Samsung'], correctIndex: 1, difficulty: 'hard', category: 'tech-science', explanation: 'While not the first smartphone, the iPhone (2007) was the first commercially dominant one.' },
  { text: 'What is quantum computing based on?', options: ['Binary digits', 'Quantum bits (qubits)', 'Photon streams', 'Neural networks'], correctIndex: 1, difficulty: 'hard', category: 'tech-science', explanation: 'Quantum computing uses qubits which can represent 0, 1, or both simultaneously.' },
  { text: 'What year was the first email sent?', options: ['1961', '1971', '1981', '1991'], correctIndex: 1, difficulty: 'hard', category: 'tech-science', explanation: 'Ray Tomlinson sent the first email in 1971.' },
  { text: 'What does the "www" in a website URL stand for?', options: ['World Wide Web', 'Wide World Web', 'Web World Wide', 'World Web Wide'], correctIndex: 0, difficulty: 'easy', category: 'tech-science', explanation: 'WWW stands for World Wide Web.' },
  { text: 'Which planet has the most moons?', options: ['Jupiter', 'Saturn', 'Uranus', 'Neptune'], correctIndex: 1, difficulty: 'hard', category: 'tech-science', explanation: 'Saturn has the most confirmed moons (over 140).' },
  { text: 'What technology does Bluetooth use?', options: ['Infrared', 'Radio waves', 'Microwaves', 'Laser light'], correctIndex: 1, difficulty: 'medium', category: 'tech-science', explanation: 'Bluetooth uses short-range radio waves to communicate.' },
  { text: 'What does CSS stand for?', options: ['Computer Style Sheets', 'Cascading Style Sheets', 'Creative Style System', 'Coded Style Syntax'], correctIndex: 1, difficulty: 'easy', category: 'tech-science', explanation: 'CSS stands for Cascading Style Sheets.' },
  { text: 'What is the most abundant gas in Earth\'s atmosphere?', options: ['Oxygen', 'Carbon Dioxide', 'Nitrogen', 'Argon'], correctIndex: 2, difficulty: 'medium', category: 'tech-science', explanation: 'Nitrogen makes up about 78% of Earth\'s atmosphere.' },

  // ── General Knowledge (35) ───────────────────────────────────────────────
  { text: 'How many continents are there?', options: ['5', '6', '7', '8'], correctIndex: 2, difficulty: 'easy', category: 'general-knowledge', explanation: 'There are 7 continents: Africa, Antarctica, Asia, Australia, Europe, North America, South America.' },
  { text: 'What is the chemical symbol for gold?', options: ['Go', 'Gd', 'Au', 'Ag'], correctIndex: 2, difficulty: 'easy', category: 'general-knowledge', explanation: 'Au comes from the Latin word "aurum" meaning gold.' },
  { text: 'Which organ pumps blood through the body?', options: ['Brain', 'Lungs', 'Liver', 'Heart'], correctIndex: 3, difficulty: 'easy', category: 'general-knowledge', explanation: 'The heart pumps blood throughout the body.' },
  { text: 'How many days are in a leap year?', options: ['364', '365', '366', '367'], correctIndex: 2, difficulty: 'easy', category: 'general-knowledge', explanation: 'A leap year has 366 days, with February having 29 days.' },
  { text: 'What is the largest ocean on Earth?', options: ['Atlantic', 'Indian', 'Arctic', 'Pacific'], correctIndex: 3, difficulty: 'easy', category: 'general-knowledge', explanation: 'The Pacific Ocean is the largest and deepest ocean.' },
  { text: 'How many colors are in a rainbow?', options: ['5', '6', '7', '8'], correctIndex: 2, difficulty: 'easy', category: 'general-knowledge', explanation: 'A rainbow has 7 colors: red, orange, yellow, green, blue, indigo, violet.' },
  { text: 'What is the boiling point of water in Celsius?', options: ['90°C', '100°C', '110°C', '120°C'], correctIndex: 1, difficulty: 'easy', category: 'general-knowledge', explanation: 'Water boils at 100°C (212°F) at sea level.' },
  { text: 'How many letters are in the English alphabet?', options: ['24', '25', '26', '27'], correctIndex: 2, difficulty: 'easy', category: 'general-knowledge', explanation: 'The English alphabet has 26 letters.' },
  { text: 'Which language is the most spoken in the world by native speakers?', options: ['English', 'Mandarin Chinese', 'Spanish', 'Hindi'], correctIndex: 1, difficulty: 'medium', category: 'general-knowledge', explanation: 'Mandarin Chinese has the most native speakers worldwide.' },
  { text: 'What is the currency of Japan?', options: ['Yuan', 'Won', 'Yen', 'Ringgit'], correctIndex: 2, difficulty: 'easy', category: 'general-knowledge', explanation: 'The Japanese currency is the Yen.' },
  { text: 'What is the smallest country in the world?', options: ['Monaco', 'Vatican City', 'San Marino', 'Liechtenstein'], correctIndex: 1, difficulty: 'medium', category: 'general-knowledge', explanation: 'Vatican City is the smallest country at about 0.44 km2.' },
  { text: 'Which blood type is the universal donor?', options: ['A+', 'B+', 'AB+', 'O-'], correctIndex: 3, difficulty: 'medium', category: 'general-knowledge', explanation: 'Type O negative can be given to anyone.' },
  { text: 'How many teeth does an adult human normally have?', options: ['28', '30', '32', '34'], correctIndex: 2, difficulty: 'medium', category: 'general-knowledge', explanation: 'Adults typically have 32 teeth including wisdom teeth.' },
  { text: 'What is the hardest rock?', options: ['Granite', 'Marble', 'Diamond', 'Quartz'], correctIndex: 2, difficulty: 'medium', category: 'general-knowledge', explanation: 'Diamond is the hardest natural material known.' },
  { text: 'What is the national animal of Scotland?', options: ['Lion', 'Eagle', 'Unicorn', 'Dragon'], correctIndex: 2, difficulty: 'hard', category: 'general-knowledge', explanation: 'The unicorn is Scotland\'s national animal.' },
  { text: 'How many keys are on a standard piano?', options: ['76', '84', '88', '92'], correctIndex: 2, difficulty: 'medium', category: 'general-knowledge', explanation: 'A standard piano has 88 keys.' },
  { text: 'What is the most common blood type?', options: ['A+', 'O+', 'B+', 'AB+'], correctIndex: 1, difficulty: 'medium', category: 'general-knowledge', explanation: 'O positive is the most common blood type globally.' },
  { text: 'Which planet is known as the Morning Star?', options: ['Mars', 'Jupiter', 'Venus', 'Mercury'], correctIndex: 2, difficulty: 'medium', category: 'general-knowledge', explanation: 'Venus is often called the Morning Star or Evening Star.' },
  { text: 'How many strings does a standard guitar have?', options: ['4', '5', '6', '8'], correctIndex: 2, difficulty: 'easy', category: 'general-knowledge', explanation: 'A standard guitar has 6 strings.' },
  { text: 'What is the tallest mammal?', options: ['Elephant', 'Giraffe', 'Whale', 'Horse'], correctIndex: 1, difficulty: 'easy', category: 'general-knowledge', explanation: 'The giraffe is the tallest living mammal.' },
  { text: 'What color does litmus paper turn in acid?', options: ['Blue', 'Green', 'Red', 'Yellow'], correctIndex: 2, difficulty: 'medium', category: 'general-knowledge', explanation: 'Litmus paper turns red in acidic solutions.' },
  { text: 'What is the most consumed beverage in the world after water?', options: ['Coffee', 'Tea', 'Beer', 'Milk'], correctIndex: 1, difficulty: 'medium', category: 'general-knowledge', explanation: 'Tea is the most widely consumed beverage after water.' },
  { text: 'What is the largest desert in the world?', options: ['Sahara', 'Gobi', 'Antarctic', 'Arabian'], correctIndex: 2, difficulty: 'hard', category: 'general-knowledge', explanation: 'Antarctica is technically the largest desert by area (cold desert).' },
  { text: 'How many chambers does the human heart have?', options: ['2', '3', '4', '5'], correctIndex: 2, difficulty: 'easy', category: 'general-knowledge', explanation: 'The human heart has 4 chambers.' },
  { text: 'What is the main ingredient in guacamole?', options: ['Tomato', 'Avocado', 'Lime', 'Onion'], correctIndex: 1, difficulty: 'easy', category: 'general-knowledge', explanation: 'Guacamole is primarily made from avocado.' },
  { text: 'Which month has 28 days?', options: ['February only', 'All of them', 'None', 'February and March'], correctIndex: 1, difficulty: 'hard', category: 'general-knowledge', explanation: 'All months have at least 28 days!' },
  { text: 'What is a group of lions called?', options: ['Pack', 'Herd', 'Pride', 'Flock'], correctIndex: 2, difficulty: 'easy', category: 'general-knowledge', explanation: 'A group of lions is called a pride.' },
  { text: 'How many sides does a hexagon have?', options: ['5', '6', '7', '8'], correctIndex: 1, difficulty: 'easy', category: 'general-knowledge', explanation: 'A hexagon has 6 sides.' },
  { text: 'What is the freezing point of water in Fahrenheit?', options: ['0°F', '32°F', '100°F', '212°F'], correctIndex: 1, difficulty: 'medium', category: 'general-knowledge', explanation: 'Water freezes at 32°F (0°C).' },
  { text: 'Which vitamin does the sun help your body produce?', options: ['Vitamin A', 'Vitamin C', 'Vitamin D', 'Vitamin E'], correctIndex: 2, difficulty: 'medium', category: 'general-knowledge', explanation: 'Sunlight helps the body produce Vitamin D.' },
  { text: 'What percentage of the Earth\'s surface is covered by water?', options: ['51%', '61%', '71%', '81%'], correctIndex: 2, difficulty: 'medium', category: 'general-knowledge', explanation: 'About 71% of the Earth\'s surface is water.' },
  { text: 'What is the largest continent?', options: ['Africa', 'Europe', 'Asia', 'North America'], correctIndex: 2, difficulty: 'easy', category: 'general-knowledge', explanation: 'Asia is the largest continent by both area and population.' },
  { text: 'How many hours are in a week?', options: ['148', '158', '168', '178'], correctIndex: 2, difficulty: 'medium', category: 'general-knowledge', explanation: '7 days x 24 hours = 168 hours in a week.' },
  { text: 'What is the strongest muscle in the human body?', options: ['Biceps', 'Heart', 'Masseter (jaw)', 'Quadriceps'], correctIndex: 2, difficulty: 'hard', category: 'general-knowledge', explanation: 'The masseter (jaw muscle) is the strongest muscle by force relative to its size.' },
  { text: 'What is the rarest blood type?', options: ['O-', 'A-', 'B-', 'AB-'], correctIndex: 3, difficulty: 'hard', category: 'general-knowledge', explanation: 'AB negative is the rarest blood type.' },

  // ── History (35) ─────────────────────────────────────────────────────────
  { text: 'In what year did World War II end?', options: ['1943', '1944', '1945', '1946'], correctIndex: 2, difficulty: 'easy', category: 'history', explanation: 'World War II ended in 1945 with the surrender of Japan.' },
  { text: 'Who was the first person to walk on the Moon?', options: ['Buzz Aldrin', 'Neil Armstrong', 'Yuri Gagarin', 'John Glenn'], correctIndex: 1, difficulty: 'easy', category: 'history', explanation: 'Neil Armstrong became the first person on the Moon on July 20, 1969.' },
  { text: 'What ancient wonder was located in Egypt?', options: ['Hanging Gardens', 'Colossus of Rhodes', 'Great Pyramid of Giza', 'Temple of Artemis'], correctIndex: 2, difficulty: 'easy', category: 'history', explanation: 'The Great Pyramid of Giza is the only ancient wonder still standing.' },
  { text: 'Who painted the Mona Lisa?', options: ['Michelangelo', 'Raphael', 'Leonardo da Vinci', 'Donatello'], correctIndex: 2, difficulty: 'easy', category: 'history', explanation: 'Leonardo da Vinci painted the Mona Lisa in the early 1500s.' },
  { text: 'What year did the Titanic sink?', options: ['1910', '1911', '1912', '1913'], correctIndex: 2, difficulty: 'medium', category: 'history', explanation: 'The Titanic sank on April 15, 1912.' },
  { text: 'Who was the first President of the United States?', options: ['Thomas Jefferson', 'John Adams', 'George Washington', 'Benjamin Franklin'], correctIndex: 2, difficulty: 'easy', category: 'history', explanation: 'George Washington served as the first U.S. President from 1789 to 1797.' },
  { text: 'In what year did the Berlin Wall fall?', options: ['1987', '1988', '1989', '1990'], correctIndex: 2, difficulty: 'medium', category: 'history', explanation: 'The Berlin Wall fell on November 9, 1989.' },
  { text: 'Which civilization built Machu Picchu?', options: ['Maya', 'Aztec', 'Inca', 'Olmec'], correctIndex: 2, difficulty: 'medium', category: 'history', explanation: 'The Inca Empire built Machu Picchu in the 15th century.' },
  { text: 'Who discovered America in 1492?', options: ['Amerigo Vespucci', 'Christopher Columbus', 'Leif Erikson', 'Ferdinand Magellan'], correctIndex: 1, difficulty: 'easy', category: 'history', explanation: 'Christopher Columbus reached the Americas in 1492.' },
  { text: 'What was the name of the ship that brought the Pilgrims to America?', options: ['Santa Maria', 'Mayflower', 'Endeavour', 'Victoria'], correctIndex: 1, difficulty: 'medium', category: 'history', explanation: 'The Mayflower brought the Pilgrims to Plymouth in 1620.' },
  { text: 'Who was the Egyptian queen known for her beauty?', options: ['Nefertiti', 'Cleopatra', 'Hatshepsut', 'Isis'], correctIndex: 1, difficulty: 'easy', category: 'history', explanation: 'Cleopatra VII was the famous Egyptian queen.' },
  { text: 'Which country was the first to grant women the right to vote?', options: ['United States', 'United Kingdom', 'New Zealand', 'France'], correctIndex: 2, difficulty: 'hard', category: 'history', explanation: 'New Zealand granted women the right to vote in 1893.' },
  { text: 'In what year did World War I begin?', options: ['1912', '1913', '1914', '1915'], correctIndex: 2, difficulty: 'medium', category: 'history', explanation: 'World War I began in 1914 after the assassination of Archduke Franz Ferdinand.' },
  { text: 'Who wrote the "I Have a Dream" speech?', options: ['Malcolm X', 'Martin Luther King Jr.', 'Rosa Parks', 'Frederick Douglass'], correctIndex: 1, difficulty: 'easy', category: 'history', explanation: 'Martin Luther King Jr. delivered the speech in 1963.' },
  { text: 'What empire was ruled by Julius Caesar?', options: ['Greek', 'Persian', 'Roman', 'Ottoman'], correctIndex: 2, difficulty: 'easy', category: 'history', explanation: 'Julius Caesar was a leader of the Roman Republic.' },
  { text: 'Who invented the printing press?', options: ['Benjamin Franklin', 'Johannes Gutenberg', 'Thomas Edison', 'Alexander Graham Bell'], correctIndex: 1, difficulty: 'medium', category: 'history', explanation: 'Johannes Gutenberg invented the printing press around 1440.' },
  { text: 'What year did Ghana gain independence?', options: ['1955', '1957', '1960', '1963'], correctIndex: 1, difficulty: 'medium', category: 'history', explanation: 'Ghana gained independence from Britain on March 6, 1957.' },
  { text: 'Who was the first African leader of a post-colonial nation?', options: ['Jomo Kenyatta', 'Kwame Nkrumah', 'Nelson Mandela', 'Julius Nyerere'], correctIndex: 1, difficulty: 'hard', category: 'history', explanation: 'Kwame Nkrumah became the first president of Ghana in 1960.' },
  { text: 'The French Revolution began in which year?', options: ['1776', '1789', '1799', '1804'], correctIndex: 1, difficulty: 'medium', category: 'history', explanation: 'The French Revolution began in 1789 with the storming of the Bastille.' },
  { text: 'Who was the longest-reigning British monarch before Queen Elizabeth II?', options: ['Queen Victoria', 'King George III', 'King Henry VIII', 'Queen Anne'], correctIndex: 0, difficulty: 'hard', category: 'history', explanation: 'Queen Victoria reigned for 63 years until Elizabeth II surpassed her.' },
  { text: 'What ancient civilization built the Parthenon?', options: ['Roman', 'Egyptian', 'Greek', 'Persian'], correctIndex: 2, difficulty: 'medium', category: 'history', explanation: 'The Parthenon was built by the ancient Greeks in Athens.' },
  { text: 'Who led the Indian independence movement with nonviolent resistance?', options: ['Jawaharlal Nehru', 'Subhas Chandra Bose', 'Mahatma Gandhi', 'B.R. Ambedkar'], correctIndex: 2, difficulty: 'easy', category: 'history', explanation: 'Mahatma Gandhi led India to independence through nonviolent civil disobedience.' },
  { text: 'What was the Cold War primarily between?', options: ['USA and China', 'USA and USSR', 'UK and Germany', 'France and Russia'], correctIndex: 1, difficulty: 'easy', category: 'history', explanation: 'The Cold War was a geopolitical rivalry between the USA and the Soviet Union.' },
  { text: 'Who was the first woman to fly solo across the Atlantic?', options: ['Bessie Coleman', 'Amelia Earhart', 'Harriet Quimby', 'Jacqueline Cochran'], correctIndex: 1, difficulty: 'medium', category: 'history', explanation: 'Amelia Earhart completed the solo transatlantic flight in 1932.' },
  { text: 'The Renaissance began in which country?', options: ['France', 'England', 'Italy', 'Spain'], correctIndex: 2, difficulty: 'medium', category: 'history', explanation: 'The Renaissance began in Italy in the 14th century.' },
  { text: 'What treaty ended World War I?', options: ['Treaty of Paris', 'Treaty of Versailles', 'Treaty of Vienna', 'Treaty of Westphalia'], correctIndex: 1, difficulty: 'hard', category: 'history', explanation: 'The Treaty of Versailles was signed in 1919.' },
  { text: 'Which empire was the largest in history?', options: ['Roman Empire', 'Mongol Empire', 'British Empire', 'Ottoman Empire'], correctIndex: 2, difficulty: 'hard', category: 'history', explanation: 'The British Empire was the largest empire by total area.' },
  { text: 'Who wrote the Communist Manifesto?', options: ['Vladimir Lenin', 'Karl Marx', 'Joseph Stalin', 'Friedrich Engels'], correctIndex: 1, difficulty: 'hard', category: 'history', explanation: 'Karl Marx (with Friedrich Engels) wrote the Communist Manifesto in 1848.' },
  { text: 'What event triggered the start of World War I?', options: ['Invasion of Poland', 'Assassination of Franz Ferdinand', 'Sinking of the Lusitania', 'Treaty violation'], correctIndex: 1, difficulty: 'medium', category: 'history', explanation: 'The assassination of Archduke Franz Ferdinand of Austria in 1914 sparked WWI.' },
  { text: 'In which city was the Declaration of Independence signed?', options: ['New York', 'Boston', 'Philadelphia', 'Washington D.C.'], correctIndex: 2, difficulty: 'medium', category: 'history', explanation: 'The Declaration of Independence was signed in Philadelphia in 1776.' },
  { text: 'Who was the first Emperor of China?', options: ['Kublai Khan', 'Qin Shi Huang', 'Sun Yat-sen', 'Confucius'], correctIndex: 1, difficulty: 'hard', category: 'history', explanation: 'Qin Shi Huang united China and became its first Emperor in 221 BC.' },
  { text: 'What ancient city was destroyed by the eruption of Mount Vesuvius?', options: ['Rome', 'Athens', 'Pompeii', 'Carthage'], correctIndex: 2, difficulty: 'medium', category: 'history', explanation: 'Pompeii was buried by Mount Vesuvius in 79 AD.' },
  { text: 'Who led the Allied forces on D-Day?', options: ['George Patton', 'Dwight D. Eisenhower', 'Winston Churchill', 'Bernard Montgomery'], correctIndex: 1, difficulty: 'hard', category: 'history', explanation: 'General Eisenhower was Supreme Commander of the Allied Forces on D-Day.' },
  { text: 'The Magna Carta was signed in which year?', options: ['1066', '1215', '1415', '1776'], correctIndex: 1, difficulty: 'hard', category: 'history', explanation: 'The Magna Carta was sealed in 1215.' },
  { text: 'What was the main goal of the Silk Road?', options: ['Military conquest', 'Trade between East and West', 'Religious pilgrimage', 'Exploration'], correctIndex: 1, difficulty: 'medium', category: 'history', explanation: 'The Silk Road was a network of trade routes connecting East Asia to Europe.' },

  // ── Geography (35) ───────────────────────────────────────────────────────
  { text: 'What is the largest country by area?', options: ['China', 'United States', 'Canada', 'Russia'], correctIndex: 3, difficulty: 'easy', category: 'geography', explanation: 'Russia is the largest country by area at over 17 million km2.' },
  { text: 'What river runs through Egypt?', options: ['Amazon', 'Nile', 'Congo', 'Tigris'], correctIndex: 1, difficulty: 'easy', category: 'geography', explanation: 'The Nile River flows through Egypt.' },
  { text: 'What is the capital of Australia?', options: ['Sydney', 'Melbourne', 'Canberra', 'Brisbane'], correctIndex: 2, difficulty: 'medium', category: 'geography', explanation: 'Canberra is the capital of Australia, not Sydney.' },
  { text: 'Which is the longest river in the world?', options: ['Amazon', 'Nile', 'Mississippi', 'Yangtze'], correctIndex: 1, difficulty: 'easy', category: 'geography', explanation: 'The Nile River is the longest river at about 6,650 km.' },
  { text: 'What is the capital of Japan?', options: ['Osaka', 'Kyoto', 'Tokyo', 'Nagoya'], correctIndex: 2, difficulty: 'easy', category: 'geography', explanation: 'Tokyo is the capital of Japan.' },
  { text: 'Which country has the most people?', options: ['United States', 'India', 'China', 'Indonesia'], correctIndex: 1, difficulty: 'medium', category: 'geography', explanation: 'India surpassed China as the most populous country.' },
  { text: 'What is the tallest mountain in the world?', options: ['K2', 'Mount Everest', 'Kangchenjunga', 'Makalu'], correctIndex: 1, difficulty: 'easy', category: 'geography', explanation: 'Mount Everest is the tallest mountain at 8,849 meters.' },
  { text: 'On which continent is the Sahara Desert?', options: ['Asia', 'South America', 'Africa', 'Australia'], correctIndex: 2, difficulty: 'easy', category: 'geography', explanation: 'The Sahara Desert is in northern Africa.' },
  { text: 'What is the capital of Canada?', options: ['Toronto', 'Vancouver', 'Ottawa', 'Montreal'], correctIndex: 2, difficulty: 'medium', category: 'geography', explanation: 'Ottawa is the capital of Canada.' },
  { text: 'Which ocean is the deepest?', options: ['Atlantic', 'Indian', 'Pacific', 'Arctic'], correctIndex: 2, difficulty: 'medium', category: 'geography', explanation: 'The Pacific Ocean contains the Mariana Trench, the deepest point on Earth.' },
  { text: 'What country is the Eiffel Tower in?', options: ['Italy', 'Spain', 'France', 'Germany'], correctIndex: 2, difficulty: 'easy', category: 'geography', explanation: 'The Eiffel Tower is in Paris, France.' },
  { text: 'What is the smallest continent?', options: ['Europe', 'Antarctica', 'Australia/Oceania', 'South America'], correctIndex: 2, difficulty: 'easy', category: 'geography', explanation: 'Australia/Oceania is the smallest continent.' },
  { text: 'Which country is known as the Land of the Rising Sun?', options: ['China', 'South Korea', 'Japan', 'Thailand'], correctIndex: 2, difficulty: 'easy', category: 'geography', explanation: 'Japan is known as the Land of the Rising Sun.' },
  { text: 'What is the capital of Brazil?', options: ['Rio de Janeiro', 'Sao Paulo', 'Brasilia', 'Salvador'], correctIndex: 2, difficulty: 'medium', category: 'geography', explanation: 'Brasilia has been the capital of Brazil since 1960.' },
  { text: 'Which African country has the largest economy?', options: ['South Africa', 'Nigeria', 'Egypt', 'Kenya'], correctIndex: 1, difficulty: 'medium', category: 'geography', explanation: 'Nigeria has the largest economy in Africa by GDP.' },
  { text: 'What is the capital of Ghana?', options: ['Kumasi', 'Accra', 'Tamale', 'Takoradi'], correctIndex: 1, difficulty: 'easy', category: 'geography', explanation: 'Accra is the capital city of Ghana.' },
  { text: 'The Great Barrier Reef is off the coast of which country?', options: ['Brazil', 'Indonesia', 'Australia', 'Mexico'], correctIndex: 2, difficulty: 'medium', category: 'geography', explanation: 'The Great Barrier Reef is off the northeast coast of Australia.' },
  { text: 'What is the largest lake in Africa?', options: ['Lake Chad', 'Lake Malawi', 'Lake Victoria', 'Lake Tanganyika'], correctIndex: 2, difficulty: 'medium', category: 'geography', explanation: 'Lake Victoria is the largest lake in Africa by surface area.' },
  { text: 'Which two countries share the longest border?', options: ['USA-Mexico', 'Russia-China', 'USA-Canada', 'India-China'], correctIndex: 2, difficulty: 'hard', category: 'geography', explanation: 'The USA-Canada border is the longest at 8,891 km.' },
  { text: 'What is the driest continent?', options: ['Africa', 'Australia', 'Antarctica', 'Asia'], correctIndex: 2, difficulty: 'hard', category: 'geography', explanation: 'Antarctica is technically the driest continent.' },
  { text: 'Which country has the most islands?', options: ['Indonesia', 'Philippines', 'Sweden', 'Japan'], correctIndex: 2, difficulty: 'hard', category: 'geography', explanation: 'Sweden has over 267,000 islands.' },
  { text: 'What is the capital of Turkey?', options: ['Istanbul', 'Ankara', 'Izmir', 'Antalya'], correctIndex: 1, difficulty: 'medium', category: 'geography', explanation: 'Ankara is the capital of Turkey, not Istanbul.' },
  { text: 'Which country is both in Europe and Asia?', options: ['Russia', 'Turkey', 'Egypt', 'Both A and B'], correctIndex: 3, difficulty: 'hard', category: 'geography', explanation: 'Both Russia and Turkey span Europe and Asia.' },
  { text: 'The Amazon River is primarily in which country?', options: ['Colombia', 'Peru', 'Brazil', 'Venezuela'], correctIndex: 2, difficulty: 'easy', category: 'geography', explanation: 'The Amazon River flows mostly through Brazil.' },
  { text: 'What is the highest waterfall in the world?', options: ['Niagara Falls', 'Victoria Falls', 'Angel Falls', 'Iguazu Falls'], correctIndex: 2, difficulty: 'hard', category: 'geography', explanation: 'Angel Falls in Venezuela is the tallest at 979 meters.' },
  { text: 'What strait separates Europe from Africa?', options: ['Strait of Hormuz', 'Strait of Malacca', 'Strait of Gibraltar', 'Bosphorus'], correctIndex: 2, difficulty: 'medium', category: 'geography', explanation: 'The Strait of Gibraltar separates Europe (Spain) from Africa (Morocco).' },
  { text: 'Which is the most densely populated country?', options: ['India', 'Bangladesh', 'Monaco', 'Singapore'], correctIndex: 2, difficulty: 'hard', category: 'geography', explanation: 'Monaco is the most densely populated country.' },
  { text: 'What is the capital of South Korea?', options: ['Busan', 'Seoul', 'Incheon', 'Daegu'], correctIndex: 1, difficulty: 'easy', category: 'geography', explanation: 'Seoul is the capital of South Korea.' },
  { text: 'Mount Kilimanjaro is in which country?', options: ['Kenya', 'Tanzania', 'Uganda', 'Ethiopia'], correctIndex: 1, difficulty: 'medium', category: 'geography', explanation: 'Mount Kilimanjaro is in Tanzania.' },
  { text: 'Which country has the largest forest area?', options: ['Brazil', 'Canada', 'Russia', 'China'], correctIndex: 2, difficulty: 'hard', category: 'geography', explanation: 'Russia has the largest forest area at about 815 million hectares.' },
  { text: 'What is the deepest lake in the world?', options: ['Lake Superior', 'Lake Baikal', 'Caspian Sea', 'Lake Victoria'], correctIndex: 1, difficulty: 'hard', category: 'geography', explanation: 'Lake Baikal in Russia is the deepest lake at 1,642 meters.' },
  { text: 'What is the capital of Egypt?', options: ['Cairo', 'Alexandria', 'Luxor', 'Giza'], correctIndex: 0, difficulty: 'easy', category: 'geography', explanation: 'Cairo is the capital of Egypt.' },
  { text: 'Which country is shaped like a boot?', options: ['Spain', 'Greece', 'Italy', 'Portugal'], correctIndex: 2, difficulty: 'easy', category: 'geography', explanation: 'Italy is shaped like a boot.' },
  { text: 'What is the longest mountain range in the world?', options: ['Himalayas', 'Rocky Mountains', 'Andes', 'Alps'], correctIndex: 2, difficulty: 'medium', category: 'geography', explanation: 'The Andes in South America span about 7,000 km.' },
  { text: 'What sea lies between Europe and Africa?', options: ['Black Sea', 'Red Sea', 'Mediterranean Sea', 'Caspian Sea'], correctIndex: 2, difficulty: 'easy', category: 'geography', explanation: 'The Mediterranean Sea lies between Europe and Africa.' },

  // ── Pop Culture (35) ─────────────────────────────────────────────────────
  { text: 'Who directed Jurassic Park?', options: ['James Cameron', 'Steven Spielberg', 'Ridley Scott', 'George Lucas'], correctIndex: 1, difficulty: 'easy', category: 'pop-culture', explanation: 'Steven Spielberg directed Jurassic Park in 1993.' },
  { text: 'What band sang "Bohemian Rhapsody"?', options: ['The Beatles', 'Led Zeppelin', 'Queen', 'Pink Floyd'], correctIndex: 2, difficulty: 'easy', category: 'pop-culture', explanation: 'Queen released Bohemian Rhapsody in 1975.' },
  { text: 'What year was the first iPhone released?', options: ['2005', '2006', '2007', '2008'], correctIndex: 2, difficulty: 'medium', category: 'pop-culture', explanation: 'The first iPhone was released on June 29, 2007.' },
  { text: 'Who played Iron Man in the Marvel Cinematic Universe?', options: ['Chris Evans', 'Chris Hemsworth', 'Robert Downey Jr.', 'Mark Ruffalo'], correctIndex: 2, difficulty: 'easy', category: 'pop-culture', explanation: 'Robert Downey Jr. played Iron Man / Tony Stark.' },
  { text: 'What is the highest-grossing film of all time?', options: ['Avengers: Endgame', 'Avatar', 'Titanic', 'Star Wars: The Force Awakens'], correctIndex: 1, difficulty: 'medium', category: 'pop-culture', explanation: 'Avatar is the highest-grossing film of all time.' },
  { text: 'Who wrote the Harry Potter series?', options: ['Stephenie Meyer', 'J.R.R. Tolkien', 'J.K. Rowling', 'C.S. Lewis'], correctIndex: 2, difficulty: 'easy', category: 'pop-culture', explanation: 'J.K. Rowling wrote the Harry Potter book series.' },
  { text: 'What social media platform uses a bird as its original logo?', options: ['Facebook', 'Instagram', 'Twitter', 'Snapchat'], correctIndex: 2, difficulty: 'easy', category: 'pop-culture', explanation: 'Twitter (now X) originally used a blue bird logo.' },
  { text: 'Which video game features a plumber named Mario?', options: ['Sonic', 'Zelda', 'Super Mario Bros.', 'Donkey Kong'], correctIndex: 2, difficulty: 'easy', category: 'pop-culture', explanation: 'Super Mario Bros. features the plumber Mario.' },
  { text: 'What Netflix series is set in the "Upside Down"?', options: ['Dark', 'The OA', 'Stranger Things', 'Black Mirror'], correctIndex: 2, difficulty: 'easy', category: 'pop-culture', explanation: 'Stranger Things features the alternate dimension called the Upside Down.' },
  { text: 'Who is known as the "King of Pop"?', options: ['Elvis Presley', 'Prince', 'Michael Jackson', 'Stevie Wonder'], correctIndex: 2, difficulty: 'easy', category: 'pop-culture', explanation: 'Michael Jackson was known as the King of Pop.' },
  { text: 'What year did YouTube launch?', options: ['2003', '2004', '2005', '2006'], correctIndex: 2, difficulty: 'medium', category: 'pop-culture', explanation: 'YouTube launched in 2005.' },
  { text: 'Who sang "Shape of You"?', options: ['Justin Bieber', 'Ed Sheeran', 'Bruno Mars', 'The Weeknd'], correctIndex: 1, difficulty: 'easy', category: 'pop-culture', explanation: 'Ed Sheeran released "Shape of You" in 2017.' },
  { text: 'What is the name of Batman\'s butler?', options: ['Jarvis', 'Alfred', 'Watson', 'Sebastian'], correctIndex: 1, difficulty: 'medium', category: 'pop-culture', explanation: 'Alfred Pennyworth is Batman\'s loyal butler.' },
  { text: 'Which company created the PlayStation?', options: ['Nintendo', 'Microsoft', 'Sony', 'Sega'], correctIndex: 2, difficulty: 'easy', category: 'pop-culture', explanation: 'Sony created the PlayStation in 1994.' },
  { text: 'What fictional school does Harry Potter attend?', options: ['Beauxbatons', 'Hogwarts', 'Durmstrang', 'Ilvermorny'], correctIndex: 1, difficulty: 'easy', category: 'pop-culture', explanation: 'Harry Potter attends Hogwarts School of Witchcraft and Wizardry.' },
  { text: 'Who played the Joker in "The Dark Knight"?', options: ['Jack Nicholson', 'Jared Leto', 'Heath Ledger', 'Joaquin Phoenix'], correctIndex: 2, difficulty: 'medium', category: 'pop-culture', explanation: 'Heath Ledger played the Joker in The Dark Knight (2008).' },
  { text: 'What is the most-watched video on YouTube as of 2025?', options: ['Gangnam Style', 'Despacito', 'Baby Shark Dance', 'See You Again'], correctIndex: 2, difficulty: 'medium', category: 'pop-culture', explanation: 'Baby Shark Dance is the most-watched YouTube video.' },
  { text: 'Which app popularized short-form vertical videos?', options: ['Instagram', 'Snapchat', 'TikTok', 'Vine'], correctIndex: 2, difficulty: 'easy', category: 'pop-culture', explanation: 'TikTok popularized short vertical video content.' },
  { text: 'What animated film features a clownfish named Nemo?', options: ['Shark Tale', 'Finding Nemo', 'The Little Mermaid', 'Moana'], correctIndex: 1, difficulty: 'easy', category: 'pop-culture', explanation: 'Finding Nemo (2003) is about a clownfish named Nemo.' },
  { text: 'Who created the Star Wars franchise?', options: ['Steven Spielberg', 'James Cameron', 'George Lucas', 'Ridley Scott'], correctIndex: 2, difficulty: 'easy', category: 'pop-culture', explanation: 'George Lucas created Star Wars in 1977.' },
  { text: 'What is the best-selling video game of all time?', options: ['GTA V', 'Minecraft', 'Tetris', 'Mario Kart 8'], correctIndex: 1, difficulty: 'medium', category: 'pop-culture', explanation: 'Minecraft is the best-selling video game with over 300 million copies.' },
  { text: 'Which streaming service created "Squid Game"?', options: ['Amazon Prime', 'Hulu', 'Netflix', 'Disney+'], correctIndex: 2, difficulty: 'easy', category: 'pop-culture', explanation: 'Squid Game is a Netflix original Korean drama.' },
  { text: 'Who voiced Woody in Toy Story?', options: ['Tim Allen', 'Tom Hanks', 'Robin Williams', 'Billy Crystal'], correctIndex: 1, difficulty: 'medium', category: 'pop-culture', explanation: 'Tom Hanks voiced Woody in the Toy Story series.' },
  { text: 'What is the fictional metal in Wolverine\'s skeleton?', options: ['Vibranium', 'Adamantium', 'Unobtanium', 'Kryptonite'], correctIndex: 1, difficulty: 'medium', category: 'pop-culture', explanation: 'Adamantium is the fictional metal bonded to Wolverine\'s skeleton.' },
  { text: 'Which K-pop group performed "Dynamite"?', options: ['BLACKPINK', 'EXO', 'BTS', 'TWICE'], correctIndex: 2, difficulty: 'easy', category: 'pop-culture', explanation: 'BTS released "Dynamite" in 2020.' },
  { text: 'What does "GIF" stand for?', options: ['Graphics Interchange Format', 'General Image File', 'Graphical Internet Format', 'Generated Image Format'], correctIndex: 0, difficulty: 'hard', category: 'pop-culture', explanation: 'GIF stands for Graphics Interchange Format.' },
  { text: 'Who directed "The Lord of the Rings" trilogy?', options: ['Christopher Nolan', 'Peter Jackson', 'Guillermo del Toro', 'Tim Burton'], correctIndex: 1, difficulty: 'medium', category: 'pop-culture', explanation: 'Peter Jackson directed The Lord of the Rings trilogy.' },
  { text: 'What was the first feature-length Pixar film?', options: ['A Bug\'s Life', 'Toy Story', 'Monsters Inc.', 'Finding Nemo'], correctIndex: 1, difficulty: 'medium', category: 'pop-culture', explanation: 'Toy Story (1995) was Pixar\'s first feature film.' },
  { text: 'Who painted "The Starry Night"?', options: ['Claude Monet', 'Pablo Picasso', 'Vincent van Gogh', 'Salvador Dali'], correctIndex: 2, difficulty: 'medium', category: 'pop-culture', explanation: 'Vincent van Gogh painted The Starry Night in 1889.' },
  { text: 'What year did Facebook launch?', options: ['2002', '2003', '2004', '2005'], correctIndex: 2, difficulty: 'medium', category: 'pop-culture', explanation: 'Facebook launched in February 2004.' },
  { text: 'Which rapper has an alter ego named Slim Shady?', options: ['Jay-Z', 'Kanye West', 'Eminem', '50 Cent'], correctIndex: 2, difficulty: 'easy', category: 'pop-culture', explanation: 'Eminem\'s alter ego is Slim Shady.' },
  { text: 'What does "GOAT" stand for in slang?', options: ['Get Out And Try', 'Greatest Of All Time', 'Good Overall Ability Today', 'Go On A Trip'], correctIndex: 1, difficulty: 'easy', category: 'pop-culture', explanation: 'GOAT stands for Greatest Of All Time.' },
  { text: 'What is the name of the AI in the movie "2001: A Space Odyssey"?', options: ['WALL-E', 'HAL 9000', 'Skynet', 'Jarvis'], correctIndex: 1, difficulty: 'hard', category: 'pop-culture', explanation: 'HAL 9000 is the AI in Stanley Kubrick\'s 2001: A Space Odyssey.' },
  { text: 'Which Disney princess has ice powers?', options: ['Rapunzel', 'Moana', 'Elsa', 'Merida'], correctIndex: 2, difficulty: 'easy', category: 'pop-culture', explanation: 'Elsa from Frozen has ice powers.' },
  { text: 'What was the first song to reach 1 billion streams on Spotify?', options: ['Shape of You', 'Despacito', 'Lean On', 'Blinding Lights'], correctIndex: 2, difficulty: 'hard', category: 'pop-culture', explanation: 'Lean On by Major Lazer was the first to reach 1 billion Spotify streams.' },

  // ── Sports (35) ──────────────────────────────────────────────────────────
  { text: 'How many players are on a soccer/football team?', options: ['9', '10', '11', '12'], correctIndex: 2, difficulty: 'easy', category: 'sports', explanation: 'A soccer team has 11 players on the field.' },
  { text: 'What sport is played at Wimbledon?', options: ['Golf', 'Cricket', 'Tennis', 'Badminton'], correctIndex: 2, difficulty: 'easy', category: 'sports', explanation: 'Wimbledon is the oldest tennis tournament in the world.' },
  { text: 'Who has won the most Olympic gold medals?', options: ['Usain Bolt', 'Michael Phelps', 'Carl Lewis', 'Simone Biles'], correctIndex: 1, difficulty: 'easy', category: 'sports', explanation: 'Michael Phelps has won 23 Olympic gold medals.' },
  { text: 'How many points is a touchdown worth in American football?', options: ['3', '5', '6', '7'], correctIndex: 2, difficulty: 'easy', category: 'sports', explanation: 'A touchdown is worth 6 points (plus a potential extra point or 2-point conversion).' },
  { text: 'Which country won the 2022 FIFA World Cup?', options: ['France', 'Brazil', 'Argentina', 'Germany'], correctIndex: 2, difficulty: 'easy', category: 'sports', explanation: 'Argentina won the 2022 World Cup in Qatar.' },
  { text: 'What is the highest possible score in a single frame of bowling?', options: ['10', '20', '30', '300'], correctIndex: 2, difficulty: 'hard', category: 'sports', explanation: 'A perfect frame with a strike and bonuses can score up to 30 points.' },
  { text: 'In which sport would you perform a slam dunk?', options: ['Volleyball', 'Basketball', 'Tennis', 'Football'], correctIndex: 1, difficulty: 'easy', category: 'sports', explanation: 'A slam dunk is a basketball move.' },
  { text: 'How many holes are in a standard round of golf?', options: ['9', '12', '18', '24'], correctIndex: 2, difficulty: 'easy', category: 'sports', explanation: 'A standard golf round has 18 holes.' },
  { text: 'Who is considered the greatest basketball player of all time?', options: ['LeBron James', 'Kobe Bryant', 'Michael Jordan', 'Magic Johnson'], correctIndex: 2, difficulty: 'easy', category: 'sports', explanation: 'Michael Jordan is widely considered the greatest basketball player.' },
  { text: 'What country invented cricket?', options: ['Australia', 'India', 'England', 'South Africa'], correctIndex: 2, difficulty: 'medium', category: 'sports', explanation: 'Cricket originated in England.' },
  { text: 'How long is a marathon in miles?', options: ['20.2 miles', '24.2 miles', '26.2 miles', '28.2 miles'], correctIndex: 2, difficulty: 'medium', category: 'sports', explanation: 'A marathon is 26.2 miles (42.195 kilometers).' },
  { text: 'Which country has won the most FIFA World Cups?', options: ['Germany', 'Italy', 'Brazil', 'Argentina'], correctIndex: 2, difficulty: 'easy', category: 'sports', explanation: 'Brazil has won 5 FIFA World Cups.' },
  { text: 'What color card in soccer means ejection?', options: ['Yellow', 'Red', 'Blue', 'Green'], correctIndex: 1, difficulty: 'easy', category: 'sports', explanation: 'A red card means the player is ejected from the game.' },
  { text: 'In tennis, what is a score of 40-40 called?', options: ['Match point', 'Break point', 'Deuce', 'Advantage'], correctIndex: 2, difficulty: 'medium', category: 'sports', explanation: 'A tied score of 40-40 in tennis is called deuce.' },
  { text: 'Which sport uses a shuttlecock?', options: ['Tennis', 'Badminton', 'Squash', 'Table Tennis'], correctIndex: 1, difficulty: 'easy', category: 'sports', explanation: 'Badminton uses a shuttlecock (birdie).' },
  { text: 'Who holds the record for the most goals in FIFA World Cup history?', options: ['Pele', 'Ronaldo', 'Miroslav Klose', 'Lionel Messi'], correctIndex: 2, difficulty: 'hard', category: 'sports', explanation: 'Miroslav Klose holds the record with 16 World Cup goals.' },
  { text: 'What is the national sport of Japan?', options: ['Judo', 'Karate', 'Sumo Wrestling', 'Baseball'], correctIndex: 2, difficulty: 'medium', category: 'sports', explanation: 'Sumo wrestling is considered Japan\'s national sport.' },
  { text: 'How many players are on a basketball team on the court?', options: ['4', '5', '6', '7'], correctIndex: 1, difficulty: 'easy', category: 'sports', explanation: 'Each basketball team has 5 players on the court.' },
  { text: 'Which Grand Slam tennis tournament is played on clay?', options: ['Wimbledon', 'US Open', 'Australian Open', 'French Open'], correctIndex: 3, difficulty: 'medium', category: 'sports', explanation: 'The French Open (Roland Garros) is played on clay courts.' },
  { text: 'In what sport is the term "hat trick" used for 3 goals?', options: ['Basketball', 'Soccer/Hockey', 'Tennis', 'Golf'], correctIndex: 1, difficulty: 'easy', category: 'sports', explanation: 'A hat trick is 3 goals by the same player, used in soccer and hockey.' },
  { text: 'Who is the fastest man in the world (100m record)?', options: ['Carl Lewis', 'Tyson Gay', 'Usain Bolt', 'Justin Gatlin'], correctIndex: 2, difficulty: 'easy', category: 'sports', explanation: 'Usain Bolt holds the 100m record at 9.58 seconds.' },
  { text: 'Which sport is known as "the beautiful game"?', options: ['Basketball', 'Cricket', 'Soccer/Football', 'Tennis'], correctIndex: 2, difficulty: 'easy', category: 'sports', explanation: 'Soccer (football) is often called "the beautiful game".' },
  { text: 'What is the diameter of a basketball hoop in inches?', options: ['16 inches', '18 inches', '20 inches', '22 inches'], correctIndex: 1, difficulty: 'hard', category: 'sports', explanation: 'A basketball hoop has an 18-inch diameter.' },
  { text: 'Who won the first ever FIFA Women\'s World Cup?', options: ['Germany', 'Norway', 'United States', 'Sweden'], correctIndex: 2, difficulty: 'hard', category: 'sports', explanation: 'The United States won the first Women\'s World Cup in 1991.' },
  { text: 'In which sport do you use a puck?', options: ['Field Hockey', 'Ice Hockey', 'Lacrosse', 'Curling'], correctIndex: 1, difficulty: 'easy', category: 'sports', explanation: 'Ice hockey uses a rubber puck.' },
  { text: 'What country hosted the first modern Olympic Games in 1896?', options: ['France', 'United States', 'Greece', 'United Kingdom'], correctIndex: 2, difficulty: 'medium', category: 'sports', explanation: 'The first modern Olympics were held in Athens, Greece in 1896.' },
  { text: 'Who has won the most Grand Slam titles in men\'s tennis?', options: ['Roger Federer', 'Rafael Nadal', 'Novak Djokovic', 'Pete Sampras'], correctIndex: 2, difficulty: 'medium', category: 'sports', explanation: 'Novak Djokovic holds the record for most men\'s Grand Slam titles.' },
  { text: 'How many periods are in a standard ice hockey game?', options: ['2', '3', '4', '5'], correctIndex: 1, difficulty: 'medium', category: 'sports', explanation: 'Ice hockey has 3 periods of 20 minutes each.' },
  { text: 'Which country is famous for the sport of sumo wrestling?', options: ['China', 'Japan', 'South Korea', 'Mongolia'], correctIndex: 1, difficulty: 'easy', category: 'sports', explanation: 'Sumo wrestling originated in Japan.' },
  { text: 'What does "FIFA" stand for?', options: ['Federation Internationale de Football Association', 'Federal International Football Authority', 'Foundation of International Football Allies', 'Federation of International Football Athletics'], correctIndex: 0, difficulty: 'hard', category: 'sports', explanation: 'FIFA is the French abbreviation for Federation Internationale de Football Association.' },
  { text: 'In boxing, what is a TKO?', options: ['Total Knockout', 'Technical Knockout', 'Time Kept Out', 'Timed Knock Out'], correctIndex: 1, difficulty: 'medium', category: 'sports', explanation: 'TKO stands for Technical Knockout.' },
  { text: 'Which swimmer has the most Olympic medals?', options: ['Ian Thorpe', 'Mark Spitz', 'Michael Phelps', 'Ryan Lochte'], correctIndex: 2, difficulty: 'easy', category: 'sports', explanation: 'Michael Phelps has 28 Olympic medals (23 gold).' },
  { text: 'What is the maximum break in snooker?', options: ['147', '155', '170', '180'], correctIndex: 0, difficulty: 'hard', category: 'sports', explanation: 'The maximum break in snooker is 147.' },
  { text: 'In which year were the first Winter Olympics held?', options: ['1920', '1924', '1928', '1932'], correctIndex: 1, difficulty: 'hard', category: 'sports', explanation: 'The first Winter Olympics were held in Chamonix, France in 1924.' },
  { text: 'What sport does Tiger Woods play?', options: ['Tennis', 'Baseball', 'Golf', 'Swimming'], correctIndex: 2, difficulty: 'easy', category: 'sports', explanation: 'Tiger Woods is a professional golfer.' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function selectQuestions(category: TriviaCategory | 'random'): TriviaQuestion[] {
  let pool: TriviaQuestion[];
  if (category === 'random') {
    pool = shuffleArray(QUESTION_BANK);
  } else {
    pool = shuffleArray(QUESTION_BANK.filter((q) => q.category === category));
  }

  // Pick by difficulty progression: Q1-3 Easy, Q4-7 Medium, Q8-10 Hard
  const easy = pool.filter((q) => q.difficulty === 'easy');
  const medium = pool.filter((q) => q.difficulty === 'medium');
  const hard = pool.filter((q) => q.difficulty === 'hard');

  const selected: TriviaQuestion[] = [
    ...easy.slice(0, 3),
    ...medium.slice(0, 4),
    ...hard.slice(0, 3),
  ];

  // If not enough in a difficulty, fill from others
  while (selected.length < QUESTIONS_PER_GAME && pool.length > 0) {
    const next = pool.find((q) => !selected.includes(q));
    if (next) selected.push(next);
    else break;
  }

  return selected.slice(0, QUESTIONS_PER_GAME);
}

// ─── Sub-components ─────────────────────────────────────��────────────────────

// Inject CSS animations once
const TC_STYLE_ID = 'trivia-challenge-animations';
function injectTCStyles() {
  if (document.getElementById(TC_STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = TC_STYLE_ID;
  style.textContent = `
    @keyframes tc-score-pop {
      0% { transform: scale(1); }
      30% { transform: scale(1.25); }
      100% { transform: scale(1); }
    }
    .tc-score-pop { animation: tc-score-pop 0.4s ease-out; }

    @keyframes tc-glow-correct {
      0% { box-shadow: 0 0 0 0 rgba(34,197,94,0.5); }
      50% { box-shadow: 0 0 16px 4px rgba(34,197,94,0.3); }
      100% { box-shadow: 0 0 0 0 rgba(34,197,94,0); }
    }
    .tc-glow-correct { animation: tc-glow-correct 0.7s ease-out; }

    @keyframes tc-shake {
      0%, 100% { transform: translateX(0); }
      10%, 50%, 90% { transform: translateX(-4px); }
      30%, 70% { transform: translateX(4px); }
    }
    .tc-shake { animation: tc-shake 0.4s ease-out; }

    @keyframes tc-cat-badge-in {
      0% { opacity: 0; transform: translateY(-6px) scale(0.9); }
      100% { opacity: 1; transform: translateY(0) scale(1); }
    }
    .tc-cat-badge-in { animation: tc-cat-badge-in 0.3s ease-out; }
  `;
  document.head.appendChild(style);
}

function HowToPlayTrivia() {
  const [open, setOpen] = useState(false);

  const rules = [
    { icon: Target, text: '10 questions per match, 15 seconds each.', accent: 'text-blue-400' },
    { icon: Zap, text: 'Difficulty progresses: Q1-3 Easy, Q4-7 Medium, Q8-10 Hard.', accent: 'text-emerald-400' },
    { icon: Award, text: 'Easy = 100pts, Medium = 200pts, Hard = 300pts base score.', accent: 'text-amber-400' },
    { icon: Clock, text: 'Speed bonus: under 3s = 2x, under 5s = 1.5x, under 8s = 1.2x multiplier.', accent: 'text-cyan-400' },
    { icon: Flame, text: '3 correct streak = 1.2x bonus, 5 streak = 1.5x bonus.', accent: 'text-orange-400' },
    { icon: Brain, text: '6 categories: Tech, General, History, Geography, Pop Culture, Sports.', accent: 'text-violet-400' },
  ];

  return (
    <div className="mb-6">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'w-full flex items-center justify-center gap-2 py-3 px-5 rounded-2xl',
          'bg-gradient-to-r from-violet-500/10 to-purple-500/10',
          'border border-violet-500/20 dark:border-violet-500/30',
          'hover:from-violet-500/15 hover:to-purple-500/15',
          'transition-all duration-200 text-sm font-bold',
          open ? 'text-violet-500 dark:text-violet-400' : 'text-muted-foreground hover:text-violet-500',
        )}
      >
        <Brain className="w-4 h-4" />
        How to Play
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="pt-4 space-y-2">
              {rules.map((rule, i) => {
                const Icon = rule.icon;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="flex items-start gap-3 px-4 py-3 rounded-xl bg-card/80 dark:bg-card/50 border border-border/50 hover:border-violet-500/30 transition-colors"
                  >
                    <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-muted/50', rule.accent)}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-sm text-muted-foreground leading-relaxed pt-1">{rule.text}</span>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CategorySelector({ onSelect }: { onSelect: (cat: TriviaCategory | 'random') => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="text-center">
        <h2 className="text-2xl font-black mb-2">Choose a Category</h2>
        <p className="text-muted-foreground text-sm">Pick a topic or go random</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {CATEGORIES.map((cat, catIdx) => {
          const Icon = cat.icon;
          return (
            <motion.button
              key={cat.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: catIdx * 0.05 }}
              whileHover={{ scale: 1.05, y: -4 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelect(cat.id)}
              className={cn(
                'relative flex flex-col items-center justify-center p-5 rounded-2xl',
                'bg-gradient-to-br text-white',
                'shadow-lg hover:shadow-xl transition-shadow duration-200',
                'min-h-[140px] overflow-hidden group',
                cat.gradient,
              )}
            >
              {/* Decorative circles */}
              <div className="absolute top-[-10px] right-[-10px] w-20 h-20 rounded-full bg-white/10 group-hover:bg-white/15 transition-colors" />
              <div className="absolute bottom-[-8px] left-[-8px] w-14 h-14 rounded-full bg-black/10" />

              {/* Icon container with glow */}
              <div className="relative w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-2.5 shadow-sm group-hover:scale-110 transition-transform">
                <Icon className="w-6 h-6 drop-shadow" />
              </div>
              <span className="text-sm font-bold leading-tight text-center relative z-10">{cat.label}</span>
              <span className="text-[10px] text-white/70 mt-1 leading-tight text-center relative z-10">{cat.description}</span>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}

// Circular Timer
function CircularTimer({ timeLeft, total }: { timeLeft: number; total: number }) {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const progress = timeLeft / total;
  const dashOffset = circumference * (1 - progress);
  const isLow = timeLeft <= 5;

  return (
    <div className="relative w-16 h-16 flex-shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r={radius} fill="none" stroke="currentColor" strokeWidth="4" className="text-muted/20" />
        <circle
          cx="32" cy="32" r={radius} fill="none"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className={cn(
            'transition-all duration-1000 ease-linear',
            isLow ? 'text-red-500' : 'text-violet-500',
          )}
        />
      </svg>
      <div className={cn(
        'absolute inset-0 flex items-center justify-center text-lg font-black tabular-nums',
        isLow && 'text-red-500 animate-pulse',
      )}>
        {timeLeft}
      </div>
    </div>
  );
}

// Progress Dots
function ProgressDots({ results, total, current }: { results: AnswerResult[]; total: number; current: number }) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap justify-center">
      {Array.from({ length: total }, (_, i) => {
        const result = results[i];
        const isCurrent = i === current;
        return (
          <div
            key={i}
            className={cn(
              'w-3 h-3 rounded-full transition-all duration-300',
              result
                ? result.correct
                  ? 'bg-green-500 scale-100'
                  : 'bg-red-500 scale-100'
                : isCurrent
                ? 'bg-violet-500 scale-125 ring-2 ring-violet-300'
                : 'bg-muted-foreground/20 scale-100',
            )}
          />
        );
      })}
    </div>
  );
}

// Difficulty badge
function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  const config = {
    easy: { label: 'Easy', color: 'bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30', icon: '●' },
    medium: { label: 'Medium', color: 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30', icon: '●●' },
    hard: { label: 'Hard', color: 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30', icon: '●●●' },
  };
  const c = config[difficulty];
  return (
    <span className={cn('text-xs font-bold px-2.5 py-1 rounded-lg border shadow-sm flex items-center gap-1', c.color)}>
      <span className="text-[8px] leading-none">{c.icon}</span>
      {c.label}
    </span>
  );
}

// Category badge
function CategoryBadge({ category }: { category: TriviaCategory }) {
  const catConfig: Record<TriviaCategory, { label: string; icon: typeof Brain; color: string }> = {
    'tech-science': { label: 'Tech & Science', icon: Cpu, color: 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30' },
    'general-knowledge': { label: 'General Knowledge', icon: Brain, color: 'bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30' },
    'history': { label: 'History', icon: Landmark, color: 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30' },
    'geography': { label: 'Geography', icon: MapPin, color: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' },
    'pop-culture': { label: 'Pop Culture', icon: Popcorn, color: 'bg-pink-500/20 text-pink-600 dark:text-pink-400 border-pink-500/30' },
    'sports': { label: 'Sports', icon: Trophy, color: 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30' },
  };
  const cfg = catConfig[category];
  const CatIcon = cfg.icon;
  return (
    <span className={cn('text-xs font-bold px-2.5 py-1 rounded-lg border shadow-sm flex items-center gap-1', cfg.color)}>
      <CatIcon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

// ─── Question Screen ─────────────────────────────────────────────────────────

interface QuestionScreenProps {
  question: TriviaQuestion;
  questionNumber: number;
  totalQuestions: number;
  timeLeft: number;
  selectedIndex: number | null;
  revealed: boolean;
  onSelect: (index: number) => void;
  score: number;
  streak: number;
  opponentScore?: number;
  playerLabel?: string;
  results: AnswerResult[];
}

function QuestionScreen({
  question, questionNumber, totalQuestions, timeLeft, selectedIndex,
  revealed, onSelect, score, streak, opponentScore, playerLabel, results,
}: QuestionScreenProps) {
  return (
    <motion.div
      key={`q-${questionNumber}`}
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      {/* Header row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <CategoryBadge category={question.category} />
          <DifficultyBadge difficulty={question.difficulty} />
          <span className="text-sm font-bold text-muted-foreground">
            Q {questionNumber}/{totalQuestions}
          </span>
        </div>
        <CircularTimer timeLeft={timeLeft} total={TIME_PER_QUESTION} />
      </div>

      {/* Score bar */}
      <div className="flex items-center justify-between text-sm font-bold">
        <div className="flex items-center gap-2">
          {playerLabel && <span className="text-muted-foreground text-xs">{playerLabel}</span>}
          <span className="text-violet-600 dark:text-violet-400 tabular-nums">{score} pts</span>
          {streak >= 3 && (
            <span className="flex items-center gap-0.5 text-orange-500 text-xs">
              <Flame className="w-3.5 h-3.5" /> {streak}x
            </span>
          )}
        </div>
        {opponentScore !== undefined && (
          <span className="text-muted-foreground tabular-nums">{opponentScore} pts</span>
        )}
      </div>

      {/* Progress dots */}
      <ProgressDots results={results} total={totalQuestions} current={questionNumber - 1} />

      {/* Question text */}
      <div className="rounded-2xl bg-card dark:bg-card/80 border border-border shadow-lg shadow-violet-500/5 p-5 sm:p-7">
        <p className="text-lg sm:text-xl font-bold leading-relaxed text-center">
          {question.text}
        </p>
      </div>

      {/* Options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {question.options.map((opt, i) => {
          const isSelected = selectedIndex === i;
          const isCorrect = i === question.correctIndex;
          const showCorrect = revealed && isCorrect;
          const showWrong = revealed && isSelected && !isCorrect;
          const disabled = revealed || selectedIndex !== null;
          const optionStyles = [
            { label: 'bg-blue-500', border: 'border-blue-500/30', hover: 'hover:border-blue-400 hover:bg-blue-500/10 hover:shadow-blue-500/10' },
            { label: 'bg-emerald-500', border: 'border-emerald-500/30', hover: 'hover:border-emerald-400 hover:bg-emerald-500/10 hover:shadow-emerald-500/10' },
            { label: 'bg-amber-500', border: 'border-amber-500/30', hover: 'hover:border-amber-400 hover:bg-amber-500/10 hover:shadow-amber-500/10' },
            { label: 'bg-purple-500', border: 'border-purple-500/30', hover: 'hover:border-purple-400 hover:bg-purple-500/10 hover:shadow-purple-500/10' },
          ];
          const os = optionStyles[i];

          return (
            <motion.button
              key={i}
              whileHover={!disabled ? { scale: 1.03, y: -2 } : undefined}
              whileTap={!disabled ? { scale: 0.95 } : undefined}
              onClick={() => !disabled && onSelect(i)}
              disabled={disabled}
              className={cn(
                'relative flex items-center gap-3 p-4 sm:p-5 rounded-2xl border-2 text-left',
                'font-medium transition-all duration-200 shadow-sm',
                'min-h-[60px]',
                showCorrect
                  ? 'border-green-500 bg-green-500/15 text-green-700 dark:text-green-400 shadow-green-500/20 shadow-md tc-glow-correct'
                  : showWrong
                  ? 'border-red-500 bg-red-500/15 text-red-700 dark:text-red-400 shadow-red-500/20 shadow-md tc-shake'
                  : isSelected
                  ? 'border-violet-500 bg-violet-500/10 shadow-violet-500/20 shadow-md'
                  : `bg-card ${os.border} ${os.hover} hover:shadow-md`,
                disabled && !showCorrect && !showWrong && 'opacity-50',
              )}
            >
              <span className={cn(
                'flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black shadow-sm',
                showCorrect
                  ? 'bg-green-500 text-white'
                  : showWrong
                  ? 'bg-red-500 text-white'
                  : isSelected
                  ? 'bg-violet-500 text-white'
                  : `${os.label} text-white`,
              )}>
                {showCorrect ? <CheckCircle2 className="w-5 h-5" /> : showWrong ? <XCircle className="w-5 h-5" /> : String.fromCharCode(65 + i)}
              </span>
              <span className="flex-1">{opt}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Explanation after reveal */}
      {revealed && question.explanation && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl bg-blue-500/10 border border-blue-500/30 p-4 text-sm text-blue-700 dark:text-blue-300"
        >
          <span className="font-bold">Did you know? </span>
          {question.explanation}
        </motion.div>
      )}
    </motion.div>
  );
}

// Local switch screen
function LocalSwitchScreen({ player, onReady }: { player: number; onReady: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center space-y-6 py-12"
    >
      <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white">
        <span className="text-3xl font-black">P{player}</span>
      </div>
      <h2 className="text-2xl font-black">Player {player}'s Turn</h2>
      <p className="text-muted-foreground">Hand the device to Player {player}</p>
      <Button
        size="lg"
        className="h-14 px-8 text-base bg-gradient-to-r from-violet-500 to-purple-600 text-white hover:from-violet-400 hover:to-purple-500"
        onClick={onReady}
      >
        I'm Ready
      </Button>
    </motion.div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function TriviaChallenge() {
  const navigate = useNavigate();
  const { player, getPlayerId, getDisplayName } = usePlayerProfile();
  const { submitScore } = useLeaderboard({ gameSlug: 'trivia-challenge' });

  // ── Game state ──
  const [phase, setPhase] = useState<GamePhase>('mode-select');
  const [gameMode, setGameMode] = useState<GameMode>('solo');
  const [selectedCategory, setSelectedCategory] = useState<TriviaCategory | 'random'>('random');
  const [questions, setQuestions] = useState<TriviaQuestion[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIME_PER_QUESTION);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [answerStartTime, setAnswerStartTime] = useState(0);

  // Scores and results
  const [p1Score, setP1Score] = useState(0);
  const [p2Score, setP2Score] = useState(0);
  const [p1Results, setP1Results] = useState<AnswerResult[]>([]);
  const [p2Results, setP2Results] = useState<AnswerResult[]>([]);
  const [p1Streak, setP1Streak] = useState(0);
  const [p2Streak, setP2Streak] = useState(0);

  // Local mode
  const [activePlayer, setActivePlayer] = useState(1); // 1 or 2

  // Online mode
  const [opponentName, setOpponentName] = useState('');
  const onBroadcastRef = useRef<((event: string, payload: Record<string, unknown>) => void) | null>(null);

  const gameRoom = useGameRoom({
    gameSlug: 'trivia-challenge',
    playerName: getDisplayName(),
    onPlayerJoined: (name) => setOpponentName(name),
    onGameStart: (payload) => {
      const qs = payload.questions as TriviaQuestion[];
      if (qs) {
        setQuestions(qs);
        setPhase('countdown');
      }
    },
    onBroadcast: (event, payload) => {
      onBroadcastRef.current?.(event, payload);
    },
  });

  // Online broadcast handler
  useEffect(() => {
    onBroadcastRef.current = (event: string, payload: Record<string, unknown>) => {
      if (event === 'answer') {
        const pts = payload.points as number;
        const correct = payload.correct as boolean;
        setP2Score((s) => s + pts);
        setP2Results((prev) => [
          ...prev,
          {
            questionIndex: payload.questionIndex as number,
            selectedIndex: payload.selectedIndex as number | null,
            correct,
            timeMs: payload.timeMs as number,
            points: pts,
          },
        ]);
        if (correct) {
          setP2Streak((s) => s + 1);
        } else {
          setP2Streak(0);
        }
      }
    };
  }, []);

  // ── Timer ──
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = useCallback(() => {
    setTimeLeft(TIME_PER_QUESTION);
    setAnswerStartTime(Date.now());
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopTimer();
  }, [stopTimer]);

  // Handle timeout
  useEffect(() => {
    if (timeLeft === 0 && phase === 'playing' && !revealed) {
      handleAnswer(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, phase, revealed]);

  // ── Core game logic ──

  const handleAnswer = useCallback((index: number | null) => {
    stopTimer();
    setSelectedAnswer(index);
    setRevealed(true);

    const q = questions[currentQ];
    if (!q) return;

    const timeMs = Date.now() - answerStartTime;
    const correct = index === q.correctIndex;

    // Determine which player
    const isP1 = gameMode !== 'local' || activePlayer === 1;
    const currentStreak = isP1 ? p1Streak : p2Streak;
    const points = correct ? calculatePoints(q, timeMs, currentStreak) : 0;

    const result: AnswerResult = {
      questionIndex: currentQ,
      selectedIndex: index,
      correct,
      timeMs,
      points,
    };

    if (isP1) {
      setP1Score((s) => s + points);
      setP1Results((prev) => [...prev, result]);
      if (correct) setP1Streak((s) => s + 1);
      else setP1Streak(0);
    } else {
      setP2Score((s) => s + points);
      setP2Results((prev) => [...prev, result]);
      if (correct) setP2Streak((s) => s + 1);
      else setP2Streak(0);
    }

    // Online: broadcast answer
    if (gameMode === 'online') {
      gameRoom.broadcast('answer', {
        questionIndex: currentQ,
        selectedIndex: index,
        correct,
        timeMs,
        points,
      });
    }
  }, [stopTimer, questions, currentQ, answerStartTime, gameMode, activePlayer, p1Streak, p2Streak, gameRoom]);

  const advanceQuestion = useCallback(() => {
    const nextQ = currentQ + 1;

    if (gameMode === 'local') {
      if (activePlayer === 1) {
        // Switch to P2 for same question
        setActivePlayer(2);
        setSelectedAnswer(null);
        setRevealed(false);
        setPhase('local-switch');
        return;
      } else {
        // Both answered, move to next question or end
        setActivePlayer(1);
        if (nextQ >= QUESTIONS_PER_GAME) {
          setPhase('game-over');
          return;
        }
        setCurrentQ(nextQ);
        setSelectedAnswer(null);
        setRevealed(false);
        setPhase('local-switch');
        return;
      }
    }

    // Solo / Online
    if (nextQ >= QUESTIONS_PER_GAME) {
      setPhase('game-over');
      return;
    }
    setCurrentQ(nextQ);
    setSelectedAnswer(null);
    setRevealed(false);
    startTimer();
  }, [currentQ, gameMode, activePlayer, startTimer]);

  // Auto-advance after reveal (solo/online)
  useEffect(() => {
    if (revealed && phase === 'playing' && gameMode !== 'local') {
      const timer = setTimeout(() => advanceQuestion(), 2500);
      return () => clearTimeout(timer);
    }
  }, [revealed, phase, gameMode, advanceQuestion]);

  // ── Game start ──

  const startGame = useCallback((cat: TriviaCategory | 'random') => {
    setSelectedCategory(cat);
    const qs = selectQuestions(cat);
    setQuestions(qs);
    setCurrentQ(0);
    setP1Score(0);
    setP2Score(0);
    setP1Results([]);
    setP2Results([]);
    setP1Streak(0);
    setP2Streak(0);
    setActivePlayer(1);
    setSelectedAnswer(null);
    setRevealed(false);

    if (gameMode === 'online' && gameRoom.isHost) {
      gameRoom.broadcast('game_start', { questions: qs });
    }

    setPhase('countdown');
  }, [gameMode, gameRoom]);

  const handleModeSelect = useCallback((mode: GameMode) => {
    setGameMode(mode);
    if (mode === 'online') {
      setPhase('online-lobby');
    } else {
      setPhase('category-select');
    }
  }, []);

  const handlePlayAgain = useCallback(() => {
    setPhase('category-select');
  }, []);

  const handleBackToArcade = useCallback(() => {
    navigate('/arcade');
  }, [navigate]);

  // Submit score on game over (solo)
  useEffect(() => {
    if (phase === 'game-over' && gameMode === 'solo') {
      submitScore({
        playerId: getPlayerId(),
        playerName: getDisplayName(),
        gameSlug: 'trivia-challenge',
        score: p1Score,
        gameMode: 'solo',
        metadata: {
          category: selectedCategory,
          correctCount: p1Results.filter((r) => r.correct).length,
        },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // ── Render ──

  const renderContent = () => {
    switch (phase) {
      case 'mode-select':
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-600 text-white shadow-lg shadow-violet-500/30">
                <Brain className="w-10 h-10" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight">Trivia Challenge</h1>
              <p className="text-muted-foreground max-w-md mx-auto">
                Test your knowledge across 6 categories. Answer fast for bonus points!
              </p>
            </div>

            <HowToPlayTrivia />

            <GameModeSelector onSelect={handleModeSelect} />

            {/* Stats preview */}
            {player && (
              <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
                <span>Games: {player.totalGames}</span>
                <span>Wins: {player.totalWins}</span>
                <span>Best Streak: {player.bestStreak}</span>
              </div>
            )}
          </motion.div>
        );

      case 'category-select':
        return <CategorySelector onSelect={startGame} />;

      case 'online-lobby':
        return (
          <RoomLobby
            roomCode={gameRoom.roomCode}
            isHost={gameRoom.isHost}
            opponentJoined={gameRoom.opponentJoined}
            opponentName={opponentName}
            onCreateRoom={gameRoom.createRoom}
            onJoinRoom={gameRoom.joinRoom}
            onStartGame={() => setPhase('category-select')}
            onBack={() => {
              gameRoom.leaveRoom();
              setPhase('mode-select');
            }}
          />
        );

      case 'countdown':
        return (
          <CountdownOverlay
            onComplete={() => {
              setPhase('playing');
              startTimer();
            }}
          />
        );

      case 'local-switch':
        return (
          <LocalSwitchScreen
            player={activePlayer}
            onReady={() => {
              setPhase('playing');
              startTimer();
            }}
          />
        );

      case 'playing':
      case 'answer-reveal': {
        const q = questions[currentQ];
        if (!q) return null;

        const isP1 = gameMode !== 'local' || activePlayer === 1;
        const currentScore = isP1 ? p1Score : p2Score;
        const currentResults = isP1 ? p1Results : p2Results;
        const currentStreak = isP1 ? p1Streak : p2Streak;

        return (
          <div className="space-y-4">
            <QuestionScreen
              question={q}
              questionNumber={currentQ + 1}
              totalQuestions={QUESTIONS_PER_GAME}
              timeLeft={timeLeft}
              selectedIndex={selectedAnswer}
              revealed={revealed}
              onSelect={handleAnswer}
              score={currentScore}
              streak={currentStreak}
              opponentScore={gameMode === 'online' ? p2Score : gameMode === 'local' ? (isP1 ? p2Score : p1Score) : undefined}
              playerLabel={gameMode === 'local' ? `Player ${activePlayer}` : undefined}
              results={currentResults}
            />

            {/* Local mode: Next button after reveal */}
            {revealed && gameMode === 'local' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-center pt-2"
              >
                <Button
                  size="lg"
                  className="h-12 px-8 bg-gradient-to-r from-violet-500 to-purple-600 text-white"
                  onClick={advanceQuestion}
                >
                  {activePlayer === 1 ? 'Player 2\'s Turn' : currentQ + 1 >= QUESTIONS_PER_GAME ? 'See Results' : 'Next Question'}
                </Button>
              </motion.div>
            )}
          </div>
        );
      }

      case 'game-over': {
        const won = gameMode === 'solo' ? true : p1Score > p2Score;
        const isDraw = gameMode !== 'solo' && p1Score === p2Score;
        const correctCount = p1Results.filter((r) => r.correct).length;

        return (
          <div className="space-y-6">
            <GameOverScreen
              won={gameMode === 'solo' ? true : won}
              isDraw={isDraw}
              score={p1Score}
              opponentScore={gameMode !== 'solo' ? p2Score : undefined}
              onPlayAgain={handlePlayAgain}
              onBackToArcade={handleBackToArcade}
              playerName={gameMode === 'local' ? 'Player 1' : getDisplayName()}
              opponentName={gameMode === 'local' ? 'Player 2' : opponentName || 'Opponent'}
              onShare={() => {
                const text = `I scored ${p1Score} points in Trivia Challenge on TechTrendi Arcade! ${correctCount}/${QUESTIONS_PER_GAME} correct. Can you beat me?`;
                if (navigator.share) {
                  navigator.share({ title: 'Trivia Challenge', text, url: 'https://techtrendi.com/arcade/trivia-challenge' });
                } else {
                  navigator.clipboard.writeText(text);
                }
              }}
            />

            {/* Detailed results */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="max-w-md mx-auto space-y-3"
            >
              <h3 className="text-lg font-bold text-center">
                {gameMode === 'solo' ? 'Your Answers' : 'Player 1 Answers'}
              </h3>
              <div className="space-y-2">
                {questions.map((q, i) => {
                  const result = p1Results[i];
                  if (!result) return null;
                  return (
                    <div
                      key={i}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-lg border text-sm',
                        result.correct
                          ? 'bg-green-500/5 border-green-500/20'
                          : 'bg-red-500/5 border-red-500/20',
                      )}
                    >
                      <span className={cn(
                        'flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white',
                        result.correct ? 'bg-green-500' : 'bg-red-500',
                      )}>
                        {result.correct ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      </span>
                      <span className="flex-1 truncate">{q.text}</span>
                      <span className="text-xs font-bold tabular-nums text-muted-foreground">
                        {result.points > 0 ? `+${result.points}` : '0'}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Summary stats */}
              <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="text-center p-3 rounded-xl bg-muted/50 border border-border">
                  <div className="text-xl font-black text-green-500">{correctCount}</div>
                  <div className="text-[10px] text-muted-foreground uppercase">Correct</div>
                </div>
                <div className="text-center p-3 rounded-xl bg-muted/50 border border-border">
                  <div className="text-xl font-black text-violet-500">{p1Score}</div>
                  <div className="text-[10px] text-muted-foreground uppercase">Points</div>
                </div>
                <div className="text-center p-3 rounded-xl bg-muted/50 border border-border">
                  <div className="text-xl font-black text-orange-500">
                    {Math.max(...p1Results.map((_, i) => {
                      let streak = 0;
                      for (let j = i; j >= 0; j--) {
                        if (p1Results[j]?.correct) streak++;
                        else break;
                      }
                      return streak;
                    }), 0)}
                  </div>
                  <div className="text-[10px] text-muted-foreground uppercase">Best Streak</div>
                </div>
              </div>
            </motion.div>
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <Layout>
      <SEOHead
        title="Trivia Challenge - TechTrendi Arcade"
        description="Test your knowledge across Tech, Science, History, Geography, Pop Culture and Sports. Compete for high scores in this multiplayer trivia game."
        canonical="https://techtrendi.com/arcade/trivia-challenge"
      />

      <div className="container py-6 sm:py-8 max-w-2xl mx-auto">
        {/* Back link — hide during gameplay */}
        {(phase === 'mode-select' || phase === 'category-select' || phase === 'game-over') && (
          <Link
            to="/arcade"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Arcade
          </Link>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={phase + (phase === 'playing' ? `-${currentQ}-${activePlayer}` : '')}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </Layout>
  );
}
