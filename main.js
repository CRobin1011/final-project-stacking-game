import * as THREE from 'three'
import * as CANNON from 'cannon-es'

let camera, scene, renderer
let world
let stack = []
let overhangs = []
const boxHeight = 1
const originalBoxSize = 3

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

function generateBox(x, y, z, width, depth, falls) {
    const geometry = new THREE.BoxGeometry(width, boxHeight, depth)
    const color = new THREE.Color(`hsl(${30 + stack.length * 4}, 100%, 50%)`)
    const material = new THREE.MeshLambertMaterial({color})
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.set(x, y, z)
    scene.add(mesh)

    const shape = new CANNON.Box(
        new CANNON.Vec3(width / 2, boxHeight / 2, depth / 2)
    )
    let mass = falls ? 5 : 0
    mass *= width / originalBoxSize
    mass *= depth / originalBoxSize
    const body = new CANNON.Body({mass, shape})
    body.position.set(x, y, z)
    world.addBody(body)

    return {
        threejs: mesh,
        cannonjs: body,
        width,
        depth
    }
}

function addLayer(x, z, width, depth, direction) {
    const y = boxHeight * stack.length
    const layer = generateBox(x, y, z, width, depth, false)
    layer.direction = direction
    stack.push(layer)
}

function addOverHang(x, z, width, depth) {
    const y = boxHeight * (stack.length - 1)
    const overhang = generateBox(x, y, z, width, depth, true)
    overhangs.push(overhang)
}