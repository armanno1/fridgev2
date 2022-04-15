import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import gsap from 'gsap'

/**
 * Base
 */
// Debug
//const gui = new dat.GUI()

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

//overlay

const overlayGeometry = new THREE.PlaneBufferGeometry(2,2,1,1)
const overlayMaterial = new THREE.ShaderMaterial({
    transparent: true,
    uniforms: {
        uAlpha: {value: 1}
    },
    vertexShader: `
        void main()
        {
            gl_Position = vec4(position, 1.0);
        }
    `, 
    fragmentShader: `
        uniform float uAlpha;
        void main() {
            gl_FragColor = vec4(0.0, 0.0, 0.0, uAlpha);
        }
    `
})
const overlay = new THREE.Mesh(overlayGeometry, overlayMaterial)
scene.add(overlay)

const loadingBar = document.querySelector('.loading-bar')
//loaders
const loadingManager = new THREE.LoadingManager(() => {
    window.setTimeout(() => {        
        gsap.to(overlayMaterial.uniforms.uAlpha, { duration: 3 , value: 0 })
        loadingBar.style.transform = ''
        loadingBar.classList.add('ended')
    }, 500)
}, (itemUrl, itemsLoaded, itemsTotal) => {
    const progressRatio = itemsLoaded/itemsTotal
    loadingBar.style.transform = `scaleX(${progressRatio})`
})
const cubeTextureLoader = new THREE.CubeTextureLoader(loadingManager)
const dracoLoader = new DRACOLoader(loadingManager)
const gltfLoader = new GLTFLoader(loadingManager)

//Env Map
const environmentMapTexture = cubeTextureLoader.load([
    '/textures/environmentMaps/0/px.png',
    '/textures/environmentMaps/0/nx.png',
    '/textures/environmentMaps/0/py.png',
    '/textures/environmentMaps/0/ny.png',
    '/textures/environmentMaps/0/pz.png',
    '/textures/environmentMaps/0/nz.png'
])

/**
 * Models
 */
dracoLoader.setDecoderPath('/draco/')
gltfLoader.setDRACOLoader(dracoLoader)

let mixer = null
let gs = new THREE.Group();
const pivot_top = new THREE.Object3D()
const pivot_bottom = new THREE.Object3D()
gs.add(pivot_top)
gs.add(pivot_bottom)
pivot_top.name = "pivot_top"
pivot_bottom.name = "pivot_bottom"

//scene.add(ad_dsw)

let door_handle_global = null

gltfLoader.load(
    '/models/fridge.glb',
    (gltf) =>
    {
        //rotate the scene and add to the gs group
        gs.add(gltf.scene)
        gs.traverse(c => c.castShadow = true)
        
        //get the doors
        const door = gs.getObjectByName("top_door")
        const bottom_door = gs.getObjectByName("bottom_door")
        const fridge = gs.getObjectByName("fridge_body")
        const door_handle = gs.getObjectByName("top_handle")
        const ad_dsw = gs.getObjectByName("ad_davidSW")
        const ad_sasquatch = gs.getObjectByName("ad_sasquatch")
        const ad_maldives = gs.getObjectByName("ad_maldives")
        door_handle_global = door_handle
        const bottom_door_handle = gs.getObjectByName("bottom_handle")
        const TWFC = gs.getObjectByName("TWFC")
        const patrons = gs.getObjectByName("patrons")
        //const top_shelf = gs.getObjectByName('top_shelf')
        //const bottom_shelf = gs.getObjectByName('bottom_shelf')

        //Materials
        fridge.material.roughness = 0.2
        fridge.material.metalness = 0.1
        fridge.material.toneMapped = false
        fridge.material.envMap = environmentMapTexture
        fridge.material.envMapIntensity = 0.5        

        door_handle.material = fridge.material.clone()
        bottom_door_handle.material = door_handle.material
        door_handle.material.metalness = 0.6
        door_handle.material.roughness = 0.1
        door_handle.material.envMap = environmentMapTexture

        TWFC.material = fridge.material.clone()
        TWFC.material.roughness = 0.3
        TWFC.material.color = new THREE.Color('#ecf0f1')

        patrons.material = fridge.material.clone()
        patrons.material.metalness = 0.4
        patrons.material.roughness = 0.1
        // patrons.material.color = new THREE.Color('#ffeaa7')

        ad_maldives.material.envMap = environmentMapTexture
        ad_sasquatch.material.envMap = environmentMapTexture
        ad_dsw.material.envMap = environmentMapTexture
        

        //top_shelf.material = door.material
        //bottom_shelf.material = door.material 

        door.attach(door_handle)
        door.attach(ad_dsw)
        door.attach(ad_maldives)
        door.attach(ad_sasquatch)

        bottom_door.attach(bottom_door_handle)

        // ad_dsw.material = new THREE.MeshBasicMaterial({map: texture})

        //set pivot group positions
        pivot_top.position.copy(door.position)
        pivot_bottom.position.copy(bottom_door.position)

        //set door positions locally in pivot groups
        door.position.set(0,0,0)
        bottom_door.position.set(0,0,0)

        //add doors to pivot groups
        pivot_top.add(door)
        pivot_bottom.add(bottom_door)

        //move doors and pivot groups into place
        const pivot_displacement = 0.38
        pivot_top.translateZ(pivot_displacement)
        door.translateZ(-pivot_displacement)        
        pivot_bottom.translateZ(pivot_displacement)
        bottom_door.translateZ(-pivot_displacement)
    
        //scaffolding cylinder (can comment this out at some point)
        //cylinder.position.copy(pivot_top.position)
        //gs.add(cylinder)

        //door debug
        //gui.add(pivot_top.rotation, 'y').min(-2).max(0).step(0.01).name('Top Door Rotation')
        //gui.add(pivot_bottom.rotation, 'y').min(-2).max(0).step(0.01).name('Bottom Door Rotation')
        
    }    
)
if (gs) {
    scene.add(gs)
    gs.rotateY(Math.PI * 1.2)
    //gui.add(gs.rotation, 'y').min(-2).max(0).step(0.1).name('pivot_rotation')
}

/**
 * Floor
 */
const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(50, 50),
    new THREE.MeshStandardMaterial({
        color: '#DDDDDD',
        metalness: 0,
        roughness: 0.5,
    })
)
floor.receiveShadow = true
floor.rotation.x = - Math.PI * 0.5
floor.position.set(0,-0.78,0)
scene.add(floor)

//Fog
const fog = new THREE.Fog('#FFFFFF', 1, 15)
scene.fog = fog

/**
 * Lights
 */
const ambientLight = new THREE.AmbientLight(0xefefef, 0.7)
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight(0xecf0f1, 0.4)
directionalLight.castShadow = true
directionalLight.shadow.mapSize.set(256, 256)
directionalLight.shadow.camera.far = 15
directionalLight.shadow.camera.left = - 7
directionalLight.shadow.camera.top = 7
directionalLight.shadow.camera.right = 7
directionalLight.shadow.camera.bottom = - 7
directionalLight.position.set(0, 6, 0)
scene.add(directionalLight)

const frontLight = new THREE.DirectionalLight(0xFFFFFF, 0.1)
frontLight.position.set(-2, 2, 5)
frontLight.castShadow = false
scene.add(frontLight)

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 0.3, 1000)
camera.position.set(-1.7, 0, 3.3)
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.target.set(0, 0, 0)
controls.enableDamping = true
controls.maxPolarAngle = Math.PI/2; 
controls.minDistance = 2;
controls.maxDistance = 3;

/**
 * Raycaster
 */
 const raycaster = new THREE.Raycaster()

 /**
 * Mouse
 */
const mouse = new THREE.Vector2()

window.addEventListener('mousemove', (event) =>
{
    mouse.x = event.clientX / sizes.width * 2 - 1
    mouse.y = - (event.clientY / sizes.height) * 2 + 1
})

let open = false
let doorRotation = - Math.PI * 0.6
window.addEventListener('mousedown', () =>
{
    if (currentIntersect) {
        gsap.to(pivot_top.rotation, {duration: 0.5, y: doorRotation, repeat: 0, ease: "power1"});
        if (open) {
            doorRotation = 0
            open = false
        } else {
            doorRotation = - Math.PI * 0.6
            open = true
        }
    }
})

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true
})
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
//renderer.setClearColor('#262837')


/**
 * Animate
 */
const clock = new THREE.Clock()
let previousTime = 0

let currentIntersect = null

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()
    const deltaTime = elapsedTime - previousTime
    previousTime = elapsedTime

    //RC
    raycaster.setFromCamera(mouse, camera)
    if (door_handle_global) {
        const intersects = raycaster.intersectObjects([door_handle_global])        
        if (intersects) { 
            currentIntersect = intersects[0]
            if (currentIntersect) {
                document.getElementById('body').style.cursor = 'pointer'
            } else {
                document.getElementById('body').style.cursor = 'default'
            }
        } else {
            currentIntersect = null
        }
    }

    if(mixer)
    {
        mixer.update(deltaTime)
    }

    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()