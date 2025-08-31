/* ------------------ App State ------------------ */
const App = {
  dataset: null,
  skillData: null,
  selectedId: null,
  level: 0,
  options: 0,
  luck: false,
  skill: false,
  required: { exe: new Set() }, // user-selected requirements
  exeRarities: new Map(), // excellent option -> rarity
  collection: loadLS(LS_KEYS.COLLECTION, []),
  selectedSet: null, // currently selected set for guided form
  setConfig: {}, // configuration for set items (level, options, etc.)
  hideCompleted: false, // new filter for hiding completed items
};

/* ------------------ Actions ------------------ */
async function boot() {
  App.dataset = await loadDataset();
  App.skillData = App.dataset.skillData;
  generateItemSets(); // Generate sets from dataset
  renderItemList();
  renderSelection();
  renderCollection();
  renderSetSelector();
}

function selectItem(id) {
  App.selectedId = String(id);
  App.required.exe.clear();
  App.exeRarities.clear();

  renderItemList();
  renderSelection();
}

function adjustLevel(delta) {
  const newLevel = Math.max(0, Math.min(15, App.level + delta));
  App.level = newLevel;
  $("#level-input").value = newLevel;
  renderSelection();
}

function adjustOptionLevel(delta) {
  const newOptionLevel = Math.max(
    0,
    Math.min(7, App.optionLevel + delta)
  );
  App.optionLevel = newOptionLevel;
  $("#option-level-input").value = newOptionLevel;
  renderSelection();
}

// Get option result for current option level
function getOptionResult(item, optionLevel) {
  if (!item || !App.dataset.itemOptions || optionLevel === 0) return null;

  const group = getGroupForItem(item);
  const groupOptions = App.dataset.itemOptions.find(
    (opt) => opt.group === group
  );

  if (groupOptions && groupOptions.options) {
    const option = groupOptions.options.find(
      (opt) => opt.index === optionLevel - 1
    );
    if (option) {
      return {
        name: groupOptions.groupName,
        value: option[`value${optionLevel}`] || 0,
        ancient: option.ancient || [],
      };
    }
  }

  return null;
}

function updateExeRarity(optionText, rarity) {
  App.exeRarities.set(optionText, rarity);

  // Update the data-rarity attribute on the option container
  const optionContainer = document.querySelector(`[data-rarity]`);
  if (optionContainer) {
    optionContainer.setAttribute("data-rarity", rarity);
  }

  renderSelection();
}

function resetConfig() {
  App.level = 0;
  App.options = 0;
  App.luck = false;
  App.skill = false;
  App.required.exe.clear();
  App.exeRarities.clear();
  renderSelection();
}

function addToCollection() {
  const it = App.dataset.items.find((i) => i.id === App.selectedId);
  if (!it) {
    alert("Select an item first.");
    return;
  }

  // Check if we're editing an existing item
  const editingIndex = App.collection.findIndex(
    (item) => item.id === it.id
  );

  // Convert excellent options to objects with rarity info
  const exeOptions = [...App.required.exe].map((optionText) => {
    const itemTypeName = getItemTypeName(it);
    const config = ITEM_CONFIGS[itemTypeName];
    const optionConfig = config?.excellentOptions?.find(
      (o) => o.name === optionText
    );

    // For Wings, don't include rarity since they're single-value options
    if (optionConfig?.values.single !== undefined) {
      return {
        text: optionText,
        rarity: "single",
      };
    } else {
      return {
        text: optionText,
        rarity: App.exeRarities.get(optionText) || "normal",
      };
    }
  });

  const entry = {
    id: it.id,
    index: it.index,
    displayId: it.displayId,
    name: it.name,
    level: App.level,
    options: App.options,
    luck: App.luck,
    skill: App.skill,
    exeOptions: exeOptions,
    done: false,
    ts: Date.now(),
  };

  if (editingIndex !== -1) {
    // Update existing item - preserve the set property
    const existingItem = App.collection[editingIndex];
    entry.set = existingItem.set; // Preserve set membership
    App.collection[editingIndex] = entry;
  } else {
    // Add new item
    App.collection.push(entry);
  }

  persistCollection();
  renderCollection();
}

function editIntoConfigurator(idx) {
  const c = App.collection[idx];
  if (!c) return;
  selectItem(c.id);
  App.level = c.level || 0;
  App.options = c.options || c.optionLevel || 0; // Support both new and legacy
  App.luck = c.luck || false;
  App.skill = c.skill || false;

  // Handle excellent options with rarity info
  if (c.exeOptions && Array.isArray(c.exeOptions)) {
    App.required.exe = new Set(c.exeOptions.map((opt) => opt.text));
    c.exeOptions.forEach((opt) => {
      App.exeRarities.set(opt.text, opt.rarity || "normal");
    });
  } else {
    // Legacy support
    App.required.exe = new Set(c.exeLines || []);
  }

  renderSelection();
}

function removeFromCollection(idx) {
  App.collection.splice(idx, 1);
  persistCollection();
  renderCollection();
}

function toggleDone(idx) {
  App.collection[idx].done = !App.collection[idx].done;
  persistCollection();
  renderCollection();
}

function persistCollection() {
  saveLS(LS_KEYS.COLLECTION, App.collection);
}

/* ------------------ Export/Import ------------------ */
function exportCollection() {
  const blob = new Blob([JSON.stringify(App.collection, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "classicx5_collection.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

function openImport() {
  $("#import-file").click();
}

function doImport(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (!Array.isArray(data)) throw new Error("Invalid file format");
      App.collection = data;
      persistCollection();
      renderCollection();
    } catch (e) {
      alert("Import failed: " + e.message);
    }
  };
  reader.readAsText(file);
}
