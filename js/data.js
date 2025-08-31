/* ------------------ Data Loading (gzip-aware) ------------------ */
let currentDataset = DEFAULT_DATASET;

async function loadDataset(datasetId = currentDataset) {
  currentDataset = datasetId;
  
  // Get dataset config
  const datasetConfig = DATASETS[datasetId];
  if (!datasetConfig) {
    console.error(`Unknown dataset: ${datasetId}`);
    return null;
  }

  $("#dataset-status").textContent = `Loading ${datasetConfig.name}...`;
  let data;
  try {
    // Try JSON directly (server might auto-decompress)
    const r1 = await fetch(datasetConfig.file, { cache: "no-store" });
    if (!r1.ok) {
      throw new Error(`Failed to load ${datasetConfig.name}: ${r1.status} ${r1.statusText}`);
    }
    const ct = r1.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      data = await r1.json();
    } else {
      // Fallback: manual gunzip
      const buf = await r1.arrayBuffer();
      const ungz = pako.ungzip(new Uint8Array(buf), { to: "string" });
      data = JSON.parse(ungz);
    }
  } catch (e) {
    console.error(`Error loading dataset ${datasetId}:`, e);
    $("#dataset-status").textContent = `Error loading ${datasetConfig.name}`;
    alert(`Failed to load ${datasetConfig.name}. Please check if the file exists.`);
    return null;
  }

  const parsed = parseDataset(data);
  parsed.datasetId = datasetId; // Add dataset identifier
  $("#dataset-status").textContent = `${datasetConfig.name} ✓`;
  return parsed;
}

async function switchDataset(datasetId) {
  if (datasetId === currentDataset) return;
  
  // Save current collection state
  Collections.saveActiveCollection();
  
  // Load new dataset
  const newDataset = await loadDataset(datasetId);
  if (!newDataset) return;
  
  // Update App state
  App.dataset = newDataset;
  App.skillData = newDataset.skillData;
  
  // Clear current selection
  App.selectedId = null;
  App.selectedSet = null;
  App.required.exe.clear();
  App.exeRarities.clear();
  
  // Regenerate item sets for new dataset
  generateItemSets();
  
  // Initialize collections for new dataset
  Collections.init(datasetId);
  
  // Re-render everything
  renderItemList();
  renderSelection();
  renderCollection();
  renderSetSelector();
  renderCollectionManager();
  
  // Update dataset switcher
  $("#dataset-switcher").value = datasetId;
  
  // Update header title
  updateHeaderTitle();
  
  // Save active dataset preference
  localStorage.setItem(LS_KEYS.ACTIVE_DATASET, datasetId);
}

/* ------------------ Parsing (items, add_option, add_exe_options) ------------------ */
function parseDataset(config) {
  // Items table: entries with Name & Index
  const items = [];

  // Handle nested items structure
  if (config.items && typeof config.items === "object") {
    for (const [categoryKey, categoryItems] of Object.entries(
      config.items
    )) {
      if (categoryItems && typeof categoryItems === "object") {
        for (const [itemKey, item] of Object.entries(categoryItems)) {
          if (
            item &&
            typeof item === "object" &&
            "Name" in item &&
            "Index" in item
          ) {
            // Create unique ID by combining category and item keys
            const uniqueId = `${categoryKey}-${itemKey}`;
            items.push({
              id: uniqueId,
              index: Number(item.Index),
              displayId: `${categoryKey}-${item.Index}`, // Global unique display ID
              name: String(item.Name || `Item ${itemKey}`),
              slot: item.Slot ?? null,
              width: item.Width ?? null,
              height: item.Height ?? null,
              categoryKey: categoryKey,
              itemKey: itemKey,
              // Include all original item data for stats display
              ...item,
            });
          }
        }
      }
    }
  }

  // Fallback: try direct top-level parsing (original logic)
  if (items.length === 0) {
    for (const [k, v] of Object.entries(config)) {
      if (v && typeof v === "object" && "Name" in v && "Index" in v) {
        items.push({
          id: String(v.Index),
          index: Number(v.Index),
          name: String(v.Name || `Item ${k}`),
          slot: v.Slot ?? null,
          width: v.Width ?? null,
          height: v.Height ?? null,
          // Include all original item data for stats display
          ...v,
        });
      }
    }
  }

  items.sort((a, b) => a.index - b.index);

  // Excellent options by category & level
  const exeByCat = config.exe_options || {};
  const exeNormalized = {};
  for (const [catKey, catData] of Object.entries(exeByCat)) {
    if (typeof catData === "object" && catData !== null) {
      exeNormalized[catKey] = {};
      for (const [levelKey, levelData] of Object.entries(catData)) {
        if (levelData && typeof levelData === "object") {
          const lvl = Number(levelKey);
          if (!exeNormalized[catKey][lvl])
            exeNormalized[catKey][lvl] = [];
          if (levelData.name) {
            exeNormalized[catKey][lvl].push({
              name: levelData.name,
              value: levelData.value,
              code: levelData.code,
            });
          }
        }
      }
    }
  }

  // Additional excellent options by item type
  const addExeOptions = config.add_exe_options || {};

  // Option ranks (rarity tiers)
  const exeOptionsRank = config.exe_options_rank || {};

  // Normal options from various sources
  const sourceOptions = config.source_options || [];
  const itemRefineOptions = config.item_refine_options || [];
  const itemOptions = config.item_options || [];
  const itemHarmonyOptions = config.item_harmony_options || [];

  // Additional options (legacy)
  const addOption = config.add_option || {};

  // Extract skill data
  const skillData = config.skill || {};

  return {
    raw: config,
    items,
    exeNormalized,
    addOption,
    addExeOptions,
    exeOptionsRank,
    sourceOptions,
    itemRefineOptions,
    itemOptions,
    itemHarmonyOptions,
    skillData,
    version: "v18",
  };
}

/* ------------------ Item Sets Configuration ------------------ */
let ITEM_SETS = {}; // Will be populated dynamically

function generateItemSets() {
  if (!App.dataset || !App.dataset.items) return;

  const sets = {};
  const setGroups = {};

  // Define the slots we're interested in for sets
  const setSlots = [2, 3, 4, 5, 6]; // Helm, Armor, Pants, Gloves, Boots
  const slotSuffixes = {
    2: "Helm",
    3: "Armor",
    4: "Pants",
    5: "Gloves",
    6: "Boots",
  };

  // Group items by their base name
  App.dataset.items.forEach((item) => {
    if (setSlots.includes(Number(item.slot))) {
      const itemName = item.name;
      const slot = Number(item.slot);
      const suffix = slotSuffixes[slot];

      // Extract base name by removing the slot suffix
      let baseName = itemName;
      if (itemName.endsWith(` ${suffix}`)) {
        baseName = itemName.substring(
          0,
          itemName.length - suffix.length - 1
        );
      }

      // Handle two-word base names (e.g., "Storm Crow", "Black Dragon")
      // Check if the base name ends with a common two-word pattern
      const twoWordPatterns = [
        "Storm Crow",
        "Black Dragon",
        "Dark Phoenix",
        "Grand Soul",
        "Holy Spirit",
        "Thunder Hawk",
        "Great Dragon",
        "Dark Soul",
        "Red Spirit",
        "Dragon Knight",
        "Venom Mist",
        "Sylphid Ray",
        "Ashcrow",
        "Eclipse",
        "Iris",
        "Violent Wind",
        "Red Winged",
        "Ancient",
        "Demonic",
        "Storm Blitz",
        "Eternal Winged",
        "Brave",
        "Divine",
        "Royal",
        "Hades",
        "Succubus",
        "Sacred Fire",
        "Storm Zahard",
        "Piercing Grove",
        "Phoenix Soul",
        "Bloody Dragon",
        "Aurelia",
        "Drakzar",
        "Ravager",
        "Netherion",
        "Sylvaria",
        "Varkrul",
        "Nymberis",
        "Bloodgrin",
        "Gravion",
        "Luxorion",
        "Crimessia",
        "Thalrion",
        "Virelith",
        "Carnavor",
        "Aetheron",
        "Nexarion",
      ];

      for (const pattern of twoWordPatterns) {
        if (itemName.startsWith(pattern + " ")) {
          baseName = pattern;
          break;
        }
      }

      if (!setGroups[baseName]) {
        setGroups[baseName] = {};
      }
      setGroups[baseName][slot] = itemName;
    }
  });

  // Create sets from groups that have at least 3 items
  Object.entries(setGroups).forEach(([baseName, slots]) => {
    const itemCount = Object.keys(slots).length;
    if (itemCount >= 3) {
      const setName = `${baseName} Set`;
      const setItems = [];

      setSlots.forEach((slot) => {
        if (slots[slot]) {
          setItems.push({
            name: slots[slot],
            slot: slot,
          });
        }
      });

      sets[setName] = {
        name: setName,
        items: setItems,
      };
    }
  });

  ITEM_SETS = sets;
}

// Multi-collection support

// Collection management
const Collections = {
  collections: {},
  activeCollectionId: null,
  currentDataset: DEFAULT_DATASET,
  
  // Get storage key for current dataset
  getStorageKey() {
    return `collections_${this.currentDataset}`;
  },
  
  // Initialize collections from storage for specific dataset
  init(datasetId = DEFAULT_DATASET) {
    this.currentDataset = datasetId;
    const storageKey = this.getStorageKey();
    
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      this.collections = JSON.parse(stored);
    } else {
      this.collections = {};
    }
    
    // Create default collection if none exist
    if (Object.keys(this.collections).length === 0) {
      this.createCollection("My Collection", "Default collection");
    }
    
    // Set active collection
    const activeId = localStorage.getItem(`${storageKey}_active`);
    if (activeId && this.collections[activeId]) {
      this.activeCollectionId = activeId;
    } else {
      this.activeCollectionId = Object.keys(this.collections)[0];
    }
    
    // Load active collection into App.collection
    this.loadActiveCollection();
  },
  
  // Create a new collection
  createCollection(name, description = "") {
    const id = `collection_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const collection = {
      id,
      name,
      description,
      items: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    this.collections[id] = collection;
    this.saveCollections();
    return id;
  },
  
  // Delete a collection
  deleteCollection(id) {
    if (Object.keys(this.collections).length <= 1) {
      alert("Cannot delete the last collection. Create a new one first.");
      return false;
    }
    
    delete this.collections[id];
    
    // If deleting active collection, switch to first available
    if (this.activeCollectionId === id) {
      this.activeCollectionId = Object.keys(this.collections)[0];
      this.loadActiveCollection();
    }
    
    this.saveCollections();
    return true;
  },
  
  // Switch to a different collection
  switchCollection(id) {
    if (!this.collections[id]) return false;
    
    // Save current collection
    this.saveActiveCollection();
    
    // Switch to new collection
    this.activeCollectionId = id;
    this.loadActiveCollection();
    
    return true;
  },
  
  // Load active collection into App.collection
  loadActiveCollection() {
    if (this.activeCollectionId && this.collections[this.activeCollectionId]) {
      App.collection = [...this.collections[this.activeCollectionId].items];
    } else {
      App.collection = [];
    }
  },
  
  // Save current App.collection to active collection
  saveActiveCollection() {
    if (this.activeCollectionId && this.collections[this.activeCollectionId]) {
      this.collections[this.activeCollectionId].items = [...App.collection];
      this.collections[this.activeCollectionId].updatedAt = Date.now();
      this.saveCollections();
    }
  },
  
  // Save all collections to storage
  saveCollections() {
    const storageKey = this.getStorageKey();
    localStorage.setItem(storageKey, JSON.stringify(this.collections));
    localStorage.setItem(`${storageKey}_active`, this.activeCollectionId);
  },
  
  // Get active collection info
  getActiveCollection() {
    return this.collections[this.activeCollectionId];
  },
  
  // Get all collections
  getAllCollections() {
    return Object.values(this.collections);
  },
  
  // Check if an item would fit in any collection
  checkItemInCollections(item) {
    const results = [];
    
    Object.values(this.collections).forEach(collection => {
      if (collection.id === this.activeCollectionId) return; // Skip current collection
      
      const hasItem = collection.items.some(collectionItem => 
        collectionItem.id === item.id
      );
      
      if (!hasItem) {
        results.push({
          collectionId: collection.id,
          collectionName: collection.name,
          wouldFit: true,
          reason: "Item not in collection"
        });
      } else {
        results.push({
          collectionId: collection.id,
          collectionName: collection.name,
          wouldFit: false,
          reason: "Item already in collection"
        });
      }
    });
    
    return results;
  },
  
  // Export collection to JSON
  exportCollection(id) {
    const collection = this.collections[id];
    if (!collection) return null;
    
    return JSON.stringify({
      name: collection.name,
      description: collection.description,
      items: collection.items,
      exportedAt: Date.now(),
      version: "1.0"
    }, null, 2);
  },
  
  // Import collection from JSON
  importCollection(jsonData) {
    try {
      const data = JSON.parse(jsonData);
      
      // Validate required fields
      if (!data.name || !Array.isArray(data.items)) {
        throw new Error("Invalid collection format");
      }
      
      // Create new collection with imported data
      const id = this.createCollection(data.name, data.description || "");
      this.collections[id].items = data.items;
      this.saveCollections();
      
      return id;
    } catch (error) {
      console.error("Failed to import collection:", error);
      return null;
    }
  }
};
