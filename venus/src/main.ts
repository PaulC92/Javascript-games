import {
  Engine,
  Scene,
  ArcRotateCamera,
  Vector3,
  HemisphericLight,
  DirectionalLight,
  MeshBuilder,
  StandardMaterial,
  Texture,
  GroundMesh,
  Color3,
  Mesh,
  VertexData,
  CubeTexture,
  SceneLoader
} from "@babylonjs/core";
import "@babylonjs/loaders";
import "./main.css";
import { createRocket } from "./createRocket";

// Initialize Babylon.js
const CanvasName = "renderCanvas";

let canvas = document.createElement("canvas");
canvas.id = CanvasName;
canvas.classList.add("background-canvas");
document.body.appendChild(canvas);

let eng = new Engine(canvas, true, {}, true);
const scene = new Scene(eng);

// Add Camera
const camera = new ArcRotateCamera(
  "Camera",
  Math.PI / 2,
  Math.PI / 3,
  50,
  new Vector3(0, 40, 0),
  scene
);
camera.lowerRadiusLimit = 20; // Prevent getting too close to the surface
camera.upperRadiusLimit = 150; // Prevent moving too far away
camera.attachControl(canvas, true);

// Add hemispheric light for ambient lighting
new HemisphericLight("HemiLight", new Vector3(0, 1, 0), scene);

// Add directional light to simulate sunlight
const sun = new DirectionalLight("SunLight", new Vector3(-1, -2, -1), scene);
sun.intensity = 2;

// Create a skybox mesh
const skybox = MeshBuilder.CreateBox("skyBox", { size: 1024 }, scene);

// Create a material for the skybox
const skyboxMaterial = new StandardMaterial("skyBoxMaterial", scene);
skyboxMaterial.backFaceCulling = false; // Render inside the cube

// Assign the cube texture
skyboxMaterial.reflectionTexture = new CubeTexture(
  "./src/assets/textures/skybox/skybox",
  scene
);
skyboxMaterial.reflectionTexture.coordinatesMode = Texture.SKYBOX_MODE;

// Add a yellow tint using emissiveColor
skyboxMaterial.emissiveColor = new Color3(0.6, 0.4, 0); // Yellow tint

// Ensure no lighting effects on the skybox
skyboxMaterial.diffuseColor = new Color3(0, 0, 0);
skyboxMaterial.specularColor = new Color3(0, 0, 0);

// Apply the material to the skybox
skybox.material = skyboxMaterial;

// Create a terrain with a height map
const terrain = MeshBuilder.CreateGroundFromHeightMap(
  "MercuryTerrain",
  "./src/assets/textures/venus_heightmap.png",
  {
    width: 600,
    height: 600,
    subdivisions: 150,
    minHeight: 0,
    maxHeight: Math.random() * 25 + 10, // Randomize the height, Max of 35, min of 10
  },
  scene
);

const terrainMaterial = new StandardMaterial("terrainMaterial", scene);
  terrainMaterial.diffuseTexture = new Texture(
    "./src/assets/textures/venus_terrain.jpg",
    scene
  );
terrain.material = terrainMaterial;
terrainMaterial.specularColor = new Color3(0, 0, 0); // No specular highlights

// Function to create a rock
function createRock(scene: Scene): Mesh {
  const rock = MeshBuilder.CreateSphere("rock", { diameter: 2, segments: 6 });
  const rockMaterial = new StandardMaterial("rockMaterial", scene);
  rockMaterial.diffuseTexture = new Texture(
    "./src/assets/textures/rock.jpg",
    scene
  );
  rockMaterial.specularColor = new Color3(0, 0, 0);
  rock.material = rockMaterial;
  

  // Deform the rock slightly for irregular shapes
  const positions = rock.getVerticesData("position");
  for (let i = 0; i < positions!.length; i++) {
    positions![i] += Math.random() * 0.5 - 0.15;
  }
  rock.updateVerticesData("position", positions!);
  return rock;
}

// Add multiple rocks and merge them for optimization
function populateTerrainWithRocks(scene: Scene, terrain: GroundMesh) {
  const baseRock = createRock(scene);
  baseRock.setEnabled(false); // Hide the base rock

  const rockInstances: Mesh[] = [];
  for (let i = 0; i < 200; i++) {
    const rockInstance = baseRock.clone(`rock_${i}`);
    rockInstance.position.x = Math.random() * 300 - 100; // Spread across terrain width
    rockInstance.position.z = Math.random() * 300 - 100; // Spread across terrain height
    rockInstance.position.y = terrain.getHeightAtCoordinates(rockInstance.position.x, rockInstance.position.z);
    rockInstance.scaling = new Vector3(
      Math.random() * 1.2 + 0.5,
      Math.random() * 1.2 + 0.5,
      Math.random() * 1.2 + 0.5
    ); // Randomize size
    rockInstances.push(rockInstance);
  }

  // Merge all rocks into a single mesh for performance
  const mergedRocks = Mesh.MergeMeshes(rockInstances, true);
  mergedRocks!.name = "MergedRocks";
}

// Wait for terrain to generate before checking height
terrain.onMeshReadyObservable.add(() => {
  // Add rocks to terrain
  populateTerrainWithRocks(scene, terrain);

  const rocket = createRocket(scene);
  rocket.position = new Vector3(0, (terrain.getHeightAtCoordinates(0, 5)+3), 5); // Adjust position as needed

  // Adjust the camera to focus on the rocket
  camera.target = rocket.position.clone();
  camera.radius = 50; // Set camera distance
  camera.lowerBetaLimit = 0.1; // Prevent looking directly up
  camera.upperBetaLimit = Math.PI / 2; // Prevent looking directly down (overhead) 
  camera.lowerRadiusLimit = 30; // Prevent zooming too close
  camera.upperRadiusLimit = 150; // Prevent zooming too far
});


// Render loop
eng.runRenderLoop(() => {
  scene.render();
});

// Handle window resize
window.addEventListener("resize", () => {
  eng.resize();
});