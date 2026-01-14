const firebase = window.firebase
const firebaseConfig = {
  apiKey: "AIzaSyAvSh3XI-t78INDTuq5TTq07V1wOAeEEXI",
  authDomain: "worn-4edd1.firebaseapp.com",
  databaseURL: "https://worn-4edd1-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "worn-4edd1",
  storageBucket: "worn-4edd1.firebasestorage.app",
  messagingSenderId: "597648038146",
  appId: "1:597648038146:web:29b0c3ef3d4aa133180a1b",
}

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig)
}
const database = firebase.database()

const colorNames = {
  "#FF0000": "Rouge",
  "#ff0000": "Rouge",
  "#00FF00": "Vert",
  "#00ff00": "Vert",
  "#0000FF": "Bleu",
  "#0000ff": "Bleu",
  "#FFFF00": "Jaune",
  "#ffff00": "Jaune",
  "#FF00FF": "Magenta",
  "#ff00ff": "Magenta",
  "#00FFFF": "Cyan",
  "#00ffff": "Cyan",
  "#FFA500": "Orange",
  "#ffa500": "Orange",
  "#800080": "Violet",
  "#000000": "Noir",
  "#FFFFFF": "Blanc",
  "#ffffff": "Blanc",
  "#808080": "Gris",
  "#FFC0CB": "Rose",
  "#ffc0cb": "Rose",
  "#A52A2A": "Marron",
  "#a52a2a": "Marron",
}

function getColorName(hex) {
  return colorNames[hex] || colorNames[hex.toUpperCase()] || hex
}

let selectedColors = []
let imageFiles = []
let allProducts = []
let editingProductId = null

function verifyCode() {
  const input = document.getElementById("authCode").value
  const authError = document.getElementById("authError")

  if (input === "3352") {
    document.getElementById("authModal").classList.remove("active")
    document.getElementById("adminMain").style.display = "block"
    initAdmin()
  } else {
    authError.style.display = "block"
    authError.classList.add("active")
    document.getElementById("authCode").value = ""
    document.getElementById("authCode").focus()

    setTimeout(() => {
      authError.style.display = "none"
      authError.classList.remove("active")
    }, 3000)
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const authCodeInput = document.getElementById("authCode")
  if (authCodeInput) {
    authCodeInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") verifyCode()
    })
    authCodeInput.focus()
  }
})

function initAdmin() {
  loadProductsFromFirebase()
  setupColorPicker()
  setupImageUpload()
  setupForm()
  setupAdminSearch()
}

function setupAdminSearch() {
  const searchInput = document.getElementById("adminSearchInput")
  searchInput?.addEventListener("input", () => {
    displayProducts(allProducts, searchInput.value.toLowerCase().trim())
  })
}

function loadProductsFromFirebase() {
  database.ref("products").on("value", (snapshot) => {
    const data = snapshot.val()
    allProducts = data ? Object.values(data) : []
    displayProducts(allProducts)
  })
}

function displayProducts(products, searchTerm = "") {
  const list = document.getElementById("productList")
  const count = document.getElementById("productCount")

  let filtered = products
  if (searchTerm) {
    filtered = products.filter((p) => p.name.toLowerCase().includes(searchTerm))
  }

  count.textContent = filtered.length

  if (filtered.length === 0) {
    list.innerHTML =
      '<div class="empty-state" style="padding: 3rem; text-align: center; color: #71717a;">Aucun produit trouvé</div>'
    return
  }

  list.innerHTML = filtered
    .map(
      (product) => `
        <div class="product-item">
            <img src="${product.images[0]}" alt="${product.name}" class="product-item-image">
            <div class="product-item-info">
                <div class="product-item-name">${product.name}</div>
                <div class="product-item-category">${product.category}</div>
                <div class="product-item-price">${Number.parseFloat(product.price).toFixed(2)}€</div>
            </div>
            <div class="product-item-actions">
                <button class="btn-edit" onclick="editProduct('${product.id}')" title="Modifier">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                </button>
                <button class="btn-delete" onclick="deleteProduct('${product.id}')" title="Supprimer">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                </button>
            </div>
        </div>
    `,
    )
    .join("")
}

function editProduct(productId) {
  const product = allProducts.find((p) => p.id === productId)
  if (!product) return

  editingProductId = productId

  document.getElementById("productName").value = product.name
  document.getElementById("productCategory").value = product.category
  document.getElementById("productPrice").value = product.price
  document.getElementById("productDescription").value = product.description

  selectedColors = [...product.colors]
  displaySelectedColors()
  updateColorButtons()

  imageFiles = []
  const preview = document.getElementById("imagePreview")
  preview.innerHTML = ""

  product.images.forEach((imageUrl, index) => {
    const div = document.createElement("div")
    div.className = "preview-item"
    div.innerHTML = `
      <img src="${imageUrl}" alt="Preview" class="preview-image">
      <button type="button" class="preview-remove" onclick="removeExistingImage(${index})">&times;</button>
    `
    preview.appendChild(div)
  })

  const form = document.getElementById("productForm")
  const submitBtn = form.querySelector('button[type="submit"]')
  submitBtn.textContent = "Mettre à jour le produit"

  window.scrollTo({ top: 0, behavior: "smooth" })
}

function cancelEdit() {
  editingProductId = null
  document.getElementById("productForm").reset()
  selectedColors = []
  imageFiles = []
  document.getElementById("selectedColors").innerHTML = ""
  document.getElementById("imagePreview").innerHTML = ""
  updateColorButtons()

  const form = document.getElementById("productForm")
  const submitBtn = form.querySelector('button[type="submit"]')
  submitBtn.textContent = "Ajouter le produit"
}

function deleteProduct(productId) {
  if (!confirm("Êtes-vous sûr de vouloir supprimer ce produit ?")) return
  database.ref("products/" + productId).remove()

  if (editingProductId === productId) {
    cancelEdit()
  }
}

function setupColorPicker() {
  document.querySelectorAll(".color-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const color = btn.dataset.color
      toggleColor(color)
      btn.classList.toggle("selected", selectedColors.includes(color))
    })
  })
}

function toggleColor(color) {
  const index = selectedColors.indexOf(color)
  if (index > -1) {
    selectedColors.splice(index, 1)
  } else {
    selectedColors.push(color)
  }
  displaySelectedColors()
  updateColorButtons()
}

function updateColorButtons() {
  document.querySelectorAll(".color-btn").forEach((btn) => {
    btn.classList.toggle("selected", selectedColors.includes(btn.dataset.color))
  })
}

function displaySelectedColors() {
  const container = document.getElementById("selectedColors")
  container.innerHTML = selectedColors
    .map(
      (color) => `
        <div class="color-tag">
            <div class="color-tag-dot" style="background: ${color}"></div>
            <span>${getColorName(color)}</span>
            <button type="button" class="color-tag-remove" onclick="removeColor('${color}')">&times;</button>
        </div>
    `,
    )
    .join("")
}

function removeColor(color) {
  selectedColors = selectedColors.filter((c) => c !== color)
  displaySelectedColors()
  updateColorButtons()
}

function setupImageUpload() {
  const input = document.getElementById("imageInput")
  const dropZone = document.querySelector(".file-label")

  input?.addEventListener("change", (e) => {
    handleFiles(Array.from(e.target.files))
  })

  dropZone?.addEventListener("dragover", (e) => {
    e.preventDefault()
    dropZone.style.borderColor = "#000"
    dropZone.style.background = "#f4f4f5"
  })

  dropZone?.addEventListener("dragleave", () => {
    dropZone.style.borderColor = "#d4d4d8"
    dropZone.style.background = "transparent"
  })

  dropZone?.addEventListener("drop", (e) => {
    e.preventDefault()
    dropZone.style.borderColor = "#d4d4d8"
    dropZone.style.background = "transparent"
    handleFiles(Array.from(e.dataTransfer.files))
  })
}

function handleFiles(files) {
  files.forEach((file) => {
    if (file.type.startsWith("image/")) {
      imageFiles.push(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        displayImagePreview(e.target.result, imageFiles.length - 1)
      }
      reader.readAsDataURL(file)
    }
  })
}

function displayImagePreview(src, index) {
  const preview = document.getElementById("imagePreview")
  const div = document.createElement("div")
  div.className = "preview-item"
  div.innerHTML = `
        <img src="${src}" alt="Preview" class="preview-image">
        <button type="button" class="preview-remove" onclick="removeImage(${index})">&times;</button>
    `
  preview.appendChild(div)
}

function removeImage(index) {
  imageFiles.splice(index, 1)
  const preview = document.getElementById("imagePreview")
  preview.innerHTML = ""
  imageFiles.forEach((file, i) => {
    const reader = new FileReader()
    reader.onload = (e) => displayImagePreview(e.target.result, i)
    reader.readAsDataURL(file)
  })
}

function setupForm() {
  document.getElementById("productForm")?.addEventListener("submit", async (e) => {
    e.preventDefault()

    if (selectedColors.length === 0) {
      alert("Veuillez sélectionner au moins une couleur")
      return
    }

    let images = []

    if (editingProductId) {
      const existingProduct = allProducts.find((p) => p.id === editingProductId)
      images = existingProduct ? [...existingProduct.images] : []

      if (imageFiles.length > 0) {
        const imagePromises = imageFiles.map((file) => {
          return new Promise((resolve) => {
            const reader = new FileReader()
            reader.onload = (e) => resolve(e.target.result)
            reader.readAsDataURL(file)
          })
        })
        const newImages = await Promise.all(imagePromises)
        images = newImages
      }
    } else {
      if (imageFiles.length === 0) {
        alert("Veuillez ajouter au moins une image")
        return
      }

      const imagePromises = imageFiles.map((file) => {
        return new Promise((resolve) => {
          const reader = new FileReader()
          reader.onload = (e) => resolve(e.target.result)
          reader.readAsDataURL(file)
        })
      })
      images = await Promise.all(imagePromises)
    }

    const productId = editingProductId || Date.now().toString()
    const product = {
      id: productId,
      name: document.getElementById("productName").value,
      category: document.getElementById("productCategory").value,
      price: document.getElementById("productPrice").value,
      description: document.getElementById("productDescription").value,
      colors: [...selectedColors],
      images: images,
    }

    await database.ref("products/" + productId).set(product)

    document.getElementById("productForm").reset()
    selectedColors = []
    imageFiles = []
    editingProductId = null
    document.getElementById("selectedColors").innerHTML = ""
    document.getElementById("imagePreview").innerHTML = ""
    updateColorButtons()

    const submitBtn = document.getElementById("productForm").querySelector('button[type="submit"]')
    submitBtn.textContent = "Ajouter le produit"

    alert(editingProductId ? "Produit mis à jour avec succès !" : "Produit ajouté avec succès !")
  })
}
