// src/components/GLBAvatar.jsx
import React, { Suspense, useRef, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { FBXLoader } from 'three-stdlib'

function AvatarModel() {
  const group = useRef()
  const gltf = useGLTF('/human_avatar/avatar1.glb')
  const mixerRef = useRef()

  useEffect(() => {
    const loader = new FBXLoader()
    loader.load('/human_avatar/idle.fbx', (fbx) => {
      const mixer = new THREE.AnimationMixer(gltf.scene)
      mixer.clipAction(fbx.animations[0]).play()
      mixerRef.current = mixer
    })
  }, [gltf.scene])

  useFrame((state, delta) => {
    if (mixerRef.current) {
      mixerRef.current.update(delta)
    }
  })

  return (
    <group ref={group}>
      <primitive object={gltf.scene} scale={1} position={[0, -1.55, 0]} />
    </group>
  )
}

export default function GLBAvatar() {
  return (
    <div style={{
      width: '35vw',          // 35% of viewport width
      height: '60vh',         // 60% of viewport height
      position: 'fixed',      // fixed so it stays on screen
      top: '29vh',            // vertical offset from top
      right: 20,               // pinned to the right
      backgroundColor: 'transparent' // background to separate from page
    }}>
      <Canvas camera={{ position: [0, 0.15, 0.8], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <Suspense fallback={null}>
          <AvatarModel />
        </Suspense>
        <OrbitControls 
          enableZoom={false}
          enablePan={false}
          enableRotate={false}
        />
      </Canvas>
    </div>
  )
}
