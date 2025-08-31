/* ------------------ Data Loading (gzip-aware) ------------------ */
async function loadDataset() {
  // cache hit?
  const cached = loadLS(LS_KEYS.DATA, null);
  if (cached?.items && cached?.raw && cached?.version === "v18") {
    $("#dataset-status").textContent = "cached ✓";
    return cached;
  }

  $("#dataset-status").textContent = "fetching…";
  let data;
  try {
    // Try JSON directly (server might auto-decompress)
    const r1 = await fetch(DATA_URL, { cache: "no-store" });
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
    // ultimate fallback: try arrayBuffer→gunzip if direct JSON failed
    const r2 = await fetch(DATA_URL, { cache: "no-store" });
    const buf = await r2.arrayBuffer();
    const ungz = pako.ungzip(new Uint8Array(buf), { to: "string" });
    data = JSON.parse(ungz);
  }

  const parsed = parseDataset(data);
  saveLS(LS_KEYS.DATA, parsed);
  $("#dataset-status").textContent = "fresh ✓";
  return parsed;
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
