const PROFILE_KEY = "akaffit.profile.v1";
const CONTACTS_KEY = "akaffit.contacts.v1";

const iconPaths = {
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/>',
  wallet: '<path d="M3 6h15a2 2 0 0 1 2 2v10H5a2 2 0 0 1-2-2V6Z"/><path d="M3 6l13-3v3"/><path d="M16 11h5v4h-5a2 2 0 0 1 0-4Z"/>',
  card: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8" cy="11" r="2"/><path d="M5.5 16c.7-1.5 4.3-1.5 5 0M14 10h4M14 14h4"/>',
  handshake: '<path d="m8 11 2 2c1 1 2.5-1 1.5-2l-2-2 2.5-2.5c1-1 2-1 3 0l5 5"/><path d="m4 14 4 4c2 2 4 2 6 0l6-6"/><path d="m2 6 4-2 3 3-5 7-3-2 1-6ZM22 6l-4-2-2 2 5 7 2-2-1-5Z"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>',
  store: '<path d="M4 10v10h16V10"/><path d="M3 4h18l1 5c0 2-3 3-5 1-2 2-5 2-7 0-2 2-5 1-5-1l-2-5Z"/><path d="M9 20v-6h6v6"/>',
  trend: '<path d="m3 17 6-6 4 4 8-9"/><path d="M15 6h6v6"/>',
  bookmark: '<path d="M6 3h12v18l-6-4-6 4V3Z"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="m15 9 6-6M17 3h4v4"/>',
  star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-2.9-5.6 2.9 1.1-6.2L3 9.6l6.2-.9L12 3Z"/>',
  pin: '<path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  megaphone: '<path d="m3 11 15-6v14L3 13v-2Z"/><path d="M7 14v5a2 2 0 0 0 2 2h2l-2-6"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
  home: '<path d="m3 11 9-8 9 8"/><path d="M5 10v11h14V10M9 21v-7h6v7"/>',
  person: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-5 15-5 16 0"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  phone: '<path d="M7 3H4a1 1 0 0 0-1 1c0 9.4 7.6 17 17 17a1 1 0 0 0 1-1v-3l-5-1-2 2c-3.5-1.5-6.5-4.5-8-8l2-2-1-5Z"/>',
  cake: '<path d="M4 10h16v11H4V10Z"/><path d="M4 15c2 2 4-2 6 0s4-2 6 0 3-1 4 0M8 10V7M12 10V7M16 10V7"/><path d="M8 4c1 1 1 2 0 3M12 4c1 1 1 2 0 3M16 4c1 1 1 2 0 3"/>',
  shield: '<path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z"/><path d="m9 12 2 2 4-4"/>',
};

const toolContent = {
  cards: ["名片收藏", "card", "<p>目前收藏 24 位商務夥伴，最近新增 3 位。</p><ul><li>依公司、專長快速分類</li><li>加入聯繫備註與追蹤狀態</li><li>資料只保存在這台裝置</li></ul>"],
  matches: ["人脈配對", "handshake", "<p>根據你設定的產業與合作需求，整理值得認識的人脈，不產生 AI 內容。</p><ul><li>品牌設計 × 2</li><li>通路合作 × 1</li></ul>"],
  followups: ["追蹤清單", "target", "<p>今天建議聯繫陳柏維與林雅婷，延續最近一次交流。</p>"],
  fortune: ["今日商務提示", "star", "<p>適合主動交流與整理合作提案。先確認對方需求，再提出一個具體的下一步。</p>"],
  calendar: ["個人行事曆", "calendar", "<p>今日 14:30 有一場「中區商務交流會」。下一個空檔為 16:00–17:30。</p>"],
  nearby: ["附近商家", "pin", "<p>周邊共 15 家合作商家，包含共享空間、咖啡店與商務服務。</p>"],
  events: ["活動中心", "megaphone", "<p>近期活動</p><ul><li>7/28 中區商務交流會</li><li>7/30 品牌合作小聚</li><li>8/02 新創資源媒合日</li></ul>"],
  wallet: ["商脈錢包", "wallet", "<p>目前點數 990 點，本月已獲得 240 點。</p><ul><li>完成商務交流 +30</li><li>新增有效名片 +10</li></ul>"],
  identity: ["我的商務名片", "card", "<p>公司、職稱、專長與合作需求將在下一階段開放完整編輯。</p>"],
  notifications: ["通知設定", "bell", "<p>目前保留活動與人脈追蹤提醒。瀏覽器推播會在後續版本加入。</p>"],
  privacy: ["隱私與資料", "shield", '<p>個人資料只存於此裝置。你可以清除資料並重新開始。</p><button class="primary-button" type="button" data-action="clear-data">清除本機資料</button>'],
};

const defaultContacts = [
  { id:"card-lin", name:"林雅婷", company:"禾光品牌顧問", skill:"品牌策略", phone:"0912 345 678", category:"partner", status:"合作夥伴", favorite:true },
  { id:"card-chen", name:"陳柏維", company:"初見數位", skill:"社群行銷", phone:"0922 468 135", category:"follow", status:"待追蹤", favorite:false },
  { id:"card-wang", name:"王思涵", company:"拾光空間", skill:"空間企劃", phone:"0933 579 246", category:"partner", status:"合作夥伴", favorite:true },
  { id:"card-chang", name:"張育誠", company:"穩健財務", skill:"企業顧問", phone:"0955 681 357", category:"follow", status:"待追蹤", favorite:false },
];

function load(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}

function normalizeContacts(contacts) {
  return contacts.map((contact) => ({
    ...contact,
    id: contact.id || crypto.randomUUID(),
    phone: contact.phone || "",
    favorite: Boolean(contact.favorite),
  }));
}

const state = {
  profile: load(PROFILE_KEY, null),
  contacts: normalizeContacts(load(CONTACTS_KEY, defaultContacts)),
  filter: "all",
  cardFilter: "all",
  editingId: null,
};

function save(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = value;
  return div.innerHTML;
}

function phoneHref(value) {
  return String(value).replace(/[^+\d]/g, "");
}

function renderIcons(root = document) {
  root.querySelectorAll("[data-icon]").forEach((el) => {
    const paths = iconPaths[el.dataset.icon] || iconPaths.grid;
    el.innerHTML = `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${paths}</svg>`;
  });
}

function setToday() {
  const label = new Intl.DateTimeFormat("zh-TW", { month:"long", day:"numeric", weekday:"short" }).format(new Date());
  document.querySelector("#todayText").textContent = `${label}・今日商務中心`;
}

function updateProfileUI() {
  const profile = state.profile;
  const name = profile?.name || "夥伴";
  document.querySelector("#welcomeName").textContent = name;
  document.querySelector("#profileDisplayName").textContent = name;
  document.querySelector(".avatar--profile").textContent = name.slice(0, 1);
  document.querySelector("#profilePhone").textContent = profile?.phone || "尚未設定";
  document.querySelector("#profileBirthday").textContent = profile?.birthday || "尚未設定";
}

function showScreen(name) {
  document.querySelectorAll(".screen").forEach((screen) => screen.classList.toggle("active", screen.dataset.screen === name));
  document.querySelectorAll(".bottom-nav [data-go]").forEach((button) => button.classList.toggle("active", button.dataset.go === name));
  if (name === "cards") renderCards();
  window.scrollTo({ top:0, behavior:"smooth" });
}

function showToast(message) {
  const toast = document.querySelector("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2200);
}

function closeOpenDialog() {
  document.querySelectorAll("dialog[open]").forEach((dialog) => dialog.close());
}

function openOnboarding() {
  const form = document.querySelector("#onboardingForm");
  if (state.profile) {
    form.elements.name.value = state.profile.name || "";
    form.elements.phone.value = state.profile.phone || "";
    form.elements.birthday.value = state.profile.birthday || "";
  }
  document.querySelector("#onboardingDialog").showModal();
}

function openContactDialog(id = null) {
  const dialog = document.querySelector("#contactDialog");
  const form = document.querySelector("#contactForm");
  state.editingId = id;
  form.reset();
  const contact = state.contacts.find((item) => item.id === id);
  dialog.querySelector("h2").textContent = contact ? "編輯名片" : "新增名片";
  document.querySelector("#contactSubmitButton").textContent = contact ? "儲存變更" : "加入人脈";
  if (contact) {
    form.elements.name.value = contact.name;
    form.elements.company.value = contact.company;
    form.elements.skill.value = contact.skill;
    form.elements.phone.value = contact.phone;
    form.elements.category.value = contact.category;
  }
  dialog.showModal();
}

function openTool(name) {
  const content = toolContent[name];
  if (!content) return;
  document.querySelector("#toolDialogTitle").textContent = content[0];
  document.querySelector("#toolDialogIcon").innerHTML = `<span data-icon="${content[1]}"></span>`;
  document.querySelector("#toolDialogBody").innerHTML = content[2];
  renderIcons(document.querySelector("#toolDialog"));
  document.querySelector("#toolDialog").showModal();
}

function renderContacts() {
  const query = document.querySelector("#contactSearch").value.trim().toLowerCase();
  const contacts = state.contacts.filter((contact) => {
    const matchesFilter = state.filter === "all" || contact.category === state.filter;
    return matchesFilter && `${contact.name} ${contact.company} ${contact.skill}`.toLowerCase().includes(query);
  });
  const list = document.querySelector("#contactList");
  if (!contacts.length) {
    list.innerHTML = '<div class="empty-state">找不到符合條件的人脈</div>';
    return;
  }
  const colors = ["avatar--gold", "avatar--teal", "avatar--purple"];
  list.innerHTML = contacts.map((contact, index) => `
    <article class="contact-item">
      <span class="avatar ${colors[index % colors.length]}">${escapeHtml(contact.name.slice(0, 1))}</span>
      <p><strong>${escapeHtml(contact.name)}</strong><small>${escapeHtml(contact.company)}・${escapeHtml(contact.skill)}</small></p>
      <em class="${contact.category === "follow" ? "warning" : ""}">${escapeHtml(contact.status)}</em>
    </article>`).join("");
}

function renderCards() {
  const search = document.querySelector("#cardSearch");
  if (!search) return;
  const query = search.value.trim().toLowerCase();
  document.querySelector("#cardTotal").textContent = state.contacts.length;
  document.querySelector("#cardFavoriteTotal").textContent = state.contacts.filter((contact) => contact.favorite).length;
  document.querySelector("#cardFollowTotal").textContent = state.contacts.filter((contact) => contact.category === "follow").length;
  const cards = state.contacts.filter((contact) => {
    const matchesFilter =
      state.cardFilter === "all" ||
      (state.cardFilter === "favorite" && contact.favorite) ||
      contact.category === state.cardFilter;
    return matchesFilter && `${contact.name} ${contact.company} ${contact.skill}`.toLowerCase().includes(query);
  });
  const collection = document.querySelector("#cardCollection");
  if (!cards.length) {
    collection.innerHTML = '<div class="empty-state">目前沒有符合條件的名片</div>';
    return;
  }
  collection.innerHTML = cards.map((contact) => `
    <article class="business-card" data-card-id="${escapeHtml(contact.id)}">
      <div class="business-card__accent"></div>
      <div class="business-card__top">
        <span class="business-card__avatar">${escapeHtml(contact.name.slice(0, 1))}</span>
        <button class="favorite-button ${contact.favorite ? "active" : ""}" type="button" data-action="favorite-card" aria-label="${contact.favorite ? "取消收藏" : "加入收藏"}">${contact.favorite ? "★" : "☆"}</button>
      </div>
      <p class="business-card__company">${escapeHtml(contact.company)}</p>
      <h3>${escapeHtml(contact.name)}</h3>
      <p class="business-card__skill">${escapeHtml(contact.skill)}</p>
      <div class="business-card__meta">
        <span class="${contact.category === "follow" ? "warning" : ""}">${escapeHtml(contact.status)}</span>
        <small>${escapeHtml(contact.phone || "尚未設定電話")}</small>
      </div>
      <div class="business-card__actions">
        ${contact.phone ? `<a href="tel:${phoneHref(contact.phone)}">撥打</a>` : ""}
        <button type="button" data-action="edit-card">編輯</button>
        <button class="danger" type="button" data-action="delete-card">刪除</button>
      </div>
    </article>
  `).join("");
}

document.addEventListener("click", (event) => {
  const go = event.target.closest("[data-go]");
  if (go) showScreen(go.dataset.go);
  const tool = event.target.closest("[data-tool]");
  if (tool) openTool(tool.dataset.tool);
  const action = event.target.closest("[data-action]")?.dataset.action;
  if (action === "notifications") {
    document.querySelector(".notification-dot").hidden = true;
    showToast("目前沒有新的通知");
  }
  if (action === "all-tools") showToast("所有商務工具已顯示");
  if (action === "close-dialog") closeOpenDialog();
  if (action === "skip-onboarding") closeOpenDialog();
  if (action === "edit-profile") openOnboarding();
  if (action === "add-contact") openContactDialog();
  const cardId = event.target.closest("[data-card-id]")?.dataset.cardId;
  if (action === "favorite-card" && cardId) {
    const contact = state.contacts.find((item) => item.id === cardId);
    contact.favorite = !contact.favorite;
    save(CONTACTS_KEY, state.contacts);
    renderCards();
    showToast(contact.favorite ? "已加入收藏" : "已取消收藏");
  }
  if (action === "edit-card" && cardId) openContactDialog(cardId);
  if (action === "delete-card" && cardId && window.confirm("確定要刪除這張名片嗎？")) {
    state.contacts = state.contacts.filter((item) => item.id !== cardId);
    save(CONTACTS_KEY, state.contacts);
    renderContacts();
    renderCards();
    showToast("名片已刪除");
  }
  if (action === "clear-data") {
    localStorage.removeItem(PROFILE_KEY);
    localStorage.removeItem(CONTACTS_KEY);
    state.profile = null;
    state.contacts = normalizeContacts([...defaultContacts]);
    updateProfileUI();
    renderContacts();
    renderCards();
    closeOpenDialog();
    showToast("本機資料已清除");
  }
});

document.querySelector("#onboardingForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  const phone = String(data.get("phone")).replace(/[\s-]/g, "");
  const error = document.querySelector("#onboardingError");
  if (!/^(?:\+?886|0)?9\d{8}$/.test(phone)) {
    error.textContent = "請輸入有效的台灣行動電話";
    return;
  }
  error.textContent = "";
  state.profile = {
    name: String(data.get("name")).trim(),
    phone: String(data.get("phone")).trim(),
    birthday: String(data.get("birthday")),
  };
  save(PROFILE_KEY, state.profile);
  updateProfileUI();
  closeOpenDialog();
  showToast("商務資料已儲存");
});

document.querySelector("#contactForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  const category = String(data.get("category"));
  const values = {
    name:String(data.get("name")).trim(),
    company:String(data.get("company")).trim(),
    skill:String(data.get("skill")).trim(),
    phone:String(data.get("phone")).trim(),
    category,
    status:category === "partner" ? "合作夥伴" : "待追蹤",
  };
  if (state.editingId) {
    const contact = state.contacts.find((item) => item.id === state.editingId);
    Object.assign(contact, values);
  } else {
    state.contacts.unshift({ id:crypto.randomUUID(), favorite:false, ...values });
  }
  save(CONTACTS_KEY, state.contacts);
  event.currentTarget.reset();
  renderContacts();
  renderCards();
  closeOpenDialog();
  showToast(state.editingId ? "名片已更新" : "名片已加入人脈");
  state.editingId = null;
});

document.querySelector("#contactSearch").addEventListener("input", renderContacts);
document.querySelector("#cardSearch").addEventListener("input", renderCards);
document.querySelectorAll("[data-card-filter]").forEach((button) => button.addEventListener("click", () => {
  state.cardFilter = button.dataset.cardFilter;
  document.querySelectorAll("[data-card-filter]").forEach((item) => item.classList.toggle("active", item === button));
  renderCards();
}));
document.querySelectorAll("[data-filter]").forEach((button) => button.addEventListener("click", () => {
  state.filter = button.dataset.filter;
  document.querySelectorAll("[data-filter]").forEach((item) => item.classList.toggle("active", item === button));
  renderContacts();
}));
document.querySelectorAll("dialog").forEach((dialog) => dialog.addEventListener("click", (event) => {
  if (event.target === dialog) dialog.close();
}));

renderIcons();
setToday();
updateProfileUI();
renderContacts();
renderCards();
if (!state.profile && !sessionStorage.getItem("akaffit.onboarding.dismissed")) {
  setTimeout(() => document.querySelector("#onboardingDialog").showModal(), 450);
}
document.querySelector("[data-action='skip-onboarding']").addEventListener("click", () => {
  sessionStorage.setItem("akaffit.onboarding.dismissed", "1");
});
