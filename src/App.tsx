import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Shield, 
  Zap, 
  Trophy, 
  Target, 
  Flame, 
  Info,
  ChevronRight,
  Heart,
  Gamepad2,
  Volume2,
  VolumeX
} from 'lucide-react';
import { GameEngine } from './GameEngine';
import { GameState, Achievement } from './types';
import { ACHIEVEMENTS } from './constants';
import { AudioManager } from './AudioManager';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const audioRef = useRef<AudioManager | null>(null);
  const [gameState, setGameState] = useState<GameState>(GameState.START);
  const [isMuted, setIsMuted] = useState(false);
  const [stats, setStats] = useState({
    score: 0,
    level: 1,
    health: 3,
    shield: false,
    triple: false
  });
  const [unlockedAchievements, setUnlockedAchievements] = useState<Set<string>>(new Set());
  const [lastUnlocked, setLastUnlocked] = useState<Achievement | null>(null);

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new AudioManager();
    }
  }, []);

  useEffect(() => {
    if (gameState === GameState.PLAYING && !isMuted) {
      audioRef.current?.startMusic();
    } else {
      audioRef.current?.stopMusic();
    }
  }, [gameState, isMuted]);

  useEffect(() => {
    if (canvasRef.current && !engineRef.current) {
      engineRef.current = new GameEngine(canvasRef.current);
      
      engineRef.current.onGameOver = () => {
        setGameState(GameState.GAME_OVER);
      };

      engineRef.current.onLevelUp = (level) => {
        setStats(prev => ({ ...prev, level }));
      };

      engineRef.current.onAchievementUnlocked = (id) => {
        setUnlockedAchievements(prev => {
          if (prev.has(id)) return prev;
          const achievement = ACHIEVEMENTS.find(a => a.id === id);
          if (achievement) {
            setLastUnlocked(achievement);
            setTimeout(() => setLastUnlocked(null), 3000);
          }
          return new Set(prev).add(id);
        });
      };

      const handleResize = () => {
        if (engineRef.current && canvasRef.current) {
          engineRef.current.resize(window.innerWidth, window.innerHeight);
        }
      };

      window.addEventListener('resize', handleResize);
      handleResize();
    }

    let animationFrame: number;
    const loop = (time: number) => {
      if (engineRef.current) {
        if (gameState === GameState.PLAYING) {
          engineRef.current.update(time);
          setStats({
            score: engineRef.current.stats.score,
            level: engineRef.current.stats.level,
            health: engineRef.current.stats.health,
            shield: engineRef.current.stats.shieldActive,
            triple: engineRef.current.stats.tripleShotActive
          });
        }
        engineRef.current.draw();
      }
      animationFrame = requestAnimationFrame(loop);
    };
    animationFrame = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [gameState]);

  const startGame = () => {
    if (engineRef.current) {
      engineRef.current.stats = {
        score: 0,
        level: 1,
        health: 3,
        maxHealth: 3,
        enemiesKilled: 0,
        itemsCollected: 0,
        startTime: Date.now(),
        shieldActive: false,
        tripleShotActive: false,
        tripleShotTimer: 0
      };
      engineRef.current.enemies = [];
      engineRef.current.bullets = [];
      engineRef.current.items = [];
      engineRef.current.particles = [];
    }
    setGameState(GameState.PLAYING);
  };

  const togglePause = () => {
    setGameState(prev => prev === GameState.PLAYING ? GameState.PAUSED : GameState.PLAYING);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyP') togglePause();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="relative w-full h-screen bg-sky-400 overflow-hidden font-sans">
      <canvas 
        ref={canvasRef} 
        className="block w-full h-full"
        onMouseMove={(e) => {
          if (gameState === GameState.PLAYING && engineRef.current) {
            // Optional mouse control
          }
        }}
        onTouchMove={(e) => {
          if (gameState === GameState.PLAYING && engineRef.current) {
            const touch = e.touches[0];
            engineRef.current.handleTouch(touch.clientX, touch.clientY);
          }
        }}
      />

      {/* HUD */}
      {gameState !== GameState.START && (
        <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-start pointer-events-none">
          <div className="flex flex-col gap-2">
            <div className="glass px-4 py-2 rounded-xl flex items-center gap-4">
              <div className="flex items-center gap-1">
                {[...Array(3)].map((_, i) => (
                  <Heart 
                    key={i} 
                    size={20} 
                    className={i < stats.health ? "fill-red-500 text-red-500" : "text-slate-900/20"} 
                  />
                ))}
              </div>
              <div className="w-px h-4 bg-slate-900/20" />
              <div className="font-display font-bold text-xl tracking-wider text-slate-900">
                {stats.score.toLocaleString()}
              </div>
            </div>
            <div className="flex gap-2">
              {stats.shield && (
                <motion.div 
                  initial={{ scale: 0 }} 
                  animate={{ scale: 1 }} 
                  className="bg-violet-500/20 border border-violet-500/50 p-2 rounded-lg"
                >
                  <Shield size={16} className="text-violet-600" />
                </motion.div>
              )}
              {stats.triple && (
                <motion.div 
                  initial={{ scale: 0 }} 
                  animate={{ scale: 1 }} 
                  className="bg-amber-500/20 border border-amber-500/50 p-2 rounded-lg"
                >
                  <Zap size={16} className="text-amber-600" />
                </motion.div>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="glass px-4 py-2 rounded-xl font-display font-bold text-sm tracking-widest uppercase text-emerald-600">
              Level {stats.level}
            </div>
            <div className="flex gap-2 pointer-events-auto">
              <button 
                onClick={() => setIsMuted(!isMuted)}
                className="glass p-3 rounded-xl hover:bg-white/40 transition-colors text-slate-900"
              >
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
              <button 
                onClick={togglePause}
                className="glass p-3 rounded-xl hover:bg-white/40 transition-colors text-slate-900"
              >
                {gameState === GameState.PAUSED ? <Play size={20} /> : <Pause size={20} />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar (Desktop only) */}
      <div className="hidden lg:flex absolute right-6 top-1/2 -translate-y-1/2 flex-col gap-6 w-64">
        <div className="glass-dark p-6 rounded-2xl">
          <h3 className="font-display text-xs font-bold uppercase tracking-widest text-slate-900/40 mb-4 flex items-center gap-2">
            <Gamepad2 size={14} /> 操作指南
          </h3>
          <ul className="space-y-3 text-sm text-slate-900/70">
            <li className="flex justify-between"><span>移动</span> <span className="text-slate-900 font-mono">WASD / 方向键</span></li>
            <li className="flex justify-between"><span>射击</span> <span className="text-slate-900 font-mono">空格键</span></li>
            <li className="flex justify-between"><span>暂停</span> <span className="text-slate-900 font-mono">P 键</span></li>
          </ul>
        </div>

        <div className="glass-dark p-6 rounded-2xl">
          <h3 className="font-display text-xs font-bold uppercase tracking-widest text-slate-900/40 mb-4 flex items-center gap-2">
            <Zap size={14} /> 道具说明
          </h3>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/50 flex items-center justify-center shrink-0">
                <Zap size={16} className="text-amber-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">三向子弹</p>
                <p className="text-[10px] text-slate-900/50">大幅提升火力覆盖范围</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-violet-500/20 border border-violet-500/50 flex items-center justify-center shrink-0">
                <Shield size={16} className="text-violet-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">能量护盾</p>
                <p className="text-[10px] text-slate-900/50">抵挡一次致命攻击</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-500/20 border border-red-500/50 flex items-center justify-center shrink-0">
                <Heart size={16} className="text-red-600 fill-red-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">医疗包</p>
                <p className="text-[10px] text-slate-900/50">恢复 1 点生命值</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Overlays */}
      <AnimatePresence>
        {gameState === GameState.START && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-sky-400/80 backdrop-blur-sm z-50 p-6"
          >
            <div className="max-w-md w-full text-center">
              <motion.h1 
                initial={{ y: -20 }}
                animate={{ y: 0 }}
                className="font-display text-5xl md:text-7xl font-black italic tracking-tighter mb-2 text-slate-900"
              >
                JESSIE'S
              </motion.h1>
              <motion.h2 
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="font-display text-xl md:text-2xl font-bold tracking-[0.3em] uppercase text-emerald-600 mb-12"
              >
                星际先锋
              </motion.h2>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={startGame}
                className="group relative px-12 py-4 bg-slate-900 text-white font-display font-black text-xl uppercase tracking-widest rounded-full overflow-hidden shadow-[0_0_30px_rgba(15,23,42,0.4)]"
              >
                <span className="relative z-10 flex items-center gap-2">
                  开始游戏 <ChevronRight size={24} />
                </span>
                <div className="absolute inset-0 bg-emerald-500 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              </motion.button>

              <p className="mt-12 text-slate-900/40 text-xs uppercase tracking-widest">
                使用键盘或触摸屏进行操作
              </p>
            </div>
          </motion.div>
        )}

        {gameState === GameState.PAUSED && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-sky-400/60 backdrop-blur-sm z-50"
          >
            <div className="glass-dark p-12 rounded-3xl text-center min-w-[300px]">
              <h2 className="font-display text-4xl font-black uppercase tracking-widest mb-8 text-slate-900">游戏暂停</h2>
              <div className="flex flex-col gap-4">
                <button 
                  onClick={togglePause}
                  className="px-8 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Play size={20} /> 继续游戏
                </button>
                <button 
                  onClick={() => setGameState(GameState.START)}
                  className="px-8 py-3 bg-slate-900/10 text-slate-900 font-bold rounded-xl hover:bg-slate-900/20 transition-colors"
                >
                  退出到主菜单
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {gameState === GameState.GAME_OVER && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-sky-400/90 z-50 p-6"
          >
            <div className="max-w-2xl w-full">
              <div className="text-center mb-12">
                <h2 className="font-display text-6xl font-black uppercase tracking-tighter text-red-600 mb-4">任务失败</h2>
                <div className="flex justify-center gap-12">
                  <div>
                    <p className="text-slate-900/40 text-xs uppercase tracking-widest mb-1">最终得分</p>
                    <p className="font-display text-4xl font-bold text-slate-900">{stats.score.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-slate-900/40 text-xs uppercase tracking-widest mb-1">最高关卡</p>
                    <p className="font-display text-4xl font-bold text-slate-900">{stats.level}</p>
                  </div>
                </div>
              </div>

              <div className="glass-dark p-8 rounded-3xl mb-12">
                <h3 className="font-display text-sm font-bold uppercase tracking-widest text-slate-900/40 mb-6 flex items-center gap-2">
                  <Trophy size={16} /> 获得成就
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {ACHIEVEMENTS.map(achievement => (
                    <div 
                      key={achievement.id}
                      className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                        unlockedAchievements.has(achievement.id) 
                        ? "bg-emerald-500/10 border-emerald-500/30 opacity-100" 
                        : "bg-slate-900/5 border-slate-900/10 opacity-30"
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${unlockedAchievements.has(achievement.id) ? "bg-emerald-500/20 text-emerald-600" : "bg-slate-900/10 text-slate-900/40"}`}>
                        {achievement.id === 'first_blood' && <Target size={20} />}
                        {achievement.id === 'survivor' && <Shield size={20} />}
                        {achievement.id === 'ace_pilot' && <Trophy size={20} />}
                        {achievement.id === 'collector' && <Zap size={20} />}
                        {achievement.id === 'unstoppable' && <Flame size={20} />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{achievement.name}</p>
                        <p className="text-[10px] text-slate-900/50">{achievement.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-center gap-6">
                <button 
                  onClick={startGame}
                  className="px-12 py-4 bg-slate-900 text-white font-display font-black text-xl uppercase tracking-widest rounded-full shadow-[0_0_30px_rgba(15,23,42,0.4)] flex items-center gap-2"
                >
                  <RotateCcw size={24} /> 再次挑战
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Achievement Popup */}
      <AnimatePresence>
        {lastUnlocked && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="absolute bottom-12 left-1/2 -translate-x-1/2 z-[100]"
          >
            <div className="glass px-6 py-4 rounded-2xl flex items-center gap-4 border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
              <div className="p-2 bg-emerald-500 rounded-lg text-white">
                <Trophy size={20} />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-emerald-600 font-bold">成就解锁</p>
                <p className="text-sm font-bold text-slate-900">{lastUnlocked.name}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
