// Cosmos Visualization using Three.js
// Interactive star catalog viewer with 50,000 stars

let scene, camera, renderer, controls;
let starSystem;
let starCount = 0;

// Initialize the Three.js scene
function init() {
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    scene.fog = new THREE.FogExp2(0x000000, 0.0003);

    // Setup camera
    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        10000
    );
    camera.position.set(0, 0, 500);

    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.getElementById('canvas-container').appendChild(renderer.domElement);

    // Add OrbitControls for mouse interaction
    setupControls();

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);

    // Load and create star system
    loadStarData();

    // Handle window resize
    window.addEventListener('resize', onWindowResize, false);

    // Start animation loop
    animate();
}

// Setup OrbitControls for camera movement
function setupControls() {
    // Simple orbit controls implementation
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let rotation = { x: 0, y: 0 };
    let isPanning = false;
    let panOffset = new THREE.Vector3();

    renderer.domElement.addEventListener('mousedown', (e) => {
        isDragging = true;
        isPanning = e.button === 2; // Right mouse button
        previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    renderer.domElement.addEventListener('mousemove', (e) => {
        if (!isDragging) return;

        const deltaMove = {
            x: e.clientX - previousMousePosition.x,
            y: e.clientY - previousMousePosition.y
        };

        if (isPanning) {
            // Pan camera
            const panSpeed = 0.5;
            panOffset.x -= deltaMove.x * panSpeed;
            panOffset.y += deltaMove.y * panSpeed;
            camera.position.x = panOffset.x;
            camera.position.y = panOffset.y;
        } else {
            // Rotate camera
            rotation.y += deltaMove.x * 0.005;
            rotation.x += deltaMove.y * 0.005;

            const radius = camera.position.length();
            camera.position.x = radius * Math.sin(rotation.y) * Math.cos(rotation.x);
            camera.position.y = radius * Math.sin(rotation.x);
            camera.position.z = radius * Math.cos(rotation.y) * Math.cos(rotation.x);
            camera.lookAt(scene.position);
        }

        previousMousePosition = { x: e.clientX, y: e.clientY };
        updateCameraPosition();
    });

    renderer.domElement.addEventListener('mouseup', () => {
        isDragging = false;
        isPanning = false;
    });

    // Prevent context menu on right click
    renderer.domElement.addEventListener('contextmenu', (e) => {
        e.preventDefault();
    });

    // Zoom with mouse wheel
    renderer.domElement.addEventListener('wheel', (e) => {
        e.preventDefault();
        const zoomSpeed = 0.1;
        const delta = e.deltaY * zoomSpeed;

        const direction = new THREE.Vector3();
        camera.getWorldDirection(direction);
        camera.position.addScaledVector(direction, -delta);

        // Clamp camera distance
        const distance = camera.position.length();
        if (distance < 10) {
            camera.position.normalize().multiplyScalar(10);
        } else if (distance > 5000) {
            camera.position.normalize().multiplyScalar(5000);
        }

        updateCameraPosition();
    });
}

// Load star catalog data
async function loadStarData() {
    try {
        const response = await fetch('data.json');
        const data = await response.json();

        starCount = data.stars.length;
        document.getElementById('star-count').textContent = starCount.toLocaleString();

        createStarField(data.stars);
    } catch (error) {
        console.error('Error loading star data:', error);
    }
}

// Create star field from catalog data
function createStarField(stars) {
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const colors = [];
    const sizes = [];

    stars.forEach(star => {
        // Use the pre-calculated x, y, z coordinates
        positions.push(star.x, star.y, star.z);

        // Map color index to RGB color
        const color = colorFromIndex(star.colorIndex);
        colors.push(color.r, color.g, color.b);

        // Map magnitude to size (brighter stars = larger)
        // Lower magnitude = brighter = larger size
        const size = magnitudeToSize(star.magnitude);
        sizes.push(size);
    });

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));

    // Create point material
    const material = new THREE.PointsMaterial({
        size: 2,
        vertexColors: true,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending
    });

    // Create the particle system
    starSystem = new THREE.Points(geometry, material);
    scene.add(starSystem);
}

// Convert B-V color index to RGB color
function colorFromIndex(colorIndex) {
    // B-V ranges from -0.4 (blue) to +2.0 (red)
    // Map to RGB colors
    let r, g, b;

    if (colorIndex < 0) {
        // Blue stars
        r = 0.6 + colorIndex * 0.5;
        g = 0.7 + colorIndex * 0.3;
        b = 1.0;
    } else if (colorIndex < 0.6) {
        // White to yellow stars
        r = 1.0;
        g = 1.0 - colorIndex * 0.3;
        b = 1.0 - colorIndex * 0.8;
    } else if (colorIndex < 1.5) {
        // Yellow to orange stars
        const t = (colorIndex - 0.6) / 0.9;
        r = 1.0;
        g = 0.8 - t * 0.3;
        b = 0.5 - t * 0.5;
    } else {
        // Red stars
        const t = Math.min((colorIndex - 1.5) / 0.5, 1.0);
        r = 1.0;
        g = 0.5 - t * 0.3;
        b = 0.2 - t * 0.2;
    }

    return { r, g, b };
}

// Convert magnitude to point size
function magnitudeToSize(magnitude) {
    // Lower magnitude = brighter = larger size
    // Magnitude ranges from -1.5 to 6.5
    // Map to size range 1 to 8
    const normalized = (6.5 - magnitude) / 8.0;
    return 1 + normalized * 7;
}

// Update camera position display
function updateCameraPosition() {
    const pos = camera.position;
    document.getElementById('camera-pos').textContent =
        `${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}, ${pos.z.toFixed(1)}`;
}

// Handle window resize
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    // Gentle rotation of star field
    if (starSystem) {
        starSystem.rotation.y += 0.0002;
    }

    renderer.render(scene, camera);
}

// Initialize when page loads
window.addEventListener('DOMContentLoaded', init);
