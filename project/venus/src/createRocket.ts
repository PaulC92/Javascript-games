import { MeshBuilder, StandardMaterial, Color3, Mesh, Scene, Vector3 } from '@babylonjs/core';

export function createRocket(scene: Scene): Mesh {
    // Materials
    const bodyMaterial = new StandardMaterial("bodyMaterial", scene);
    bodyMaterial.diffuseColor = new Color3(0.8, 0.8, 0.8); // Light gray

    const noseMaterial = new StandardMaterial("noseMaterial", scene);
    noseMaterial.diffuseColor = new Color3(1, 0, 0); // Red

    const finMaterial = new StandardMaterial("finMaterial", scene);
    finMaterial.diffuseColor = new Color3(0, 0, 1); // Blue

    // Rocket body
    const body = MeshBuilder.CreateCylinder("body", { diameter: 1, height: 5 }, scene);
    body.material = bodyMaterial;

    // Rocket nose
    const nose = MeshBuilder.CreateCylinder("nose", { diameterTop: 0, diameterBottom: 1, height: 1 }, scene);
    nose.position.y = 3; // Positioned above the body
    nose.material = noseMaterial;

    // Rocket fins
    const fin1 = MeshBuilder.CreateBox("fin1", { width: 0.1, height: 1, depth: 0.5 }, scene);
    fin1.position.set(0.6, -2, 0); // Positioned at the bottom of the body
    fin1.rotation.y = Math.PI / 2;
    fin1.material = finMaterial;

    const fin2 = fin1.clone("fin2");
    fin2.position.set(-0.6, -2, 0);

    const fin3 = fin1.clone("fin3");
    fin3.rotation.y = 0;
    fin3.position.set(0, -2, 0.6);

    const fin4 = fin3.clone("fin4");
    fin4.position.set(0, -2, -0.6);

    // Rocket engines
    const engine1 = MeshBuilder.CreateCylinder("engine1", { diameter: 0.5, height: 0.5 }, scene);
    engine1.position.set(0.5, -2.75, 0);
    engine1.material = bodyMaterial;

    const engine2 = engine1.clone("engine2");
    engine2.position.set(-0.5, -2.75, 0);

    const engine3 = engine1.clone("engine3");
    engine3.position.set(0, -2.75, 0.5);

    const engine4 = engine1.clone("engine4");
    engine4.position.set(0, -2.75, -0.5);

    // Merge all parts into one mesh
    const rocketParts = [body, nose, fin1, fin2, fin3, fin4, engine1, engine2, engine3, engine4];
    const mergedRocket = Mesh.MergeMeshes(rocketParts, true, true, undefined, false);
    
    // Return the merged rocket mesh
    if (mergedRocket) {
        mergedRocket.name = "Rocket";
        //mergedRocket.position = Vector3.Zero(); // Optional: Set initial position
        return mergedRocket;
    } else {
        throw new Error("Failed to merge rocket parts into a single mesh.");
    }
}
