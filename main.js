import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

// --- Scroll Reveal Logic for UI ---
function initScrollReveal() {
    const reveals = document.querySelectorAll('.reveal');
    if (!reveals.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            } else {
                // Remove to allow fading out and in repeatedly while flying
                entry.target.classList.remove('active');
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '-10% 0px -20% 0px'
    });

    reveals.forEach(reveal => {
        observer.observe(reveal);
    });
}
initScrollReveal();

// --- 3D Scene Setup (The Space Journey) ---
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x020204, 0.0015);

// Camera
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
container.appendChild(renderer.domElement);

// --- The Space Environment ---
const particleCount = 10000;
const particleGeometry = new THREE.BufferGeometry();
const particlePositions = new Float32Array(particleCount * 3);
const particleColors = new Float32Array(particleCount * 3);

const color1 = new THREE.Color(0x00f0ff);
const color2 = new THREE.Color(0xbf00ff);
const color3 = new THREE.Color(0xffffff);

for (let i = 0; i < particleCount * 3; i += 3) {
    const radius = 10 + Math.random() * 90;
    const theta = Math.random() * 2 * Math.PI;

    particlePositions[i] = radius * Math.cos(theta); // X
    particlePositions[i + 1] = radius * Math.sin(theta); // Y
    particlePositions[i + 2] = Math.random() * 2100 - 2000; // Z

    const rand = Math.random();
    let c = color3;
    if (rand > 0.8) c = color1;
    else if (rand > 0.6) c = color2;

    particleColors[i] = c.r;
    particleColors[i + 1] = c.g;
    particleColors[i + 2] = c.b;
}

particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
particleGeometry.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

const particleMaterial = new THREE.PointsMaterial({
    size: 0.5,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending
});

const starfield = new THREE.Points(particleGeometry, particleMaterial);
scene.add(starfield);

const shapes = [];
const shapeGeom = new THREE.IcosahedronGeometry(2, 0);
const shapeMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, wireframe: true, transparent: true, opacity: 0.3 });

for (let i = 0; i < 20; i++) {
    const mesh = new THREE.Mesh(shapeGeom, shapeMat);
    mesh.position.set(
        (Math.random() - 0.5) * 40,
        (Math.random() - 0.5) * 40,
        -Math.random() * 1800
    );
    mesh.userData = {
        rx: (Math.random() - 0.5) * 0.02,
        ry: (Math.random() - 0.5) * 0.02
    };
    shapes.push(mesh);
    scene.add(mesh);
}

// --- Scroll Tracking for Camera Fly-Through ---
let currentScroll = 0;
let targetScroll = 0;

window.addEventListener('scroll', () => {
    targetScroll = window.scrollY;
});

function getScrollPercent() {
    const h = document.documentElement;
    const b = document.body;
    const sh = 'scrollHeight';
    const maxScroll = (h[sh] || b[sh]) - h.clientHeight;
    return maxScroll > 0 ? currentScroll / maxScroll : 0;
}

// --- Interactivity (Mouse Parallax) ---
let mouseX = 0;
let mouseY = 0;
let targetX = 0;
let targetY = 0;

document.addEventListener('mousemove', (event) => {
    mouseX = (event.clientX - window.innerWidth / 2) * 0.05;
    mouseY = (event.clientY - window.innerHeight / 2) * 0.05;
});

// --- Animation Loop ---
function animate() {
    requestAnimationFrame(animate);

    currentScroll += (targetScroll - currentScroll) * 0.08;
    const scrollPercent = getScrollPercent();

    const startZ = 50;
    const endZ = -1800;
    camera.position.z = startZ + (endZ - startZ) * scrollPercent;

    starfield.rotation.z += 0.0005;

    shapes.forEach(shape => {
        shape.rotation.x += shape.userData.rx;
        shape.rotation.y += shape.userData.ry;
    });

    targetX = mouseX;
    targetY = mouseY;
    camera.position.x += (targetX - camera.position.x) * 0.05;
    camera.position.y += (-targetY - camera.position.y) * 0.05;

    const lookTarget = new THREE.Vector3(0, 0, camera.position.z - 100);
    camera.lookAt(lookTarget);

    renderer.render(scene, camera);
}

// --- Resize Handler ---
window.addEventListener('resize', () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
});

// Start animation
animate();
