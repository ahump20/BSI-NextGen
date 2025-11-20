# BLAZE SPORTS INTEL - 3D VISUALIZATION QUICK START

**Status:** Ready to Install & Test
**Date:** 2025-11-09
**Platform:** BSI-NextGen + Babylon.js 7.x + WebGPU

---

## INSTALLATION

### 1. Install Dependencies

```bash
cd /Users/AustinHumphrey/BSI-NextGen
pnpm install
```

This will install:
- `@babylonjs/core@^7.30.0` - Core rendering engine
- `@babylonjs/loaders@^7.30.0` - GLTF/GLB model loaders
- `@babylonjs/materials@^7.30.0` - Advanced materials library
- `@babylonjs/inspector@^7.30.0` - Debug inspector
- `@babylonjs/havok@^1.3.0` - Physics engine
- `@webgpu/types@^0.1.51` - TypeScript types for WebGPU

### 2. Start Development Server

```bash
pnpm dev
```

### 3. Open 3D Demo Page

Navigate to: **http://localhost:3000/3d-demo**

---

## WHAT YOU'LL SEE

### Baseball Diamond Visualization

The demo page displays:

1. **3D Baseball Field**
   - Regulation 90-foot diamond (infield dirt)
   - All four bases (home, first, second, third)
   - Pitcher's mound (60.5 feet from home plate)
   - Outfield fence
   - Foul lines (chalk lines)

2. **Player Positions**
   - All 9 defensive positions marked with orange spheres
   - Position labels (P, C, 1B, 2B, SS, 3B, LF, CF, RF)

3. **Interactive Camera**
   - **Desktop:** Click and drag to rotate, scroll to zoom
   - **Mobile:** Touch and drag to rotate, pinch to zoom

4. **Performance Indicators**
   - Engine type (WebGPU or WebGL2) shown in bottom-left corner
   - GPU renderer information
   - Compute shader support indicator

### Controls Panel

Top-right overlay shows:
- Hit Heatmap toggle (WebGPU compute shader - Phase 2)
- Pitch Trajectories toggle (Physics simulation - Phase 2)
- Player Positions toggle (Active)

---

## TESTING ON MOBILE

### iOS (Safari)

1. Build and deploy to a test server or use ngrok:
   ```bash
   # Option 1: Deploy to Netlify/Vercel (recommended)
   pnpm build
   # Deploy dist folder

   # Option 2: Local testing with ngrok
   ngrok http 3000
   ```

2. Open the ngrok URL on your iPhone
3. Navigate to `/3d-demo`
4. **Expected Results:**
   - WebGPU on iOS 17.4+ (Safari 18+)
   - WebGL2 fallback on older iOS versions
   - 60fps on iPhone 12 Pro or newer
   - Touch controls feel responsive (<50ms latency)

### Android (Chrome)

1. Enable USB debugging and port forwarding
2. Visit `chrome://inspect` on desktop
3. Forward localhost:3000
4. Navigate to `/3d-demo` on mobile Chrome
5. **Expected Results:**
   - WebGPU on Chrome 113+ (Android 12+)
   - WebGL2 fallback on older versions
   - 60fps on mid-tier devices (Snapdragon 765G+)

---

## PERFORMANCE VERIFICATION

### Desktop (M1 MacBook Pro)

**Expected Metrics:**
- FPS: 120 (steady)
- Frame Time: <8.33ms
- Memory: <300MB
- Engine: WebGPU
- GPU: Apple M1/M2/M3

**Check Performance:**
1. Open browser console (F12)
2. Look for `[Performance] FPS: ...` logs every 5 seconds
3. Bottom-left overlay shows engine type

### Mobile (iPhone 12 Pro)

**Expected Metrics:**
- FPS: 60 (steady)
- Frame Time: <16.67ms
- Memory: <150MB
- Engine: WebGPU (iOS 17.4+) or WebGL2
- GPU: Apple A14 Bionic

**Check Performance:**
1. Safari → Develop → [Your iPhone] → Web Inspector
2. Console shows FPS logs
3. Timeline tab for frame profiling

---

## ARCHITECTURE FILES CREATED

```
/Users/AustinHumphrey/BSI-NextGen/
├── BLAZE-3D-VISUALIZATION-ARCHITECTURE.md    # Complete architecture doc
├── BLAZE-3D-QUICK-START.md                    # This file
├── packages/web/
│   ├── package.json                            # Updated with Babylon.js deps
│   ├── src/
│   │   ├── lib/babylon/
│   │   │   ├── engine.ts                       # WebGPU/WebGL2 factory
│   │   │   └── utils/
│   │   │       └── device-capability.ts        # Device detection
│   │   ├── components/3d/
│   │   │   ├── BabylonScene.tsx                # Base scene wrapper
│   │   │   └── baseball/
│   │   │       └── BaseballDiamond.tsx         # Baseball field component
│   │   └── app/
│   │       └── 3d-demo/
│   │           └── page.tsx                    # Demo page
```

---

## TROUBLESHOOTING

### "Module not found: Can't resolve '@babylonjs/core'"

**Solution:**
```bash
cd /Users/AustinHumphrey/BSI-NextGen
pnpm install
```

### Black screen / Nothing renders

**Possible Causes:**
1. **WebGL2 not supported** (very rare on modern browsers)
   - Check browser console for errors
   - Update browser to latest version

2. **Canvas not found** (SSR issue)
   - Verify `BabylonScene` is imported with `dynamic(() => import(...), { ssr: false })`
   - Check browser console for hydration errors

3. **GPU context lost**
   - Too many other GPU-intensive apps running
   - Close other tabs/apps and refresh

### Low FPS (<30fps on desktop)

**Solutions:**
1. **Check GPU tier:**
   - Console logs show `Device: LOW tier` → Expected on integrated GPUs
   - Console logs show `Engine: webgl2` → WebGPU not available

2. **Reduce quality:**
   - In `device-capability.ts`, force `gpuTier: 'low'`
   - This reduces LOD levels and disables shadows

3. **Check hardware acceleration:**
   - Chrome: `chrome://gpu` → Verify GPU acceleration enabled
   - Safari: Develop → Experimental Features → WebGPU

### "Cannot read property 'gpu' of undefined"

**Solution:**
- WebGPU not supported on this browser
- Engine will automatically fallback to WebGL2
- Update browser to Chrome 113+ or Safari 18+

---

## NEXT STEPS

### Phase 1: Verify Foundation (Today)

- [ ] Install dependencies: `pnpm install`
- [ ] Start dev server: `pnpm dev`
- [ ] Open http://localhost:3000/3d-demo
- [ ] Verify baseball diamond renders
- [ ] Test touch controls on mobile
- [ ] Check FPS in console logs

### Phase 2: Hit Heatmap (Week 1)

- [ ] Implement WebGPU compute shader (`heatmap-generator.wgsl`)
- [ ] Fetch real Cardinals batting data from SportsDataIO
- [ ] Transform hit locations to 3D coordinates
- [ ] Generate density field on GPU
- [ ] Render heatmap overlay on diamond

### Phase 3: Pitch Trajectory (Week 2)

- [ ] Implement physics engine (`pitch-trajectory.ts`)
- [ ] Fetch pitch data (velocity, spin rate, spin axis)
- [ ] Simulate Magnus force and drag
- [ [ Run Runge-Kutta 4th order integration
- [ ] Render trajectory path with particles

### Phase 4: Football Field (Week 3-4)

- [ ] Create football field 3D model
- [ ] Build play animation system
- [ ] Integrate Titans real-time data
- [ ] Add formation editor

### Phase 5: Basketball Court (Week 5-6)

- [ ] Create basketball court 3D model
- [ ] Build shot chart WebGPU shader
- [ ] Integrate Grizzlies real-time data
- [ ] Add player tracking visualization

---

## VERIFICATION CHECKLIST

Before marking Phase 1 complete:

- [ ] **Installation:** All Babylon.js packages installed without errors
- [ ] **Dev Server:** `pnpm dev` runs without errors
- [ ] **Demo Page:** `/3d-demo` loads successfully
- [ ] **3D Rendering:** Baseball diamond visible and interactive
- [ ] **Camera Controls:** Drag-to-rotate and scroll-to-zoom work
- [ ] **Mobile Touch:** Touch controls work on iPhone/Android
- [ ] **Performance:** 60fps on mobile, 120fps on desktop (check console)
- [ ] **Engine Detection:** WebGPU or WebGL2 indicator shows in bottom-left
- [ ] **Console Logs:** No errors in browser console
- [ ] **TypeScript:** No type errors (`pnpm type-check`)

---

## SUPPORT

**Architecture Documentation:**
- Full architecture: `/Users/AustinHumphrey/BSI-NextGen/BLAZE-3D-VISUALIZATION-ARCHITECTURE.md`
- This quick start: `/Users/AustinHumphrey/BSI-NextGen/BLAZE-3D-QUICK-START.md`

**Babylon.js Resources:**
- Official docs: https://doc.babylonjs.com/
- WebGPU guide: https://doc.babylonjs.com/setup/support/webGPU
- Playground: https://playground.babylonjs.com/

**Key Concepts:**
- **WebGPU:** Next-gen GPU API (Safari 18+, Chrome 113+)
- **WebGL2:** Fallback for older browsers (99% support)
- **LOD (Level of Detail):** Adaptive quality based on device
- **Compute Shaders:** GPU-accelerated data processing (heatmaps, physics)

---

**Status:** READY FOR INSTALLATION
**Estimated Setup Time:** 5 minutes
**First Results:** Baseball diamond rendering in 3D

Let me know if you encounter any issues during installation!
