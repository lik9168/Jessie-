import { Type } from "@google/genai";

export enum GameState {
  START = 'START',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  GAME_OVER = 'GAME_OVER'
}

export interface Point {
  x: number;
  y: number;
}

export interface Entity {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  health: number;
  maxHealth: number;
}

export enum EnemyType {
  BASIC = 'BASIC',
  FAST = 'FAST',
  HEAVY = 'HEAVY'
}

export interface Enemy extends Entity {
  type: EnemyType;
  scoreValue: number;
  color: string;
  lastShotTime: number;
  shootInterval: number;
}

export enum ItemType {
  TRIPLE_SHOT = 'TRIPLE_SHOT',
  SHIELD = 'SHIELD',
  HEALTH = 'HEALTH'
}

export interface Item extends Entity {
  type: ItemType;
  color: string;
}

export interface Bullet extends Entity {
  damage: number;
  isPlayerBullet: boolean;
  angle: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  icon: string;
}

export interface GameStats {
  score: number;
  level: number;
  health: number;
  maxHealth: number;
  enemiesKilled: number;
  itemsCollected: number;
  startTime: number;
  shieldActive: boolean;
  tripleShotActive: boolean;
  tripleShotTimer: number;
}
