/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Member {
  id: number;
  name: string;
  nickname: string;
  description: string;
}

export interface GameState {
  score: number;
  highScore: number;
  lives: number;
  gameOver: boolean;
  isPlaying: boolean;
  level: number;
}

export interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  targetY: number; // For smooth touch/mouse dragging
  flameFrame: number;
}

export interface Bullet {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  color: string;
}

export enum TargetType {
  FAST_SMALL = 'fast_small',
  MEDIUM_REGULAR = 'medium_regular',
  SLOW_LARGE = 'slow_large'
}

export interface Target {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  speedX: number;
  speedY: number;
  type: TargetType;
  points: number;
  color: string;
  emoji?: string; // Retro geometric or emoji shape
  health: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
}

export interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
  color: string;
}
