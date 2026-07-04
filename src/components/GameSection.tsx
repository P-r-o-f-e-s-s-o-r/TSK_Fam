/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState, PointerEvent } from 'react';
import { GameState, Player, Bullet, Target, Particle, Star, TargetType } from '../types';
import { Play, RotateCcw, Volume2, VolumeX, Shield, Trophy } from 'lucide-react';

// Web Audio API Sound Generator for retro arcade sounds
class SoundManager {
  private ctx: AudioContext | null = null;
  public muted: boolean = false;

  private init() {
    if (!this.ctx && typeof window !== 'undefined') {
      try {
        this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (e) {
        console.error('Web Audio API not supported', e);
      }
    }
  }

  playLaser() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(600, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.12);
    
    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.12);
  }

  playExplosion(isLarge: boolean = false) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(isLarge ? 180 : 300, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(10, this.ctx.currentTime + (isLarge ? 0.5 : 0.3));
    
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + (isLarge ? 0.5 : 0.3));
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start();
    osc.stop(this.ctx.currentTime + (isLarge ? 0.5 : 0.3));
  }

  playHit() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, this.ctx.currentTime);
    osc.frequency.setValueAtTime(100, this.ctx.currentTime + 0.05);
    
    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.08);
  }

  playHurt() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(40, this.ctx.currentTime + 0.25);
    
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.25);
  }

  playGameOver() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(250, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(50, this.ctx.currentTime + 0.8);
    
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.8);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.8);
  }
}

const sounds = new SoundManager();

export default function GameSection() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // High score tracking from LocalStorage
  const [highScore, setHighScore] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('tsk_game_highscore');
      return saved ? parseInt(saved, 10) : 0;
    }
    return 0;
  });

  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    highScore: highScore,
    lives: 3,
    gameOver: false,
    isPlaying: false,
    level: 1,
  });

  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [useAutoFire, setUseAutoFire] = useState<boolean>(true);

  // References to keep mutable game engine parameters out of React render cycles
  const gameLoopRef = useRef<number | null>(null);
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const spaceshipImageRef = useRef<HTMLImageElement | null>(null);
  const isImageLoadedRef = useRef<boolean>(false);
  const targetImage1Ref = useRef<HTMLImageElement | null>(null);
  const targetImage2Ref = useRef<HTMLImageElement | null>(null);
  const targetImage3Ref = useRef<HTMLImageElement | null>(null);
  const areTargetImagesLoadedRef = useRef<{ target1: boolean; target2: boolean; target3: boolean }>({
    target1: false,
    target2: false,
    target3: false,
  });

  // Canvas internal virtual resolution
  const V_WIDTH = 800;
  const V_HEIGHT = 480;

  // Game entity collections
  const playerRef = useRef<Player>({
    x: 80,
    y: V_HEIGHT / 2 - 30,
    width: 120, // horizontal bounding box matching original image layout
    height: 67,
    speed: 7,
    targetY: V_HEIGHT / 2 - 30,
    flameFrame: 0,
  });

  const bulletsRef = useRef<Bullet[]>([]);
  const targetsRef = useRef<Target[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const starsRef = useRef<Star[]>([]);

  // Spawn counters
  const lastSpawnTime = useRef<number>(0);
  const lastShotTime = useRef<number>(0);
  const levelTimer = useRef<number>(0);
  const screenFlashAlpha = useRef<number>(0);

  // Initialize stars once
  useEffect(() => {
    const stars: Star[] = [];
    const colors = ['#ffffff', '#a5f3fc', '#c084fc', '#e9d5ff'];
    for (let i = 0; i < 80; i++) {
      stars.push({
        x: Math.random() * V_WIDTH,
        y: Math.random() * V_HEIGHT,
        size: Math.random() * 2 + 0.5,
        speed: Math.random() * 2 + 0.5,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
    starsRef.current = stars;
  }, []);

  // Set up ship image loader with multi-stage fallback (SVG vector, PNG assets, and embedded Base64 backup)
  useEffect(() => {
    const img = new Image();
    
    // High-fidelity vector SVG matching the exact user-provided image (Woman flying horizontally with rocket fire on feet)
    const highFidelitySvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 250" width="500" height="250">
  <defs>
    <!-- Dress Pattern definition -->
    <pattern id="dress-pattern" width="10" height="10" patternUnits="userSpaceOnUse">
      <path d="M 5,0 L 10,5 L 5,10 L 0,5 Z" fill="none" stroke="#e0b8b1" stroke-width="0.8" />
      <circle cx="5" cy="5" r="1" fill="#fbcfe8" />
    </pattern>
    
    <!-- Shading Gradients -->
    <linearGradient id="flame-red" x1="0%" y1="50%" x2="100%" y2="50%">
      <stop offset="0%" stop-color="#dc2626" />
      <stop offset="100%" stop-color="#ef4444" />
    </linearGradient>
    <linearGradient id="flame-orange" x1="0%" y1="50%" x2="100%" y2="50%">
      <stop offset="0%" stop-color="#ea580c" />
      <stop offset="100%" stop-color="#f97316" />
    </linearGradient>
    <linearGradient id="flame-yellow" x1="0%" y1="50%" x2="100%" y2="50%">
      <stop offset="0%" stop-color="#ca8a04" />
      <stop offset="100%" stop-color="#facc15" />
    </linearGradient>
    
    <linearGradient id="skin-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffedd5" />
      <stop offset="100%" stop-color="#fed7aa" />
    </linearGradient>
  </defs>

  <!-- FLAME BOOST SYSTEM (Left side / hips down) -->
  <g id="flame-propulsion">
    <!-- Outer Red Flame -->
    <path d="M 190,125 
             C 140,80 70,60 30,125 
             C 10,140 15,160 5,175 
             C 40,195 90,210 135,200
             C 90,215 110,230 150,220
             C 170,215 180,185 190,175
             C 180,170 170,165 190,155
             Z" fill="url(#flame-red)" />
             
    <!-- Middle Orange Flame -->
    <path d="M 180,125 
             C 145,95 90,85 60,125 
             C 45,135 50,150 40,165 
             C 70,180 110,190 145,185
             C 115,195 125,205 150,200
             C 165,195 175,175 180,165
             C 172,160 165,155 180,148
             Z" fill="url(#flame-orange)" />
             
    <!-- Inner Yellow Core -->
    <path d="M 165,125 
             C 140,105 110,100 90,125 
             C 80,132 85,142 80,152 
             C 100,162 130,170 150,165
             C 158,160 162,145 165,138
             Z" fill="url(#flame-yellow)" />
  </g>

  <!-- THE WOMAN (Horizontal flying layout) -->
  <g id="woman-pilot">
    <!-- Under hair shadow / Back hair -->
    <path d="M 280,100 C 270,60 390,50 395,110 C 390,170 330,190 280,150 Z" fill="#111827" />

    <!-- Body / Kurti / Dress -->
    <!-- Base fabric (dusty rose/beige) -->
    <path d="M 175,125 
             C 190,110 250,110 335,115 
             C 340,120 345,125 348,135
             C 348,155 340,170 335,175 
             C 250,180 190,180 175,165 
             Z" fill="#b4837a" />
             
    <!-- Pattern Overlay -->
    <path d="M 175,125 
             C 190,110 250,110 335,115 
             C 340,120 345,125 348,135
             C 348,155 340,170 335,175 
             C 250,180 190,180 175,165 
             Z" fill="url(#dress-pattern)" opacity="0.85" />

    <!-- Dress folds & shading -->
    <path d="M 180,135 C 220,130 280,135 330,132" stroke="#83544c" stroke-width="2" fill="none" opacity="0.4" />
    <path d="M 180,155 C 220,158 280,155 330,158" stroke="#83544c" stroke-width="2" fill="none" opacity="0.4" />

    <!-- White Embroidered Bodice / Neckline Details -->
    <path d="M 305,115 C 315,118 330,125 335,135 C 330,145 315,148 305,148 Z" fill="#ffffff" opacity="0.9" />
    <path d="M 310,122 C 318,125 325,130 328,135 C 325,140 318,142 310,142 Z" fill="#fdf2f8" />
    <circle cx="318" cy="135" r="2" fill="#b4837a" />
    <circle cx="325" cy="135" r="1.5" fill="#b4837a" />

    <!-- Left Arm & Sleeve -->
    <path d="M 220,113 C 240,105 280,115 295,125 C 285,135 250,130 220,125 Z" fill="#b4837a" />
    <path d="M 220,113 C 240,105 280,115 295,125 C 285,135 250,130 220,125 Z" fill="url(#dress-pattern)" opacity="0.8" />
    <path d="M 295,125 C 298,126 302,125 305,128 C 302,132 298,131 295,130 Z" fill="url(#skin-gradient)" />

    <!-- Neck -->
    <rect x="330" y="125" width="22" height="18" rx="2" fill="url(#skin-gradient)" />
    <!-- Neck shadow -->
    <path d="M 330,138 C 335,140 342,140 348,138" stroke="#fbcfe8" stroke-width="2" fill="none" />

    <!-- Head / Face -->
    <path d="M 345,115 
             C 355,100 385,100 395,120 
             C 405,135 395,160 380,165 
             C 365,168 350,155 345,145 
             Z" fill="url(#skin-gradient)" />

    <!-- Face Details -->
    <!-- Soft Cheeks -->
    <circle cx="375" cy="142" r="6" fill="#fecdd3" opacity="0.5" />
    <!-- Smiling Eyes -->
    <path d="M 370,126 Q 375,123 378,126" stroke="#1e293b" stroke-width="2.5" fill="none" stroke-linecap="round" />
    <path d="M 382,128 Q 387,125 390,128" stroke="#1e293b" stroke-width="2.5" fill="none" stroke-linecap="round" />
    <!-- Eyebrows -->
    <path d="M 368,121 Q 374,117 379,120" stroke="#0f172a" stroke-width="1.8" fill="none" />
    <path d="M 381,122 Q 387,118 392,121" stroke="#0f172a" stroke-width="1.8" fill="none" />
    <!-- Cute Nose -->
    <path d="M 388,135 Q 391,137 388,139" stroke="#fda4af" stroke-width="2" fill="none" stroke-linecap="round" />
    <!-- Smiling Lips -->
    <path d="M 374,147 Q 382,154 388,147" stroke="#dc2626" stroke-width="3" fill="none" stroke-linecap="round" />
    <path d="M 375,147 Q 382,151 387,147" stroke="#fecdd3" stroke-width="1.5" fill="none" stroke-linecap="round" />

    <!-- Hair (flowing backwards elegantly) -->
    <!-- Front Hair part -->
    <path d="M 345,120 C 352,105 370,105 378,112 C 385,105 395,108 398,120 C 392,116 384,116 378,122 C 372,116 354,116 345,120 Z" fill="#1e293b" />
    <!-- Side Hair curls -->
    <path d="M 342,122 C 335,135 340,155 330,165 C 342,168 348,155 348,140 Z" fill="#0f172a" />
    <path d="M 392,122 C 400,135 395,155 405,165 C 395,168 388,155 388,140 Z" fill="#0f172a" />
    <!-- Flowing Hair behind her back -->
    <path d="M 320,100 C 260,110 240,140 220,160 C 245,155 270,140 310,135 Z" fill="#1e293b" />
  </g>
</svg>
    `;

    // Attempt to load from multiple sources in sequence
    const loadSources = [
      '/assets/spaceship (2).png', // primary spaceship image requested by user
      '/assets/spaceship.svg', // custom SVG we created
      '/assets/spaceship.png', // custom PNG uploaded by user
      'data:image/svg+xml;base64,' + btoa(highFidelitySvg.trim()) // direct high-fidelity fallback
    ];

    let currentSourceIndex = 0;

    const tryLoadNextSource = () => {
      if (currentSourceIndex >= loadSources.length) {
        console.warn('All spaceship sources failed to load. Falling back to canvas drawing.');
        isImageLoadedRef.current = false;
        return;
      }

      const src = loadSources[currentSourceIndex];
      img.src = src;
      currentSourceIndex++;
    };

    img.onload = () => {
      spaceshipImageRef.current = img;
      isImageLoadedRef.current = true;
      console.log(`Spaceship image loaded successfully from source index ${currentSourceIndex - 1}`);
    };

    img.onerror = () => {
      console.log(`Failed to load spaceship source index ${currentSourceIndex - 1}, trying next...`);
      tryLoadNextSource();
    };

    // Begin cascade load
    tryLoadNextSource();
  }, []);

  // Load target images
  useEffect(() => {
    const t1 = new Image();
    t1.src = '/assets/Targets/Target 1.png';
    t1.onload = () => {
      targetImage1Ref.current = t1;
      areTargetImagesLoadedRef.current.target1 = true;
    };
    t1.onerror = () => {
      console.warn('Failed to load Target 1 image');
    };

    const t2 = new Image();
    t2.src = '/assets/Targets/Target 2.png';
    t2.onload = () => {
      targetImage2Ref.current = t2;
      areTargetImagesLoadedRef.current.target2 = true;
    };
    t2.onerror = () => {
      console.warn('Failed to load Target 2 image');
    };

    const t3 = new Image();
    t3.src = '/assets/Targets/Target 3.png';
    t3.onload = () => {
      targetImage3Ref.current = t3;
      areTargetImagesLoadedRef.current.target3 = true;
    };
    t3.onerror = () => {
      console.warn('Failed to load Target 3 image');
    };
  }, []);

  // Sync mute state
  useEffect(() => {
    sounds.muted = isMuted;
  }, [isMuted]);

  // Handle keyboard event listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.key] = true;
      if (e.key === ' ' || e.key === 'Spacebar') {
        // Prevent default browser scrolling on spacebar
        e.preventDefault();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Audio Context unlock interaction
  const unlockAudio = () => {
    // Standard audio unlock
    if (typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const dummyCtx = new AudioCtx();
        dummyCtx.resume();
      }
    }
  };

  // Start / Reset Game
  const startGame = () => {
    unlockAudio();
    
    // Reset all variables
    playerRef.current = {
      x: 80,
      y: V_HEIGHT / 2 - 25,
      width: 120,
      height: 67,
      speed: 7,
      targetY: V_HEIGHT / 2 - 25,
      flameFrame: 0,
    };

    bulletsRef.current = [];
    targetsRef.current = [];
    particlesRef.current = [];
    lastSpawnTime.current = Date.now();
    lastShotTime.current = Date.now();
    levelTimer.current = Date.now();
    screenFlashAlpha.current = 0;

    setGameState({
      score: 0,
      highScore: highScore,
      lives: 3,
      gameOver: false,
      isPlaying: true,
      level: 1,
    });
  };

  // Game physics, controls & rendering loop
  useEffect(() => {
    if (!gameState.isPlaying || gameState.gameOver) {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let localScore = 0;
    let localLives = 3;
    let localLevel = 1;

    const gameLoop = () => {
      const now = Date.now();

      // 1. CLEAR & BACKGROUND DRAW
      ctx.fillStyle = '#06060c';
      ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);

      // Parallax scroll stars
      starsRef.current.forEach(star => {
        star.x -= star.speed;
        if (star.x < 0) {
          star.x = V_WIDTH;
          star.y = Math.random() * V_HEIGHT;
        }
        ctx.fillStyle = star.color;
        ctx.fillRect(star.x, star.y, star.size, star.size);
      });

      // 2. LEVEL & DIFFICULTY CONTROL
      // Every 15 seconds, level up!
      const elapsedSinceStart = now - levelTimer.current;
      const expectedLevel = Math.min(5, Math.floor(elapsedSinceStart / 15000) + 1);
      if (expectedLevel > localLevel) {
        localLevel = expectedLevel;
        setGameState(prev => ({ ...prev, level: localLevel }));
        // Play small chime
        sounds.playHit();
      }

      // 3. PLAYER INPUTS & MOVEMENT
      const keys = keysRef.current;
      const player = playerRef.current;

      // Handle desktop controls
      if (keys['ArrowUp'] || keys['w'] || keys['W']) {
        player.y -= player.speed;
      }
      if (keys['ArrowDown'] || keys['s'] || keys['S']) {
        player.y += player.speed;
      }
      if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
        player.x -= player.speed;
      }
      if (keys['ArrowRight'] || keys['d'] || keys['D']) {
        player.x += player.speed;
      }

      // Clamp player within boundaries
      player.x = Math.max(10, Math.min(V_WIDTH - player.width - 10, player.x));
      player.y = Math.max(10, Math.min(V_HEIGHT - player.height - 10, player.y));

      // 4. FIRE BULLETS
      // Auto-fire or manual spacebar fire
      const shootInterval = Math.max(120, 260 - localLevel * 20); // Fires faster as level increases
      const canShoot = now - lastShotTime.current > shootInterval;
      if (canShoot && (useAutoFire || keys[' '] || keys['Spacebar'])) {
        // Laser fires forward from the nose of the horizontally flying spaceship (right side)
        bulletsRef.current.push({
          x: player.x + player.width - 5,
          y: player.y + player.height / 2 - 3,
          width: 14,
          height: 6,
          speed: 12,
          color: '#06b6d4', // Bright cyan laser
        });
        lastShotTime.current = now;
        sounds.playLaser();
      }

      // 5. BULLETS UPDATE & DRAW
      const bullets = bulletsRef.current;
      for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        bullet.x += bullet.speed;

        // Draw bullet with pixel glow
        ctx.fillStyle = bullet.color;
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(bullet.x + 4, bullet.y + 1, bullet.width - 6, bullet.height - 2);

        // Remove off-screen bullets
        if (bullet.x > V_WIDTH) {
          bullets.splice(i, 1);
        }
      }

      // 6. TARGETS SPAWN & UPDATE
      const targets = targetsRef.current;
      const spawnCooldown = Math.max(800, 2200 - localLevel * 300); // Spawns faster as level increases
      if (now - lastSpawnTime.current > spawnCooldown) {
        // Choose type randomly
        const rand = Math.random();
        let type: TargetType = TargetType.MEDIUM_REGULAR;
        let points = 20; // Target 3: 20 Points
        let speedX = -(3 + Math.random() * 2 + localLevel * 0.6);
        let speedY = (Math.random() - 0.5) * 1.5; // Subtle float up/down
        let size = 35;
        let color = '#a855f7'; // Purple asteroid
        let health = 1;

        if (rand < 0.25) {
          // Fast small target (Target 1)
          type = TargetType.FAST_SMALL;
          points = 10; // Target 1: 10 Points
          speedX = -(6 + Math.random() * 3 + localLevel * 0.8);
          speedY = (Math.random() - 0.5) * 3;
          size = 28;
          color = '#ec4899'; // Hot pink
          health = 1;
        } else if (rand > 0.8) {
          // Slow large target (Target 2)
          type = TargetType.SLOW_LARGE;
          points = 30; // Target 2: 30 Points
          speedX = -(1.5 + Math.random() * 1 + localLevel * 0.3);
          speedY = (Math.random() - 0.5) * 0.5;
          size = 55;
          color = '#eab308'; // Amber/gold
          health = 3; // Takes 3 hits!
        }

        targets.push({
          id: Math.random().toString(36).substr(2, 9),
          x: V_WIDTH + 50,
          y: Math.random() * (V_HEIGHT - size - 40) + 20,
          width: size,
          height: size,
          speedX,
          speedY,
          type,
          points,
          color,
          health,
        });

        lastSpawnTime.current = now;
      }

      // Update and Draw targets
      for (let i = targets.length - 1; i >= 0; i--) {
        const target = targets[i];
        target.x += target.speedX;
        target.y += target.speedY;

        // Clamp y inside boundaries to bounce
        if (target.y < 10 || target.y > V_HEIGHT - target.height - 10) {
          target.speedY = -target.speedY;
        }

        // Draw Target (Chunky Retro Style or loaded PNG Image)
        ctx.fillStyle = target.color;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;

        if (target.type === TargetType.FAST_SMALL) {
          if (areTargetImagesLoadedRef.current.target1 && targetImage1Ref.current) {
            ctx.drawImage(targetImage1Ref.current, target.x, target.y, target.width, target.height);
          } else {
            // Draw pixel bug shape fallback
            ctx.fillRect(target.x, target.y + 6, target.width, target.height - 12);
            ctx.fillRect(target.x + 6, target.y, target.width - 12, target.height);
            // Eyes
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(target.x + 4, target.y + 6, 4, 4);
            ctx.fillRect(target.x + 14, target.y + 6, 4, 4);
          }
        } else if (target.type === TargetType.SLOW_LARGE) {
          if (areTargetImagesLoadedRef.current.target2 && targetImage2Ref.current) {
            ctx.drawImage(targetImage2Ref.current, target.x, target.y, target.width, target.height);
          } else {
            // Draw jagged asteroid octagonal box fallback
            ctx.beginPath();
            const r = target.width / 2;
            const cx = target.x + r;
            const cy = target.y + r;
            ctx.moveTo(cx + r, cy);
            ctx.lineTo(cx + r * 0.7, cy + r * 0.7);
            ctx.lineTo(cx, cy + r);
            ctx.lineTo(cx - r * 0.7, cy + r * 0.7);
            ctx.lineTo(cx - r, cy);
            ctx.lineTo(cx - r * 0.7, cy - r * 0.7);
            ctx.lineTo(cx, cy - r);
            ctx.lineTo(cx + r * 0.7, cy - r * 0.7);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Cracks/detail
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.fillRect(target.x + 15, target.y + 15, 12, 12);
            ctx.fillRect(target.x + 30, target.y + 25, 8, 8);
          }

          // Draw health indicator bar
          if (target.health > 1) {
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(target.x, target.y - 8, target.width, 4);
            ctx.fillStyle = '#22c55e';
            ctx.fillRect(target.x, target.y - 8, target.width * (target.health / 3), 4);
          }
        } else {
          if (areTargetImagesLoadedRef.current.target3 && targetImage3Ref.current) {
            ctx.drawImage(targetImage3Ref.current, target.x, target.y, target.width, target.height);
          } else {
            // Standard Asteroid fallback (Pixelated square with cut corners)
            ctx.fillRect(target.x + 5, target.y, target.width - 10, target.height);
            ctx.fillRect(target.x, target.y + 5, target.width, target.height - 10);
            ctx.strokeRect(target.x + 5, target.y + 5, target.width - 10, target.height - 10);
          }
        }

        // Check if passed player (Missed target!)
        if (target.x + target.width < 0) {
          targets.splice(i, 1);
          localLives -= 1;
          screenFlashAlpha.current = 0.4; // Red flash
          sounds.playHurt();
          setGameState(prev => ({ ...prev, lives: localLives }));

          if (localLives <= 0) {
            setGameState(prev => ({ ...prev, gameOver: true }));
            sounds.playGameOver();
            // Check high score
            if (localScore > highScore) {
              setHighScore(localScore);
              localStorage.setItem('tsk_game_highscore', localScore.toString());
            }
          }
        }
      }

      // 7. COLLISION DETECTION (Bullet vs Target)
      for (let b = bullets.length - 1; b >= 0; b--) {
        const bullet = bullets[b];
        for (let t = targets.length - 1; t >= 0; t--) {
          const target = targets[t];

          // AABB Collision check
          if (
            bullet.x < target.x + target.width &&
            bullet.x + bullet.width > target.x &&
            bullet.y < target.y + target.height &&
            bullet.y + bullet.height > target.y
          ) {
            // Remove bullet
            bullets.splice(b, 1);

            // Deduct target health
            target.health -= 1;

            if (target.health <= 0) {
              // Destroy target!
              targets.splice(t, 1);
              localScore += target.points;
              setGameState(prev => ({ ...prev, score: localScore }));

              // Create pixelated particles for explosion
              const pCount = target.type === TargetType.SLOW_LARGE ? 25 : 12;
              for (let p = 0; p < pCount; p++) {
                particlesRef.current.push({
                  x: target.x + target.width / 2,
                  y: target.y + target.height / 2,
                  vx: (Math.random() - 0.5) * 8,
                  vy: (Math.random() - 0.5) * 8,
                  size: Math.random() * 4 + 2,
                  color: target.color,
                  alpha: 1,
                  decay: Math.random() * 0.03 + 0.015,
                });
              }

              sounds.playExplosion(target.type === TargetType.SLOW_LARGE);
            } else {
              // Just a hit sound and tiny dust sparks
              sounds.playHit();
              for (let p = 0; p < 3; p++) {
                particlesRef.current.push({
                  x: bullet.x,
                  y: bullet.y,
                  vx: -(Math.random() * 2 + 1),
                  vy: (Math.random() - 0.5) * 4,
                  size: Math.random() * 3 + 1,
                  color: '#ffffff',
                  alpha: 1,
                  decay: 0.05,
                });
              }
            }
            break; // Break target loop since bullet is gone
          }
        }
      }

      // 8. COLLISION DETECTION (Player vs Target)
      for (let t = targets.length - 1; t >= 0; t--) {
        const target = targets[t];

        // Narrow player hitbox to be fairer
        const playerHitbox = {
          x: player.x + 10,
          y: player.y + 10,
          width: player.width - 20,
          height: player.height - 20,
        };

        if (
          playerHitbox.x < target.x + target.width &&
          playerHitbox.x + playerHitbox.width > target.x &&
          playerHitbox.y < target.y + target.height &&
          playerHitbox.y + playerHitbox.height > target.y
        ) {
          // Destroy target
          targets.splice(t, 1);
          localLives -= 1;
          screenFlashAlpha.current = 0.5; // Red screen flash
          sounds.playHurt();

          setGameState(prev => ({ ...prev, lives: localLives }));

          // Massive player hit particles
          for (let p = 0; p < 20; p++) {
            particlesRef.current.push({
              x: player.x + player.width / 2,
              y: player.y + player.height / 2,
              vx: (Math.random() - 0.5) * 10,
              vy: (Math.random() - 0.5) * 10,
              size: Math.random() * 5 + 2,
              color: '#ef4444',
              alpha: 1,
              decay: 0.02,
            });
          }

          if (localLives <= 0) {
            setGameState(prev => ({ ...prev, gameOver: true }));
            sounds.playGameOver();
            if (localScore > highScore) {
              setHighScore(localScore);
              localStorage.setItem('tsk_game_highscore', localScore.toString());
            }
          }
          break;
        }
      }

      // 9. PARTICLES UPDATE & DRAW
      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;

        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillRect(p.x, p.y, p.size, p.size);
        ctx.globalAlpha = 1.0; // Reset alpha

        if (p.alpha <= 0) {
          particles.splice(i, 1);
        }
      }

      // 10. DRAW PLAYER (Spaceship model of woman + rocket fire)
      player.flameFrame = (player.flameFrame + 1) % 12;

      // Draw rocket booster particles extending leftwards from player's back
      if (Math.random() < 0.6) {
        particlesRef.current.push({
          x: player.x + 5,
          y: player.y + player.height / 2 + (Math.random() - 0.5) * 12,
          vx: -(3 + Math.random() * 4),
          vy: (Math.random() - 0.5) * 2,
          size: Math.random() * 5 + 3,
          color: Math.random() < 0.4 ? '#ef4444' : '#f97316', // Fire colors
          alpha: 1.0,
          decay: 0.04,
        });
      }

      if (isImageLoadedRef.current && spaceshipImageRef.current) {
        // Draw the exact provided image
        ctx.drawImage(spaceshipImageRef.current, player.x, player.y, player.width, player.height);
      } else {
        // HIGH-FIDELITY CUSTOM CANVAS RENDERING
        // Represents a pixelated horizontal woman in a pink-brown dress with a fiery rocket exhaust tail!
        
        ctx.save();
        
        // Let's draw the animated retro flame (rocket engine) on the left side (lower body/feet)
        const flameLength = 30 + Math.sin(player.flameFrame * 0.5) * 10;
        
        // Flame - Outer Red Layer
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.moveTo(player.x + 15, player.y + 12);
        ctx.quadraticCurveTo(player.x - flameLength + 5, player.y + 25, player.x + 15, player.y + 38);
        ctx.lineTo(player.x + 15, player.y + 12);
        ctx.fill();

        // Flame - Inner Orange Layer
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.moveTo(player.x + 15, player.y + 17);
        ctx.quadraticCurveTo(player.x - flameLength * 0.7, player.y + 25, player.x + 15, player.y + 33);
        ctx.lineTo(player.x + 15, player.y + 17);
        ctx.fill();

        // Flame - Center Yellow Core
        ctx.fillStyle = '#eab308';
        ctx.beginPath();
        ctx.moveTo(player.x + 15, player.y + 21);
        ctx.quadraticCurveTo(player.x - flameLength * 0.4, player.y + 25, player.x + 15, player.y + 29);
        ctx.lineTo(player.x + 15, player.y + 21);
        ctx.fill();

        // Draw Player Body (Horizontal flying layout - Head to the right, legs/hips to the left)
        
        // 1. Dress/Body (Pink-brown patterned fabric) - represented as horizontal rectangle with details
        ctx.fillStyle = '#b4837a'; // Dusty pink-brown
        ctx.fillRect(player.x + 15, player.y + 12, 45, 26);
        
        // Dress borders/shadows for 3D retro volume
        ctx.fillStyle = '#83544c'; // Darker rose shadow
        ctx.fillRect(player.x + 15, player.y + 30, 45, 8);
        
        // Dress Pattern lines (subtle check pattern)
        ctx.fillStyle = '#dfb5ad'; // Light rose pattern accents
        for (let l = player.x + 20; l < player.x + 55; l += 8) {
          ctx.fillRect(l, player.y + 14, 2, 22);
        }

        // 2. Arms (folded along her side or flying)
        ctx.fillStyle = '#fbcfe8'; // Soft skin tone
        ctx.fillRect(player.x + 30, player.y + 18, 18, 5); // Arm outline

        // 3. Face (Right side, head pointing right)
        ctx.fillStyle = '#ffedd5'; // Warm skin tone
        ctx.fillRect(player.x + 60, player.y + 14, 16, 18);
        
        // Nose & Neck
        ctx.fillStyle = '#fbcfe8';
        ctx.fillRect(player.x + 76, player.y + 22, 2, 4); // nose pointer
        ctx.fillRect(player.x + 58, player.y + 24, 6, 6); // neck

        // Smile (brown/red pixel)
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(player.x + 72, player.y + 26, 2, 2);

        // Eye (black + white pixel)
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(player.x + 68, player.y + 18, 4, 3);
        ctx.fillStyle = '#000000';
        ctx.fillRect(player.x + 70, player.y + 18, 2, 3);

        // 4. Hair (Black, waving backwards to the left)
        ctx.fillStyle = '#1e293b'; // Slate black/dark gray hair
        // Hair flowing back
        ctx.fillRect(player.x + 54, player.y + 10, 12, 26); // hair wrap
        ctx.fillRect(player.x + 42, player.y + 8, 16, 8); // hair waving back top
        ctx.fillRect(player.x + 48, player.y + 30, 10, 10); // hair waving bottom
        
        ctx.restore();
      }

      // 11. RED SCREEN HURT FLASH DRAW
      if (screenFlashAlpha.current > 0) {
        ctx.fillStyle = `rgba(239, 68, 68, ${screenFlashAlpha.current})`;
        ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);
        screenFlashAlpha.current -= 0.02;
      }

      // 12. RUNNING LOOP REGISTRATION
      if (!gameState.gameOver) {
        gameLoopRef.current = requestAnimationFrame(gameLoop);
      }
    };

    // Begin loop
    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState.isPlaying, gameState.gameOver, useAutoFire]);

  // Handle Touch/Mouse Drag to slide Player vertically & horizontally
  const handlePointerMove = (e: PointerEvent<HTMLCanvasElement>) => {
    if (!gameState.isPlaying || gameState.gameOver) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    // Translate screen coords to internal 800x480 resolution
    const scaleX = V_WIDTH / rect.width;
    const scaleY = V_HEIGHT / rect.height;

    const pointerX = (e.clientX - rect.left) * scaleX;
    const pointerY = (e.clientY - rect.top) * scaleY;

    // Centered smooth placement
    playerRef.current.x = pointerX - playerRef.current.width / 2;
    playerRef.current.y = pointerY - playerRef.current.height / 2;

    // Boundary locks
    playerRef.current.x = Math.max(10, Math.min(V_WIDTH - playerRef.current.width - 10, playerRef.current.x));
    playerRef.current.y = Math.max(10, Math.min(V_HEIGHT - playerRef.current.height - 10, playerRef.current.y));
  };

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto px-4" id="game-section-container">
      
      {/* Title Header with Glowing Pixel Vibe */}
      <div className="text-center mb-6">
        <h2 className="font-sans text-3xl md:text-4xl text-cyan-400 font-bold tracking-widest uppercase mb-2 drop-shadow-[0_2px_8px_rgba(34,211,238,0.4)]" style={{ fontFamily: '"Pixelify Sans", sans-serif' }}>
          TSK Space Shooter
        </h2>
        <p className="text-gray-400 text-xs md:text-sm max-w-md mx-auto" style={{ fontFamily: '"Pixelify Sans", sans-serif' }}>
          Steer the fiery TSK ship with arrow/WASD keys or drag on mobile to blast incoming targets!
        </p>
      </div>

      {/* GAME SCOREBAR */}
      <div className="flex items-center justify-between w-full bg-slate-900 border-2 border-slate-700 p-3 rounded-t-lg text-white font-mono text-sm shadow-md" style={{ fontFamily: '"Pixelify Sans", sans-serif' }}>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-cyan-400">
            <Trophy className="w-4 h-4" />
            <span>SCORE: <span className="text-white font-bold">{gameState.score}</span></span>
          </div>
          <div className="hidden sm:flex items-center gap-1 text-purple-400">
            <Shield className="w-4 h-4" />
            <span>LVL: <span className="text-white font-bold">{gameState.level}</span></span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <span className="text-rose-400">HP:</span>
            <div className="flex gap-1">
              {[...Array(3)].map((_, idx) => (
                <div
                  key={idx}
                  className={`w-4 h-4 border border-rose-500 rounded-sm transform rotate-45 transition-all duration-300 ${
                    idx < gameState.lives ? 'bg-rose-500 shadow-[0_0_6px_#f43f5e]' : 'bg-transparent'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Audio toggle */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-1.5 hover:bg-slate-800 rounded text-gray-400 hover:text-white transition-colors"
            title={isMuted ? 'Unmute game' : 'Mute game'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>
        </div>
      </div>

      {/* STAGE CONTAINER */}
      <div
        ref={containerRef}
        className="relative w-full overflow-hidden bg-black border-2 border-cyan-500 rounded-b-lg shadow-[0_0_25px_rgba(6,182,212,0.2)] aspect-[800/480] select-none touch-none"
      >
        <canvas
          ref={canvasRef}
          width={V_WIDTH}
          height={V_HEIGHT}
          onPointerMove={handlePointerMove}
          className="w-full h-full block bg-black"
        />

        {/* START SCREEN OVERLAY */}
        {!gameState.isPlaying && (
          <div className="absolute inset-0 bg-slate-950/85 flex flex-col items-center justify-center text-center p-6 animate-fade-in">
            <div className="max-w-md p-6 border-2 border-purple-500 bg-slate-900/90 rounded-lg shadow-[0_0_20px_rgba(168,85,247,0.4)]">
              <h3 className="text-2xl font-bold text-purple-400 mb-2 uppercase tracking-wide" style={{ fontFamily: '"Pixelify Sans", sans-serif' }}>
                Prepare for takeoff
              </h3>
              <p className="text-gray-300 text-xs md:text-sm mb-6" style={{ fontFamily: '"Pixelify Sans", sans-serif' }}>
                Blast through incoming asteroids and space junk. Save high scores to your device!
              </p>

              <div className="flex flex-col gap-4 max-w-xs mx-auto mb-6 text-left bg-slate-950/60 p-4 border border-slate-700 rounded text-xs text-gray-400">
                <p className="font-semibold text-gray-300 border-b border-slate-700 pb-1 uppercase">Controls</p>
                <div className="flex justify-between">
                  <span>Move:</span>
                  <span className="text-cyan-400 font-bold">Arrow Keys / WASD</span>
                </div>
                <div className="flex justify-between">
                  <span>Mobile/Mouse:</span>
                  <span className="text-cyan-400 font-bold">Drag / Slide</span>
                </div>
                <div className="flex justify-between">
                  <span>Fire:</span>
                  <span className="text-cyan-400 font-bold">Auto-firing or Spacebar</span>
                </div>
              </div>

              {gameState.highScore > 0 && (
                <div className="flex items-center justify-center gap-1.5 text-yellow-400 text-sm font-semibold mb-6 uppercase" style={{ fontFamily: '"Pixelify Sans", sans-serif' }}>
                  <Trophy className="w-4 h-4 text-yellow-400" />
                  <span>Personal Best: {gameState.highScore} pts</span>
                </div>
              )}

              <button
                onClick={startGame}
                id="start-game-button"
                className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-bold rounded shadow-lg cursor-pointer transition-all transform hover:scale-[1.03] active:scale-[0.98]"
                style={{ fontFamily: '"Pixelify Sans", sans-serif' }}
              >
                <Play className="w-5 h-5 fill-current" />
                START GAME
              </button>
            </div>
          </div>
        )}

        {/* GAME OVER OVERLAY */}
        {gameState.gameOver && (
          <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center text-center p-6 animate-fade-in">
            <div className="max-w-md p-6 border-2 border-rose-500 bg-slate-900/95 rounded-lg shadow-[0_0_20px_rgba(239,68,110,0.4)]">
              <h3 className="text-3xl font-extrabold text-rose-500 mb-2 uppercase tracking-widest" style={{ fontFamily: '"Pixelify Sans", sans-serif' }}>
                GAME OVER
              </h3>
              <p className="text-gray-400 text-xs md:text-sm mb-6" style={{ fontFamily: '"Pixelify Sans", sans-serif' }}>
                The spaceship took too much damage or missed too many targets!
              </p>

              <div className="grid grid-cols-2 gap-4 bg-slate-950 p-4 border border-slate-800 rounded mb-6 text-sm">
                <div className="text-left border-r border-slate-800 pr-2">
                  <span className="text-gray-500 text-xs block uppercase">YOUR SCORE</span>
                  <span className="text-2xl font-bold text-white block">{gameState.score}</span>
                </div>
                <div className="text-left pl-2">
                  <span className="text-gray-500 text-xs block uppercase">HIGH SCORE</span>
                  <span className="text-2xl font-bold text-yellow-400 block">{highScore}</span>
                </div>
              </div>

              {gameState.score >= highScore && gameState.score > 0 && (
                <div className="text-emerald-400 text-xs font-bold mb-6 flex items-center justify-center gap-1 uppercase" style={{ fontFamily: '"Pixelify Sans", sans-serif' }}>
                  <Trophy className="w-4 h-4" /> NEW ALL-TIME RECORD!
                </div>
              )}

              <button
                onClick={startGame}
                id="play-again-button"
                className="flex items-center justify-center gap-2 w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded shadow-lg cursor-pointer transition-all transform hover:scale-[1.03] active:scale-[0.98]"
                style={{ fontFamily: '"Pixelify Sans", sans-serif' }}
              >
                <RotateCcw className="w-5 h-5" />
                PLAY AGAIN
              </button>
            </div>
          </div>
        )}
      </div>

      {/* AUTO-FIRE SETTING BAR */}
      {gameState.isPlaying && !gameState.gameOver && (
        <div className="flex items-center justify-between w-full mt-4 bg-slate-900 border border-slate-800 p-3 rounded-lg text-xs md:text-sm text-gray-300 shadow">
          <span className="font-medium" style={{ fontFamily: '"Pixelify Sans", sans-serif' }}>
            🚀 Pro Tip: Drag or slide on the screen to navigate effortlessly on touchscreens.
          </span>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={useAutoFire}
              onChange={(e) => setUseAutoFire(e.target.checked)}
              className="rounded text-cyan-500 bg-slate-800 border-slate-700 focus:ring-0 w-4 h-4 cursor-pointer"
            />
            <span className="font-bold text-xs uppercase" style={{ fontFamily: '"Pixelify Sans", sans-serif' }}>Auto-fire</span>
          </label>
        </div>
      )}
    </div>
  );
}
