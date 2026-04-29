uniform float time;
varying vec2 vUv;
varying vec3 vPosition;
uniform vec3 uColor[4];
varying vec3 vColor;
uniform vec2 pixels;
float PI = 3.141592653589793238;
//	Simplex 3D Noise 
//	by Ian McEwan, Ashima Arts
//
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

float snoise(vec3 v){ 
  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

// First corner
  vec3 i  = floor(v + dot(v, C.yyy) );
  vec3 x0 =   v - i + dot(i, C.xxx) ;

// Other corners
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min( g.xyz, l.zxy );
  vec3 i2 = max( g.xyz, l.zxy );

  //  x0 = x0 - 0. + 0.0 * C 
  vec3 x1 = x0 - i1 + 1.0 * C.xxx;
  vec3 x2 = x0 - i2 + 2.0 * C.xxx;
  vec3 x3 = x0 - 1. + 3.0 * C.xxx;

// Permutations
  i = mod(i, 289.0 ); 
  vec4 p = permute( permute( permute( 
             i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
           + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

// Gradients
// ( N*N points uniformly over a square, mapped onto an octahedron.)
  float n_ = 1.0/7.0; // N=7
  vec3  ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z *ns.z);  //  mod(p,N*N)

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4( x.xy, y.xy );
  vec4 b1 = vec4( x.zw, y.zw );

  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);

//Normalise gradients
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

// Mix final noise value
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), 
                                dot(p2,x2), dot(p3,x3) ) );
}

void main() {
  // Create sparse, large bumps using even lower frequency noise for bigger lumps
  vec2 noiseCoord = uv * vec2(3.4, 3.1); // Even lower frequency for larger bumps

  // Generate multiple octaves with faster animation and varied bump sizes
  float noise1 = snoise(vec3(noiseCoord.x + time * 1.2, noiseCoord.y + time * 0.8, time * 4.0));
  float noise2 = snoise(vec3(noiseCoord.x * 2.0 + time * 1.5, noiseCoord.y * 1.0 + time * 0.2, time * 3.5));
  float noise3 = snoise(vec3(noiseCoord.x * 0.3 + time * 0.6, noiseCoord.y * 0.3 + time * 0.4, time * 5.0));

  // Add extra large-scale noise for really big lumps
  // float largeLumpNoise = snoise(vec3(noiseCoord.x * 0.8 + time * 0.9, noiseCoord.y * 0.8 + time * 0.7, time * 2.5));

  // Combine noise layers with emphasis on larger features
  float combinedNoise = noise1 * 0.5 + noise2 * 0.25 + noise3 * 0.6;

  // Create varied thresholds for different sized bumps
  float bumpThreshold = 0.2; // Lower threshold for more frequent bumps
  float bumpHeight = smoothstep(bumpThreshold, bumpThreshold + 0.1, abs(combinedNoise));

  // Add extra scaling for really large lumps based on the large-scale noise
  // float largeLumpScale = smoothstep(0.4, 0.8, abs(largeLumpNoise));
  // bumpHeight = mix(bumpHeight, bumpHeight * 2.5, largeLumpScale); // Some lumps can be 2.5x bigger

  // Scale the bump height with increased maximum displacement
  float displacement = combinedNoise * bumpHeight * 1.7; // Increased from 1.2 to 1.8

  // Create the position - mostly flat with occasional large bumps
  vec3 pos = vec3(position.x, position.y, position.z + displacement);

  // Parabolic color function based on Z displacement
  // displacement now ranges roughly from -1.8 to 1.8
  // float center = 0.0; // Middle point (flat areas)
  float range = 1.8;   // Updated max displacement range

  // Create parabolic intensity: strong at extremes, weak at center
  float normalizedZ = displacement / range; // Normalize to roughly -1 to 1
  float colorIntensity = abs(normalizedZ); // Linear intensity from center
  colorIntensity = colorIntensity * colorIntensity; // Make it parabolic
  colorIntensity = smoothstep(0.1, 0.9, colorIntensity); // Smooth the transition

  // White color for flat/middle areas, colored for extreme areas
  vec3 white = vec3(1.0, 1.0, 1.0);

  // Choose color based on whether it's a positive or negative bump
  vec3 bumpColor;
  if (displacement > 0.0) {
    // Positive bumps (hills) - use first few colors
    bumpColor = mix(uColor[0], uColor[1], abs(normalizedZ));
  } else {
    // Negative bumps (valleys) - use other colors
    bumpColor = mix(uColor[2], uColor[3], abs(normalizedZ));
  }

  // Mix between white (flat areas) and bump colors (extreme areas)
  vColor = mix(white, bumpColor, colorIntensity);

  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}