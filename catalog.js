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

if (!firebase.apps || !firebase.apps.length) {
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
  "#C0C0C0": "Argent",
  "#c0c0c0": "Argent",
  "#FFC0CB": "Rose",
  "#ffc0cb": "Rose",
  "#A52A2A": "Marron",
  "#a52a2a": "Marron",
  "#FFD700": "Or",
  "#ffd700": "Or",
  "#000080": "Marine",
  "#008000": "Vert foncé",
  "#F5F5DC": "Beige",
  "#f5f5dc": "Beige",
}

function getColorName(hex) {
  return colorNames[hex] || colorNames[hex.toUpperCase()] || hex
}

let allProducts = []
let currentProduct = null
let currentImageIndex = 0

let sessionId = localStorage.getItem("sessionId")
if (!sessionId) {
  sessionId = "user_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9)
  localStorage.setItem("sessionId", sessionId)
}
let cart = JSON.parse(localStorage.getItem(`cart_${sessionId}`)) || []

const priceRange = { min: 0, max: 500 }

document.addEventListener("DOMContentLoaded", () => {
  loadProductsFromFirebase()
  setupFilters()
  setupSearch()
  setupPriceSlider()
  updateCartUI()
  setupScrollEffects()
  setupKeyboardShortcuts()
})

function loadProductsFromFirebase() {
  database.ref("products").on(
    "value",
    (snapshot) => {
      const data = snapshot.val()
      allProducts = data ? Object.values(data) : []

      loadRecentProducts()
      loadCatalog()
    },
    (error) => {
      console.error("Erreur lors du chargement des produits:", error)
      showToast("Erreur de chargement des produits")
    },
  )
}

function setupPriceSlider() {
  const minSlider = document.getElementById("priceMin")
  const maxSlider = document.getElementById("priceMax")

  if (!minSlider || !maxSlider) return

  function updateSlider() {
    let min = Number.parseInt(minSlider.value)
    let max = Number.parseInt(maxSlider.value)

    if (min > max) {
      ;[min, max] = [max, min]
    }

    document.getElementById("priceMinDisplay").textContent = min + "€"
    document.getElementById("priceMaxDisplay").textContent = max + "€"

    const progress = document.getElementById("rangeProgress")
    const percent1 = (min / 500) * 100
    const percent2 = (max / 500) * 100
    progress.style.left = percent1 + "%"
    progress.style.width = percent2 - percent1 + "%"
  }

  minSlider.addEventListener("input", updateSlider)
  maxSlider.addEventListener("input", updateSlider)
  updateSlider()
}

function togglePriceFilter() {
  const dropdown = document.getElementById("priceFilterDropdown")
  if (dropdown) dropdown.classList.toggle("active")
}

function applyPriceFilter() {
  const minEl = document.getElementById("priceMin")
  const maxEl = document.getElementById("priceMax")

  if (!minEl || !maxEl) return

  const min = Number.parseInt(minEl.value)
  const max = Number.parseInt(maxEl.value)

  priceRange.min = Math.min(min, max)
  priceRange.max = Math.max(min, max)

  const label = document.getElementById("priceFilterLabel")
  if (label) {
    label.textContent = `${priceRange.min}€ - ${priceRange.max}€`
  }

  const dropdown = document.getElementById("priceFilterDropdown")
  if (dropdown) dropdown.classList.remove("active")

  displayProducts(allProducts)
}

document.addEventListener("click", (e) => {
  if (!e.target.closest(".price-filter")) {
    const dropdown = document.getElementById("priceFilterDropdown")
    if (dropdown) dropdown.classList.remove("active")
  }
})

function setupScrollEffects() {
  const header = document.querySelector(".header")
  if (!header) return

  window.addEventListener("scroll", () => {
    if (window.scrollY > 50) {
      header.classList.add("scrolled")
    } else {
      header.classList.remove("scrolled")
    }
  })
}

function setupKeyboardShortcuts() {
  document.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault()
      const searchInput = document.getElementById("headerSearchInput")
      if (searchInput) searchInput.focus()
    }

    if (e.key === "Escape") {
      closeModal()
      const cartPanel = document.getElementById("cartPanel")
      if (cartPanel && cartPanel.classList.contains("active")) {
        toggleCart()
      }
    }

    if (currentProduct) {
      if (e.key === "ArrowLeft") prevImage()
      if (e.key === "ArrowRight") nextImage()
    }
  })
}

function setupSearch() {
  const searchInput = document.getElementById("headerSearchInput")
  if (!searchInput) return

  searchInput.addEventListener(
    "input",
    debounce(() => {
      const isSearching = searchInput.value.trim() !== ""

      const recentSection = document.getElementById("recentSection")
      if (recentSection) {
        recentSection.style.display = isSearching ? "none" : "block"
      }

      displayProducts(allProducts)

      if (isSearching) {
        const catalog = document.getElementById("catalog")
        if (catalog) catalog.scrollIntoView({ behavior: "smooth" })
      }
    }, 300),
  )
}

function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

function loadRecentProducts() {
  const recentContainer = document.getElementById("recentProducts")
  const recentSection = document.getElementById("recentSection")

  if (!recentContainer || !recentSection) return

  if (allProducts.length === 0) {
    recentSection.style.display = "none"
    return
  }

  recentSection.style.display = "block"
  const recent = [...allProducts].sort((a, b) => Number.parseInt(b.id) - Number.parseInt(a.id)).slice(0, 4)

  recentContainer.innerHTML = recent.map((product) => createProductCard(product, true)).join("")
}

function loadCatalog() {
  populateFilters(allProducts)
  displayProducts(allProducts)
}

function populateFilters(products) {
  const categoryFilter = document.getElementById("categoryFilter")
  const colorFilter = document.getElementById("colorFilter")

  if (!categoryFilter || !colorFilter) return

  const currentCategory = categoryFilter.value
  const currentColor = colorFilter.value

  categoryFilter.innerHTML = '<option value="">Catégorie</option>'
  colorFilter.innerHTML = '<option value="">Couleur</option>'

  const categories = [...new Set(products.map((p) => p.category).filter(Boolean))]
  categories.sort().forEach((cat) => {
    const option = document.createElement("option")
    option.value = cat
    option.textContent = cat
    if (cat === currentCategory) option.selected = true
    categoryFilter.appendChild(option)
  })

  const allColors = products.flatMap((p) => p.colors || [])
  const uniqueColors = [...new Set(allColors)]
  uniqueColors.forEach((color) => {
    const option = document.createElement("option")
    option.value = color
    option.textContent = getColorName(color)
    if (color === currentColor) option.selected = true
    colorFilter.appendChild(option)
  })
}

function createProductCard(product, isNew = false) {
  const colorsHtml = (product.colors || [])
    .slice(0, 4)
    .map(
      (color) =>
        `<div class="color-dot" style="background: ${color}" title="${getColorName(color)}" role="img" aria-label="${getColorName(color)}"></div>`,
    )
    .join("")

  return `
        <div class="product-card" onclick="openModal('${product.id}')" role="button" tabindex="0" aria-label="Voir les détails de ${product.name}">
            <div class="product-image-container">
                <img src="${product.images[0]}" alt="${product.name}" class="product-image" loading="lazy">
                ${isNew ? '<span class="product-badge" aria-label="Produit nouveau">Nouveau</span>' : ""}
                <button class="product-quick-add" onclick="event.stopPropagation(); quickAddToCart('${product.id}')" aria-label="Ajouter ${product.name} au panier rapidement">
                    Ajouter au panier
                </button>
            </div>
            <div class="product-content">
                <div class="product-category">${product.category}</div>
                <div class="product-name">${product.name}</div>
                <p class="product-description">${product.description}</p>
                <div class="product-footer">
                    <div class="product-price" aria-label="Prix: ${Number.parseFloat(product.price).toFixed(2)} euros">${Number.parseFloat(product.price).toFixed(2)}€</div>
                    <div class="product-colors" role="list" aria-label="Couleurs disponibles">${colorsHtml}</div>
                </div>
            </div>
        </div>
    `
}

function displayProducts(products) {
  const grid = document.getElementById("productsGrid")
  const countElement = document.getElementById("productCount")
  const emptyState = document.getElementById("emptyState")

  if (!grid || !countElement || !emptyState) return

  const searchInput = document.getElementById("headerSearchInput")
  const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : ""

  const categoryFilter = document.getElementById("categoryFilter")
  const colorFilter = document.getElementById("colorFilter")
  const sortSelect = document.getElementById("sortSelect")

  const categoryValue = categoryFilter ? categoryFilter.value : ""
  const colorValue = colorFilter ? colorFilter.value : ""
  const sortValue = sortSelect ? sortSelect.value : "newest"

  const filtered = products.filter((product) => {
    const matchSearch =
      !searchTerm ||
      product.name.toLowerCase().includes(searchTerm) ||
      product.description.toLowerCase().includes(searchTerm) ||
      product.category.toLowerCase().includes(searchTerm)

    const matchCategory = !categoryValue || product.category === categoryValue
    const matchColor = !colorValue || (product.colors && product.colors.includes(colorValue))

    const price = Number.parseFloat(product.price)
    const matchPrice = price >= priceRange.min && price <= priceRange.max

    return matchSearch && matchCategory && matchColor && matchPrice
  })

  filtered.sort((a, b) => {
    switch (sortValue) {
      case "newest":
        return Number.parseInt(b.id) - Number.parseInt(a.id)
      case "name-asc":
        return a.name.localeCompare(b.name)
      case "name-desc":
        return b.name.localeCompare(a.name)
      case "price-asc":
        return Number.parseFloat(a.price) - Number.parseFloat(b.price)
      case "price-desc":
        return Number.parseFloat(b.price) - Number.parseFloat(a.price)
      default:
        return 0
    }
  })

  countElement.textContent = `${filtered.length} produit${filtered.length > 1 ? "s" : ""}`

  if (filtered.length === 0) {
    grid.innerHTML = ""
    emptyState.style.display = "block"
    return
  }

  emptyState.style.display = "none"
  grid.innerHTML = filtered.map((product) => createProductCard(product)).join("")

  setTimeout(() => {
    document.querySelectorAll("#productsGrid .product-card").forEach((card, index) => {
      card.style.opacity = "0"
      card.style.transform = "translateY(20px)"
      card.style.transition = `opacity 0.5s ease ${index * 0.05}s, transform 0.5s ease ${index * 0.05}s`

      setTimeout(() => {
        card.style.opacity = "1"
        card.style.transform = "translateY(0)"
      }, 50)
    })
  }, 10)
}

function setupFilters() {
  ;["categoryFilter", "colorFilter", "sortSelect"].forEach((id) => {
    const element = document.getElementById(id)
    if (element) {
      element.addEventListener("change", () => {
        displayProducts(allProducts)
      })
    }
  })
}

function openModal(productId) {
  currentProduct = allProducts.find((p) => p.id === productId)
  if (!currentProduct) return

  currentImageIndex = 0

  const modalTitle = document.getElementById("modalTitle")
  const modalCategory = document.getElementById("modalCategory")
  const modalPrice = document.getElementById("modalPrice")
  const modalDescription = document.getElementById("modalDescription")

  if (modalTitle) modalTitle.textContent = currentProduct.name
  if (modalCategory) modalCategory.textContent = currentProduct.category
  if (modalPrice) modalPrice.textContent = `${Number.parseFloat(currentProduct.price).toFixed(2)}€`
  if (modalDescription) modalDescription.textContent = currentProduct.description

  updateMainImage()

  const thumbnailsContainer = document.getElementById("modalThumbnails")
  if (thumbnailsContainer) {
    thumbnailsContainer.innerHTML = currentProduct.images
      .map(
        (img, index) => `
          <img src="${img}" alt="Image ${index + 1} de ${currentProduct.name}" 
               class="thumbnail ${index === 0 ? "active" : ""}"
               onclick="selectImage(${index})"
               loading="lazy"
               role="button"
               tabindex="0"
               aria-label="Voir l'image ${index + 1}">
      `,
      )
      .join("")
  }

  const colorList = document.getElementById("modalColorList")
  if (colorList) {
    colorList.innerHTML = (currentProduct.colors || [])
      .map(
        (color) => `
          <div class="color-tag">
              <div class="color-tag-dot" style="background: ${color}" role="img" aria-label="${getColorName(color)}"></div>
              <span>${getColorName(color)}</span>
          </div>
      `,
      )
      .join("")
  }

  const modal = document.getElementById("productModal")
  if (modal) {
    modal.classList.add("active")
    document.body.style.overflow = "hidden"
  }
}

function closeModal() {
  const modal = document.getElementById("productModal")
  if (modal) {
    modal.classList.remove("active")
    document.body.style.overflow = ""
  }
  currentProduct = null
}

function updateMainImage() {
  if (!currentProduct) return
  const mainImage = document.getElementById("modalMainImage")
  if (!mainImage) return

  mainImage.style.opacity = "0"

  setTimeout(() => {
    mainImage.src = currentProduct.images[currentImageIndex]
    mainImage.alt = `${currentProduct.name} - Image ${currentImageIndex + 1}`
    mainImage.style.opacity = "1"
  }, 150)

  document.querySelectorAll(".thumbnail").forEach((thumb, index) => {
    thumb.classList.toggle("active", index === currentImageIndex)
  })
}

function selectImage(index) {
  currentImageIndex = index
  updateMainImage()
}

function prevImage() {
  if (!currentProduct) return
  currentImageIndex = (currentImageIndex - 1 + currentProduct.images.length) % currentProduct.images.length
  updateMainImage()
}

function nextImage() {
  if (!currentProduct) return
  currentImageIndex = (currentImageIndex + 1) % currentProduct.images.length
  updateMainImage()
}

const productModal = document.getElementById("productModal")
if (productModal) {
  productModal.addEventListener("click", (e) => {
    if (e.target.id === "productModal") closeModal()
  })
}

function quickAddToCart(productId) {
  const product = allProducts.find((p) => p.id === productId)
  if (!product) return
  addProductToCart(product)
  showToast("Produit ajouté au panier")
}

function addToCartFromModal() {
  if (currentProduct) {
    addProductToCart(currentProduct)
    showToast("Produit ajouté au panier")
    closeModal()
  }
}

function addProductToCart(product) {
  const existingItem = cart.find((item) => item.id === product.id)

  if (!existingItem) {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.images[0],
      quantity: 1,
    })
  }

  saveCart()
  updateCartUI()
}

function removeFromCart(productId) {
  cart = cart.filter((item) => item.id !== productId)
  saveCart()
  updateCartUI()
}

function saveCart() {
  localStorage.setItem(`cart_${sessionId}`, JSON.stringify(cart))
}

function updateCartUI() {
  const cartCount = document.getElementById("cartCount")
  const cartItems = document.getElementById("cartItems")
  const cartTotal = document.getElementById("cartTotal")
  const checkoutBtn = document.getElementById("checkoutBtn")

  if (!cartCount) return

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0)
  cartCount.textContent = totalItems

  cartCount.style.transform = "scale(1.3)"
  setTimeout(() => {
    cartCount.style.transform = "scale(1)"
  }, 200)

  if (!cartItems || !cartTotal) return

  if (cart.length === 0) {
    cartItems.innerHTML = '<div class="cart-empty">Votre panier est vide</div>'
    cartTotal.textContent = "0.00€"
    if (checkoutBtn) checkoutBtn.style.pointerEvents = "none"
    return
  }

  if (checkoutBtn) checkoutBtn.style.pointerEvents = "auto"

  cartItems.innerHTML = cart
    .map(
      (item) => `
        <div class="cart-item">
            <img src="${item.image}" alt="${item.name}" class="cart-item-image">
            <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">${Number.parseFloat(item.price).toFixed(2)}€</div>
                <div class="cart-item-quantity">Quantité: ${item.quantity}</div>
                <button class="cart-item-remove" onclick="removeFromCart('${item.id}')" aria-label="Supprimer ${item.name} du panier">Supprimer</button>
            </div>
        </div>
    `,
    )
    .join("")

  const total = cart.reduce((sum, item) => sum + Number.parseFloat(item.price) * item.quantity, 0)
  cartTotal.textContent = `${total.toFixed(2)}€`
}

function toggleCart() {
  const panel = document.getElementById("cartPanel")
  const overlay = document.getElementById("cartOverlay")

  if (panel && overlay) {
    const isActive = panel.classList.toggle("active")
    overlay.classList.toggle("active", isActive)
    document.body.style.overflow = isActive ? "hidden" : ""
  }
}

function showToast(message) {
  const toast = document.getElementById("toast")
  const toastMessage = document.getElementById("toastMessage")

  if (!toast || !toastMessage) return

  toastMessage.textContent = message
  toast.classList.add("active")

  setTimeout(() => {
    toast.classList.remove("active")
  }, 3000)
}
