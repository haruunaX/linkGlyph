const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const defaults = {
  type: "url",
  fields: { url: "https://linkglyph.app", text: "Hello from LinkGlyph", email: "", subject: "", body: "", phone: "", ssid: "", password: "", encryption: "WPA" },
  dark: "#0B1220",
  light: "#FFFFFF",
  size: 1024,
  level: "M",
  margin: 4,
  name: "My first glyph"
};

let state = structuredClone(defaults);
let qrInstance = null;
let toastTimer = null;

const fieldTemplates = {
  url: () => `
    <label class="field">Website or link
      <input data-field="url" type="url" value="${escapeAttribute(state.fields.url)}" placeholder="https://example.com" autocomplete="url">
      <small>Use the complete address, including https://</small>
    </label>`,
  text: () => `
    <label class="field">Message or plain text
      <textarea data-field="text" maxlength="1200" placeholder="Type anything you want people to see">${escapeHtml(state.fields.text)}</textarea>
      <small>Perfect for short notes, instructions, or reference numbers.</small>
    </label>`,
  email: () => `
    <div class="field-grid">
      <label class="field">Email address<input data-field="email" type="email" value="${escapeAttribute(state.fields.email)}" placeholder="hello@example.com"></label>
      <label class="field">Subject<input data-field="subject" type="text" value="${escapeAttribute(state.fields.subject)}" placeholder="Let’s connect"></label>
    </div>
    <label class="field" style="margin-top:14px">Message<textarea data-field="body" placeholder="Optional email message">${escapeHtml(state.fields.body)}</textarea></label>`,
  phone: () => `
    <label class="field">Phone number
      <input data-field="phone" type="tel" value="${escapeAttribute(state.fields.phone)}" placeholder="+63 912 345 6789" autocomplete="tel">
      <small>Scanning opens the phone dialer with this number ready.</small>
    </label>`,
  wifi: () => `
    <div class="field-grid">
      <label class="field">Network name<input data-field="ssid" type="text" value="${escapeAttribute(state.fields.ssid)}" placeholder="My Wi-Fi"></label>
      <label class="field">Security
        <span class="select-wrap"><select data-field="encryption"><option value="WPA" ${state.fields.encryption === "WPA" ? "selected" : ""}>WPA / WPA2</option><option value="WEP" ${state.fields.encryption === "WEP" ? "selected" : ""}>WEP</option><option value="nopass" ${state.fields.encryption === "nopass" ? "selected" : ""}>No password</option></select></span>
      </label>
    </div>
    <label class="field" style="margin-top:14px">Password<input data-field="password" type="text" value="${escapeAttribute(state.fields.password)}" placeholder="Network password" ${state.fields.encryption === "nopass" ? "disabled" : ""}></label>`
};

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
}

function escapeAttribute(value = "") { return escapeHtml(value); }

function renderFields() {
  $("#dynamicFields").innerHTML = fieldTemplates[state.type]();
  $$('[data-field]', $("#dynamicFields")).forEach(input => {
    input.addEventListener("input", event => {
      state.fields[event.target.dataset.field] = event.target.value;
      if (event.target.dataset.field === "encryption") renderFields();
      updateQr();
    });
    input.addEventListener("change", event => {
      state.fields[event.target.dataset.field] = event.target.value;
      if (event.target.dataset.field === "encryption") renderFields();
      updateQr();
    });
  });
}

function wifiEscape(value) { return String(value || "").replace(/([\\;,":])/g, "\\$1"); }

function getContent() {
  const f = state.fields;
  if (state.type === "url") {
    const raw = f.url.trim();
    if (!raw) return "https://linkglyph.app";
    return /^(https?:\/\/)/i.test(raw) ? raw : `https://${raw}`;
  }
  if (state.type === "text") return f.text.trim() || "Hello from LinkGlyph";
  if (state.type === "email") {
    const params = new URLSearchParams();
    if (f.subject.trim()) params.set("subject", f.subject.trim());
    if (f.body.trim()) params.set("body", f.body.trim());
    return `mailto:${f.email.trim() || "hello@example.com"}${params.toString() ? `?${params}` : ""}`;
  }
  if (state.type === "phone") return `tel:${f.phone.trim().replace(/[^+\d]/g, "") || "+639123456789"}`;
  const hidden = false;
  return `WIFI:T:${f.encryption};S:${wifiEscape(f.ssid || "My Wi-Fi")};P:${f.encryption === "nopass" ? "" : wifiEscape(f.password)};H:${hidden};;`;
}

function getFriendlyValue() {
  const f = state.fields;
  if (state.type === "url") return f.url || "https://linkglyph.app";
  if (state.type === "text") return f.text || "Plain text";
  if (state.type === "email") return f.email || "hello@example.com";
  if (state.type === "phone") return f.phone || "+63 912 345 6789";
  return f.ssid || "My Wi-Fi";
}

function normalizeHex(value, fallback) {
  const hex = String(value).trim();
  return /^#[0-9a-f]{6}$/i.test(hex) ? hex.toUpperCase() : fallback;
}

function luminance(hex) {
  const rgb = hex.slice(1).match(/.{2}/g).map(v => parseInt(v, 16) / 255).map(v => v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
  return .2126 * rgb[0] + .7152 * rgb[1] + .0722 * rgb[2];
}

function contrastRatio(a, b) {
  const la = luminance(a), lb = luminance(b);
  return (Math.max(la, lb) + .05) / (Math.min(la, lb) + .05);
}

function updateScanStatus() {
  const status = $(".scan-status");
  const ratio = contrastRatio(state.dark, state.light);
  status.innerHTML = ratio >= 4 ? "<i></i> Scan-ready" : "<i></i> Increase contrast";
  status.style.color = ratio >= 4 ? "#26805d" : "#a64b33";
  status.querySelector("i").style.background = ratio >= 4 ? "#18a76e" : "#d25d3f";
}

function updateQr() {
  const output = $("#qrOutput");
  state.name = $("#projectName").value.trim() || "Untitled glyph";
  $("#previewName").textContent = state.name;
  $("#previewValue").textContent = getFriendlyValue();
  $("#qrCard").style.background = state.light;
  output.style.padding = `${Math.max(6, state.margin * 2)}px`;
  updateScanStatus();

  if (typeof QRCode === "undefined") {
    output.innerHTML = '<p style="padding:24px;text-align:center;color:#697386">QR engine could not load. Check your connection and refresh.</p>';
    return;
  }

  output.innerHTML = "";
  const level = QRCode.CorrectLevel[state.level] || QRCode.CorrectLevel.M;
  qrInstance = new QRCode(output, { text: getContent(), width: 320, height: 320, colorDark: state.dark, colorLight: state.light, correctLevel: level });
}

function bindControls() {
  $$(".type-tab").forEach(tab => tab.addEventListener("click", () => {
    state.type = tab.dataset.type;
    $$(".type-tab").forEach(item => { const active = item === tab; item.classList.toggle("active", active); item.setAttribute("aria-selected", String(active)); });
    renderFields();
    updateQr();
  }));

  const colorPairs = [["darkColor", "darkHex", "dark"], ["lightColor", "lightHex", "light"]];
  colorPairs.forEach(([pickerId, textId, key]) => {
    const picker = $(`#${pickerId}`), text = $(`#${textId}`);
    picker.addEventListener("input", () => { state[key] = picker.value.toUpperCase(); text.value = state[key]; clearPresets(); updateQr(); });
    text.addEventListener("change", () => { state[key] = normalizeHex(text.value, state[key]); text.value = state[key]; picker.value = state[key]; clearPresets(); updateQr(); });
  });

  $$(".preset").forEach(preset => preset.addEventListener("click", () => {
    state.dark = preset.dataset.dark.toUpperCase(); state.light = preset.dataset.light.toUpperCase();
    $("#darkColor").value = state.dark; $("#darkHex").value = state.dark;
    $("#lightColor").value = state.light; $("#lightHex").value = state.light;
    $$(".preset").forEach(item => item.classList.toggle("active", item === preset));
    updateQr();
  }));

  $("#sizeSelect").addEventListener("change", event => { state.size = Number(event.target.value); });
  $("#errorLevel").addEventListener("change", event => { state.level = event.target.value; updateQr(); });
  $("#marginRange").addEventListener("input", event => { state.margin = Number(event.target.value); $("#marginValue").textContent = `${state.margin} modules`; updateQr(); });
  $("#projectName").addEventListener("input", updateQr);
  $("#downloadPng").addEventListener("click", downloadPng);
  $("#downloadSvg").addEventListener("click", downloadSvg);
  $("#saveProject").addEventListener("click", saveProject);
  $("#historyButton").addEventListener("click", openDrawer);
  $("#closeDrawer").addEventListener("click", closeDrawer);
  $("#drawerBackdrop").addEventListener("click", closeDrawer);
  document.addEventListener("keydown", event => { if (event.key === "Escape") closeDrawer(); });
}

function clearPresets() { $$(".preset").forEach(item => item.classList.remove("active")); }

function getMatrix() {
  const qr = qrInstance?._oQRCode;
  return qr?.modules || null;
}

function drawExportCanvas() {
  const modules = getMatrix();
  if (!modules) return null;
  const count = modules.length, total = count + state.margin * 2, size = state.size;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = state.light; ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = state.dark;
  const scale = size / total;
  for (let row = 0; row < count; row++) for (let col = 0; col < count; col++) {
    if (!modules[row][col]) continue;
    const x1 = Math.round((col + state.margin) * scale), y1 = Math.round((row + state.margin) * scale);
    const x2 = Math.round((col + state.margin + 1) * scale), y2 = Math.round((row + state.margin + 1) * scale);
    ctx.fillRect(x1, y1, x2 - x1, y2 - y1);
  }
  return canvas;
}

function safeFilename() {
  return (state.name || "linkglyph-qr").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || "linkglyph-qr";
}

function triggerDownload(url, filename) {
  const anchor = document.createElement("a"); anchor.href = url; anchor.download = filename; document.body.appendChild(anchor); anchor.click(); anchor.remove();
}

function downloadPng() {
  const canvas = drawExportCanvas();
  if (!canvas) return showToast("QR preview is still loading");
  triggerDownload(canvas.toDataURL("image/png"), `${safeFilename()}.png`);
  showToast("PNG downloaded");
}

function downloadSvg() {
  const modules = getMatrix();
  if (!modules) return showToast("QR preview is still loading");
  const count = modules.length, total = count + state.margin * 2;
  let path = "";
  for (let row = 0; row < count; row++) for (let col = 0; col < count; col++) if (modules[row][col]) path += `M${col + state.margin} ${row + state.margin}h1v1h-1z`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="${state.light}"/><path d="${path}" fill="${state.dark}"/></svg>`;
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  triggerDownload(url, `${safeFilename()}.svg`); setTimeout(() => URL.revokeObjectURL(url), 1000);
  showToast("SVG downloaded");
}

function getSaved() {
  try { return JSON.parse(localStorage.getItem("linkglyph-projects") || "[]"); } catch { return []; }
}

function saveProject() {
  state.name = $("#projectName").value.trim() || "Untitled glyph";
  const saved = getSaved();
  const project = { ...structuredClone(state), id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()), content: getFriendlyValue(), savedAt: new Date().toISOString() };
  localStorage.setItem("linkglyph-projects", JSON.stringify([project, ...saved].slice(0, 12)));
  renderHistory(); showToast("Saved to My codes");
}

function renderHistory() {
  const list = $("#historyList"), saved = getSaved();
  $("#savedCount").textContent = saved.length;
  if (!saved.length) { list.innerHTML = '<div class="empty-state"><strong>No saved codes yet</strong>Create one in the studio, then save it here.</div>'; return; }
  list.innerHTML = "";
  saved.forEach(project => {
    const item = document.createElement("article"); item.className = "history-item";
    item.innerHTML = `<div class="history-swatch" style="--dark:${project.dark};--light:${project.light}">▦</div><div class="history-meta"><strong></strong><small></small></div><div class="history-actions"><button type="button" data-action="load" title="Load project">↗</button><button type="button" data-action="delete" title="Delete project">×</button></div>`;
    $("strong", item).textContent = project.name;
    $("small", item).textContent = project.content;
    $('[data-action="load"]', item).addEventListener("click", () => loadProject(project));
    $('[data-action="delete"]', item).addEventListener("click", () => deleteProject(project.id));
    list.appendChild(item);
  });
}

function loadProject(project) {
  state = { ...structuredClone(defaults), ...structuredClone(project), fields: { ...structuredClone(defaults.fields), ...(project.fields || {}) } };
  $$(".type-tab").forEach(tab => { const active = tab.dataset.type === state.type; tab.classList.toggle("active", active); tab.setAttribute("aria-selected", String(active)); });
  $("#darkColor").value = state.dark; $("#darkHex").value = state.dark;
  $("#lightColor").value = state.light; $("#lightHex").value = state.light;
  $("#sizeSelect").value = String(state.size); $("#errorLevel").value = state.level;
  $("#marginRange").value = String(state.margin); $("#marginValue").textContent = `${state.margin} modules`;
  $("#projectName").value = state.name;
  clearPresets(); renderFields(); updateQr(); closeDrawer();
  document.querySelector("#studio").scrollIntoView({ behavior: "smooth" }); showToast("Project loaded");
}

function deleteProject(id) {
  localStorage.setItem("linkglyph-projects", JSON.stringify(getSaved().filter(project => project.id !== id)));
  renderHistory(); showToast("Project removed");
}

function openDrawer() { $("#historyDrawer").classList.add("open"); $("#historyDrawer").setAttribute("aria-hidden", "false"); renderHistory(); setTimeout(() => $("#closeDrawer").focus(), 100); }
function closeDrawer() { $("#historyDrawer").classList.remove("open"); $("#historyDrawer").setAttribute("aria-hidden", "true"); }

function showToast(message) {
  const toast = $("#toast"); toast.textContent = message; toast.classList.add("show"); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
}

renderFields();
bindControls();
renderHistory();
window.addEventListener("load", updateQr);
setTimeout(updateQr, 50);
