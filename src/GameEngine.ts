import { 
  Enemy, 
  Bullet, 
  Item, 
  Particle, 
  EnemyType, 
  ItemType, 
  GameStats,
  Point
} from './types';
import { ENEMY_CONFIGS, ITEM_CONFIGS } from './constants';

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  
  player = {
    x: 0,
    y: 0,
    width: 50,
    height: 50,
    speed: 7,
    invulnerable: false,
    invulnerableTimer: 0,
    lastShotTime: 0,
    shootInterval: 250
  };

  enemies: Enemy[] = [];
  bullets: Bullet[] = [];
  items: Item[] = [];
  particles: Particle[] = [];
  stars: { x: number, y: number, size: number, speed: number, color: string }[] = [];
  clouds: { x: number, y: number, width: number, height: number, speed: number }[] = [];

  stats: GameStats = {
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

  private keys: Record<string, boolean> = {};
  private lastTime = 0;
  private spawnTimer = 0;
  private itemSpawnTimer = 0;
  
  onAchievementUnlocked?: (id: string) => void;
  onGameOver?: () => void;
  onLevelUp?: (level: number) => void;

  private images: Record<string, HTMLImageElement> = {};
  private imagesLoaded = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.initStars();
    this.initClouds();
    this.resetPlayer();
    this.loadAssets();
    
    window.addEventListener('keydown', (e) => this.keys[e.code] = true);
    window.addEventListener('keyup', (e) => this.keys[e.code] = false);
  }

  private loadAssets() {
    const assets = {
      player: '/assets/player.png',
      enemy_basic: '/assets/enemy_basic.png',
      enemy_fast: '/assets/enemy_fast.png',
      enemy_heavy: '/assets/enemy_heavy.png',
    };

    let loadedCount = 0;
    const totalAssets = Object.keys(assets).length;

    Object.entries(assets).forEach(([key, src]) => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        loadedCount++;
        if (loadedCount === totalAssets) {
          this.imagesLoaded = true;
        }
      };
      img.onerror = () => {
        console.warn(`Failed to load asset: ${src}, falling back to vector shapes.`);
        loadedCount++; // Still count it to mark loading as "finished"
        if (loadedCount === totalAssets) {
          this.imagesLoaded = true;
        }
      };
      this.images[key] = img;
    });
  }

  private initStars() {
    this.stars = [];
    for (let i = 0; i < 50; i++) {
      this.stars.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        size: Math.random() * 3 + 1,
        speed: Math.random() * 0.5 + 0.1,
        color: `rgba(255, 255, 255, ${Math.random() * 0.5 + 0.5})`
      });
    }
  }

  private initClouds() {
    this.clouds = [];
    for (let i = 0; i < 5; i++) {
      this.clouds.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        width: 100 + Math.random() * 200,
        height: 40 + Math.random() * 60,
        speed: Math.random() * 0.5 + 0.2
      });
    }
  }

  private resetPlayer() {
    this.player.x = this.canvas.width / 2 - this.player.width / 2;
    this.player.y = this.canvas.height - 100;
  }

  update(timestamp: number) {
    const deltaTime = timestamp - this.lastTime;
    this.lastTime = timestamp;

    if (this.stats.health <= 0) return;

    this.handleInput();
    this.updateStars();
    this.updateClouds();
    this.updatePlayer(deltaTime);
    this.updateBullets(deltaTime);
    this.updateEnemies(deltaTime);
    this.updateItems(deltaTime);
    this.updateParticles(deltaTime);
    this.handleSpawning(deltaTime);
    this.checkCollisions();
    this.checkLevelUp();
    this.checkAchievements();
  }

  private handleInput() {
    if (this.keys['ArrowLeft'] || this.keys['KeyA']) this.player.x -= this.player.speed;
    if (this.keys['ArrowRight'] || this.keys['KeyD']) this.player.x += this.player.speed;
    if (this.keys['ArrowUp'] || this.keys['KeyW']) this.player.y -= this.player.speed;
    if (this.keys['ArrowDown'] || this.keys['KeyS']) this.player.y += this.player.speed;

    // Boundary checks
    this.player.x = Math.max(0, Math.min(this.canvas.width - this.player.width, this.player.x));
    this.player.y = Math.max(0, Math.min(this.canvas.height - this.player.height, this.player.y));

    if (this.keys['Space']) {
      this.shoot();
    }
  }

  // Mobile touch support
  handleTouch(x: number, y: number) {
    this.player.x = x - this.player.width / 2;
    this.player.y = y - this.player.height / 2;
    this.shoot();
  }

  private shoot() {
    const now = Date.now();
    if (now - this.player.lastShotTime > this.player.shootInterval) {
      if (this.stats.tripleShotActive) {
        this.createBullet(this.player.x + this.player.width / 2, this.player.y, 0);
        this.createBullet(this.player.x + this.player.width / 2, this.player.y, -0.2);
        this.createBullet(this.player.x + this.player.width / 2, this.player.y, 0.2);
      } else {
        this.createBullet(this.player.x + this.player.width / 2, this.player.y, 0);
      }
      this.player.lastShotTime = now;
    }
  }

  private createBullet(x: number, y: number, angle: number) {
    this.bullets.push({
      id: Math.random().toString(),
      x,
      y,
      width: 4,
      height: 15,
      speed: 10,
      damage: 1,
      isPlayerBullet: true,
      angle,
      health: 1,
      maxHealth: 1
    });
  }

  private updateStars() {
    this.stars.forEach(star => {
      star.y += star.speed;
      if (star.y > this.canvas.height) {
        star.y = 0;
        star.x = Math.random() * this.canvas.width;
      }
    });
  }

  private updateClouds() {
    this.clouds.forEach(cloud => {
      cloud.y += cloud.speed;
      if (cloud.y > this.canvas.height) {
        cloud.y = -cloud.height;
        cloud.x = Math.random() * this.canvas.width;
      }
    });
  }

  private updatePlayer(deltaTime: number) {
    if (this.player.invulnerable) {
      this.player.invulnerableTimer -= deltaTime;
      if (this.player.invulnerableTimer <= 0) {
        this.player.invulnerable = false;
      }
    }

    if (this.stats.tripleShotActive) {
      this.stats.tripleShotTimer -= deltaTime;
      if (this.stats.tripleShotTimer <= 0) {
        this.stats.tripleShotActive = false;
      }
    }
  }

  private updateBullets(deltaTime: number) {
    this.bullets = this.bullets.filter(bullet => {
      bullet.y -= bullet.speed * Math.cos(bullet.angle);
      bullet.x += bullet.speed * Math.sin(bullet.angle);
      return bullet.y > -50 && bullet.y < this.canvas.height + 50 && bullet.x > -50 && bullet.x < this.canvas.width + 50;
    });
  }

  private updateEnemies(deltaTime: number) {
    this.enemies = this.enemies.filter(enemy => {
      enemy.y += enemy.speed;
      
      // Enemy shooting
      const now = Date.now();
      if (now - enemy.lastShotTime > enemy.shootInterval) {
        this.bullets.push({
          id: Math.random().toString(),
          x: enemy.x + enemy.width / 2,
          y: enemy.y + enemy.height,
          width: 4,
          height: 10,
          speed: -5, // Downwards
          damage: 1,
          isPlayerBullet: false,
          angle: 0,
          health: 1,
          maxHealth: 1
        });
        enemy.lastShotTime = now;
      }

      if (enemy.y > this.canvas.height) {
        this.stats.score = Math.max(0, this.stats.score - 50);
        return false;
      }
      return true;
    });
  }

  private updateItems(deltaTime: number) {
    this.items = this.items.filter(item => {
      item.y += item.speed;
      return item.y < this.canvas.height;
    });
  }

  private updateParticles(deltaTime: number) {
    this.particles = this.particles.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= deltaTime;
      return p.life > 0;
    });
  }

  private handleSpawning(deltaTime: number) {
    this.spawnTimer += deltaTime;
    const spawnRate = Math.max(500, 2000 - (this.stats.level * 150));
    
    if (this.spawnTimer > spawnRate) {
      this.spawnEnemy();
      this.spawnTimer = 0;
    }

    this.itemSpawnTimer += deltaTime;
    if (this.itemSpawnTimer > 10000) {
      this.spawnItem();
      this.itemSpawnTimer = 0;
    }
  }

  private spawnEnemy() {
    const rand = Math.random();
    let type = EnemyType.BASIC;
    if (this.stats.level >= 2 && rand > 0.7) type = EnemyType.FAST;
    if (this.stats.level >= 4 && rand > 0.9) type = EnemyType.HEAVY;

    const config = ENEMY_CONFIGS[type];
    this.enemies.push({
      id: Math.random().toString(),
      type,
      x: Math.random() * (this.canvas.width - config.width),
      y: -config.height,
      ...config,
      lastShotTime: Date.now() + Math.random() * 2000,
      maxHealth: config.health
    });
  }

  private spawnItem() {
    const rand = Math.random();
    let type: ItemType;
    if (rand < 0.4) type = ItemType.TRIPLE_SHOT;
    else if (rand < 0.8) type = ItemType.SHIELD;
    else type = ItemType.HEALTH;

    const config = ITEM_CONFIGS[type];
    this.items.push({
      id: Math.random().toString(),
      type,
      x: Math.random() * (this.canvas.width - 30),
      y: -30,
      width: 30,
      height: 30,
      speed: 2,
      health: 1,
      maxHealth: 1,
      color: config.color
    });
  }

  private checkCollisions() {
    const bulletsToRemove = new Set<string>();
    const enemiesToRemove = new Set<string>();
    const itemsToRemove = new Set<string>();

    // Player vs Enemy
    this.enemies.forEach(enemy => {
      if (!this.player.invulnerable && this.rectIntersect(this.player, enemy)) {
        this.hitPlayer();
        enemiesToRemove.add(enemy.id);
        this.createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.color, 20);
      }
    });

    // Player vs Item
    this.items.forEach(item => {
      if (this.rectIntersect(this.player, item)) {
        this.collectItem(item);
        itemsToRemove.add(item.id);
      }
    });

    // Bullet vs Enemy/Player
    this.bullets.forEach(bullet => {
      if (bullet.isPlayerBullet) {
        this.enemies.forEach(enemy => {
          if (!enemiesToRemove.has(enemy.id) && this.rectIntersect(bullet, enemy)) {
            enemy.health -= bullet.damage;
            bulletsToRemove.add(bullet.id);
            if (enemy.health <= 0) {
              enemiesToRemove.add(enemy.id);
              this.stats.score += enemy.scoreValue;
              this.stats.enemiesKilled++;
              this.createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.color, 20);
            } else {
              this.createExplosion(bullet.x, bullet.y, enemy.color, 5);
            }
          }
        });
      } else {
        if (!this.player.invulnerable && this.rectIntersect(bullet, this.player)) {
          this.hitPlayer();
          bulletsToRemove.add(bullet.id);
        }
      }
    });

    // Apply removals
    if (enemiesToRemove.size > 0) {
      this.enemies = this.enemies.filter(e => !enemiesToRemove.has(e.id));
    }
    if (bulletsToRemove.size > 0) {
      this.bullets = this.bullets.filter(b => !bulletsToRemove.has(b.id));
    }
    if (itemsToRemove.size > 0) {
      this.items = this.items.filter(i => !itemsToRemove.has(i.id));
    }
  }

  private rectIntersect(r1: any, r2: any) {
    return r1.x < r2.x + r2.width &&
           r1.x + r1.width > r2.x &&
           r1.y < r2.y + r2.height &&
           r1.y + r1.height > r2.y;
  }

  private hitPlayer() {
    if (this.stats.shieldActive) {
      this.stats.shieldActive = false;
      this.createExplosion(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2, '#a78bfa', 20);
    } else {
      this.stats.health--;
      this.player.invulnerable = true;
      this.player.invulnerableTimer = 2000;
      this.createExplosion(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2, '#ffffff', 30);
      
      if (this.stats.health <= 0) {
        this.onGameOver?.();
      }
    }
  }

  private destroyEnemy(enemy: Enemy) {
    this.stats.score += enemy.scoreValue;
    this.stats.enemiesKilled++;
    this.createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.color, 20);
    this.enemies = this.enemies.filter(e => e.id !== enemy.id);
  }

  private collectItem(item: Item) {
    this.stats.itemsCollected++;
    if (item.type === ItemType.TRIPLE_SHOT) {
      this.stats.tripleShotActive = true;
      this.stats.tripleShotTimer = ITEM_CONFIGS.TRIPLE_SHOT.duration;
    } else if (item.type === ItemType.SHIELD) {
      this.stats.shieldActive = true;
    } else if (item.type === ItemType.HEALTH) {
      this.stats.health = Math.min(this.stats.maxHealth, this.stats.health + 1);
    }
    this.createExplosion(item.x + item.width / 2, item.y + item.height / 2, item.color, 15);
  }

  private createExplosion(x: number, y: number, color: string, count: number) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5 + 2;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 500 + Math.random() * 500,
        maxLife: 1000,
        color,
        size: Math.random() * 3 + 1
      });
    }
  }

  private checkLevelUp() {
    const nextLevelScore = this.stats.level * 2000;
    if (this.stats.score >= nextLevelScore) {
      this.stats.level++;
      this.onLevelUp?.(this.stats.level);
      // Clear screen on level up
      this.enemies = [];
      this.bullets = this.bullets.filter(b => b.isPlayerBullet);
    }
  }

  private checkAchievements() {
    if (this.stats.enemiesKilled >= 1) this.onAchievementUnlocked?.('first_blood');
    if (Date.now() - this.stats.startTime > 60000) this.onAchievementUnlocked?.('survivor');
    if (this.stats.enemiesKilled >= 50) this.onAchievementUnlocked?.('ace_pilot');
    if (this.stats.itemsCollected >= 5) this.onAchievementUnlocked?.('collector');
    if (this.stats.level >= 5) this.onAchievementUnlocked?.('unstoppable');
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw Daytime Sky Gradient
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, '#38bdf8'); // Sky 400
    gradient.addColorStop(1, '#bae6fd'); // Sky 200
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw Sun
    this.ctx.fillStyle = '#fef08a'; // Yellow 200
    this.ctx.shadowBlur = 50;
    this.ctx.shadowColor = '#facc15'; // Yellow 400
    this.ctx.beginPath();
    this.ctx.arc(this.canvas.width - 100, 100, 60, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.shadowBlur = 0;

    // Draw Clouds
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    this.clouds.forEach(cloud => {
      this.ctx.beginPath();
      this.ctx.ellipse(cloud.x, cloud.y, cloud.width / 2, cloud.height / 2, 0, 0, Math.PI * 2);
      this.ctx.fill();
    });

    // Draw "Stars" (Dust/Pollen in daytime)
    this.stars.forEach(star => {
      this.ctx.fillStyle = star.color;
      this.ctx.fillRect(star.x, star.y, star.size, star.size);
    });

    // Draw Particles
    this.particles.forEach(p => {
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = p.life / p.maxLife;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
    });
    this.ctx.globalAlpha = 1;

    // Draw Items
    this.items.forEach(item => {
      this.ctx.shadowBlur = 15;
      this.ctx.shadowColor = item.color;
      this.ctx.fillStyle = item.color;
      
      this.ctx.beginPath();
      if (item.type === ItemType.TRIPLE_SHOT) {
        // Triangle for triple shot
        this.ctx.moveTo(item.x + item.width / 2, item.y);
        this.ctx.lineTo(item.x + item.width, item.y + item.height);
        this.ctx.lineTo(item.x, item.y + item.height);
      } else if (item.type === ItemType.SHIELD) {
        // Circle for shield
        this.ctx.arc(item.x + item.width / 2, item.y + item.height / 2, item.width / 2, 0, Math.PI * 2);
      } else if (item.type === ItemType.HEALTH) {
        // Cross for health
        const cx = item.x + item.width / 2;
        const cy = item.y + item.height / 2;
        const r = item.width / 2;
        this.ctx.rect(cx - r, cy - r/3, r*2, r*2/3);
        this.ctx.rect(cx - r/3, cy - r, r*2/3, r*2);
      }
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.shadowBlur = 0;
    });

    // Draw Bullets
    this.bullets.forEach(bullet => {
      this.ctx.fillStyle = bullet.isPlayerBullet ? '#60a5fa' : '#f87171';
      this.ctx.shadowBlur = 10;
      this.ctx.shadowColor = this.ctx.fillStyle;
      this.ctx.save();
      this.ctx.translate(bullet.x, bullet.y);
      this.ctx.rotate(bullet.angle);
      this.ctx.fillRect(-bullet.width / 2, -bullet.height / 2, bullet.width, bullet.height);
      this.ctx.restore();
      this.ctx.shadowBlur = 0;
    });

    // Draw Enemies
    this.enemies.forEach(enemy => {
      const imgKey = `enemy_${enemy.type.toLowerCase()}`;
      const img = this.images[imgKey];

      if (this.imagesLoaded && img && img.complete && img.naturalWidth !== 0) {
        this.ctx.drawImage(img, enemy.x, enemy.y, enemy.width, enemy.height);
      } else {
        this.ctx.fillStyle = enemy.color;
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = enemy.color;
        
        // Draw ship body
        this.ctx.beginPath();
        this.ctx.moveTo(enemy.x + enemy.width / 2, enemy.y + enemy.height);
        this.ctx.lineTo(enemy.x + enemy.width, enemy.y);
        this.ctx.lineTo(enemy.x, enemy.y);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
      }

      // Health bar
      if (enemy.maxHealth > 1) {
        const barWidth = enemy.width;
        const healthPercent = enemy.health / enemy.maxHealth;
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(enemy.x, enemy.y - 10, barWidth, 4);
        this.ctx.fillStyle = enemy.color;
        this.ctx.fillRect(enemy.x, enemy.y - 10, barWidth * healthPercent, 4);
      }
    });

    // Draw Player
    if (!this.player.invulnerable || Math.floor(Date.now() / 100) % 2 === 0) {
      const img = this.images['player'];
      if (this.imagesLoaded && img && img.complete && img.naturalWidth !== 0) {
        this.ctx.drawImage(img, this.player.x, this.player.y, this.player.width, this.player.height);
      } else {
        this.ctx.fillStyle = '#ffffff';
        this.ctx.strokeStyle = '#0f172a'; // Slate 900 for outline
        this.ctx.lineWidth = 2;
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = '#60a5fa';
        
        // Ship body
        this.ctx.beginPath();
        this.ctx.moveTo(this.player.x + this.player.width / 2, this.player.y);
        this.ctx.lineTo(this.player.x + this.player.width, this.player.y + this.player.height);
        this.ctx.lineTo(this.player.x + this.player.width / 2, this.player.y + this.player.height * 0.8);
        this.ctx.lineTo(this.player.x, this.player.y + this.player.height);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke(); // Add outline

        // Engine glow
        this.ctx.fillStyle = '#3b82f6';
        this.ctx.beginPath();
        this.ctx.arc(this.player.x + this.player.width / 2, this.player.y + this.player.height, 5 + Math.random() * 5, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke(); // Outline engine too
      }

      // Shield
      if (this.stats.shieldActive) {
        this.ctx.strokeStyle = '#a78bfa';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.arc(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2, this.player.width * 0.8, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.globalAlpha = 0.3;
        this.ctx.fillStyle = '#a78bfa';
        this.ctx.fill();
        this.ctx.globalAlpha = 1;
      }

      this.ctx.shadowBlur = 0;
    }
  }

  resize(width: number, height: number) {
    this.canvas.width = width;
    this.canvas.height = height;
    this.initStars();
    this.initClouds();
    this.resetPlayer();
  }
}
