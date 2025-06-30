// Enhanced GLBAvatar.jsx with realistic lip sync and avatar selection
import React, { Suspense, useRef, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { FBXLoader } from 'three-stdlib'
import { useTTS } from '@/contexts/TTSContext'

function AvatarModel({ selectedAvatar }) { // ADD THIS PROP
  const group = useRef()
  const gltf = useGLTF(`/human_avatar/${selectedAvatar}.glb`) // CHANGE THIS LINE
  const mixerRef = useRef()
  const talkingMeshes = useRef([])
  const { isSpeaking, audioLevel, visemeData } = useTTS()
  const smoothedVisemes = useRef({
    mouthOpen: 0,
    mouthWide: 0,
    lipsPursed: 0,
    smile: 0.15,
    jawOpen: 0
  })

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
        
        // Map common morph target names to our viseme system
        const morphMappings = {
          // Mouth opening
          'mouthOpen': 'mouthOpen',
          'mouth_open': 'mouthOpen',
          'MouthOpen': 'mouthOpen',
          'Mouth_Open': 'mouthOpen',
          
          // Mouth width/smile
          'mouthSmile': 'mouthSmile',
          'mouth_smile': 'mouthSmile',
          'MouthSmile': 'mouthSmile',
          'Mouth_Smile': 'mouthSmile',
          'mouthWide': 'mouthWide',
          'mouth_wide': 'mouthWide',
          
          // Lip pursing
          'mouthPucker': 'lipsPursed',
          'mouth_pucker': 'lipsPursed',
          'MouthPucker': 'lipsPursed',
          'Mouth_Pucker': 'lipsPursed',
          'mouthFunnel': 'lipsPursed',
          'mouth_funnel': 'lipsPursed',
          
          // Jaw movement
          'jawOpen': 'jawOpen',
          'jaw_open': 'jawOpen',
          'JawOpen': 'jawOpen',
          'Jaw_Open': 'jawOpen',
          
          // Additional mouth shapes
          'mouthFrown': 'mouthFrown',
          'mouth_frown': 'mouthFrown',
          'mouthLeft': 'mouthLeft',
          'mouth_left': 'mouthLeft',
          'mouthRight': 'mouthRight',
          'mouth_right': 'mouthRight'
        };
        
        // Check for available morph targets
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

  // Smooth interpolation function
  const lerp = (start, end, factor) => {
    return start + (end - start) * factor;
  }

  // Animate based on text-based viseme data
  useFrame((state, delta) => {
    if (mixerRef.current) mixerRef.current.update(delta)

    const smoothingFactor = 0.2; // Slightly faster response for text-based sync
    
    if (isSpeaking && visemeData) {
      // Smooth the viseme data to avoid jittery movement
      smoothedVisemes.current.mouthOpen = lerp(
        smoothedVisemes.current.mouthOpen, 
        visemeData.mouthOpen || 0, 
        smoothingFactor
      );
      
      smoothedVisemes.current.mouthWide = lerp(
        smoothedVisemes.current.mouthWide, 
        visemeData.mouthWide || 0, 
        smoothingFactor
      );
      
      smoothedVisemes.current.lipsPursed = lerp(
        smoothedVisemes.current.lipsPursed, 
        visemeData.lipsPursed || 0, 
        smoothingFactor
      );
      
      smoothedVisemes.current.smile = lerp(
        smoothedVisemes.current.smile, 
        visemeData.smile || 0.1, 
        smoothingFactor
      );
      
      smoothedVisemes.current.jawOpen = lerp(
        smoothedVisemes.current.jawOpen, 
        visemeData.jawOpen || 0, 
        smoothingFactor
      );
    } else {
      // When not speaking, return to neutral position
      smoothedVisemes.current.mouthOpen = lerp(smoothedVisemes.current.mouthOpen, 0.05, 0.25);
      smoothedVisemes.current.mouthWide = lerp(smoothedVisemes.current.mouthWide, 0, 0.25);
      smoothedVisemes.current.lipsPursed = lerp(smoothedVisemes.current.lipsPursed, 0, 0.25);
      smoothedVisemes.current.smile = lerp(smoothedVisemes.current.smile, 0.15, 0.25);
      smoothedVisemes.current.jawOpen = lerp(smoothedVisemes.current.jawOpen, 0, 0.25);
    }

    // Add subtle breathing animation when not speaking
    const breathingIntensity = isSpeaking ? 0.02 : 0.05;
    const breathing = Math.sin(state.clock.elapsedTime * 0.8) * breathingIntensity;
    
    // Apply morph target values to all meshes
    talkingMeshes.current.forEach(({ mesh, morphTargets }) => {
      if (mesh.morphTargetInfluences) {
        // Primary mouth movements
        if (morphTargets.mouthOpen !== undefined) {
          mesh.morphTargetInfluences[morphTargets.mouthOpen] = 
            Math.max(0, Math.min(1, smoothedVisemes.current.mouthOpen + breathing));
        }
        
        if (morphTargets.mouthSmile !== undefined) {
          mesh.morphTargetInfluences[morphTargets.mouthSmile] = 
            Math.max(0, Math.min(1, smoothedVisemes.current.smile));
        }
        
        if (morphTargets.mouthWide !== undefined) {
          mesh.morphTargetInfluences[morphTargets.mouthWide] = 
            Math.max(0, Math.min(1, smoothedVisemes.current.mouthWide));
        }
        
        if (morphTargets.lipsPursed !== undefined) {
          mesh.morphTargetInfluences[morphTargets.lipsPursed] = 
            Math.max(0, Math.min(1, smoothedVisemes.current.lipsPursed));
        }
        
        if (morphTargets.jawOpen !== undefined) {
          mesh.morphTargetInfluences[morphTargets.jawOpen] = 
            Math.max(0, Math.min(1, smoothedVisemes.current.jawOpen + breathing * 0.5));
        }
        
        // Additional expressions for more natural look
        if (morphTargets.mouthFrown !== undefined) {
          // Slight frown when concentrating on certain sounds
          mesh.morphTargetInfluences[morphTargets.mouthFrown] = 
            Math.max(0, Math.min(0.3, smoothedVisemes.current.lipsPursed * 0.3));
        }
        
        // Subtle left/right mouth movement for consonants
        if (morphTargets.mouthLeft !== undefined) {
          mesh.morphTargetInfluences[morphTargets.mouthLeft] = 
            Math.sin(state.clock.elapsedTime * 12) * 0.05 * (smoothedVisemes.current.mouthWide || 0);
        }
        
        if (morphTargets.mouthRight !== undefined) {
          mesh.morphTargetInfluences[morphTargets.mouthRight] = 
            Math.cos(state.clock.elapsedTime * 12) * 0.05 * (smoothedVisemes.current.mouthWide || 0);
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

export default function GLBAvatar({ selectedAvatar, onAvatarChange }) { // ADD THESE PROPS
  return (
    <div style={{
      width: '35vw',
      height: '60vh',
      position: 'fixed',
      top: '29vh',
      right: 20,
      backgroundColor: 'transparent'
    }}>
      {/* ADD AVATAR SELECTOR BUTTON */}
      <div style={{
        position: 'absolute',
        top: 10,
        right: 10,
        zIndex: 1000,
        display: 'flex',
        gap: '5px',
        flexWrap: 'wrap',
        maxWidth: '200px'
      }}>
        {[1, 2, 3, 4, 5, 6].map(num => (
          <button
            key={num}
            onClick={() => onAvatarChange(`avatar${num}`)}
            style={{
              padding: '5px 10px',
              backgroundColor: selectedAvatar === `avatar${num}` ? '#fbbf24' : '#e5e7eb',
              color: selectedAvatar === `avatar${num}` ? '#000' : '#374151',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: selectedAvatar === `avatar${num}` ? 'bold' : 'normal'
            }}
          >
            {num}
          </button>
        ))}
      </div>
      
      <Canvas camera={{ position: [0, 0.2, 0.8], fov: 50 }}>
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <Suspense fallback={null}>
          <AvatarModel selectedAvatar={selectedAvatar} /> {/* PASS PROP HERE */}
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
