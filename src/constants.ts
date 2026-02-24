import { Achievement } from './types';

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_blood',
    name: '第一滴血',
    description: '击落第一架敌机',
    unlocked: false,
    icon: 'Target'
  },
  {
    id: 'survivor',
    name: '生存者',
    description: '在单局游戏中坚持超过 60 秒',
    unlocked: false,
    icon: 'Shield'
  },
  {
    id: 'ace_pilot',
    name: '王牌飞行员',
    description: '击落 50 架敌机',
    unlocked: false,
    icon: 'Trophy'
  },
  {
    id: 'collector',
    name: '收集者',
    description: '收集 5 个道具',
    unlocked: false,
    icon: 'Zap'
  },
  {
    id: 'unstoppable',
    name: '势不可挡',
    description: '达到第 5 关',
    unlocked: false,
    icon: 'Flame'
  }
];

export const ENEMY_CONFIGS = {
  BASIC: {
    speed: 2,
    health: 1,
    scoreValue: 100,
    color: '#34d399', // Emerald 400
    width: 40,
    height: 40,
    shootInterval: 2000
  },
  FAST: {
    speed: 4,
    health: 1,
    scoreValue: 200,
    color: '#60a5fa', // Blue 400
    width: 30,
    height: 30,
    shootInterval: 1500
  },
  HEAVY: {
    speed: 1,
    health: 3,
    scoreValue: 500,
    color: '#f87171', // Red 400
    width: 60,
    height: 60,
    shootInterval: 3000
  }
};

export const ITEM_CONFIGS = {
  TRIPLE_SHOT: {
    color: '#fbbf24', // Amber 400
    duration: 10000
  },
  SHIELD: {
    color: '#a78bfa', // Violet 400
    duration: 0 // Instant/One-time
  },
  HEALTH: {
    color: '#ef4444', // Red 500
    duration: 0
  }
};
