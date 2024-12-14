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
  Sound,
  SceneLoader,
  Mesh,
} from "@babylonjs/core";
import * as GUI from "@babylonjs/gui";
import "@babylonjs/loaders";
import "./main.css";

// Initialize the engine and create a canvas
const canvas = document.createElement("canvas");
canvas.id = "renderCanvas";
document.body.appendChild(canvas);

const engine = new Engine(canvas, true);
let scene = new Scene(engine);

// State Management
let isAudioOn = false; // Audio state
let ambientSound; // Background sound
let ufo; // UFO reference
let score = 0;

// Scene References
let moonScene;
let asteroidScene;

// Main Function
(async () => {
  // Create both scenes
  moonScene = await createMoonScene();
  asteroidScene = await createAsteroidScene();

  // Start with the Moon Scene
  switchToScene(moonScene);

  // Render loop
  engine.runRenderLoop(() => {
    scene.render();
  });

  // Handle window resize
  window.addEventListener("resize", () => engine.resize());
})();

// Scene Switching Function
function switchToScene(newScene) {
  if (scene) scene.dispose(); // Dispose the current scene
  scene = newScene; // Set the new scene
  engine.runRenderLoop(() => scene.render()); // Start rendering the new scene
}

// Create Moon Scene
async function createMoonScene() {
  const moonScene = new Scene(engine);

  // Camera and Lighting
  const camera = new ArcRotateCamera(
    "moonCamera",
    Math.PI / 2,
    Math.PI / 3,
    15,
    new Vector3(0, 5, 0),
    moonScene
  );
  camera.attachControl(canvas, true);
  new HemisphericLight("moonLight", new Vector3(0, 1, 0), moonScene);

  // Ground Plane from Heightmap
  const ground = MeshBuilder.CreateGroundFromHeightMap(
    "ground",
    "./src/assets/textures/moon_heightmap.jpg",
    {
      width: 200,
      height: 200,
      subdivisions: 100,
      minHeight: 0,
      maxHeight: 5,
    },
    moonScene
  );
  const groundMaterial = new StandardMaterial("groundMaterial", moonScene);
  groundMaterial.diffuseTexture = new Texture("./src/assets/textures/moon.jpg", moonScene);
  groundMaterial.specularColor = new Color3(0, 0, 0); // No shine
  ground.material = groundMaterial;

  // Load UFO
  ufo = await loadUFO(moonScene);
  camera.parent = ufo;

  // Add UFO Movement Controls
  setupUfoControls(ufo, moonScene);

  // Populate Rocks
  ground.onMeshReadyObservable.add(() => {
    populateTerrainWithRocks(moonScene, ground);
  });

  // GUI
  const advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI("MoonUI");

  // Score Display
  const scoreText = new GUI.TextBlock();
  scoreText.text = `Score: ${score}`;
  scoreText.color = "white";
  scoreText.fontSize = "24px";
  scoreText.height = "50px";
  scoreText.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
  scoreText.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
  scoreText.paddingLeft = "20px";
  scoreText.paddingTop = "20px";
  advancedTexture.addControl(scoreText);

  // Scene Switch Button
  const switchButton = GUI.Button.CreateSimpleButton("switchToAsteroid", "Go to Asteroid Belt");
  switchButton.width = "200px";
  switchButton.height = "50px";
  switchButton.color = "white";
  switchButton.background = "purple";
  switchButton.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
  switchButton.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
  switchButton.paddingTop = "20px";
  switchButton.paddingRight = "20px";
  switchButton.onPointerClickObservable.add(() => {
    switchToScene(asteroidScene);
  });
  advancedTexture.addControl(switchButton);

  return moonScene;
}

// Create Asteroid Belt Scene
async function createAsteroidScene() {
  const asteroidScene = new Scene(engine);

  // Camera and Lighting
  const camera = new ArcRotateCamera(
    "asteroidCamera",
    Math.PI / 2,
    Math.PI / 3,
    15,
    new Vector3(0, 5, 0),
    asteroidScene
  );
  camera.attachControl(canvas, true);
  new HemisphericLight("asteroidLight", new Vector3(0, 1, 0), asteroidScene);

  // Starry Background
  const starsMaterial = new StandardMaterial("starsMaterial", asteroidScene);
  starsMaterial.diffuseTexture = new Texture("./src/assets/textures/starfield.png", asteroidScene);
  starsMaterial.backFaceCulling = false;

  const stars = MeshBuilder.CreateSphere("stars", { diameter: 1000 }, asteroidScene);
  stars.material = starsMaterial;

  // Load UFO
  const ufoInSpace = await loadUFO(asteroidScene);
  camera.parent = ufoInSpace;

  // Populate Asteroids
  populateAsteroids(asteroidScene);

  // GUI
  const advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI("AsteroidUI");

  // Score Display
  const scoreText = new GUI.TextBlock();
  scoreText.text = `Score: ${score}`;
  scoreText.color = "white";
  scoreText.fontSize = "24px";
  scoreText.height = "50px";
  scoreText.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
  scoreText.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
  scoreText.paddingLeft = "20px";
  scoreText.paddingTop = "20px";
  advancedTexture.addControl(scoreText);

  // Scene Switch Button
  const switchButton = GUI.Button.CreateSimpleButton("switchToMoon", "Go to Moon Scene");
  switchButton.width = "200px";
  switchButton.height = "50px";
  switchButton.color = "white";
  switchButton.background = "purple";
  switchButton.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
  switchButton.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
  switchButton.paddingTop = "20px";
  switchButton.paddingRight = "20px";
  switchButton.onPointerClickObservable.add(() => {
    switchToScene(moonScene);
  });
  advancedTexture.addControl(switchButton);

  return asteroidScene;
}

// Populate Asteroids with Irregular Shapes
function populateAsteroids(scene) {
  const baseAsteroid = MeshBuilder.CreateSphere("asteroidBase", { diameter: 1, segments: 8 }, scene);
  baseAsteroid.isVisible = false; // Use as a template

  // Material for asteroids
  const asteroidMaterial = new StandardMaterial("asteroidMaterial", scene);
  asteroidMaterial.diffuseTexture = new Texture("./src/assets/textures/rock.jpg", scene);

  for (let i = 0; i < 50; i++) {
    // Clone the base asteroid
    const asteroid = baseAsteroid.clone(`asteroid${i}`);
    asteroid.isVisible = true;

    // Randomly deform the asteroid vertices
    const positions = asteroid.getVerticesData("position");
    for (let j = 0; j < positions!.length; j += 3) {
      // Add random distortion to x, y, and z coordinates
      positions![j] += Math.random() * 0.5 - 0.25; // X-axis
      positions![j + 1] += Math.random() * 0.5 - 0.25; // Y-axis
      positions![j + 2] += Math.random() * 0.5 - 0.25; // Z-axis
    }
    asteroid.updateVerticesData("position", positions!);

    // Randomize position and scale
    asteroid.position.x = Math.random() * 100 - 50;
    asteroid.position.y = Math.random() * 50 - 25;
    asteroid.position.z = Math.random() * 100 - 50;
    asteroid.scaling = new Vector3(
      Math.random() * 2 + 0.5,
      Math.random() * 2 + 0.5,
      Math.random() * 2 + 0.5
    );

    // Apply the material
    asteroid.material = asteroidMaterial;
  }
}

// Load UFO Model
async function loadUFO(scene) {
  const result = await SceneLoader.ImportMeshAsync(
    "",
    "./src/assets/meshes/",
    "ufo.glb",
    scene
  );

  if (!result || result.meshes.length === 0) {
    throw new Error("Failed to load UFO model.");
  }

  const ufo = result.meshes[0];
  ufo.scaling = new Vector3(2, 2, 2); // Adjust size
  ufo.position = new Vector3(0, 7, 0); // Initial position

  console.log("UFO loaded successfully.");
  return ufo;
}

// UFO Controls
function setupUfoControls(ufo, scene) {
  const keys = {};
  window.addEventListener("keydown", (e) => (keys[e.key] = true));
  window.addEventListener("keyup", (e) => (keys[e.key] = false));

  scene.onBeforeRenderObservable.add(() => {
    const speed = 0.1;
    if (keys["w"] || keys["ArrowUp"]) ufo.position.z -= speed;
    if (keys["s"] || keys["ArrowDown"]) ufo.position.z += speed;
    if (keys["a"] || keys["ArrowLeft"]) ufo.position.x -= speed;
    if (keys["d"] || keys["ArrowRight"]) ufo.position.x += speed;
  });
}

// Populate Rocks on Moon Scene
function populateTerrainWithRocks(scene, ground) {
  for (let i = 0; i < 50; i++) {
    const rock = MeshBuilder.CreateSphere(`rock${i}`, { diameter: 1 }, scene);
    rock.position.x = Math.random() * 50 - 25;
    rock.position.z = Math.random() * 50 - 25;
    rock.position.y = ground.getHeightAtCoordinates(rock.position.x, rock.position.z) || 1;

    const rockMaterial = new StandardMaterial("rockMaterial", scene);
    rockMaterial.diffuseTexture = new Texture("./src/assets/textures/rock.jpg", scene);
    rock.material = rockMaterial;
  }
}
