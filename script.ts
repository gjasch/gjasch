// Import necessary three.js components.
// These will be loaded via CDN in index.html, so we declare them as modules.
// We'll need to ensure the CDN versions expose these as ES modules or global variables.
// For now, we assume ES module imports will work if index.html is set up correctly.
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';

// DOM Elements
const selectionMenu = document.getElementById('selection-menu') as HTMLDivElement;
const viewerContainer = document.getElementById('viewer-container') as HTMLDivElement;
const fileList = document.getElementById('file-list') as HTMLUListElement;
const backButton = document.getElementById('back-button') as HTMLButtonElement;
const modelCanvas = document.getElementById('model-canvas') as HTMLCanvasElement;

// Available 3D model files
const modelFiles: string[] = [
    "Strength_in_Stance_0617185714_texture.fbx",
    "Strength_in_Stance_0617185815_texture.obj",
    "base.fbx"
];

// Three.js variables
let scene: THREE.Scene | null = null;
let camera: THREE.PerspectiveCamera | null = null;
let renderer: THREE.WebGLRenderer | null = null;
let controls: OrbitControls | null = null;
let currentModel: THREE.Object3D | null = null;
let animationFrameId: number | null = null;

// Function to populate the file list
function populateFileList(): void {
    modelFiles.forEach(fileName => {
        const listItem = document.createElement('li');
        listItem.textContent = fileName;
        listItem.setAttribute('data-filename', fileName);
        listItem.addEventListener('click', () => handleFileSelection(fileName));
        fileList.appendChild(listItem);
    });
}

// Handle file selection
function handleFileSelection(fileName: string): void {
    selectionMenu.style.display = 'none';
    viewerContainer.style.display = 'flex'; // Use flex as per CSS

    if (!renderer) { // First time loading a model
        initViewer(fileName);
    } else {
        loadModel(fileName);
    }
}

// Initialize the three.js viewer
function initViewer(modelPath: string): void {
    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x333333);

    // Camera
    camera = new THREE.PerspectiveCamera(75, modelCanvas.clientWidth / modelCanvas.clientHeight, 0.1, 1000);
    camera.position.z = 5; // Initial camera position

    // Renderer
    renderer = new THREE.WebGLRenderer({ canvas: modelCanvas, antialias: true });
    renderer.setSize(modelCanvas.clientWidth, modelCanvas.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7.5);
    scene.add(directionalLight);

    // Controls
    if (camera && renderer) {
        controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
        controls.dampingFactor = 0.05;
        controls.screenSpacePanning = false;
        controls.minDistance = 1;
        controls.maxDistance = 500;
        controls.maxPolarAngle = Math.PI / 2;
    }

    // Load the first model
    loadModel(modelPath);

    // Handle window resize
    window.addEventListener('resize', onWindowResize, false);
}

// Load a model
function loadModel(modelPath: string): void {
    if (!scene || !camera || !renderer) return;

    // Clear previous model
    if (currentModel && scene) {
        scene.remove(currentModel);
        // Dispose of geometries and materials if necessary for complex models
    }

    const fileExtension = modelPath.split('.').pop()?.toLowerCase();
    let loader: FBXLoader | OBJLoader;

    if (fileExtension === 'fbx') {
        loader = new FBXLoader();
    } else if (fileExtension === 'obj') {
        loader = new OBJLoader();
    } else {
        console.error('Unsupported file format:', fileExtension);
        alert('Unsupported file format.');
        // Show selection menu again
        viewerContainer.style.display = 'none';
        selectionMenu.style.display = 'block';
        return;
    }

    loader.load(
        modelPath,
        (object) => {
            if (!scene || !camera || !controls || !renderer) return;
            currentModel = object;
            scene.add(currentModel);

            // Center the model
            const box = new THREE.Box3().setFromObject(currentModel);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const fov = camera.fov * (Math.PI / 180);
            let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));

            // Add some padding so the model is not edge to edge
            cameraZ *= 1.5;

            camera.position.set(center.x, center.y, center.z + cameraZ);
            controls.target.copy(center);
            controls.update();

            console.log(`Loaded model: ${modelPath}`);
            if (animationFrameId === null) { // Start animation loop if not already running
                animate();
            }
        },
        (xhr) => {
            // console.log((xhr.loaded / xhr.total * 100) + '% loaded');
        },
        (error) => {
            console.error('Error loading model:', error);
            alert(`Error loading model: ${modelPath}. Check console for details.`);
            // Show selection menu again
            viewerContainer.style.display = 'none';
            selectionMenu.style.display = 'block';
        }
    );
}

// Handle window resize
function onWindowResize(): void {
    if (camera && renderer) {
        camera.aspect = modelCanvas.clientWidth / modelCanvas.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(modelCanvas.clientWidth, modelCanvas.clientHeight);
    }
}

// Animation loop
function animate(): void {
    if (!renderer || !scene || !camera || !controls) return;
    animationFrameId = requestAnimationFrame(animate);
    controls.update(); // only required if controls.enableDamping or controls.autoRotate are set to true
    renderer.render(scene, camera);
}

// Back button functionality
backButton.addEventListener('click', () => {
    viewerContainer.style.display = 'none';
    selectionMenu.style.display = 'block';

    // Stop animation and clean up
    if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    if (scene) {
        if (currentModel) {
            scene.remove(currentModel);
            // Proper disposal of model resources (geometry, material, textures)
            // currentModel.traverse((child) => {
            //     if (child instanceof THREE.Mesh) {
            //         child.geometry.dispose();
            //         if (Array.isArray(child.material)) {
            //             child.material.forEach(material => material.dispose());
            //         } else {
            //             child.material.dispose();
            //         }
            //     }
            // });
        }
        // scene.dispose(); // Dispose scene resources if necessary
    }
    // controls?.dispose(); // Dispose controls
    // renderer?.dispose(); // Dispose renderer

    // For simplicity in this example, we are not fully disposing all three.js objects.
    // In a larger application, thorough cleanup is important.
    // We will re-initialize the viewer if another model is selected.
    // Or, we can just clear the scene and keep the renderer, camera, controls.
    // For now, let's reset them to null to force re-initialization for simplicity.
    // scene = null;
    // camera = null;
    // renderer = null; // If we null out renderer, initViewer will create a new one.
    // controls = null;
    // currentModel = null;

    // Simpler approach: just remove model and stop animation.
    // Next selection will call loadModel which will add the new model.
    // If initViewer was robust, it could also handle re-initialization.
});

// Initialize
populateFileList();

// Note: A TypeScript build step (e.g., tsc) is required to compile this to JavaScript.
// The compiled JS file (e.g., dist/script.js) should be referenced in index.html.
// The subtask should handle this compilation.
// Also, index.html needs to be updated to include three.js, OrbitControls, FBXLoader, OBJLoader
// via CDN and the compiled script.ts file.
