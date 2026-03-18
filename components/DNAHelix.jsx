'use client';

import { useEffect, useRef } from 'react';
import { Renderer, Camera, Transform, Program, Mesh, Sphere, Color, Polyline } from 'ogl';

export default function DNAHelix() {
  const containerRef = useRef(null);
  const mouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!containerRef.current) return;

    const renderer = new Renderer({
      alpha: true,
      antialias: true,
      dpr: window.devicePixelRatio,
    });
    const gl = renderer.gl;
    containerRef.current.appendChild(gl.canvas);

    const camera = new Camera(gl, { fov: 35 });
    camera.position.z = 12;

    const scene = new Transform();

    const vertex = /* glsl */ `
      attribute vec3 position;
      uniform mat4 modelViewMatrix;
      uniform mat4 projectionMatrix;
      
      void main() {
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const fragment = /* glsl */ `
      precision highp float;
      void main() {
        gl_FragColor = vec4(0.23, 0.51, 0.96, 0.6);
      }
    `;

    // DNA Geometry Data
    const numPoints = 60;
    const radius = 1.2;
    const strand1 = [];
    const strand2 = [];
    const colors = [];
    
    for (let i = 0; i < numPoints; i++) {
      const y = (i - numPoints / 2) * 0.25;
      const angle = i * 0.4;
      
      // Strand 1
      strand1.push(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
      // Strand 2
      strand2.push(Math.cos(angle + Math.PI) * radius, y, Math.sin(angle + Math.PI) * radius);
      
      // Colors (Neural Blue)
      colors.push(0.23, 0.51, 0.96); 
    }

    const sphereGeom = new Sphere(gl, {
      radius: 0.08,
      widthSegments: 8,
      heightSegments: 8,
    });

    const program = new Program(gl, {
      vertex,
      fragment,
      uniforms: {},
      transparent: true,
    });

    // Helix container
    const helix = new Transform();
    helix.setParent(scene);

    const spheres = [];
    for (let i = 0; i < numPoints; i++) {
        const s1 = new Mesh(gl, { geometry: sphereGeom, program });
        const s2 = new Mesh(gl, { geometry: sphereGeom, program });
        
        s1.position.set(strand1[i*3], strand1[i*3+1], strand1[i*3+2]);
        s2.position.set(strand2[i*3], strand2[i*3+1], strand2[i*3+2]);
        
        s1.setParent(helix);
        s2.setParent(helix);
        spheres.push(s1, s2);
    }

    function resize() {
      if (!renderer || !gl.canvas) return;
      renderer.setSize(window.innerWidth, window.innerHeight);
      camera.perspective({ aspect: gl.canvas.width / gl.canvas.height });
    }
    window.addEventListener('resize', resize, false);
    resize();

    const onMouseMove = (e) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('mousemove', onMouseMove);

    let mounted = true;
    let request;
    function update(time) {
      if (!mounted) return;
      request = requestAnimationFrame(update);

      helix.rotation.y += 0.005 + (Math.abs(mouse.current.x) * 0.02);
      helix.rotation.x = mouse.current.y * 0.2;
      
      helix.position.y = Math.sin(time * 0.001) * 0.2;

      renderer.render({ scene, camera });
    }
    requestAnimationFrame(update);

    return () => {
      mounted = false;
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(request);
      if (containerRef.current && gl.canvas) {
        try {
          containerRef.current.removeChild(gl.canvas);
        } catch (e) {
          console.warn("Clean up: Canvas already removed or container ref lost.");
        }
      }
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="fixed inset-0 pointer-events-none z-0 opacity-20 overflow-hidden" 
      style={{ mixBlendMode: 'screen' }}
    />
  );
}
