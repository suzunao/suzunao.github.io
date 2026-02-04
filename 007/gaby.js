import { butterfliesBackground } from 'https://unpkg.com/threejs-toys@0.0.7/build/threejs-toys.module.cdn.min.js'

    const pc = butterfliesBackground({
        el: document.getElementById('app'),
        eventsEl: document.body,
        gpgpuSize: 40, 
        background: 0xffffff,
        material: 'basic',
        materialParams: { transparent: true, alphaTest: 0.5 },
        texture: 'https://assets.codepen.io/33787/butterflies.png',
        textureCount: 4,
        wingsSpeed: 0.75,
        attractionRadius1: 100,
        attractionRadius2: 150,
        maxVelocity: 0.1,
    })


const app = document.getElementById('app');
const total = 60; 
const butterflies = [];

for (let i = 0; i < total; i++) {
    const el = document.createElement('div');
    el.className = 'butterfly';
    const spriteIndex = Math.floor(Math.random() * 4);
    el.style.backgroundPosition = `-${spriteIndex * 32}px 0px`;
    
    
    el.style.animationDelay = `${Math.random() * 2}s`;
    el.style.animationDuration = `${0.4 + Math.random() * 0.4}s`;
    
    app.appendChild(el);

    butterflies.push({
        el: el,
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: 0,
        vy: 0,
        phase: Math.random() * Math.PI * 2
    });
}

function getHeartPoint(t) {
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
    return { x: x * 15, y: y * 15 }; 
}

function animate() {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const now = Date.now() * 0.0015; 

    butterflies.forEach((b, i) => {
        const t = (i / total) * Math.PI * 2;
        const target = getHeartPoint(t);
        
        
        const hoverX = Math.cos(now + b.phase) * 8;
        const hoverY = Math.sin(now + b.phase) * 8;
        
        const tx = centerX + target.x + hoverX;
        const ty = centerY + target.y + hoverY;

        
        const dx = tx - b.x;
        const dy = ty - b.y;
        
        b.vx += dx * 0.002; 
        b.vy += dy * 0.002;
       
        b.vx *= 0.96; 
        b.vy *= 0.96;

        b.x += b.vx;
        b.y += b.vy;

        
        const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
        let angle = (speed > 0.2) ? Math.atan2(b.vy, b.vx) + Math.PI / 2 : t + Math.PI / 2;

        b.el.style.left = `${b.x}px`;
        b.el.style.top = `${b.y}px`;
        b.el.style.transform = `translate(-50%, -50%) rotate(${angle}rad)`;
    });

    requestAnimationFrame(animate);
}

animate();