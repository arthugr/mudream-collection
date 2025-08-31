/* ------------------ Utilities ------------------ */
const $ = (sel) => document.querySelector(sel);

function h(tag, props = {}, ...children) {
  const el = document.createElement(tag);
  if (props && typeof props === "object") {
    Object.entries(props).forEach(([k, v]) => {
      if (k === "class") el.className = v;
      else if (k === "html") el.innerHTML = v;
      else if (k.startsWith("on") && typeof v === "function")
        el.addEventListener(k.slice(2), v);
      else if (k === "checked" || k === "disabled") {
        // Handle boolean attributes properly
        if (v) {
          el.setAttribute(k, k);
        } else {
          el.removeAttribute(k);
        }
      } else {
        el.setAttribute(k, v);
      }
    });
  }
  children.flat().forEach((c) => {
    if (c == null) return;
    el.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  });
  return el;
}

function debounce(fn, ms) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

function saveLS(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}

function loadLS(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

/* ------------------ Slot Name Mapping ------------------ */
function getSlotName(slotNumber) {
  const slotMap = {
    0: "weapon",
    1: "shield",
    2: "helm",
    3: "body",
    4: "pants",
    5: "gloves",
    6: "boots",
    7: "wings",
    8: "pet",
    9: "ring(L)",
    10: "ring(R)",
    12: "earring(L)",
    13: "earring(R)",
    255: "common",
  };
  return slotMap[slotNumber] || `slot ${slotNumber}`;
}

/* ------------------ Image URL Generation ------------------ */
function getItemImageUrl(displayId) {
  if (!displayId) return null;
  // Convert displayId like "14-14" to "14/14.webp"
  const parts = displayId.split("-");
  if (parts.length === 2) {
    return `https://dreamassets.fra1.cdn.digitaloceanspaces.com/items_seasons/6plus/${parts[0]}/${parts[1]}.webp`;
  }
  return null;
}

/* ------------------ Gear Stats Display ------------------ */
function getGearStats(item) {
  if (!item) return null;

  const stats = [];

  // Check for common gear stats in the item data
  if (item.Damage !== undefined) {
    stats.push(`Damage: ${item.Damage}`);
  }
  if (item.Defense !== undefined) {
    stats.push(`Defense: ${item.Defense}`);
  }
  if (item.AttackSpeed !== undefined) {
    stats.push(`Attack Speed: ${item.AttackSpeed}`);
  }
  if (item.SuccessRate !== undefined) {
    stats.push(`Success Rate: ${item.SuccessRate}`);
  }
  if (item.RequireLevel !== undefined) {
    stats.push(`Level: ${item.RequireLevel}`);
  }
  if (item.RequireStrength !== undefined) {
    stats.push(`Strength: ${item.RequireStrength}`);
  }
  if (item.RequireDexterity !== undefined) {
    stats.push(`Dexterity: ${item.RequireDexterity}`);
  }
  if (item.RequireEnergy !== undefined) {
    stats.push(`Energy: ${item.RequireEnergy}`);
  }
  if (item.RequireVitality !== undefined) {
    stats.push(`Vitality: ${item.RequireVitality}`);
  }
  if (item.RequireLeadership !== undefined) {
    stats.push(`Leadership: ${item.RequireLeadership}`);
  }
  if (item.Durability !== undefined) {
    stats.push(`Durability: ${item.Durability}`);
  }
  if (item.Excellent !== undefined) {
    stats.push(`Excellent: ${item.Excellent}`);
  }
  if (item.Skill !== undefined) {
    stats.push(`Skill: ${item.Skill}`);
  }
  if (item.Luck !== undefined) {
    stats.push(`Luck: ${item.Luck}`);
  }
  if (item.Option !== undefined) {
    stats.push(`Option: ${item.Option}`);
  }
  if (item.Ancient !== undefined) {
    stats.push(`Ancient: ${item.Ancient}`);
  }
  if (item.Socket !== undefined) {
    stats.push(`Socket: ${item.Socket}`);
  }
  if (item.Pentagram !== undefined) {
    stats.push(`Pentagram: ${item.Pentagram}`);
  }
  if (item.Element !== undefined) {
    stats.push(`Element: ${item.Element}`);
  }
  if (item.ElementLevel !== undefined) {
    stats.push(`Element Level: ${item.ElementLevel}`);
  }

  return stats.length > 0 ? stats : null;
}

/* ------------------ Skill Name Extraction ------------------ */
function getSkillName(item) {
  if (!item || !item.Skill || item.Skill === "0") return DISPLAY_TEXTS.NONE;

  // Use the simple way to get skill name
  if (
    App.dataset &&
    App.dataset.raw &&
    App.dataset.raw.skill &&
    App.dataset.raw.skill[item.Skill]
  ) {
    return App.dataset.raw.skill[item.Skill].text;
  }

  return `Skill ${item.Skill}`;
}

/* ------------------ Item Type Name ------------------ */
function getItemTypeName(item) {
  if (!item) return "";

  const itemName = item.name.toLowerCase();
  const slot = Number(item.slot); // Convert to number

  // Check if it's a staff (weapon slot but staff name)
  const isStaff = slot === 0 && itemName.includes("staff");

  if (slot === 0 && !isStaff) {
    return ITEM_TYPES.WEAPON_ALL_EXCEPT_STAFFS;
  } else if (isStaff) {
    return ITEM_TYPES.WEAPON_STAFFS;
  } else if (slot === 1) {
    return ITEM_TYPES.SHIELDS;
  } else if (
    slot === 2 ||
    slot === 3 ||
    slot === 4 ||
    slot === 5 ||
    slot === 6 ||
    slot === 9 ||
    slot === 10
  ) {
    return ITEM_TYPES.ARMOR_AND_RINGS;
  } else if (slot === 7) {
    return ITEM_TYPES.WINGS;
  } else if (slot === 12 || slot === 13) {
    return ITEM_TYPES.EARRINGS;
  } else {
    return (
      getSlotName(slot).charAt(0).toUpperCase() + getSlotName(slot).slice(1)
    );
  }
}

/* ------------------ Category Guess ------------------ */
function guessExeCategory(item, exeNormalized) {
  if (!item) return null;

  // Map slots to option categories based on the JSON structure
  const slotToCategory = {
    0: "1", // weapon slot -> category "1" (weapons)
    1: "2", // shield slot -> category "2" (shields)
    2: "3", // helm slot -> category "3" (helms)
    3: "4", // body slot -> category "4" (armor)
    4: "5", // pants slot -> category "5" (pants)
    5: "6", // gloves slot -> category "6" (gloves)
    6: "7", // boots slot -> category "7" (boots)
    7: "8", // wings slot -> category "8" (wings)
    8: "9", // pet slot -> category "9" (pets)
    9: "10", // ring left slot -> category "10" (rings)
    10: "10", // ring right slot -> category "10" (rings)
    12: "11", // earring left slot -> category "11" (earrings)
    13: "11", // earring right slot -> category "11" (earrings)
    255: null, // common items might not have excellent options
  };

  const slotCategory = slotToCategory[item.slot];
  if (slotCategory && exeNormalized[slotCategory]) {
    return slotCategory;
  }

  // Fallback to name-based detection
  const n = (item?.name || "").toLowerCase();
  if (n.includes("wing")) return "8";
  if (n.includes("shield")) return "2";
  if (/(sword|staff|bow|blade|mace|axe|scepter|dagger)/.test(n)) return "1";
  if (n.includes("helm")) return "3";
  if (/(armor|plate|mail)/.test(n)) return "4";
  if (/(pant|pants)/.test(n)) return "5";
  if (/(glove)/.test(n)) return "6";
  if (/(boot)/.test(n)) return "7";
  if (n.includes("ear")) return "11";

  return null;
}

/* ------------------ Additional options lookup ------------------ */
/* Map items to their add_option group based on slot */
function getGroupForItem(item) {
  if (!item) return 0;

  // Map slots to groups - this is based on typical Mu Online item grouping
  const slotToGroup = {
    0: 0, // weapon -> group 0
    1: 1, // shield -> group 1
    2: 2, // helm -> group 2
    3: 3, // body -> group 3
    4: 4, // pants -> group 4
    5: 5, // gloves -> group 5
    6: 6, // boots -> group 6
    255: 0, // common -> group 0 (default)
  };

  return slotToGroup[item.slot] || 0;
}

function getAdditionalOptions(addOption, groupId, plus) {
  const g = addOption?.[String(groupId)];
  const row = g?.[String(plus)];
  if (!row) return [];
  const out = [];
  if (row.opt1) out.push({ id: Number(row.opt1), value: Number(row.val1) });
  if (row.opt2) out.push({ id: Number(row.opt2), value: Number(row.val2) });
  return out;
}

// Map option IDs to human-readable names
function getOptionName(optionId) {
  const optionNames = {
    0: "Max HP",
    1: "Max MP",
    2: "Max AG",
    3: "Max SD",
    4: "HP Recovery",
    5: "MP Recovery",
    6: "AG Recovery",
    7: "SD Recovery",
    8: "Attack Power",
    9: "Defense",
    10: "Attack Speed",
    11: "Attack Success Rate",
    12: "Defense Success Rate",
    13: "Critical Damage",
    14: "Excellent Damage",
    15: "Skill Attack",
    16: "Skill Defense",
    17: "Ignore Defense",
    18: "Double Damage",
    19: "Triple Damage",
    20: "Wizardry",
    21: "Excellent Rate",
    22: "Critical Rate",
    23: "Skill Rate",
    24: "HP Absorb",
    25: "MP Absorb",
    26: "SD Absorb",
    27: "AG Absorb",
    28: "Reflect",
    29: "Block",
    30: "Dodge",
    31: "Resistance",
    32: "Elemental Damage",
    33: "Elemental Defense",
    34: "Elemental Resistance",
    35: "Elemental Absorb",
    36: "Elemental Reflect",
    37: "Elemental Block",
    38: "Elemental Dodge",
    39: "Elemental Critical",
    40: "Elemental Excellent",
  };
  return optionNames[optionId] || `Option ${optionId}`;
}
