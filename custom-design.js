let database
let emailjs

function initFirebase() {
  try {
    if (!window.firebase) {
      console.error("[v0] Firebase not loaded")
      return
    }

    const firebaseConfig = {
      apiKey: "AIzaSyAvSh3XI-t78INDTuq5TTq07V1wOAeEEXI",
      authDomain: "worn-4edd1.firebaseapp.com",
      databaseURL: "https://worn-4edd1-default-rtdb.europe-west1.firebasedatabase.app",
      projectId: "worn-4edd1",
      storageBucket: "worn-4edd1.firebasestorage.app",
      messagingSenderId: "597648038146",
      appId: "1:597648038146:web:29b0c3ef3d4aa133180a1b",
    }

    if (!window.firebase.apps || !window.firebase.apps.length) {
      window.firebase.initializeApp(firebaseConfig)
    }

    database = window.firebase.database()
    console.log("[v0] Firebase initialized successfully")
  } catch (error) {
    console.error("[v0] Firebase init error:", error)
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initFirebase)
} else {
  initFirebase()
}

let selectedGarment = null
let selectedGarmentName = ""
let selectedColor = null
let selectedColorName = ""
let designImageData = null
let currentStep = 1
let currentView = 'front'
let designPosition = 'front-center'

const colorNames = {
  '#000000': 'Noir',
  '#FFFFFF': 'Blanc',
  '#808080': 'Gris',
  '#FF0000': 'Rouge',
  '#0000FF': 'Bleu',
  '#FFFF00': 'Jaune'
}

function setPreviewView(view) {
  currentView = view
  document.querySelectorAll('.preview-view-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === view)
  })
  updatePreview()
}

function selectGarment(garment, name) {
  selectedGarment = garment
  selectedGarmentName = name
  document.getElementById("selectedGarment").value = garment

  document.querySelectorAll(".garment-option").forEach((opt) => {
    opt.classList.remove("selected")
  })
  document.querySelector(`[data-garment="${garment}"]`).classList.add("selected")

  updatePreview()
}

function selectColor(color) {
  selectedColor = color
  selectedColorName = colorNames[color] || color
  document.getElementById("selectedColor").value = color

  document.querySelectorAll(".color-btn").forEach((btn) => {
    btn.classList.remove("selected")
  })
  document.querySelector(`[data-color="${color}"]`).classList.add("selected")

  updatePreview()
}

function updatePreview() {
  const previewArea = document.getElementById("previewArea")
  const designOverlay = document.getElementById("designOverlay")
  const previewGarmentInfo = document.getElementById("previewGarmentInfo")
  const previewColorInfo = document.getElementById("previewColorInfo")
  const previewDesignInfo = document.getElementById("previewDesignInfo")

  // Update info bar
  if (previewGarmentInfo) {
    previewGarmentInfo.querySelector('.info-value').textContent = selectedGarmentName || '-'
    previewGarmentInfo.classList.toggle('active', !!selectedGarment)
  }
  if (previewColorInfo) {
    previewColorInfo.querySelector('.info-value').innerHTML = selectedColor 
      ? `<span class="color-dot" style="background:${selectedColor}; ${selectedColor === '#FFFFFF' ? 'border: 1px solid #ddd;' : ''}"></span>${selectedColorName}` 
      : '-'
    previewColorInfo.classList.toggle('active', !!selectedColor)
  }
  if (previewDesignInfo) {
    previewDesignInfo.querySelector('.info-value').textContent = designImageData ? 'Ajoute' : 'Non ajoute'
    previewDesignInfo.classList.toggle('active', !!designImageData)
  }

  if (!selectedGarment || !selectedColor) {
    previewArea.innerHTML = `
      <div class="preview-placeholder">
        <div class="preview-placeholder-icon">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
            <path d="M20.38 3.46L16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/>
          </svg>
        </div>
        <p class="preview-placeholder-title">Visualisez votre creation</p>
        <p class="preview-placeholder-text">Selectionnez un vetement et une couleur pour voir l'apercu</p>
      </div>
    `
    if (designOverlay) designOverlay.innerHTML = ''
    return
  }

  const isWhite = selectedColor === '#FFFFFF' || selectedColor === '#ffffff'
  const strokeColor = isWhite ? '#e5e7eb' : 'rgba(0,0,0,0.12)'
  const strokeColorDark = isWhite ? '#d1d5db' : 'rgba(0,0,0,0.2)'
  const shadowColor = isWhite ? 'rgba(0,0,0,0.03)' : 'rgba(0,0,0,0.08)'
  const highlightColor = isWhite ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.15)'

  const garmentSvgs = {
    't-shirt': {
      front: `
        <svg viewBox="0 0 300 340" class="garment-svg">
          <defs>
            <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:${highlightColor}"/>
              <stop offset="50%" style="stop-color:transparent"/>
              <stop offset="100%" style="stop-color:${shadowColor}"/>
            </linearGradient>
            <linearGradient id="sleeveGradientL" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style="stop-color:transparent"/>
              <stop offset="100%" style="stop-color:${shadowColor}"/>
            </linearGradient>
            <linearGradient id="sleeveGradientR" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:${highlightColor}"/>
              <stop offset="100%" style="stop-color:transparent"/>
            </linearGradient>
            <filter id="fabricTexture">
              <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" result="noise"/>
              <feDiffuseLighting in="noise" lighting-color="white" surfaceScale="1" result="light">
                <feDistantLight azimuth="45" elevation="60"/>
              </feDiffuseLighting>
              <feBlend in="SourceGraphic" in2="light" mode="multiply"/>
            </filter>
          </defs>
          
          <!-- Shadow -->
          <ellipse cx="150" cy="325" rx="80" ry="8" fill="rgba(0,0,0,0.08)"/>
          
          <!-- Left sleeve -->
          <path d="M60 75 L15 100 L15 145 L60 125 Z" fill="${selectedColor}" stroke="${strokeColor}" stroke-width="2"/>
          <path d="M60 75 L15 100 L15 145 L60 125 Z" fill="url(#sleeveGradientL)"/>
          
          <!-- Right sleeve -->
          <path d="M240 75 L285 100 L285 145 L240 125 Z" fill="${selectedColor}" stroke="${strokeColor}" stroke-width="2"/>
          <path d="M240 75 L285 100 L285 145 L240 125 Z" fill="url(#sleeveGradientR)"/>
          
          <!-- Main body -->
          <path d="M60 75 L60 310 L240 310 L240 75 L195 75 C185 45 150 35 150 35 C150 35 115 45 105 75 Z" 
                fill="${selectedColor}" stroke="${strokeColor}" stroke-width="2.5" stroke-linejoin="round"/>
          
          <!-- Body shading overlay -->
          <path d="M60 75 L60 310 L240 310 L240 75 L195 75 C185 45 150 35 150 35 C150 35 115 45 105 75 Z" 
                fill="url(#bodyGradient)"/>
          
          <!-- Collar -->
          <ellipse cx="150" cy="72" rx="45" ry="18" fill="${selectedColor}" stroke="${strokeColorDark}" stroke-width="3"/>
          <ellipse cx="150" cy="72" rx="35" ry="12" fill="none" stroke="${strokeColorDark}" stroke-width="1.5" stroke-dasharray="2,2" opacity="0.5"/>
          
          <!-- Seam lines -->
          <line x1="60" y1="125" x2="60" y2="310" stroke="${strokeColor}" stroke-width="1" stroke-dasharray="4,4" opacity="0.5"/>
          <line x1="240" y1="125" x2="240" y2="310" stroke="${strokeColor}" stroke-width="1" stroke-dasharray="4,4" opacity="0.5"/>
          
          <!-- Bottom hem -->
          <rect x="60" y="302" width="180" height="8" fill="${shadowColor}" rx="1"/>
          
          <!-- Sleeve hems -->
          <rect x="15" y="137" width="45" height="8" fill="${shadowColor}" rx="1" transform="rotate(-15 37 141)"/>
          <rect x="240" y="137" width="45" height="8" fill="${shadowColor}" rx="1" transform="rotate(15 262 141)"/>
        </svg>
      `,
      back: `
        <svg viewBox="0 0 300 340" class="garment-svg">
          <defs>
            <linearGradient id="bodyGradientBack" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style="stop-color:${highlightColor}"/>
              <stop offset="50%" style="stop-color:transparent"/>
              <stop offset="100%" style="stop-color:${shadowColor}"/>
            </linearGradient>
          </defs>
          
          <!-- Shadow -->
          <ellipse cx="150" cy="325" rx="80" ry="8" fill="rgba(0,0,0,0.08)"/>
          
          <!-- Left sleeve -->
          <path d="M60 75 L15 100 L15 145 L60 125 Z" fill="${selectedColor}" stroke="${strokeColor}" stroke-width="2"/>
          
          <!-- Right sleeve -->
          <path d="M240 75 L285 100 L285 145 L240 125 Z" fill="${selectedColor}" stroke="${strokeColor}" stroke-width="2"/>
          
          <!-- Main body -->
          <path d="M60 75 L60 310 L240 310 L240 75 L195 75 C190 55 150 50 150 50 C150 50 110 55 105 75 Z" 
                fill="${selectedColor}" stroke="${strokeColor}" stroke-width="2.5" stroke-linejoin="round"/>
          
          <path d="M60 75 L60 310 L240 310 L240 75 L195 75 C190 55 150 50 150 50 C150 50 110 55 105 75 Z" 
                fill="url(#bodyGradientBack)"/>
          
          <!-- Back collar -->
          <path d="M105 75 C110 55 150 50 150 50 C150 50 190 55 195 75" fill="none" stroke="${strokeColorDark}" stroke-width="3"/>
          
          <!-- Center back seam -->
          <line x1="150" y1="75" x2="150" y2="310" stroke="${strokeColor}" stroke-width="1" stroke-dasharray="6,4" opacity="0.4"/>
          
          <!-- Tag -->
          <rect x="140" y="60" width="20" height="12" fill="${isWhite ? '#f3f4f6' : 'rgba(255,255,255,0.9)'}" stroke="${strokeColor}" stroke-width="1" rx="1"/>
          
          <!-- Bottom hem -->
          <rect x="60" y="302" width="180" height="8" fill="${shadowColor}" rx="1"/>
        </svg>
      `,
      designArea: { front: { x: 90, y: 100, w: 120, h: 140 }, back: { x: 90, y: 90, w: 120, h: 160 } }
    },
    'sweat': {
      front: `
        <svg viewBox="0 0 320 360" class="garment-svg">
          <defs>
            <linearGradient id="sweatGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:${highlightColor}"/>
              <stop offset="100%" style="stop-color:${shadowColor}"/>
            </linearGradient>
          </defs>
          
          <!-- Shadow -->
          <ellipse cx="160" cy="348" rx="90" ry="8" fill="rgba(0,0,0,0.08)"/>
          
          <!-- Hood -->
          <path d="M105 70 C100 40 160 25 160 25 C160 25 220 40 215 70" fill="${selectedColor}" stroke="${strokeColor}" stroke-width="2"/>
          <path d="M105 70 C115 50 160 42 160 42 C160 42 205 50 215 70" fill="none" stroke="${strokeColorDark}" stroke-width="2"/>
          
          <!-- Left sleeve -->
          <path d="M50 85 L5 115 L5 185 L50 165 Z" fill="${selectedColor}" stroke="${strokeColor}" stroke-width="2"/>
          <rect x="5" y="175" width="45" height="12" fill="${shadowColor}" rx="2"/>
          
          <!-- Right sleeve -->
          <path d="M270 85 L315 115 L315 185 L270 165 Z" fill="${selectedColor}" stroke="${strokeColor}" stroke-width="2"/>
          <rect x="270" y="175" width="45" height="12" fill="${shadowColor}" rx="2"/>
          
          <!-- Main body -->
          <path d="M50 85 L50 340 L270 340 L270 85 L215 70 L105 70 Z" 
                fill="${selectedColor}" stroke="${strokeColor}" stroke-width="2.5" stroke-linejoin="round"/>
          <path d="M50 85 L50 340 L160 340 L160 85 Z" fill="url(#sweatGrad)"/>
          
          <!-- Hood opening -->
          <ellipse cx="160" cy="68" rx="40" ry="15" fill="none" stroke="${strokeColorDark}" stroke-width="3"/>
          
          <!-- Hood strings -->
          <line x1="135" y1="80" x2="135" y2="130" stroke="${strokeColorDark}" stroke-width="2.5" stroke-linecap="round"/>
          <circle cx="135" cy="132" r="4" fill="${strokeColorDark}"/>
          <line x1="185" y1="80" x2="185" y2="130" stroke="${strokeColorDark}" stroke-width="2.5" stroke-linecap="round"/>
          <circle cx="185" cy="132" r="4" fill="${strokeColorDark}"/>
          
          <!-- Kangaroo pocket -->
          <path d="M75 230 Q160 245 245 230 L245 290 Q160 305 75 290 Z" fill="none" stroke="${strokeColorDark}" stroke-width="2.5" stroke-linejoin="round"/>
          <line x1="160" y1="235" x2="160" y2="295" stroke="${strokeColor}" stroke-width="1.5"/>
          
          <!-- Bottom ribbing -->
          <rect x="50" y="328" width="220" height="12" fill="${shadowColor}" rx="2"/>
          <line x1="50" y1="334" x2="270" y2="334" stroke="${strokeColor}" stroke-width="0.5"/>
          <line x1="50" y1="337" x2="270" y2="337" stroke="${strokeColor}" stroke-width="0.5"/>
        </svg>
      `,
      back: `
        <svg viewBox="0 0 320 360" class="garment-svg">
          <defs>
            <linearGradient id="sweatGradBack" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style="stop-color:${highlightColor}"/>
              <stop offset="100%" style="stop-color:${shadowColor}"/>
            </linearGradient>
          </defs>
          
          <!-- Shadow -->
          <ellipse cx="160" cy="348" rx="90" ry="8" fill="rgba(0,0,0,0.08)"/>
          
          <!-- Hood (back view - full) -->
          <path d="M105 70 C100 20 160 5 160 5 C160 5 220 20 215 70 L105 70 Z" fill="${selectedColor}" stroke="${strokeColor}" stroke-width="2"/>
          <path d="M120 60 C120 35 160 25 160 25 C160 25 200 35 200 60" fill="none" stroke="${strokeColor}" stroke-width="1.5" stroke-dasharray="4,3" opacity="0.5"/>
          
          <!-- Left sleeve -->
          <path d="M50 85 L5 115 L5 185 L50 165 Z" fill="${selectedColor}" stroke="${strokeColor}" stroke-width="2"/>
          <rect x="5" y="175" width="45" height="12" fill="${shadowColor}" rx="2"/>
          
          <!-- Right sleeve -->
          <path d="M270 85 L315 115 L315 185 L270 165 Z" fill="${selectedColor}" stroke="${strokeColor}" stroke-width="2"/>
          <rect x="270" y="175" width="45" height="12" fill="${shadowColor}" rx="2"/>
          
          <!-- Main body -->
          <path d="M50 85 L50 340 L270 340 L270 85 L215 70 L105 70 Z" 
                fill="${selectedColor}" stroke="${strokeColor}" stroke-width="2.5"/>
          <path d="M50 85 L50 340 L160 340 L160 85 Z" fill="url(#sweatGradBack)"/>
          
          <!-- Center seam -->
          <line x1="160" y1="70" x2="160" y2="328" stroke="${strokeColor}" stroke-width="1" stroke-dasharray="6,4" opacity="0.4"/>
          
          <!-- Bottom ribbing -->
          <rect x="50" y="328" width="220" height="12" fill="${shadowColor}" rx="2"/>
        </svg>
      `,
      designArea: { front: { x: 85, y: 140, w: 150, h: 80 }, back: { x: 85, y: 90, w: 150, h: 180 } }
    },
    'pantalon': {
      front: `
        <svg viewBox="0 0 220 340" class="garment-svg">
          <defs>
            <linearGradient id="pantsGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:${highlightColor}"/>
              <stop offset="100%" style="stop-color:${shadowColor}"/>
            </linearGradient>
          </defs>
          
          <!-- Shadow -->
          <ellipse cx="110" cy="332" rx="70" ry="6" fill="rgba(0,0,0,0.08)"/>
          
          <!-- Waistband -->
          <rect x="25" y="10" width="170" height="25" rx="3" fill="${selectedColor}" stroke="${strokeColorDark}" stroke-width="2.5"/>
          
          <!-- Belt loops -->
          <rect x="50" y="6" width="10" height="33" rx="2" fill="${selectedColor}" stroke="${strokeColor}" stroke-width="1.5"/>
          <rect x="105" y="6" width="10" height="33" rx="2" fill="${selectedColor}" stroke="${strokeColor}" stroke-width="1.5"/>
          <rect x="160" y="6" width="10" height="33" rx="2" fill="${selectedColor}" stroke="${strokeColor}" stroke-width="1.5"/>
          
          <!-- Left leg -->
          <path d="M25 35 L32 325 L95 325 L110 160 L110 35 Z" fill="${selectedColor}" stroke="${strokeColor}" stroke-width="2" stroke-linejoin="round"/>
          <path d="M25 35 L32 325 L65 325 L75 35 Z" fill="url(#pantsGrad)"/>
          
          <!-- Right leg -->
          <path d="M110 35 L110 160 L125 325 L188 325 L195 35 Z" fill="${selectedColor}" stroke="${strokeColor}" stroke-width="2" stroke-linejoin="round"/>
          
          <!-- Front fly -->
          <path d="M110 35 L110 120" stroke="${strokeColorDark}" stroke-width="2.5"/>
          <circle cx="110" cy="50" r="3" fill="${strokeColorDark}"/>
          
          <!-- Left pocket -->
          <path d="M32 42 L32 95 L70 102 L75 42" fill="none" stroke="${strokeColorDark}" stroke-width="2"/>
          
          <!-- Right pocket -->
          <path d="M188 42 L188 95 L150 102 L145 42" fill="none" stroke="${strokeColorDark}" stroke-width="2"/>
          
          <!-- Knee creases -->
          <path d="M50 200 Q63 195 75 200" fill="none" stroke="${strokeColor}" stroke-width="1" opacity="0.5"/>
          <path d="M145 200 Q158 195 170 200" fill="none" stroke="${strokeColor}" stroke-width="1" opacity="0.5"/>
        </svg>
      `,
      back: `
        <svg viewBox="0 0 220 340" class="garment-svg">
          <defs>
            <linearGradient id="pantsGradBack" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style="stop-color:${highlightColor}"/>
              <stop offset="100%" style="stop-color:${shadowColor}"/>
            </linearGradient>
          </defs>
          
          <!-- Shadow -->
          <ellipse cx="110" cy="332" rx="70" ry="6" fill="rgba(0,0,0,0.08)"/>
          
          <!-- Waistband -->
          <rect x="25" y="10" width="170" height="25" rx="3" fill="${selectedColor}" stroke="${strokeColorDark}" stroke-width="2.5"/>
          
          <!-- Belt loops -->
          <rect x="50" y="6" width="10" height="33" rx="2" fill="${selectedColor}" stroke="${strokeColor}" stroke-width="1.5"/>
          <rect x="105" y="6" width="10" height="33" rx="2" fill="${selectedColor}" stroke="${strokeColor}" stroke-width="1.5"/>
          <rect x="160" y="6" width="10" height="33" rx="2" fill="${selectedColor}" stroke="${strokeColor}" stroke-width="1.5"/>
          
          <!-- Left leg -->
          <path d="M25 35 L32 325 L95 325 L110 160 L110 35 Z" fill="${selectedColor}" stroke="${strokeColor}" stroke-width="2"/>
          <path d="M25 35 L32 325 L65 325 L75 35 Z" fill="url(#pantsGradBack)"/>
          
          <!-- Right leg -->
          <path d="M110 35 L110 160 L125 325 L188 325 L195 35 Z" fill="${selectedColor}" stroke="${strokeColor}" stroke-width="2"/>
          
          <!-- Center seam -->
          <line x1="110" y1="35" x2="110" y2="160" stroke="${strokeColor}" stroke-width="1.5" stroke-dasharray="5,3" opacity="0.6"/>
          
          <!-- Back pockets -->
          <rect x="40" y="55" width="45" height="50" rx="3" fill="none" stroke="${strokeColorDark}" stroke-width="2"/>
          <rect x="135" y="55" width="45" height="50" rx="3" fill="none" stroke="${strokeColorDark}" stroke-width="2"/>
          
          <!-- Back yoke -->
          <path d="M25 35 L195 35 L185 70 L35 70 Z" fill="${shadowColor}" opacity="0.3"/>
        </svg>
      `,
      designArea: { front: { x: 55, y: 120, w: 110, h: 80 }, back: { x: 55, y: 120, w: 110, h: 80 } }
    }
  }

  const garment = garmentSvgs[selectedGarment]
  if (!garment) return

  previewArea.innerHTML = `
    <div class="garment-preview-wrapper">
      ${garment[currentView]}
    </div>
  `

  // Show design overlay if design exists
  if (designImageData && designOverlay) {
    const area = garment.designArea[currentView]
    const positionMatch = currentView === 'front' 
      ? designPosition.includes('front') 
      : designPosition.includes('back')
    
    if (positionMatch || !designPosition) {
      designOverlay.innerHTML = `
        <div class="design-on-garment" style="
          left: ${area.x}px;
          top: ${area.y}px;
          width: ${area.w}px;
          height: ${area.h}px;
        ">
          <img src="${designImageData}" alt="Design" style="
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
            opacity: 0.9;
            mix-blend-mode: multiply;
          "/>
        </div>
      `
    } else {
      designOverlay.innerHTML = `
        <div class="design-position-hint">
          Design sur l'autre face
        </div>
      `
    }
  } else if (designOverlay) {
    designOverlay.innerHTML = ''
  }
}

document.getElementById("designPosition")?.addEventListener("change", (e) => {
  designPosition = e.target.value
  // Auto switch view based on position
  if (designPosition.includes('back')) {
    setPreviewView('back')
  } else if (designPosition.includes('front')) {
    setPreviewView('front')
  }
  updatePreview()
})

document.getElementById("designImage")?.addEventListener("change", (e) => {
  const file = e.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (event) => {
      designImageData = event.target.result
      const preview = document.getElementById("designImagePreview")
      preview.innerHTML = `
        <div class="preview-item">
          <img src="${designImageData}" alt="Design" class="preview-image">
          <button type="button" class="preview-remove" onclick="removeDesignImage()">&times;</button>
        </div>
      `

      const designPreview = document.getElementById("designPreview")
      designPreview.innerHTML = `
        <img src="${designImageData}" alt="Votre design" style="max-width: 150px; max-height: 150px; object-fit: contain; border-radius: 8px;">
      `
    }
    reader.readAsDataURL(file)
  }
})

function removeDesignImage() {
  designImageData = null
  document.getElementById("designImage").value = ""
  document.getElementById("designImagePreview").innerHTML = ""
  document.getElementById("designPreview").innerHTML = ""
}

function nextStep(step) {
  const currentStepEl = document.querySelector(`.form-step[data-step="${currentStep}"]`)

  if (currentStep === 1) {
    if (!selectedGarment || !selectedColor || !document.getElementById("garmentSize").value) {
      alert("Veuillez compléter tous les champs obligatoires")
      return
    }
  }

  if (currentStep === 2) {
    if (
      !designImageData ||
      !document.getElementById("designDescription").value ||
      !document.getElementById("designPosition").value
    ) {
      alert("Veuillez compléter tous les champs obligatoires")
      return
    }
  }

  currentStepEl.classList.remove("active")
  currentStep = step
  document.querySelector(`.form-step[data-step="${step}"]`).classList.add("active")
  window.scrollTo({ top: 0, behavior: "smooth" })
}

function prevStep(step) {
  document.querySelector(`.form-step[data-step="${currentStep}"]`).classList.remove("active")
  currentStep = step
  document.querySelector(`.form-step[data-step="${step}"]`).classList.add("active")
  window.scrollTo({ top: 0, behavior: "smooth" })
}

function generateCustomId() {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  const id = `CUSTOM-${timestamp.toString(36).toUpperCase()}${random}`
  console.log("[v0] Generated custom ID:", id)
  return id
}

document.getElementById("customDesignForm").addEventListener("submit", async (e) => {
  e.preventDefault()

  if (!database) {
    alert(
      "Erreur: La base de données n'est pas initialisée.\n\n" +
        "Veuillez rafraîchir la page et réessayer.\n\n" +
        "Si le problème persiste, vérifiez les règles Firebase.",
    )
    return
  }

  const submitBtn = document.getElementById("submitBtn")
  const btnText = submitBtn.querySelector(".btn-text")
  const btnLoading = submitBtn.querySelector(".btn-loading")

  btnText.style.display = "none"
  btnLoading.style.display = "flex"
  submitBtn.disabled = true

  const requestId = generateCustomId()
  const customerEmail = document.getElementById("customerEmail").value

  const customRequest = {
    id: requestId,
    garment: selectedGarment,
    garmentName: selectedGarmentName,
    size: document.getElementById("garmentSize").value,
    color: selectedColor,
    designImage: designImageData,
    description: document.getElementById("designDescription").value,
    position: document.getElementById("designPosition").value,
    customerName: document.getElementById("customerName").value,
    email: customerEmail,
    phone: document.getElementById("customerPhone").value || "",
    status: "pending",
    timestamp: Date.now(),
    date: new Date().toLocaleDateString("fr-FR"),
  }

  console.log("[v0] =================================")
  console.log("[v0] SAVING CUSTOM REQUEST")
  console.log("[v0] Request ID:", requestId)
  console.log("[v0] Firebase path: customRequests/" + requestId)
  console.log("[v0] Request data keys:", Object.keys(customRequest))
  console.log("[v0] =================================")

  try {
    await database.ref("customRequests").child(requestId).set(customRequest)
    console.log("[v0] ✅ Custom request saved successfully")

    const verifySnapshot = await database.ref("customRequests").child(requestId).once("value")
    console.log("[v0] =================================")
    console.log("[v0] VERIFICATION")
    console.log("[v0] Request exists in Firebase?:", verifySnapshot.exists())
    if (verifySnapshot.exists()) {
      console.log("[v0] ✅ Verified - Request found in database")
    } else {
      console.error("[v0] ❌ ERROR - Request NOT found after saving!")
    }
    console.log("[v0] =================================")

    if (!verifySnapshot.exists()) {
      throw new Error("Custom request was not saved properly in Firebase")
    }

    const trackingUrl = `${window.location.origin}/order-tracking.html?id=${requestId}`

    try {
      await emailjs.send("service_qfzd8k8", "template_order_confirmation", {
        to_email: customerEmail,
        to_name: customRequest.customerName,
        order_number: requestId,
        tracking_url: trackingUrl,
        total: "En attente de devis",
        items: `Design personnalisé: ${customRequest.garmentName}`,
      })
      console.log("[v0] ✅ Email confirmation sent successfully")
    } catch (emailError) {
      console.error("[v0] ⚠️  Email error (non-blocking):", emailError)
    }

    document.getElementById("confirmEmail").textContent = customerEmail
    const successModal = document.getElementById("successModal")

    const successContent = successModal.querySelector(".success-content")
    const existingLink = successContent.querySelector(".tracking-link-info")
    if (existingLink) {
      existingLink.remove()
    }

    const trackingInfo = document.createElement("div")
    trackingInfo.className = "tracking-link-info"
    trackingInfo.style.cssText =
      "margin-top: 1.5rem; padding: 1rem; background: var(--gray-50); border-radius: 8px; text-align: left;"
    trackingInfo.innerHTML = `
      <div style="font-weight: 600; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
        </svg>
        Lien de suivi
      </div>
      <a href="${trackingUrl}" target="_blank" style="color: #3b82f6; font-size: 0.875rem; word-break: break-all;">${trackingUrl}</a>
      <button onclick="navigator.clipboard.writeText('${trackingUrl}').then(() => alert('Lien copié!'))" style="margin-top: 0.5rem; padding: 0.5rem 1rem; background: var(--black); color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 0.875rem; width: 100%;">
        Copier le lien
      </button>
    `
    successContent.insertBefore(trackingInfo, successContent.querySelector(".btn-primary"))

    successModal.classList.add("active")

    document.getElementById("customDesignForm").reset()
    selectedGarment = null
    selectedGarmentName = ""
    selectedColor = null
    designImageData = null
    currentStep = 1

    document.querySelectorAll(".garment-option").forEach((opt) => opt.classList.remove("selected"))
    document.querySelectorAll(".color-btn").forEach((btn) => btn.classList.remove("selected"))
    document.querySelectorAll(".form-step").forEach((step) => step.classList.remove("active"))
    document.querySelector('.form-step[data-step="1"]').classList.add("active")

    document.getElementById("previewArea").innerHTML = `
      <svg width="200" height="200" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="0.5" opacity="0.1">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
      </svg>
      <p style="color: var(--gray-400); margin-top: 1rem;">Sélectionnez un vêtement et ajoutez votre design</p>
    `
    document.getElementById("designPreview").innerHTML = ""

    btnText.style.display = "inline"
    btnLoading.style.display = "none"
    submitBtn.disabled = false

    console.log("[v0] ✅ Opening tracking page:", trackingUrl)
    setTimeout(() => {
      window.open(trackingUrl, "_blank")
    }, 1500)
  } catch (error) {
    console.error("[v0] =================================")
    console.error("[v0] ❌ FIREBASE ERROR")
    console.error("[v0] Error code:", error.code)
    console.error("[v0] Error message:", error.message)
    console.error("[v0] Full error:", error)
    console.error("[v0] =================================")

    let errorMessage = "Une erreur est survenue lors de l'envoi de votre demande.\n\n"

    if (error.code === "PERMISSION_DENIED" || (error.message && error.message.includes("PERMISSION_DENIED"))) {
      errorMessage +=
        "🚫 ERREUR: Permissions Firebase non configurées.\n\n" +
        "Les règles Firebase Realtime Database bloquent l'écriture.\n\n" +
        "SOLUTION:\n" +
        "1. Allez dans Firebase Console\n" +
        "2. Realtime Database → Règles\n" +
        '3. Copiez-collez: { "rules": { ".read": true, ".write": true } }\n' +
        "4. Publiez les nouvelles règles\n" +
        "5. Réessayez d'envoyer votre demande\n\n" +
        "Détails: " +
        (error.message || error.code)
    } else if (error.message && error.message.includes("network")) {
      errorMessage += "Problème de connexion internet. Vérifiez votre connexion et réessayez."
    } else {
      errorMessage += "Détails: " + (error.message || error.code || "Erreur inconnue")
    }

    alert(errorMessage)
    btnText.style.display = "inline"
    btnLoading.style.display = "none"
    submitBtn.disabled = false
  }
})
