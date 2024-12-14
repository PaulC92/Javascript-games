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
  Ray,
  Mesh,
  HavokPlugin,
  SceneLoader,
  PhysicsAggregate,
  PhysicsShapeType,
  SpotLight
} from "@babylonjs/core";
import HavokPhysics, { HavokPhysicsWithBindings } from "@babylonjs/havok";
import "@babylonjs/loaders";
import "./main.css";
import "@babylonjs/inspector";

// Initialize the engine and create a canvas
const canvas = document.createElement("canvas");
canvas.id = "renderCanvas";
document.body.appendChild(canvas);

const engine = new Engine(canvas, true);
const scene = new Scene(engine);

(async () => {
  const havokInstance: HavokPhysicsWithBindings = await HavokPhysics();
  const hk: HavokPlugin = new HavokPlugin(true, havokInstance);

  scene.enablePhysics(new Vector3(0, -9.8, 0), hk);

  // Set up the scene
  await setupScene(scene);

  // Render loop
  engine.runRenderLoop(() => {
    scene.render();
  });

  // Handle window resize
  window.addEventListener("resize", () => {
    engine.resize();
  });
})();

async function setupScene(scene) {
  // Create the camera
  const camera = new ArcRotateCamera(
    "Camera",
    Math.PI / 2,
    Math.PI / 3,
    10,
    new Vector3(0, 3, 0),
    scene
  );
  camera.attachControl(canvas, true);

  // Add lighting
  new HemisphericLight("HemiLight", new Vector3(0, 1, 0), scene);

  // Create Moon terrain
  const terrain = MeshBuilder.CreateGroundFromHeightMap(
    "MoonTerrain",
    "./src/assets/textures/moon_heightmap.jpg",
    {
      width: 600,
      height: 600,
      subdivisions: 150,
      minHeight: 0,
      maxHeight: 10,
    },
    scene
  );

  const terrainMaterial = new StandardMaterial("terrainMaterial", scene);
  terrainMaterial.diffuseTexture = new Texture(
    "./src/assets/textures/moon.jpg",
    scene
  );
  terrainMaterial.specularColor = new Color3(0, 0, 0); // Disable specular shine
  terrain.material = terrainMaterial;

  terrain.onMeshReadyObservable.add(() => {
    console.log("Terrain is ready.");
    const groundAggregate = new PhysicsAggregate(terrain, PhysicsShapeType.MESH, { mass: 0, restitution: 0.5, friction: 0.5 }, scene);
  });

  // Load the UFO player
  const ufo = await loadUFO(scene);

  // Attach the camera to the UFO
  camera.parent = ufo;
  camera.alpha = Math.PI / 2; // Adjust the angle to focus behind the UFO
  camera.beta = Math.PI / 4; // Slightly lower the angle

  // Add spotlight to UFO
  const spotlight = new SpotLight(
    "ufoSpotlight",
    new Vector3(0, -1, 0), // Direction pointing down
    new Vector3(0, -1, 0),
    Math.PI / 4, // Narrow beam angle
    5, // Sharp falloff
    scene
  );
  spotlight.intensity = 5; // Spotlight intensity
  spotlight.diffuse = new Color3(0, 1, 0); // Green diffuse color
  spotlight.specular = new Color3(0, 1, 0); // Green specular color
  spotlight.parent = ufo;

  // Add controls for the UFO
  addPlayerControls(ufo);

  // Add rocks to terrain
  populateTerrainWithRocks(scene, terrain);

  // Add constant floating for the UFO
  applyConstantFloating(ufo, scene);
}

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

  const ufo = result.meshes[0] as Mesh;
  ufo.scaling = new Vector3(3, 3, 3); // Increased scaling
  ufo.position = new Vector3(0, 15, 0); // Initial position

  console.log("UFO player loaded.");

  // Create and attach the beam
  const beam = MeshBuilder.CreateCylinder(
    "beam",
    { height: 15, diameterTop: 0, diameterBottom: 4, tessellation: 32 },
    scene
  );
  beam.parent = ufo; // Attach the beam to the UFO
  beam.position = new Vector3(0, -7.5, 0); // Position the beam below the UFO

  // Make the beam semi-transparent and green
  const beamMaterial = new StandardMaterial("beamMaterial", scene);
  beamMaterial.diffuseColor = new Color3(0, 1, 0); // Green color
  beamMaterial.alpha = 0.5; // Semi-transparent
  beam.material = beamMaterial;

  // Add physics to the beam
  new PhysicsAggregate(beam, PhysicsShapeType.CYLINDER, { mass: 0, restitution: 0.5, friction: 0.5 }, scene);

  // Add beam interaction logic
  addBeamInteractions(beam, scene, ufo);

  return ufo;
}

function addBeamInteractions(beam, scene, ufo) {
  const keyDownMap = {};
  let floatingRocks = [];

  // Register key events
  window.addEventListener("keydown", (event) => {
    keyDownMap[event.key] = true;

    // Show the beam when "E" is pressed
    if (event.key === "e") {
      beam.isVisible = true; // Make the beam visible
    }
  });

  window.addEventListener("keyup", (event) => {
    keyDownMap[event.key] = false;

    // Hide the beam when "E" is released
    if (event.key === "e") {
      beam.isVisible = false; // Hide the beam
      floatingRocks = []; // Clear floating rocks
    }
  });

  // Initially hide the beam
  beam.isVisible = false;

  // Add beam interactions
  scene.onBeforeRenderObservable.add(() => {
    if (keyDownMap["e"]) {
      // Get the beam's starting position and direction
      const beamStart = beam.getAbsolutePosition();
      const beamDirection = new Vector3(0, -1, 0); // Beam points downward
      const rayLength = 20; // Beam/ray length

      // Create a ray from the beam
      const ray = new Ray(beamStart, beamDirection, rayLength);

      // Find all rocks in the scene
      const rocks = scene.meshes.filter((mesh) => mesh.name.startsWith("rock_"));

      // Check each rock for intersection with the ray
      floatingRocks = rocks.filter((rock) => {
        const hitInfo = ray.intersectsMesh(rock);
        return hitInfo.hit; // Include only intersected rocks
      });

      // Float the intersected rocks toward the UFO
      floatingRocks.forEach((rock: Mesh) => {
        const targetPosition = ufo.getAbsolutePosition().add(new Vector3(0, -5, 0));
        const direction = targetPosition.subtract(rock.position).normalize();
        const movement = direction.scale(0.1); // Smooth movement
        rock.position.addInPlace(movement);

        // Elevate rocks slightly above the ground
        if (rock.position.y < targetPosition.y) {
          rock.position.y += 0.5; // Smooth elevation
        }
      });
    }
  });
}


function createRock(scene) {
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
  for (let i = 0; i < positions!.length; i += 3) {
    positions![i] += Math.random() * 0.1 - 0.05; // X-axis
    positions![i + 1] += Math.random() * 0.1 - 0.05; // Y-axis
    positions![i + 2] += Math.random() * 0.1 - 0.05; // Z-axis
  }
  rock.updateVerticesData("position", positions!);
  return rock;
}

function populateTerrainWithRocks(scene, terrain) {
  const baseRock = createRock(scene);

  for (let i = 0; i < 200; i++) {
    const rockInstance = baseRock.clone(`rock_${i}`);
    rockInstance.position.x = Math.random() * 300 - 100;
    rockInstance.position.z = Math.random() * 300 - 100;
    rockInstance.position.y = terrain.getHeightAtCoordinates(rockInstance.position.x, rockInstance.position.z) +1;
    rockInstance.scaling = new Vector3(
      Math.random() * 1.3 + 0.3,
      Math.random() * 1.3 + 0.3,
      Math.random() * 1.3 + 0.3
    );
    new PhysicsAggregate(rockInstance, PhysicsShapeType.SPHERE, { mass: 0.8, restitution: 0.1, friction: 1 }, scene);
  }
  baseRock.setEnabled(false);
}

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

function addPlayerControls(ufo) {
  const keyDownMap = {};
  let characterMoving = false;

  // Register key events
  window.addEventListener("keydown", (event) => {
    keyDownMap[event.key] = true;
  });
  window.addEventListener("keyup", (event) => {
    keyDownMap[event.key] = false;
  });

  // Update movement in the render loop
  scene.onBeforeRenderObservable.add(() => {
    characterMoving = false;

    // Calculate desired movement direction
    let forwardMovement = 0;
    let sidewaysMovement = 0;

    if (keyDownMap["w"] || keyDownMap["ArrowUp"]) {
      forwardMovement = 0.1;
    }
    if (keyDownMap["s"] || keyDownMap["ArrowDown"]) {
      forwardMovement = -0.1;
    }
    if (keyDownMap["a"] || keyDownMap["ArrowLeft"]) {
      sidewaysMovement = -0.1;
    }
    if (keyDownMap["d"] || keyDownMap["ArrowRight"]) {
      sidewaysMovement = 0.1;
    }

    // Update UFO's position
    ufo.position.z += forwardMovement;
    ufo.position.x += sidewaysMovement;

    // Calculate and apply rotation based on movement direction
    if (forwardMovement !== 0 || sidewaysMovement !== 0) {
      const desiredRotation = Math.atan2(sidewaysMovement, forwardMovement);
      ufo.rotation.y = desiredRotation;
    }
  });
}

function applyConstantFloating(ufo, scene) {
  const targetHeight = 25; // Desired hovering height
  const strength = 50; // Base upward force
  const damping = 5; // Damping to reduce oscillations

  scene.onBeforeRenderObservable.add(() => {
    if (ufo.physicsBody) {
      const currentHeight = ufo.position.y;
      const velocity = ufo.physicsBody.getLinearVelocity().y;

      // Calculate force based on height error and velocity
      const heightError = targetHeight - currentHeight;
      const upwardForce = strength * heightError - damping * velocity;

      // Apply upward force directly at the UFO's center of mass
      ufo.physicsBody.applyForce(new Vector3(0, upwardForce, 0), ufo.getAbsolutePosition());
    }
  });
}
