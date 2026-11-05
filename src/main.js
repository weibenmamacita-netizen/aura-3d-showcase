import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'

// -------------------------------------
// 1. 页面基础交互
// -------------------------------------

const menuToggle = document.querySelector('#menuToggle')
const nav = document.querySelector('#nav')

menuToggle?.addEventListener('click', () => {
  nav.classList.toggle('nav-open')
  menuToggle.classList.toggle('active')
})

document.querySelectorAll('.nav a').forEach((link) => {
  link.addEventListener('click', () => {
    nav.classList.remove('nav-open')
    menuToggle.classList.remove('active')
  })
})

// 滚动进入动画
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible')
        revealObserver.unobserve(entry.target)
      }
    })
  },
  { threshold: 0.12 }
)

document.querySelectorAll('.reveal').forEach((element) => {
  revealObserver.observe(element)
})

// -------------------------------------
// 2. Three.js 场景
// -------------------------------------

const canvas = document.querySelector('#product-canvas')

if (canvas) {
  const scene = new THREE.Scene()
  scene.background = new THREE.Color('#08090b')

  const camera = new THREE.PerspectiveCamera(
    35,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  )

  camera.position.set(0, 0.15, 8.5)

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  })

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(canvas.clientWidth, canvas.clientHeight)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.25

  // 灯光
  const ambientLight = new THREE.AmbientLight('#ffffff', 1.1)
  scene.add(ambientLight)

  const keyLight = new THREE.DirectionalLight('#ffffff', 3.5)
  keyLight.position.set(4, 5, 5)
  scene.add(keyLight)

  const rimLight = new THREE.PointLight('#91bfff', 28, 15)
  rimLight.position.set(-4, 1, -3)
  scene.add(rimLight)

  const bottomLight = new THREE.PointLight('#ffffff', 12, 12)
  bottomLight.position.set(0, -4, 3)
  scene.add(bottomLight)

  // 产品主体组
  const product = new THREE.Group()
  scene.add(product)

  // 圆角长方体几何体
  function roundedBox(width, height, depth, radius, segments = 6) {
    const shape = new THREE.Shape()

    const x = -width / 2
    const y = -height / 2

    shape.moveTo(x + radius, y)
    shape.lineTo(x + width - radius, y)
    shape.quadraticCurveTo(x + width, y, x + width, y + radius)
    shape.lineTo(x + width, y + height - radius)
    shape.quadraticCurveTo(
      x + width,
      y + height,
      x + width - radius,
      y + height
    )
    shape.lineTo(x + radius, y + height)
    shape.quadraticCurveTo(x, y + height, x, y + height - radius)
    shape.lineTo(x, y + radius)
    shape.quadraticCurveTo(x, y, x + radius, y)

    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: true,
      bevelSegments: segments,
      bevelSize: radius * 0.35,
      bevelThickness: radius * 0.35,
      curveSegments: 12,
    })

    geometry.center()
    geometry.computeVertexNormals()
    return geometry
  }

  // 金属外壳
  const bodyMaterial = new THREE.MeshPhysicalMaterial({
    color: '#a8adb5',
    metalness: 0.94,
    roughness: 0.22,
    clearcoat: 1,
    clearcoatRoughness: 0.12,
  })

  const body = new THREE.Mesh(
    roundedBox(2.35, 4.65, 0.24, 0.28),
    bodyMaterial
  )

  product.add(body)

  // 正面玻璃屏幕
  const screenMaterial = new THREE.MeshPhysicalMaterial({
    color: '#11151d',
    metalness: 0.35,
    roughness: 0.16,
    clearcoat: 1,
    clearcoatRoughness: 0.08,
    transmission: 0.08,
  })

  const screen = new THREE.Mesh(
    roundedBox(2.19, 4.47, 0.025, 0.25),
    screenMaterial
  )

  screen.position.z = 0.145
  product.add(screen)

  // 屏幕内的柔和光效
  const screenGlowMaterial = new THREE.MeshBasicMaterial({
    color: '#304968',
    transparent: true,
    opacity: 0.28,
  })

  const screenGlow = new THREE.Mesh(
    new THREE.PlaneGeometry(1.55, 2.8),
    screenGlowMaterial
  )

  screenGlow.position.set(0, 0.05, 0.163)
  product.add(screenGlow)

  // 屏幕渐变视觉：使用几何圆环
  const screenRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.78, 0.012, 12, 120),
    new THREE.MeshBasicMaterial({
      color: '#91c8ff',
      transparent: true,
      opacity: 0.65,
    })
  )

  screenRing.position.set(0, 0.2, 0.18)
  screenRing.scale.set(0.85, 1.35, 1)
  product.add(screenRing)

  // 顶部听筒
  const speaker = new THREE.Mesh(
    new THREE.BoxGeometry(0.48, 0.035, 0.018),
    new THREE.MeshStandardMaterial({
      color: '#050608',
      metalness: 0.4,
      roughness: 0.6,
    })
  )

  speaker.position.set(0, 2.03, 0.18)
  product.add(speaker)

  // 摄像头组
  const cameraGroup = new THREE.Group()
  cameraGroup.position.set(0.65, 1.65, 0.17)
  product.add(cameraGroup)

  const cameraBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.34, 0.34, 0.055, 48),
    new THREE.MeshStandardMaterial({
      color: '#555b64',
      metalness: 0.9,
      roughness: 0.25,
    })
  )

  cameraBase.rotation.x = Math.PI / 2
  cameraGroup.add(cameraBase)

  const lensMaterial = new THREE.MeshPhysicalMaterial({
    color: '#101b2c',
    metalness: 0.6,
    roughness: 0.08,
    clearcoat: 1,
  })

  const lens = new THREE.Mesh(
    new THREE.CylinderGeometry(0.23, 0.23, 0.075, 48),
    lensMaterial
  )

  lens.rotation.x = Math.PI / 2
  lens.position.z = 0.055
  cameraGroup.add(lens)

  const lensReflection = new THREE.Mesh(
    new THREE.CircleGeometry(0.12, 48),
    new THREE.MeshBasicMaterial({
      color: '#7aaee8',
      transparent: true,
      opacity: 0.7,
    })
  )

  lensReflection.position.z = 0.096
  cameraGroup.add(lensReflection)

  // 摄像头镜头装饰环
  const lensRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.245, 0.018, 10, 64),
    new THREE.MeshStandardMaterial({
      color: '#c8cbd0',
      metalness: 1,
      roughness: 0.18,
    })
  )

  lensRing.position.z = 0.06
  cameraGroup.add(lensRing)

  // 侧边按键
  const buttonMaterial = new THREE.MeshStandardMaterial({
    color: '#b7bdc5',
    metalness: 0.95,
    roughness: 0.22,
  })

  const sideButton = new THREE.Mesh(
    new THREE.BoxGeometry(0.07, 0.48, 0.12),
    buttonMaterial
  )

  sideButton.position.set(1.2, 0.8, 0)
  product.add(sideButton)

  const volumeButton = new THREE.Mesh(
    new THREE.BoxGeometry(0.07, 0.32, 0.12),
    buttonMaterial
  )

  volumeButton.position.set(1.2, 0.1, 0)
  product.add(volumeButton)

  // 产品底部小细节
  const bottomPort = new THREE.Mesh(
    new THREE.BoxGeometry(0.34, 0.035, 0.025),
    new THREE.MeshStandardMaterial({
      color: '#15181d',
      metalness: 0.5,
      roughness: 0.6,
    })
  )

  bottomPort.position.set(0, -2.3, 0.15)
  product.add(bottomPort)

  // -------------------------------------
  // 3. 环绕粒子
  // -------------------------------------

  const particleCount = 700
  const particlePositions = new Float32Array(particleCount * 3)

  for (let i = 0; i < particleCount; i++) {
    const radius = 2.7 + Math.random() * 2.8
    const angle = Math.random() * Math.PI * 2
    const height = (Math.random() - 0.5) * 8

    particlePositions[i * 3] = Math.cos(angle) * radius
    particlePositions[i * 3 + 1] = height
    particlePositions[i * 3 + 2] = Math.sin(angle) * radius
  }

  const particleGeometry = new THREE.BufferGeometry()
  particleGeometry.setAttribute(
    'position',
    new THREE.BufferAttribute(particlePositions, 3)
  )

  const particleMaterial = new THREE.PointsMaterial({
    color: '#a9c9ed',
    size: 0.018,
    transparent: true,
    opacity: 0.72,
    sizeAttenuation: true,
  })

  const particles = new THREE.Points(
    particleGeometry,
    particleMaterial
  )

  scene.add(particles)

  // -------------------------------------
  // 4. 后期辉光
  // -------------------------------------

  const composer = new EffectComposer(renderer)

  composer.addPass(new RenderPass(scene, camera))

  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(
      canvas.clientWidth,
      canvas.clientHeight
    ),
    0.8,
    0.65,
    0.15
  )

  composer.addPass(bloomPass)

  // -------------------------------------
  // 5. 鼠标控制
  // -------------------------------------

  const controls = new OrbitControls(camera, canvas)

  controls.enableDamping = true
  controls.dampingFactor = 0.055
  controls.enablePan = false
  controls.minDistance = 6
  controls.maxDistance = 11
  controls.minPolarAngle = Math.PI * 0.32
  controls.maxPolarAngle = Math.PI * 0.68
  controls.autoRotate = true
  controls.autoRotateSpeed = 0.65

  // -------------------------------------
  // 6. 动画循环
  // -------------------------------------

  const clock = new THREE.Clock()

  function animate() {
    requestAnimationFrame(animate)

    const elapsed = clock.getElapsedTime()

    if (!controls.enabled) return

    product.position.y = Math.sin(elapsed * 0.8) * 0.055

    if (!controls.autoRotate) {
      product.rotation.y = Math.sin(elapsed * 0.25) * 0.025
    }

    particles.rotation.y = elapsed * 0.018

    screenRing.rotation.z = elapsed * 0.12

    controls.update()
    composer.render()
  }

  animate()

  // -------------------------------------
  // 7. 响应式尺寸
  // -------------------------------------

  function resizeScene() {
    const width = canvas.clientWidth
    const height = canvas.clientHeight

    if (!width || !height) return

    camera.aspect = width / height
    camera.updateProjectionMatrix()

    renderer.setSize(width, height)
    composer.setSize(width, height)
  }

  window.addEventListener('resize', resizeScene)

  // 移动端模型缩放
  function adjustForMobile() {
    if (window.innerWidth < 700) {
      camera.position.set(0, 0.1, 9.5)
      product.scale.setScalar(0.85)
    } else {
      camera.position.set(0, 0.15, 8.5)
      product.scale.setScalar(1)
    }

    camera.updateProjectionMatrix()
  }

  adjustForMobile()
  window.addEventListener('resize', adjustForMobile)
}