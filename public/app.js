const $ = (selector) => document.querySelector(selector);
const state = { page: 1, limit: 20, totalPages: 1, lowOnly: false, searchTimer: null };

async function api(path, options = {}) {
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: { Accept: "application/json", ...(options.body ? { "Content-Type": "application/json" } : {}), ...options.headers },
  });
  if (response.status === 204) return null;
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || `Request failed (${response.status}).`);
  return payload;
}

function showMessage(message) {
  const el = $("#message"); el.textContent = message; el.hidden = false;
  window.clearTimeout(showMessage.timer); showMessage.timer = window.setTimeout(() => { el.hidden = true; }, 6000);
}

function money(value) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(Number(value) || 0);
}

function queryString() {
  const params = new URLSearchParams({ page: String(state.page), limit: String(state.limit) });
  const search = $("#search-input").value.trim();
  const category = $("#category-filter").value;
  const [sortBy, order] = $("#sort-filter").value.split(":");
  if (search) params.set("search", search);
  if (category) params.set("category", category);
  if (state.lowOnly) params.set("stock", "low");
  params.set("sortBy", sortBy); params.set("order", order);
  return params;
}

async function loadSummary() {
  const summary = await api("/products/summary");
  $("#stat-products").textContent = summary.products.toLocaleString("en-IN");
  $("#stat-units").textContent = summary.units.toLocaleString("en-IN");
  $("#stat-value").textContent = money(summary.stockValue);
  $("#stat-low").textContent = summary.lowStock.toLocaleString("en-IN");
  const select = $("#category-filter");
  const selected = select.value;
  select.replaceChildren(new Option("All categories", ""));
  for (const category of summary.categories || []) select.add(new Option(category._id, category._id));
  select.value = selected;
}

function productRow(product) {
  const low = product.quantity <= product.reorderLevel;
  const tr = document.createElement("tr");
  const name = document.createElement("td");
  name.innerHTML = `<span class="product-name"></span><span class="supplier"></span>`;
  name.querySelector(".product-name").textContent = product.name;
  name.querySelector(".supplier").textContent = product.supplier;
  const values = [product.sku, product.category, money(product.price)];
  tr.append(name);
  for (const value of values) { const td = document.createElement("td"); td.textContent = value; tr.append(td); }
  const quantity = document.createElement("td");
  quantity.innerHTML = `<span class="stock-pill ${low ? "low" : ""}"></span>`;
  quantity.querySelector("span").textContent = `${product.quantity} ${low ? "· Reorder" : ""}`;
  tr.append(quantity);
  const stock = document.createElement("td"); stock.className = "stock-value"; stock.textContent = money(product.stockValue ?? product.price * product.quantity); tr.append(stock);
  const actions = document.createElement("td"); actions.className = "row-actions";
  const plus = Object.assign(document.createElement("button"), { type: "button", className: "mini-button", textContent: "+1", title: "Add one unit" });
  plus.addEventListener("click", () => adjustStock(product._id, 1));
  const minus = Object.assign(document.createElement("button"), { type: "button", className: "mini-button", textContent: "−1", title: "Remove one unit" });
  minus.addEventListener("click", () => adjustStock(product._id, -1));
  const edit = Object.assign(document.createElement("button"), { type: "button", className: "mini-button", textContent: "Edit" });
  edit.addEventListener("click", () => openForm(product));
  const del = Object.assign(document.createElement("button"), { type: "button", className: "mini-button", textContent: "Delete" });
  del.addEventListener("click", () => deleteProduct(product._id));
  actions.append(plus, minus, edit, del); tr.append(actions);
  return tr;
}

async function loadProducts() {
  try {
    const data = await api(`/products?${queryString()}`);
    $("#product-rows").replaceChildren(...data.products.map(productRow));
    $("#empty-state").hidden = data.products.length > 0;
    $("#result-count").textContent = `${data.total} ${data.total === 1 ? "product" : "products"}`;
    state.totalPages = Math.max(1, data.totalPages);
    $("#page-label").textContent = `Page ${state.page} of ${state.totalPages}`;
    $("#previous-page").disabled = state.page <= 1;
    $("#next-page").disabled = state.page >= state.totalPages;
  } catch (error) { showMessage(error.message); }
}

async function refresh() {
  try {
    await Promise.all([loadSummary(), loadProducts()]);
    $("#connection-dot").classList.add("online"); $("#connection-label").textContent = "Connected";
  } catch (error) {
    $("#connection-dot").classList.remove("online"); $("#connection-label").textContent = "API unavailable";
    showMessage(error.message);
  }
}

function openForm(product = null) {
  const panel = $("#form-panel"); panel.classList.add("open");
  $("#form-title").textContent = product ? "Edit product" : "Add a product";
  $("#save-button").textContent = product ? "Save changes" : "Save product";
  $("#product-id").value = product?._id || "";
  for (const field of ["name", "sku", "category", "price", "quantity", "reorderLevel", "supplier"]) $("#" + field).value = product?.[field] ?? "";
  $("#name").focus();
}

function closeForm() { $("#form-panel").classList.remove("open"); $("#product-form").reset(); $("#product-id").value = ""; }

async function saveProduct(event) {
  event.preventDefault();
  const id = $("#product-id").value;
  const body = Object.fromEntries(new FormData(event.currentTarget).entries());
  delete body.productId;
  for (const field of ["price", "quantity", "reorderLevel"]) body[field] = Number(body[field]);
  try {
    await api(id ? `/products/${encodeURIComponent(id)}` : "/products", { method: id ? "PUT" : "POST", body: JSON.stringify(body) });
    closeForm(); await refresh();
  } catch (error) { showMessage(error.message); }
}

async function adjustStock(id, change) {
  try { await api(`/products/${encodeURIComponent(id)}/stock`, { method: "PATCH", body: JSON.stringify({ change }) }); await refresh(); }
  catch (error) { showMessage(error.message); }
}

async function deleteProduct(id) {
  if (!window.confirm("Delete this product record?")) return;
  try { await api(`/products/${encodeURIComponent(id)}`, { method: "DELETE" }); await refresh(); }
  catch (error) { showMessage(error.message); }
}

$("#product-form").addEventListener("submit", saveProduct);
$("#new-product-button").addEventListener("click", () => openForm());
$("#empty-add-button").addEventListener("click", () => openForm());
$("#cancel-form").addEventListener("click", closeForm);
$("#close-form").addEventListener("click", closeForm);
$("#search-input").addEventListener("input", () => { window.clearTimeout(state.searchTimer); state.page = 1; state.searchTimer = window.setTimeout(loadProducts, 250); });
for (const selector of ["#category-filter", "#sort-filter"]) $(selector).addEventListener("change", () => { state.page = 1; loadProducts(); });
$("#low-stock-toggle").addEventListener("click", (event) => { state.lowOnly = !state.lowOnly; state.page = 1; event.currentTarget.setAttribute("aria-pressed", String(state.lowOnly)); loadProducts(); });
$("#previous-page").addEventListener("click", () => { if (state.page > 1) { state.page--; loadProducts(); } });
$("#next-page").addEventListener("click", () => { if (state.page < state.totalPages) { state.page++; loadProducts(); } });

refresh();
