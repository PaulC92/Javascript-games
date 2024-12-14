import {
  Engine,
  Scene,
  ArcRotateCamera,
  Vector3,
  HemisphericLight,
  MeshBuilder,
  StandardMaterial,
  Texture,
  Color3,
  Mesh,
  VertexData,
  ActionManager,
  ExecuteCodeAction,
  MergeMeshesOptimization,
} from "@babylonjs/core";
import "./main.css";
import * as GUI from "@babylonjs/gui";
//import "@babylonjs/inspector";

// Initialize Babylon.js
const CanvasName = "renderCanvas";

let canvas = document.createElement("canvas");
canvas.id = CanvasName;
canvas.classList.add("background-canvas");
document.body.appendChild(canvas);

let eng = new Engine(canvas, true, {}, true);
const scene = new Scene(eng);

const descriptionBoxes: GUI.Rectangle[] = [];

// Add main camera
const mainCamera = new ArcRotateCamera(
  "mainCamera",
  Math.PI / 2,
  Math.PI / 2.5,
  210,
  Vector3.Zero(),
  scene
);
mainCamera.attachControl(canvas, true);
scene.activeCamera = mainCamera; // Set main camera as active

// Add light
new HemisphericLight("light", new Vector3(1, 1, 0), scene);

// Create the Sun
const sunMaterial = new StandardMaterial("sunMaterial", scene);
sunMaterial.emissiveColor = new Color3(1, 1, 0);
const sun = MeshBuilder.CreateSphere("sun", { diameter: 9 }, scene);
sun.material = sunMaterial;

// Create the return button
const returnButton = document.createElement("button");
returnButton.textContent = "Return to Main Camera";
returnButton.style.position = "absolute";
returnButton.style.top = "10px";
returnButton.style.left = "10px";
returnButton.style.zIndex = "10";
returnButton.style.padding = "10px 20px";
returnButton.style.fontSize = "16px";
returnButton.style.backgroundColor = "#333";
returnButton.style.color = "#fff";
returnButton.style.border = "none";
returnButton.style.cursor = "pointer";
document.body.appendChild(returnButton);

// Initially hide the button
returnButton.style.display = "none";

// Return to main camera on button click
returnButton.addEventListener("click", () => {
  scene.activeCamera = mainCamera; // Switch back to the main camera
  mainCamera.attachControl(canvas, true);
  toggleReturnButton(); // Update button visibility
});

// Function to toggle button visibility based on the active camera
function toggleReturnButton() {
  if (scene.activeCamera === mainCamera) {
    returnButton.style.display = "none";
    descriptionBoxes.forEach((box) => (box.isVisible = false));
  } else {
    returnButton.style.display = "block";
  }
}

// Function to create planets with individual cameras
function createPlanet(
  name: string,
  distance: number,
  size: number,
  textureUrl: string,
  orbitSpeed: number,
  axialSpeed: number,
  description: string
) {
  const planetMaterial = new StandardMaterial(`${name}Material`, scene);
  planetMaterial.diffuseTexture = new Texture(textureUrl, scene);

  const planet = MeshBuilder.CreateSphere(name, { diameter: size }, scene);
  planet.material = planetMaterial;

  // Generate a random starting angle (0 to 2 * PI radians)
  let orbitAngle = Math.random() * Math.PI * 2;

  // Place the planet at its initial position based on the random angle
  planet.position.x = distance * Math.cos(orbitAngle);
  planet.position.z = distance * Math.sin(orbitAngle);

  // Create a camera for this planet
  const planetCamera = new ArcRotateCamera(
    `${name}Camera`,
    Math.PI / 2,
    Math.PI / 4,
    distance / 2, // create a calculation that can use planet size 
    planet.position,
    scene
  );

  // Create the description UI
  const advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI(
    `${name}UI`
  );

  const descriptionBox = new GUI.Rectangle();
  descriptionBox.width = "250px";
  descriptionBox.height = "210px";
  descriptionBox.cornerRadius = 10;
  descriptionBox.color = "white";
  descriptionBox.thickness = 0;
  descriptionBox.background = "rgba(3, 3, 3, 0.7)";
  descriptionBox.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
  descriptionBox.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
  descriptionBox.isVisible = false;

  const descriptionText = new GUI.TextBlock();
  descriptionText.text = description;
  descriptionText.color = "white";
  descriptionText.fontSize = 14;
  descriptionText.textWrapping = GUI.TextWrapping.WordWrap;
  descriptionText.resizeToFit = true;
  descriptionBox.addControl(descriptionText);
  advancedTexture.addControl(descriptionBox);

  // Add the description box to the global list
  descriptionBoxes.push(descriptionBox);

  // Orbit and rotation logic
  scene.onBeforeRenderObservable.add(() => {
    // Update orbital position
    orbitAngle += orbitSpeed;
    planet.position.x = distance * Math.cos(orbitAngle);
    planet.position.z = distance * Math.sin(orbitAngle);

    // Rotate the planet on its own axis
    planet.rotation.y -= axialSpeed;

    // Keep the planet's camera locked onto the planet's position
    planetCamera.setTarget(planet.position);
  });

  // Add click action to switch to this planet's camera and show the description
  planet.actionManager = new ActionManager(scene);
  planet.actionManager.registerAction(
    new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
      // Hide all description boxes
      descriptionBoxes.forEach((box) => (box.isVisible = false));

      // Switch to this planet's camera
      scene.activeCamera = planetCamera;
      planetCamera.attachControl(canvas, true);

      // Show this planet's description
      descriptionBox.isVisible = true;

      // Update button visibility
      toggleReturnButton();
    })
  );

  return planet;
}

// Function to create a custom asteroid mesh
function createCustomAsteroidMesh(name: string): Mesh {
  const positions: number[] = [];
  const indices: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];

  const radius = 1;
  const segments = 6;

  for (let i = 0; i <= segments; i++) {
    const theta = (i * Math.PI) / segments;
    for (let j = 0; j <= segments; j++) {
      const phi = (j * 2 * Math.PI) / segments;

      // Randomize radius slightly for an irregular shape
      const randomizedRadius = radius + Math.random() * 0.2 - 0.1;

      // Cartesian coordinates
      const x = randomizedRadius * Math.sin(theta) * Math.cos(phi);
      const y = randomizedRadius * Math.sin(theta) * Math.sin(phi);
      const z = randomizedRadius * Math.cos(theta);

      // Add position
      positions.push(x, y, z);

      // Add UV coordinates
      uvs.push(j / segments, i / segments);
    }
  }

  // Generate indices for faces
  for (let i = 0; i < segments; i++) {
    for (let j = 0; j < segments; j++) {
      const first = i * (segments + 1) + j;
      const second = first + segments + 1;

      indices.push(first, second, first + 1);
      indices.push(second, second + 1, first + 1);
    }
  }

  // Calculate normals
  VertexData.ComputeNormals(positions, indices, normals);

  // Create the mesh
  const asteroid = new Mesh(name, scene);
  const vertexData = new VertexData();
  vertexData.positions = positions;
  vertexData.indices = indices;
  vertexData.normals = normals;
  vertexData.uvs = uvs;
  vertexData.applyToMesh(asteroid);

  // Add material
  const asteroidMaterial = new StandardMaterial(`${name}Material`, scene);
  asteroidMaterial.diffuseTexture = new Texture(
    "./src/assets/textures/asteroid.jpg",
    scene
  );
  asteroid.material = asteroidMaterial;

  return asteroid;
}

// Function to create the asteroid belt
function createAsteroidBelt(
  numAsteroids: number,
  innerRadius: number,
  outerRadius: number,
  beltWidth: number
) {
  // Create base asteroid mesh
  const baseAsteroid = createCustomAsteroidMesh("baseAsteroid");
  baseAsteroid.setEnabled(false); // Hide base asteroid mesh

  // Create material for the asteroids
  const asteroidMaterial = new StandardMaterial("asteroidMaterial", scene);
  asteroidMaterial.diffuseTexture = new Texture(
    "./src/assets/textures/asteroid.jpg",
    scene
  );

  for (let i = 0; i < numAsteroids; i++) {
    // Clone base asteroid mesh
    const asteroidInstance = baseAsteroid.clone(`asteroid_${i}`);
    asteroidInstance.setEnabled(true);

    // Apply the material
    asteroidInstance.material = asteroidMaterial;

    // Randomize position
    const distance = innerRadius + Math.random() * (outerRadius - innerRadius);
    const angle = Math.random() * Math.PI * 2;
    const height = Math.random() * beltWidth - beltWidth / 2;

    asteroidInstance.position.x = distance * Math.cos(angle);
    asteroidInstance.position.z = distance * Math.sin(angle);
    asteroidInstance.position.y = height;

    // Randomize scale
    const scale = Math.random() * 0.15 + 0.15;
    asteroidInstance.scaling = new Vector3(scale, scale, scale);

    // Randomize rotation
    asteroidInstance.rotation = new Vector3(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI
    );
  }
}

// Function to create Saturn's rings
function createSaturnRings(saturn: Mesh) {
  const ringMaterial = new StandardMaterial("ringMaterial", scene);
  ringMaterial.diffuseTexture = new Texture(
    "./src/assets/textures/saturn-rings.png",
    scene
  );
  ringMaterial.diffuseTexture.hasAlpha = true;
  ringMaterial.backFaceCulling = false;

  const ring = MeshBuilder.CreateDisc("saturnRings", {
    radius: 4.5,
    tessellation: 64,
  });

  ring.material = ringMaterial;
  ring.parent = saturn;
  ring.rotation.x = Math.PI / 2; 
  return ring;
}

// function to create Uranus rings
function createUranusRings(saturn: Mesh) {
  const ringMaterial = new StandardMaterial("ringMaterial", scene);
  ringMaterial.diffuseTexture = new Texture(
    "./src/assets/textures/uranus-rings.png", 
    scene
  );
  ringMaterial.diffuseTexture.hasAlpha = true;
  ringMaterial.backFaceCulling = false;

  const ring = MeshBuilder.CreateDisc("uranusRings", {
    radius: 3.5,
    tessellation: 64,
  });

  ring.material = ringMaterial;
  ring.parent = uranus;
  ring.rotation.y = Math.PI / 2;
  return ring;
}

// Create planets
createPlanet(
  "Mercury",
  15,
  1.8,
  "./src/assets/textures/mercury.jpg",
  0.002,
  0.0025,
  "Mercury is the smallest planet and closest to the Sun, with a rocky, cratered surface resembling Earth’s Moon. It has an incredibly short year, taking only 88 Earth days to orbit the Sun, and despite its proximity to the Sun, it’s not the hottest planet due to its lack of atmosphere."
);
createPlanet(
  "Venus",
  25,
  2.25,
  "./src/assets/textures/venus.jpg",
  0.0012,
  0.0025,
  "Venus, often called Earth’s \"twin\" because of its similar size, is a scorching planet with thick clouds of sulfuric acid. It holds the title of the hottest planet in the solar system, with surface temperatures reaching over 475°C (900°F), and its day is longer than its year."
);
createPlanet(
  "Earth",
  36,
  2.5,
  "./src/assets/textures/earth.jpg",
  0.0008,
  0.0025,
  "Earth is the only planet known to support life, with a diverse environment and a surface covered by over 70% water. Its atmosphere shields it from harmful solar radiation and helps maintain temperatures that allow life to thrive."
);
createPlanet(
  "Mars",
  42,
  2,
  "./src/assets/textures/mars.jpg",
  0.0005,
  0.002,
  "Mars, the \"Red Planet,\" is a cold, desert world with evidence of ancient rivers and lakes. It hosts Olympus Mons, the largest volcano in the solar system, and experiences massive dust storms that can envelop the entire planet."
);
createPlanet(
  "Ceres",
  56,
  0.8,
  "./src/assets/textures/ceres.jpg",
  0.0004,
  0.002,
  "Ceres is a dwarf planet in the middle main asteroid belt between the orbits of Mars and Jupiter. It was the first known asteroid, discovered on 1 January 1801 and is the largest asteroid in the main asteroid belt"
);
createPlanet(
  "Jupiter",
  75,
  6,
  "./src/assets/textures/jupiter.jpg",
  0.0002,
  0.002,
  "Jupiter is the largest planet in the solar system, a gas giant with turbulent clouds and storms, including the iconic Great Red Spot. It has at least 92 moons, including Ganymede, the largest moon in the solar system, and boasts the strongest magnetic field of all the planets."
);
const saturn = createPlanet(
  "Saturn",
  89,
  3.5,
  "./src/assets/textures/saturn.jpg",
  0.0002,
  0.001,
  "Saturn is a gas giant known for its stunning ring system made up of ice and rock particles. It has 83 confirmed moons, including Titan, the second-largest moon in the solar system, with a thick atmosphere."
);
createSaturnRings(saturn);

const uranus = createPlanet(
  "Uranus",
  107,
  3.2,
  "./src/assets/textures/uranus.jpg",
  0.0001,
  0.000,
  "Uranus is an ice giant with a pale blue color due to methane in its atmosphere. It rotates on its side, with its axis nearly parallel to its orbit, and has faint rings and 27 known moons."
);
createUranusRings(uranus);

createPlanet(
  "Neptune",
  135,
  3.1,
  "./src/assets/textures/neptune.jpg",
  0.00007,
  0.001,
  "Neptune is the farthest planet from the Sun, an ice giant with a deep blue color. It has the strongest winds in the solar system, reaching speeds of over 2,000 km/h, and 14 known moons, including Triton, which has geysers of liquid nitrogen."
);
createPlanet(
  "Pluto",
  155,
  1,
  "./src/assets/textures/pluto.jpg",
  0.00007,
  0.001,
  "Pluto is a dwarf planet in the Kuiper belt, a ring of bodies beyond the orbit of Neptune. It is the ninth-largest and tenth-most-massive known object to directly orbit the Sun."
);

// Create the asteroid belt between Mars and Jupiter
createAsteroidBelt(120, 49, 62, 2);

// Create the outer asteroid belt
createAsteroidBelt(200, 149, 172, 2);

// Merge all asteroid meshes for performance


// Create stars (background)
const starsMaterial = new StandardMaterial("starsMaterial", scene);
starsMaterial.diffuseTexture = new Texture(
  "./src/assets/textures/starfield.png",
  scene
);
starsMaterial.backFaceCulling = false;

const stars = MeshBuilder.CreateSphere(
  "stars",
  { diameter: 1000, segments: 32 },
  scene
);
stars.material = starsMaterial;

// Enable debug layer for inspection
//scene.debugLayer.show({});

// Render loop
eng.runRenderLoop(() => {
  scene.render();
  toggleReturnButton(); // Check button visibility on each frame
});

// Handle window resize
window.addEventListener("resize", () => {
  eng.resize();
});
