/* ------------------ Events ------------------ */
// Tab switching
$("#tab-items").addEventListener("click", () => {
  $("#tab-items").style.borderBottomColor = "#6aa7ff";
  $("#tab-items").style.background = "rgba(106, 167, 255, 0.1)";
  $("#tab-sets").style.borderBottomColor = "transparent";
  $("#tab-sets").style.background = "transparent";

  $("#items-tab-content").style.display = "block";
  $("#sets-tab-content").style.display = "none";

  // Clear set selection when switching to items
  App.selectedSet = null;
  renderSelection();
});

$("#tab-sets").addEventListener("click", () => {
  $("#tab-sets").style.borderBottomColor = "#6aa7ff";
  $("#tab-sets").style.background = "rgba(106, 167, 255, 0.1)";
  $("#tab-items").style.borderBottomColor = "transparent";
  $("#tab-items").style.background = "transparent";

  $("#sets-tab-content").style.display = "block";
  $("#items-tab-content").style.display = "none";

  // Clear item selection when switching to sets
  App.selectedId = null;
  renderSelection();
  renderSetSelector();
});

// Dataset switcher
$("#dataset-switcher").addEventListener("change", (e) => {
  const newDataset = e.target.value;
  switchDataset(newDataset);
});

$("#reload").addEventListener("click", () => {
  $("#dataset-status").textContent = "reloading…";
  boot();
});

$("#search").addEventListener("input", debounce(renderItemList, 120));
$("#armor-only").addEventListener("change", renderItemList);
$("#collection-search").addEventListener(
  "input",
  debounce(renderCollection, 120)
);
$("#set-search").addEventListener("input", debounce(renderSetSelector, 120));

// Hide completed checkbox event
$("#hide-completed").addEventListener("change", (e) => {
  App.hideCompleted = e.target.checked;
  renderCollection();
});

document.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
    e.preventDefault();
    $("#search").focus();
    $("#search").select();
  }
});

$("#clear-selection").addEventListener("click", () => {
  App.selectedId = null;
  App.required.exe.clear();
  App.exeRarities.clear();
  resetConfig();
  renderItemList();
  renderSelection();
});

// Level controls
$("#level-slider").addEventListener("input", (e) => {
  App.level = Math.max(0, Math.min(15, Number(e.target.value) || 0));
  renderSelection();
});

$("#level-input").addEventListener("input", (e) => {
  App.level = Math.max(0, Math.min(15, Number(e.target.value) || 0));
  renderSelection();
});

// Options controls
$("#options-slider").addEventListener("input", (e) => {
  App.options = Math.max(0, Math.min(7, Number(e.target.value) || 0));
  renderSelection();
});

$("#options-input").addEventListener("input", (e) => {
  App.options = Math.max(0, Math.min(7, Number(e.target.value) || 0));
  renderSelection();
});

// Luck toggle
$("#luck-toggle").addEventListener("change", (e) => {
  App.luck = e.target.checked;
  renderSelection();
});

// Skill toggle
$("#skill-toggle").addEventListener("change", (e) => {
  App.skill = e.target.checked;
  renderSelection();
});

$("#reset-config").addEventListener("click", resetConfig);
$("#add-to-collection").addEventListener("click", addToCollection);
$("#export").addEventListener("click", exportCurrentCollection);
$("#import").addEventListener("click", openImportCollectionModal);
$("#import-file").addEventListener(
  "change",
  (e) => e.target.files[0] && doImport(e.target.files[0])
);
$("#wipe").addEventListener("click", () => {
  if (confirm("Wipe entire collection?")) {
    App.collection = [];
    persistCollection();
    renderCollection();
    renderCollectionManager();
  }
});

// Modal event listeners
$("#modal-close").addEventListener("click", closeSetModal);
$("#set-modal").addEventListener("click", (e) => {
  if (e.target.id === "set-modal") {
    closeSetModal();
  }
});
