import React, { Suspense, useRef, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { FBXLoader } from 'three-stdlib'
import { useTTS } from '@/contexts/TTSContext'

function AvatarModel({ selectedAvatar }) {
  const group = useRef()
  const gltf = useGLTF(`/human_avatar/${selectedAvatar}.glb`)
  const mixerRef = useRef()
  const talkingMeshes = useRef([])
  const { isSpeaking, visemeData } = useTTS()

  // Load idle FBX animation
  useEffect(() => {
    const loader = new FBXLoader()
    loader.load('/human_avatar/idle.fbx', (fbx) => {
      const mixer = new THREE.AnimationMixer(gltf.scene)
      mixer.clipAction(fbx.animations[0]).play()
      mixerRef.current = mixer
    })
  }, [gltf.scene])

  // Collect meshes with morph targets for lip sync
  useEffect(() => {
    gltf.scene.traverse((child) => {
      if (child.isMesh && child.morphTargetDictionary) {
        const morphTargets = {};
        
        // Simple mapping for basic mouth movement
        const morphMappings = {
          'mouthOpen': 'mouthOpen',
          'mouth_open': 'mouthOpen',
          'MouthOpen': 'mouthOpen',
          'Mouth_Open': 'mouthOpen',
          'jawOpen': 'jawOpen',
          'jaw_open': 'jawOpen',
          'JawOpen': 'jawOpen',
          'Jaw_Open': 'jawOpen',
        };
        
        Object.keys(child.morphTargetDictionary).forEach(morphName => {
          const mappedName = morphMappings[morphName];
          if (mappedName) {
            morphTargets[mappedName] = child.morphTargetDictionary[morphName];
          }
        });
        
        if (Object.keys(morphTargets).length > 0) {
          talkingMeshes.current.push({ mesh: child, morphTargets });
          console.log(`Found mesh with morph targets:`, Object.keys(morphTargets));
        }
      }
    })
  }, [gltf.scene])

  // Simple mouth animation when speaking
  useFrame((state, delta) => {
    if (mixerRef.current) mixerRef.current.update(delta)

    // Apply mouth movement to all meshes
    talkingMeshes.current.forEach(({ mesh, morphTargets }) => {
      if (mesh.morphTargetInfluences) {
        if (isSpeaking) {
          // Basic mouth opening when speaking
          if (morphTargets.mouthOpen !== undefined) {
            mesh.morphTargetInfluences[morphTargets.mouthOpen] = visemeData.mouthOpen || 0.3;
          }
          
          if (morphTargets.jawOpen !== undefined) {
            mesh.morphTargetInfluences[morphTargets.jawOpen] = visemeData.jawOpen || 0.2;
          }
        } else {
          // Close mouth when not speaking
          if (morphTargets.mouthOpen !== undefined) {
            mesh.morphTargetInfluences[morphTargets.mouthOpen] = 0.05;
          }
          
          if (morphTargets.jawOpen !== undefined) {
            mesh.morphTargetInfluences[morphTargets.jawOpen] = 0;
          }
        }
      }
    });
  })

  return (
    <group ref={group}>
      <primitive object={gltf.scene} scale={1} position={[0, -1.55, 0]} />
    </group>
  )
}

export default function GLBAvatar({ selectedAvatar, onAvatarChange, className }) {
  return (
    <div className={`${className}`}>      
      <Canvas camera={{ position: [0, 0.2, 0.8], fov: 50 }}>
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <Suspense fallback={null}>
          <AvatarModel selectedAvatar={selectedAvatar} />
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
