let database

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
let designImageData = null
let currentStep = 1

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
  document.getElementById("selectedColor").value = color

  document.querySelectorAll(".color-btn").forEach((btn) => {
    btn.classList.remove("selected")
  })
  document.querySelector(`[data-color="${color}"]`).classList.add("selected")

  updatePreview()
}

function updatePreview() {
  const previewArea = document.getElementById("previewArea")

  if (selectedGarment && selectedColor) {
    previewArea.innerHTML = `
      <div class="preview-garment" style="background: ${selectedColor};">
        <div class="preview-label">${selectedGarmentName}</div>
      </div>
    `
  }
}

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

document.getElementById("customDesignForm").addEventListener("submit", async (e) => {
  e.preventDefault()

  if (!database) {
    alert(
      "Erreur: La base de données n'est pas initialisée.\n\n" +
        "Veuillez rafraîchir la page et réessayer.\n\n" +
        "Si le problème persiste, consultez le fichier FIREBASE_SETUP.txt",
    )
    return
  }

  const submitBtn = document.getElementById("submitBtn")
  const btnText = submitBtn.querySelector(".btn-text")
  const btnLoading = submitBtn.querySelector(".btn-loading")

  btnText.style.display = "none"
  btnLoading.style.display = "flex"
  submitBtn.disabled = true

  const requestId = "CUSTOM-" + Date.now().toString(36).toUpperCase()
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

  try {
    await database.ref("customDesigns/" + requestId).set(customRequest)

    document.getElementById("confirmEmail").textContent = customerEmail
    document.getElementById("successModal").classList.add("active")

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
  } catch (error) {
    console.error("[v0] Firebase error:", error)

    let errorMessage = "Une erreur est survenue lors de l'envoi de votre demande.\n\n"

    if (error.code === "PERMISSION_DENIED" || (error.message && error.message.includes("PERMISSION_DENIED"))) {
      errorMessage +=
        "ERREUR: Permissions Firebase non configurées.\n\n" +
        "Les règles Firebase Realtime Database bloquent l'écriture.\n\n" +
        "SOLUTION:\n" +
        "1. Ouvrez le fichier FIREBASE_SETUP.txt\n" +
        "2. Suivez les instructions pour configurer les règles\n" +
        "3. Publiez les nouvelles règles\n" +
        "4. Réessayez d'envoyer votre demande\n\n" +
        "Détails techniques: " +
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
