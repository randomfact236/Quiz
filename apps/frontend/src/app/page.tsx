'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function HomePage(): JSX.Element {
  const [topicsExpanded, setTopicsExpanded] = useState(true);
  const [academicExpanded, setAcademicExpanded] = useState(true);
  const [professionalExpanded, setProfessionalExpanded] = useState(true);
  const [entertainmentExpanded, setEntertainmentExpanded] = useState(false);

  return (
    <main id="main-content" className="min-h-screen bg-gradient-to-b from-[#A5A3E4] to-[#BF7076] px-4 py-8">
      {/* Bubble Background Effect - using deterministic values to avoid hydration mismatch */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        {[50, 80, 60, 90, 70, 55, 85, 65, 75, 95].map((size, i) => (
          <div
            key={i}
            className="absolute animate-pulse rounded-full bg-white/10"
            style={{
              width: `${size}px`,
              height: `${size + 10}px`,
              left: `${(i * 10 + 5) % 100}%`,
              top: `${(i * 13 + 7) % 100}%`,
              animationDelay: `${i * 0.5}s`,
            }}
          />
        ))}
      </div>

      <div className="relative mx-auto max-w-2xl">
        {/* Home Page Content */}
        <div className="home-content">
          
          {/* Topics Section - Collapsible */}
          <div className="mb-6 overflow-hidden rounded-2xl bg-white/95 shadow-lg">
            <button
              onClick={() => setTopicsExpanded(!topicsExpanded)}
              className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-gray-50"
            >
              <h2 className="text-xl font-bold text-gray-800">📚 Topics</h2>
              <span className={`text-gray-500 transition-transform ${topicsExpanded ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>
            
            {topicsExpanded && (
              <div className="space-y-2 p-4 pt-0">
                
                {/* ACADEMIC Section */}
                <div className="rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 p-3">
                  <button
                    onClick={() => setAcademicExpanded(!academicExpanded)}
                    className="flex w-full items-center justify-between"
                  >
                    <h3 className="font-semibold text-indigo-700">━━━━ ACADEMIC ━━━━</h3>
                    <span className={`text-indigo-500 transition-transform ${academicExpanded ? 'rotate-180' : ''}`}>▼</span>
                  </button>
                  
                  {academicExpanded && (
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <Link href="/quiz?subject=science" className="flex flex-col items-center rounded-lg bg-white p-3 text-center shadow-sm transition-all hover:scale-105 hover:shadow-md">
                        <span className="text-2xl">🔬</span>
                        <span className="mt-1 text-xs font-medium text-gray-700">Science</span>
                      </Link>
                      <Link href="/quiz?subject=math" className="flex flex-col items-center rounded-lg bg-white p-3 text-center shadow-sm transition-all hover:scale-105 hover:shadow-md">
                        <span className="text-2xl">🔢</span>
                        <span className="mt-1 text-xs font-medium text-gray-700">Math</span>
                      </Link>
                      <Link href="/quiz?subject=history" className="flex flex-col items-center rounded-lg bg-white p-3 text-center shadow-sm transition-all hover:scale-105 hover:shadow-md">
                        <span className="text-2xl">📜</span>
                        <span className="mt-1 text-xs font-medium text-gray-700">History</span>
                      </Link>
                      <Link href="/quiz?subject=geography" className="flex flex-col items-center rounded-lg bg-white p-3 text-center shadow-sm transition-all hover:scale-105 hover:shadow-md">
                        <span className="text-2xl">🌍</span>
                        <span className="mt-1 text-xs font-medium text-gray-700">Geography</span>
                      </Link>
                      <Link href="/quiz?subject=english" className="flex flex-col items-center rounded-lg bg-white p-3 text-center shadow-sm transition-all hover:scale-105 hover:shadow-md">
                        <span className="text-2xl">📖</span>
                        <span className="mt-1 text-xs font-medium text-gray-700">English</span>
                      </Link>
                      <Link href="/quiz?subject=environment" className="flex flex-col items-center rounded-lg bg-white p-3 text-center shadow-sm transition-all hover:scale-105 hover:shadow-md">
                        <span className="text-2xl">🌱</span>
                        <span className="mt-1 text-xs font-medium text-gray-700">Environment</span>
                      </Link>
                    </div>
                  )}
                </div>

                {/* PROFESSIONAL & LIFE Section */}
                <div className="rounded-xl bg-gradient-to-r from-green-50 to-teal-50 p-3">
                  <button
                    onClick={() => setProfessionalExpanded(!professionalExpanded)}
                    className="flex w-full items-center justify-between"
                  >
                    <h3 className="font-semibold text-teal-700">━━━━ PROFESSIONAL & LIFE ━━━━</h3>
                    <span className={`text-teal-500 transition-transform ${professionalExpanded ? 'rotate-180' : ''}`}>▼</span>
                  </button>
                  
                  {professionalExpanded && (
                    <div className="mt-3 grid grid-cols-4 gap-2">
                      <Link href="/quiz?subject=technology" className="flex flex-col items-center rounded-lg bg-white p-3 text-center shadow-sm transition-all hover:scale-105 hover:shadow-md">
                        <span className="text-2xl">💻</span>
                        <span className="mt-1 text-xs font-medium text-gray-700">Technology</span>
                      </Link>
                      <Link href="/quiz?subject=business" className="flex flex-col items-center rounded-lg bg-white p-3 text-center shadow-sm transition-all hover:scale-105 hover:shadow-md">
                        <span className="text-2xl">💼</span>
                        <span className="mt-1 text-xs font-medium text-gray-700">Business</span>
                      </Link>
                      <Link href="/quiz?subject=health" className="flex flex-col items-center rounded-lg bg-white p-3 text-center shadow-sm transition-all hover:scale-105 hover:shadow-md">
                        <span className="text-2xl">💪</span>
                        <span className="mt-1 text-xs font-medium text-gray-700">Health</span>
                      </Link>
                      <Link href="/quiz?subject=parenting" className="flex flex-col items-center rounded-lg bg-white p-3 text-center shadow-sm transition-all hover:scale-105 hover:shadow-md">
                        <span className="text-2xl">👶</span>
                        <span className="mt-1 text-xs font-medium text-gray-700">Parenting</span>
                      </Link>
                    </div>
                  )}
                </div>

                {/* ENTERTAINMENT & CULTURE Section */}
                <div className="rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 p-3">
                  <button
                    onClick={() => setEntertainmentExpanded(!entertainmentExpanded)}
                    className="flex w-full items-center justify-between"
                  >
                    <h3 className="font-semibold text-purple-700">━━━━ ENTERTAINMENT & CULTURE ━━━━</h3>
                    <span className={`text-purple-500 transition-transform ${entertainmentExpanded ? 'rotate-180' : ''}`}>▼</span>
                  </button>
                  
                  {entertainmentExpanded && (
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <div className="relative flex flex-col items-center rounded-lg bg-white p-3 text-center shadow-sm opacity-60">
                        <span className="absolute -top-2 -right-2 rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-bold text-white">Soon</span>
                        <span className="text-2xl">🐾</span>
                        <span className="mt-1 text-xs font-medium text-gray-700">Animals</span>
                      </div>
                      <div className="relative flex flex-col items-center rounded-lg bg-white p-3 text-center shadow-sm opacity-60">
                        <span className="absolute -top-2 -right-2 rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-bold text-white">Soon</span>
                        <span className="text-2xl">🎬</span>
                        <span className="mt-1 text-xs font-medium text-gray-700">Movies</span>
                      </div>
                      <div className="relative flex flex-col items-center rounded-lg bg-white p-3 text-center shadow-sm opacity-60">
                        <span className="absolute -top-2 -right-2 rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-bold text-white">Soon</span>
                        <span className="text-2xl">🏆</span>
                        <span className="mt-1 text-xs font-medium text-gray-700">Sports</span>
                      </div>
                      <div className="relative flex flex-col items-center rounded-lg bg-white p-3 text-center shadow-sm opacity-60">
                        <span className="absolute -top-2 -right-2 rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-bold text-white">Soon</span>
                        <span className="text-2xl">🍔</span>
                        <span className="mt-1 text-xs font-medium text-gray-700">Food</span>
                      </div>
                      <div className="relative flex flex-col items-center rounded-lg bg-white p-3 text-center shadow-sm opacity-60">
                        <span className="absolute -top-2 -right-2 rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-bold text-white">Soon</span>
                        <span className="text-2xl">🎨</span>
                        <span className="mt-1 text-xs font-medium text-gray-700">Art</span>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>

          {/* Other Mode Cards */}
          <div className="grid grid-cols-2 gap-4">
            <Link href="/quiz?mode=timer" className="flex flex-col items-center rounded-2xl bg-white/95 p-6 text-center shadow-lg transition-all hover:scale-105 hover:bg-white hover:shadow-xl">
              <span className="text-4xl">⏱️</span>
              <span className="mt-2 font-bold text-gray-800">Timer Challenges</span>
              <span className="text-sm text-gray-500">Mix - All Subjects</span>
            </Link>
            <Link href="/quiz?mode=practice" className="flex flex-col items-center rounded-2xl bg-white/95 p-6 text-center shadow-lg transition-all hover:scale-105 hover:bg-white hover:shadow-xl">
              <span className="text-4xl">🎯</span>
              <span className="mt-2 font-bold text-gray-800">Practice Mode</span>
              <span className="text-sm text-gray-500">Mix - No Timer</span>
            </Link>
            <Link href="/riddles" className="flex flex-col items-center rounded-2xl bg-white/95 p-6 text-center shadow-lg transition-all hover:scale-105 hover:bg-white hover:shadow-xl">
              <span className="text-4xl">🎭</span>
              <span className="mt-2 font-bold text-gray-800">Riddles</span>
              <span className="text-sm text-gray-500">Brain Teasers</span>
            </Link>
            <Link href="/image-riddles" className="flex flex-col items-center rounded-2xl bg-white/95 p-6 text-center shadow-lg transition-all hover:scale-105 hover:bg-white hover:shadow-xl">
              <span className="text-4xl">🖼️</span>
              <span className="mt-2 font-bold text-gray-800">Image Riddles</span>
              <span className="text-sm text-gray-500">Visual Puzzles</span>
            </Link>
            <Link href="/jokes" className="flex flex-col items-center rounded-2xl bg-white/95 p-6 text-center shadow-lg transition-all hover:scale-105 hover:bg-white hover:shadow-xl">
              <span className="text-4xl">😂</span>
              <span className="mt-2 font-bold text-gray-800">Dad Jokes</span>
              <span className="text-sm text-gray-500">Fun Time</span>
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-6 grid grid-cols-3 gap-4 text-center">
            <div className="rounded-xl bg-white/20 p-3 backdrop-blur">
              <p className="text-2xl font-bold text-white">500+</p>
              <p className="text-xs text-white/80">Questions</p>
            </div>
            <div className="rounded-xl bg-white/20 p-3 backdrop-blur">
              <p className="text-2xl font-bold text-white">200+</p>
              <p className="text-xs text-white/80">Jokes</p>
            </div>
            <div className="rounded-xl bg-white/20 p-3 backdrop-blur">
              <p className="text-2xl font-bold text-white">20</p>
              <p className="text-xs text-white/80">Chapters</p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center text-sm text-white/60">
            <p>© 2026 AI Quiz Platform</p>
          </div>
        </div>
      </div>
    </main>
  );
}