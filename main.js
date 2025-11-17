import * as THREE from 'three'
import * as CANNON from 'cannon-es'

let camera, scene, renderer
let world

function init() {
    world = new CANNON.World()
    world.gravity.set(0, -10, 0)
    world.broadphase = new CANNON.NaiveBroadphase()
    world.solver.iterations = 40
    
    const aspect = window.innerWidth / window.innerHeight
    const width = 10
    const height = width / aspect

    camera = new THREE.OrthographicCamera(
        width / -2, width / 2, height / 2, height / -2, 0, 100
    )
    camera.position.set(4, 4, 4)
    camera.lookAt(0, 0, 0)

    scene = new THREE.Scene()

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambientLight)

    const dLight = new THREE.DirectionalLight(0xffffff, 0.6)
    dLight.position.set(10, 20, 0)
    scene.add(dLight)

    renderer = new THREE.WebGLRenderer({antialias: true})
    renderer.setSize(window.innerWidth, window.innerHeight)
    document.body.append(renderer.domElement)
}

init()