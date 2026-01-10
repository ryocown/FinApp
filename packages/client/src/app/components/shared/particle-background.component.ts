import { Component, ElementRef, NgZone, OnDestroy, OnInit, viewChild, effect, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../services/theme.service';

@Component({
    selector: 'app-particle-background',
    standalone: true,
    imports: [CommonModule],
    template: `<canvas #bgCanvas></canvas>`,
    styles: [`
    :host {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      z-index: 0;
      pointer-events: none; /* Let clicks pass through, but we capture mousemove on window */
      /* Background handled by parent/global styles now */
    }
    canvas {
      width: 100%;
      height: 100%;
    }
  `]
})
export class ParticleBackgroundComponent implements OnInit, OnDestroy {
    canvasRef = viewChild<ElementRef<HTMLCanvasElement>>('bgCanvas');
    private themeService = inject(ThemeService);

    private particles: Particle[] = [];
    private packets: Packet[] = [];
    private ctx!: CanvasRenderingContext2D;
    private animationId: number = 0;
    private mouse = { x: 0, y: 0, active: false };

    constructor(private ngZone: NgZone) {
        effect(() => {
            const canvas = this.canvasRef();
            // Trigger whenever canvas OR theme changes
            const theme = this.themeService.theme();
            if (canvas) {
                this.initCanvas(canvas.nativeElement);
            }
        });
    }

    ngOnInit() {
        this.ngZone.runOutsideAngular(() => {
            window.addEventListener('resize', this.resize);
            window.addEventListener('mousemove', this.onMouseMove);
            window.addEventListener('mouseout', this.onMouseOut);
        });
    }

    ngOnDestroy() {
        cancelAnimationFrame(this.animationId);
        window.removeEventListener('resize', this.resize);
        window.removeEventListener('mousemove', this.onMouseMove);
        window.removeEventListener('mouseout', this.onMouseOut);
    }

    private resize = () => {
        if (!this.ctx) return;
        this.ctx.canvas.width = window.innerWidth;
        this.ctx.canvas.height = window.innerHeight;
        this.initParticles(this.ctx.canvas.width, this.ctx.canvas.height);
    };

    private onMouseMove = (e: MouseEvent) => {
        this.mouse.x = e.clientX;
        this.mouse.y = e.clientY;
        this.mouse.active = true;
    };

    private onMouseOut = () => {
        this.mouse.active = false;
    };

    private initCanvas(canvas: HTMLCanvasElement) {
        cancelAnimationFrame(this.animationId); // Stop existing loop
        this.ctx = canvas.getContext('2d')!;
        this.resize();
        this.ngZone.runOutsideAngular(() => this.animate());
    }

    private initParticles(width: number, height: number) {
        this.particles = [];
        this.packets = [];
        const count = Math.floor((width * height) / 15000); // Reduced density for performance

        const isDark = this.themeService.theme() === 'dark';

        // Palettes
        const darkColors = ['#6366f1', '#8b5cf6', '#3b82f6', '#a855f7', '#1e293b'];
        const lightColors = ['#0ea5e9', '#38bdf8', '#0284c7', '#7dd3fc', '#bae6fd']; // Sky Blues

        const colors = isDark ? darkColors : lightColors;

        for (let i = 0; i < count; i++) {
            let x, y, size;
            let attempts = 0;
            let tooClose = false;

            do {
                x = Math.random() * width;
                y = Math.random() * height;
                size = Math.random() * 3 + 1;
                tooClose = false;

                for (const p of this.particles) {
                    const dx = x - p.x;
                    const dy = y - p.y;
                    if (Math.hypot(dx, dy) < 50) {
                        tooClose = true;
                        break;
                    }
                }
                attempts++;
            } while (tooClose && attempts < 10);

            this.particles.push({
                x, y,
                vx: (Math.random() - 0.5) * 0.3,
                vy: (Math.random() - 0.5) * 0.3,
                size,
                color: colors[Math.floor(Math.random() * colors.length)],
                baseAlpha: Math.random() * 0.5 + 0.3,
                flashIntensity: 0,
                shockwaveActive: false,
                shockwaveRadius: 0
            });
        }
    }

    @Input() collapse: boolean = false;

    private animate = () => {
        if (!this.ctx) return;
        const canvas = this.ctx.canvas;
        const width = canvas.width;
        const height = canvas.height;
        const centerX = width / 2;
        const centerY = height / 2;
        const maxDist = Math.hypot(width / 2, height / 2);

        this.ctx.clearRect(0, 0, width, height);

        const isDark = this.themeService.theme() === 'dark';

        // Dynamic Colors
        const trailColorStart = isDark ? 'rgba(139, 92, 246, 0)' : 'rgba(14, 165, 233, 0)';
        const trailColorEnd = isDark ? 'rgba(192, 132, 252, 0.6)' : 'rgba(56, 189, 248, 0.6)';
        const dotColor = isDark ? '#c084fc' : '#38bdf8';
        const shockwaveColorBase = isDark ? '167, 139, 250' : '56, 189, 248'; // RGB for template string
        const connectionColorBase = isDark ? '139, 92, 246' : '2, 132, 199'; // RGB for connection

        // --- PACKET MANAGEMENT ---
        if (!this.collapse && this.packets.length < 5 && Math.random() < 0.005) {
            // Only spawn packets if not collapsing
            const p1 = this.particles[Math.floor(Math.random() * this.particles.length)];
            let p2: Particle | null = null;
            let minD = 150;

            for (const other of this.particles) {
                if (other === p1) continue;
                const d = Math.hypot(p1.x - other.x, p1.y - other.y);
                if (d < minD) {
                    p2 = other;
                    break;
                }
            }

            if (p2) {
                this.packets.push({
                    p1, p2,
                    progress: 0,
                    speed: 0.01 + Math.random() * 0.02
                });
            }
        }

        // Packets
        for (let i = this.packets.length - 1; i >= 0; i--) {
            const pkt = this.packets[i];
            pkt.progress += pkt.speed * (this.collapse ? 3 : 1); // Accelerate packets on collapse

            const curX = pkt.p1.x + (pkt.p2.x - pkt.p1.x) * pkt.progress;
            const curY = pkt.p1.y + (pkt.p2.y - pkt.p1.y) * pkt.progress;

            if (pkt.progress >= 1) {
                if (!this.collapse) {
                    pkt.p2.flashIntensity = 0.8;
                    pkt.p2.shockwaveActive = true;
                    pkt.p2.shockwaveRadius = 0;
                }
                this.packets.splice(i, 1);
                // No chain reaction during collapse
                if (!this.collapse && Math.random() < 0.4) {
                    for (const other of this.particles) {
                        if (other === pkt.p2 || other === pkt.p1) continue;
                        const d = Math.hypot(pkt.p2.x - other.x, pkt.p2.y - other.y);
                        if (d < 150) {
                            this.packets.push({
                                p1: pkt.p2,
                                p2: other,
                                progress: 0,
                                speed: pkt.speed
                            });
                            break;
                        }
                    }
                }
                continue;
            }

            const trailGradient = this.ctx.createLinearGradient(pkt.p1.x, pkt.p1.y, curX, curY);
            trailGradient.addColorStop(0, trailColorStart);
            trailGradient.addColorStop(1, trailColorEnd);

            this.ctx.beginPath();
            this.ctx.moveTo(pkt.p1.x, pkt.p1.y);
            this.ctx.lineTo(curX, curY);
            this.ctx.strokeStyle = trailGradient;
            this.ctx.lineWidth = 1.5;
            this.ctx.stroke();

            this.ctx.beginPath();
            this.ctx.arc(curX, curY, 1.5, 0, Math.PI * 2);
            this.ctx.fillStyle = dotColor;
            this.ctx.fill();
        }

        // Particles
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];

            if (this.collapse) {
                // WARP SPEED LOGIC
                const dx = centerX - p.x;
                const dy = centerY - p.y;
                const dist = Math.hypot(dx, dy);

                // Normalize and accelerate
                const speed = 10 + (maxDist - dist) * 0.05;
                const nx = dx / dist;
                const ny = dy / dist;

                p.x += nx * speed;
                p.y += ny * speed;

                // If reaches center, respawn far away or hide
                if (dist < 20) {
                    p.x = centerX + (Math.random() - 0.5) * width; // Scamble
                    p.y = centerY + (Math.random() - 0.5) * height; // Scamble
                    p.baseAlpha = 0; // Fade out
                }
            } else {
                p.x += p.vx;
                p.y += p.vy;

                if (p.x < 0 || p.x > width) p.vx *= -1;
                if (p.y < 0 || p.y > height) p.vy *= -1;
            }

            const distFromCenter = Math.hypot(p.x - centerX, p.y - centerY);
            const centerFade = Math.max(0, 1 - (distFromCenter / (maxDist * 0.8)));

            if (centerFade <= 0.01 && !p.flashIntensity && !this.collapse) continue;

            let hoverFactor = 0;
            if (this.mouse.active && !this.collapse) {
                const dx = p.x - this.mouse.x;
                const dy = p.y - this.mouse.y;
                const dist = Math.hypot(dx, dy);

                if (dist < 180) {
                    hoverFactor = (1 - dist / 180);
                    const nx = dx / dist;
                    const ny = dy / dist;
                    const force = hoverFactor * 1.5;
                    p.x += nx * force;
                    p.y += ny * force;
                }
            }

            if (p.flashIntensity > 0) {
                p.flashIntensity -= 0.03;
                if (p.flashIntensity < 0) p.flashIntensity = 0;
            }

            if (p.shockwaveActive) {
                p.shockwaveRadius += 1.0;
                const maxRad = 120;
                const alpha = Math.max(0, (1 - (p.shockwaveRadius / maxRad)) * 0.3);

                if (alpha > 0) {
                    this.ctx.beginPath();
                    this.ctx.arc(p.x, p.y, p.shockwaveRadius, 0, Math.PI * 2);
                    this.ctx.strokeStyle = `rgba(${shockwaveColorBase}, ${alpha})`;
                    this.ctx.lineWidth = 1;
                    this.ctx.stroke();
                } else {
                    p.shockwaveActive = false;
                }
            }

            const size = p.size * (1 + hoverFactor * 0.3) + (p.flashIntensity * 1.5);
            const rgb = this.hexToRgb(p.color);
            const r = Math.min(255, rgb.r + p.flashIntensity * 100);
            const g = Math.min(255, rgb.g + p.flashIntensity * 100);
            const b = Math.min(255, rgb.b + p.flashIntensity * 200);

            let alpha = Math.min(0.8, (p.baseAlpha + hoverFactor * 0.3 + p.flashIntensity) * centerFade);

            // Fade out drastically during collapse if close to center
            if (this.collapse) {
                alpha *= (distFromCenter / maxDist);
            }

            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)}, ${alpha})`;
            this.ctx.fill();

            if (!this.collapse) {
                for (let j = i + 1; j < this.particles.length; j++) {
                    const p2 = this.particles[j];
                    const dx = p.x - p2.x;
                    const dy = p.y - p2.y;
                    const dist = Math.hypot(dx, dy);

                    if (dist < 150) {
                        let opacity = (1 - dist / 150) * centerFade * 0.15;
                        if (hoverFactor > 0) opacity += hoverFactor * 0.15;
                        if (p.flashIntensity > 0) opacity += p.flashIntensity * 0.2;

                        if (opacity > 0) {
                            this.ctx.beginPath();
                            this.ctx.strokeStyle = `rgba(${connectionColorBase}, ${opacity})`;
                            this.ctx.lineWidth = 0.5;
                            this.ctx.moveTo(p.x, p.y);
                            this.ctx.lineTo(p2.x, p2.y);
                            this.ctx.stroke();
                        }
                    }
                }
            }
        }

        this.animationId = requestAnimationFrame(this.animate);
    };

    private hexToRgb(hex: string) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 255, g: 255, b: 255 };
    }
}

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    color: string;
    baseAlpha: number;
    flashIntensity: number;
    shockwaveActive: boolean;
    shockwaveRadius: number;
}

interface Packet {
    p1: Particle;
    p2: Particle;
    progress: number;
    speed: number;
}
