# Element 1
To get started I played around with some of the babylon features and created a space scene with planets rotating around a central star.
To Add to this I added all the planets of our solar system and created some meshes with random verticies for asteroids, I then cloned these and created 2 asteroid belts.
To make Saturn and neptunes rings I created a disc and applied a png image with transparency.
I added cameras that follow each planet and click events on the planets that allow players to click the planet and see a small description of the planet with a close up.

# Element 2
For Element 2 I started creating a Venus planet scene. I used a random heightmap I found online and used it to create the terrain. 
I used the random verticies code from my asteroids and edited it to create rocks then cloned and placed them randomly on the terrain. 
I Mesh Merged all rocks to make them a single element for performance reasons.
I used a skybox for the background and tinted it yellow to try match Venus' Atmosphere.
I created a rocket out of different shapes, Mesh Merged them and placed it in the scene.

# Element 3
For Element 3 I wanted to create a moon scene. I copied Element 2 and replaced the heightmap, texture and removed the rocket.
I started with importing a mesh (I initially wanted a buggy but settled with the UFO when I had issues loading the buggy)
I added a spotlight to act as a abduction beam from the UFO (The pla nwas to pickup/move rocks with this)
Once I had the UFO in and moving I started adding Havok physics (Once I got this set-up my UFO started falling through the terrain :D )
I added a constant float to the UFO (I removed this later and removed physics from the UFO and attached physics to the abduction beam)
The plan was to use the abduction beam to lift any rocks and float them off the ground. (Couldn't get this to work)

# Element 4
For Element 4 my idea was to use the moon scene and add some menu interaction.
I started with creating a Start menu, This consisted of a few buttons including a music toggle
I then added the functionality to click on rocks to gather them and increase your score

# Element 5
For Element 5 my idea was to use the pervious scene and add a button that allows you to go from the moon surface to the asteroid belt.
To do this I reused the previous scene and changed some of the code.
I then created a second scene with asteroids to switch between