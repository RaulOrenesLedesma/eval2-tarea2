import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// --- CONFIGURACIÓN DE ESCENA ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a1a);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.5, 4);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 1, 0);

// --- ILUMINACIÓN ---
const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 2);
dirLight.position.set(5, 5, 5);
scene.add(dirLight);

// --- CARGA DEL MODELO ---
let mixer;
const clock = new THREE.Clock();
const loader = new GLTFLoader();

// interfaz para elegir animación
function createAnimationSelector(clips) {
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.bottom = '20px';
    container.style.left = '20px';
    container.style.background = 'rgba(0,0,0,0.8)';
    container.style.color = '#fff';
    container.style.padding = '10px';
    container.style.borderRadius = '8px';

    const label = document.createElement('label');
    label.textContent = 'Animación:';
    label.style.marginRight = '8px';
    const select = document.createElement('select');
    clips.forEach((clip, i) => {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = clip.name || `Clip ${i}`;
        select.appendChild(option);
    });
    select.addEventListener('change', () => {
        playClip(select.selectedIndex);
    });
    container.appendChild(label);
    container.appendChild(select);
    document.body.appendChild(container);
}

function playClip(index) {
    if (!mixer || !actions || !actions[index]) return;
    actions.forEach(a => a.stop());
    actions[index].play();
    document.getElementById('status').innerText = `Reproduciendo: ${actions[index]._clip.name}`;
}

let actions = [];

// IMPORTANTE: Asegúrate de que el archivo se llame "X Bot.glb" en tu carpeta
loader.load('./X Bot.glb', (gltf) => {
    const model = gltf.scene;
    scene.add(model);
    
    document.getElementById('status').innerText = "Modelo cargado correctamente";

    // preparar animaciones
    if (gltf.animations.length > 0) {
        mixer = new THREE.AnimationMixer(model);
        gltf.animations.forEach((clip) => {
            const action = mixer.clipAction(clip);
            actions.push(action);
        });
        createAnimationSelector(gltf.animations);
        playClip(0);
    }
}, 
(xhr) => {
    const porcentaje = Math.round((xhr.loaded / xhr.total) * 100);
    document.getElementById('status').innerText = `Cargando: ${porcentaje}%`;
},
(error) => {
    console.error("Error cargando el modelo:", error);
    document.getElementById('status').innerText = "Error: No se encontró X Bot.glb";
});

// --- CICLO DE ANIMACIÓN ---
function animate() {
    requestAnimationFrame(animate);
    
    const delta = clock.getDelta();
    if (mixer) mixer.update(delta);
    
    controls.update();
    renderer.render(scene, camera);
}

animate();

// --- RESIZE ---
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});