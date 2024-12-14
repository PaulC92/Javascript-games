import {
    Scene,
    Mesh,
    HemisphericLight,
    PointLight,
    SpotLight,
    PhotoDome,
    DirectionalLight,
    Camera,
    ShadowGenerator,
  } from "@babylonjs/core";
  
  export interface SceneData {
    scene: Scene;
    box: Mesh;
    sky: PhotoDome;
    building: Mesh;
    text: Mesh;
    lightDirectional?: DirectionalLight;
    lightHemispheric: HemisphericLight;
    sphere: Mesh;
    ground: Mesh;
    camera: Camera;
    shadowGenerator: ShadowGenerator;
  }
  