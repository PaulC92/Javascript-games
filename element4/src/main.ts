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

// Main Function
(async () => {
  // Start with the menu scene
  setupMenuScene();

  // Render loop
  engine.runRenderLoop(() => {
    scene.render();
  });

  // Handle window resize
  window.addEventListener("resize", () => engine.resize());
})();

// Setup Menu Scene
function setupMenuScene() {
  // Dispose previous scene if any
  scene.dispose();
  scene = new Scene(engine);

  // Camera and Lighting for Menu
  const camera = new ArcRotateCamera(
    "menuCamera",
    Math.PI / 2,
    Math.PI / 3,
    10,
    new Vector3(0, 0, 0),
    scene
  );
  camera.attachControl(canvas, true);
  new HemisphericLight("menuLight", new Vector3(0, 1, 0), scene);

  // GUI for Menu
  const advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");

  const panel = new GUI.StackPanel();
  advancedTexture.addControl(panel);

  // Title
  const title = new GUI.TextBlock();
  title.text = "Interactive Scene Demo";
  title.color = "white";
  title.fontSize = "36px";
  title.height = "80px";
  panel.addControl(title);

  // Start Button
  const startButton = GUI.Button.CreateSimpleButton("start", "Start");
  startButton.width = "200px";
  startButton.height = "50px";
  startButton.color = "white";
  startButton.background = "green";
  startButton.onPointerClickObservable.add(() => {
    setupInteractiveScene();
    advancedTexture.dispose();
  });
  panel.addControl(startButton);

  // Audio Toggle Button
  const audioButton = GUI.Button.CreateSimpleButton("audio", "Turn Audio On");
  audioButton.width = "200px";
  audioButton.height = "50px";
  audioButton.color = "white";
  audioButton.background = "blue";
  audioButton.paddingTop = "20px";
  audioButton.onPointerClickObservable.add(() => {
    isAudioOn = !isAudioOn;
    audioButton.textBlock!.text = isAudioOn ? "Turn Audio Off" : "Turn Audio On";

    if (!ambientSound) {
      ambientSound = new Sound("ambient", "./src/assets/audio/song.mp3", scene, null, {
        loop: true,
        autoplay: false,
        volume: 0.5,
      });
    }
    if (isAudioOn) {
      ambientSound.play();
    } else {
      ambientSound.stop();
    }
  });
  panel.addControl(audioButton);
}

// Setup Interactive Scene
async function setupInteractiveScene() {
  // Dispose previous scene if any
  scene.dispose();
  scene = new Scene(engine);

  // Camera and Lighting for the Scene
  const camera = new ArcRotateCamera(
    "gameCamera",
    Math.PI / 2,
    Math.PI / 3,
    15,
    new Vector3(0, 5, 0),
    scene
  );
  camera.attachControl(canvas, true);
  new HemisphericLight("gameLight", new Vector3(0, 1, 0), scene);

  // Create a Ground Plane from Heightmap
  const ground = MeshBuilder.CreateGroundFromHeightMap(
    "ground",
    "./src/assets/textures/moon_heightmap.jpg", // Heightmap texture
    {
      width: 200,
      height: 200,
      subdivisions: 100,
      minHeight: 0,
      maxHeight: 5,
    },
    scene
  );
  const groundMaterial = new StandardMaterial("groundMaterial", scene);
  groundMaterial.diffuseTexture = new Texture("./src/assets/textures/moon.jpg", scene);
  groundMaterial.specularColor = new Color3(0, 0, 0); // No shine
  ground.material = groundMaterial;

  ground.onMeshReadyObservable.add(() => {
    console.log("Heightmap applied successfully.");
    populateTerrainWithRocks(scene, ground);
  });

  // Load UFO
  ufo = await loadUFO(scene);
  camera.parent = ufo; // Attach camera to UFO

  // Add controls for UFO movement
  setupUfoControls(ufo);

  // GUI for the Scene
  const advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI("GameUI");

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

  // Instruction Display
  const instructions = new GUI.TextBlock();
  instructions.text = "Collect Rocks by clicking on them";
  instructions.color = "white";
  instructions.fontSize = "20px";
  instructions.height = "40px";
  instructions.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
  instructions.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
  instructions.paddingBottom = "20px";
  advancedTexture.addControl(instructions);

  // Interaction Logic: Collect Rocks
  scene.onPointerObservable.add((pointerInfo) => {
    if (pointerInfo.pickInfo?.hit && pointerInfo.pickInfo.pickedMesh) {
      const pickedMesh = pointerInfo.pickInfo.pickedMesh;
      if (pickedMesh.name.startsWith("rock")) {
        // Remove the rock and update the score
        pickedMesh.dispose();
        score += 10;
        scoreText.text = `Score: ${score}`;
        if (isAudioOn) {
          const clickSound = new Sound("click", "./src/assets/audio/click.mp3", scene, null, {
            autoplay: true,
            volume: 0.5,
          });
        }
      }
    }
  });
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

// Create and Populate Rocks
function createRock(scene) {
  const rock = MeshBuilder.CreateSphere("rockBase", { diameter: 1, segments: 6 }, scene);
  const rockMaterial = new StandardMaterial("rockMaterial", scene);
  rockMaterial.diffuseTexture = new Texture("./src/assets/textures/rock.jpg", scene);
  rock.material = rockMaterial;

  // Apply random deformation for irregular shapes
  const positions = rock.getVerticesData("position");
  for (let i = 0; i < positions!.length; i++) {
    positions![i] += Math.random() * 0.2 - 0.1;
  }
  rock.updateVerticesData("position", positions!);
  rock.setEnabled(false); // Use as a template
  return rock;
}

function populateTerrainWithRocks(scene, ground) {
  const baseRock = createRock(scene);

  for (let i = 0; i < 50; i++) {
    const rock = baseRock.clone(`rock${i}`);
    rock.setEnabled(true);

    // Position rocks randomly on the terrain
    rock.position.x = Math.random() * 50 - 25;
    rock.position.z = Math.random() * 50 - 25;
    rock.position.y = ground.getHeightAtCoordinates(rock.position.x, rock.position.z) || 1;

    rock.scaling = new Vector3(
      Math.random() * 1.5 + 0.5,
      Math.random() * 1.5 + 0.5,
      Math.random() * 1.5 + 0.5
    );
  }
}

// Setup UFO Movement Controls
function setupUfoControls(ufo) {
  const keys = {};

  // Key event listeners
  window.addEventListener("keydown", (e) => {
    keys[e.key] = true;
  });

  window.addEventListener("keyup", (e) => {
    keys[e.key] = false;
  });

  // Update movement in the render loop
  scene.onBeforeRenderObservable.add(() => {
    const speed = 0.1;
    if (keys["w"] || keys["ArrowUp"]) ufo.position.z -= speed;
    if (keys["s"] || keys["ArrowDown"]) ufo.position.z += speed;
    if (keys["a"] || keys["ArrowLeft"]) ufo.position.x -= speed;
    if (keys["d"] || keys["ArrowRight"]) ufo.position.x += speed;
  });
}
