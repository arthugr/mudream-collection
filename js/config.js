/* ------------------ Config ------------------ */
const DATA_URL = "items.json";
const LS_KEYS = {
  DATA: "classicx5_dataset_v1",
  COLLECTION: "classicx5_collection_v1",
};

/* ------------------ Item Type Constants ------------------ */
const ITEM_TYPES = {
  WEAPON_ALL_EXCEPT_STAFFS: "Weapon (All except staffs)",
  WEAPON_STAFFS: "Weapon (Staffs)",
  SHIELDS: "Shields",
  ARMOR_AND_RINGS: "Armor & Rings",
  WINGS: "Wings",
  EARRINGS: "Earrings",
};

/* ------------------ Luck Option Constants ------------------ */
const LUCK_OPTIONS = {
  SUCCESS_RATE_INCREASE: "Success rate increase +25%",
  CRITICAL_DAMAGE_RATE: "Critical damage rate +5%",
  NONE: "none",
};

/* ------------------ Display Constants ------------------ */
const DISPLAY_TEXTS = {
  NONE: "None",
};

/* ------------------ Item Configuration from options.md ------------------ */
const ITEM_CONFIGS = {
  [ITEM_TYPES.WEAPON_ALL_EXCEPT_STAFFS]: {
    level: { min: 0, max: 15 },
    options: { min: 0, max: 7, damagePerLevel: 30 },
    luck: {
      on: [LUCK_OPTIONS.SUCCESS_RATE_INCREASE, LUCK_OPTIONS.CRITICAL_DAMAGE_RATE],
      off: LUCK_OPTIONS.NONE,
    },
    skill: true,
    excellentOptions: [
      {
        name: "Excellent Damage Rate %",
        values: {
          normal: 6,
          uncommon: 7,
          rare: 8,
          legendary: 9,
          epic: 10,
        },
      },
      {
        name: "Physical Damage Increases +level/",
        values: {
          normal: 35,
          uncommon: 30,
          rare: 25,
          legendary: 20,
          epic: 15,
        },
      },
      {
        name: "Physical Damage Increase %",
        values: {
          normal: 6,
          uncommon: 7,
          rare: 8,
          legendary: 9,
          epic: 10,
        },
      },
      {
        name: "Increases Attack Speed +",
        values: {
          normal: 20,
          uncommon: 25,
          rare: 30,
          legendary: 35,
          epic: 40,
        },
      },
      {
        name: "Obtains (Life) when monster is killed",
        values: {
          normal: 14,
          uncommon: 12,
          rare: 10,
          legendary: 8,
          epic: 6,
        },
      },
      {
        name: "Obtains (Mana) when monster is killed",
        values: {
          normal: 14,
          uncommon: 12,
          rare: 10,
          legendary: 8,
          epic: 6,
        },
      },
    ],
  },
  [ITEM_TYPES.WEAPON_STAFFS]: {
    level: { min: 0, max: 15 },
    options: { min: 0, max: 7, damagePerLevel: 30 },
    luck: {
      on: [LUCK_OPTIONS.SUCCESS_RATE_INCREASE, LUCK_OPTIONS.CRITICAL_DAMAGE_RATE],
      off: LUCK_OPTIONS.NONE,
    },
    skill: false,
    excellentOptions: [
      {
        name: "Excellent Damage Rate %",
        values: {
          normal: 6,
          uncommon: 7,
          rare: 8,
          legendary: 9,
          epic: 10,
        },
      },
      {
        name: "Wizardry Damage Increases +level/",
        values: {
          normal: 35,
          uncommon: 30,
          rare: 25,
          legendary: 20,
          epic: 15,
        },
      },
      {
        name: "Wizardry Damage Increase %",
        values: {
          normal: 6,
          uncommon: 7,
          rare: 8,
          legendary: 9,
          epic: 10,
        },
      },
      {
        name: "Increases Attack Speed +",
        values: {
          normal: 20,
          uncommon: 25,
          rare: 30,
          legendary: 35,
          epic: 40,
        },
      },
      {
        name: "Obtains (Life) when monster is killed",
        values: {
          normal: 14,
          uncommon: 12,
          rare: 10,
          legendary: 8,
          epic: 6,
        },
      },
      {
        name: "Obtains (Mana) when monster is killed",
        values: {
          normal: 14,
          uncommon: 12,
          rare: 10,
          legendary: 8,
          epic: 6,
        },
      },
    ],
  },
  [ITEM_TYPES.SHIELDS]: {
    level: { min: 0, max: 15 },
    options: {
      min: 0,
      max: 7,
      defensePerLevel: 5,
    },
    luck: {
      on: [LUCK_OPTIONS.SUCCESS_RATE_INCREASE, LUCK_OPTIONS.CRITICAL_DAMAGE_RATE],
      off: LUCK_OPTIONS.NONE,
    },
    skill: true,
    excellentOptions: [
      {
        name: "Increase Maximum Life %",
        values: {
          normal: 1,
          uncommon: 2,
          rare: 3,
          legendary: 4,
          epic: 5,
        },
      },
      {
        name: "Increase Maximum SD %",
        values: {
          normal: 1,
          uncommon: 2,
          rare: 3,
          legendary: 4,
          epic: 5,
        },
      },
      {
        name: "Damage Decrease %",
        values: {
          normal: 1,
          uncommon: 2,
          rare: 3,
          legendary: 4,
          epic: 5,
        },
      },
      {
        name: "Reflect Damage %",
        values: {
          normal: 1,
          uncommon: 2,
          rare: 3,
          legendary: 4,
          epic: 5,
        },
      },
      {
        name: "Defense success rate % (PVM Only)",
        values: {
          normal: 3,
          uncommon: 6,
          rare: 9,
          legendary: 12,
          epic: 15,
        },
      },
      {
        name: "Increase Zen Drop Rate %",
        values: {
          normal: 5,
          uncommon: 10,
          rare: 15,
          legendary: 20,
          epic: 25,
        },
      },
    ],
  },
  [ITEM_TYPES.ARMOR_AND_RINGS]: {
    level: { min: 0, max: 15 },
    options: {
      min: 0,
      max: 7,
      defensePerLevel: 15,
    },
    luck: {
      on: [LUCK_OPTIONS.SUCCESS_RATE_INCREASE, LUCK_OPTIONS.CRITICAL_DAMAGE_RATE],
      off: LUCK_OPTIONS.NONE,
    },
    skill: false,
    excellentOptions: [
      {
        name: "Increase Maximum Life %",
        values: {
          normal: 1,
          uncommon: 2,
          rare: 3,
          legendary: 4,
          epic: 5,
        },
      },
      {
        name: "Increase Maximum SD %",
        values: {
          normal: 1,
          uncommon: 2,
          rare: 3,
          legendary: 4,
          epic: 5,
        },
      },
      {
        name: "Damage Decrease %",
        values: {
          normal: 1,
          uncommon: 2,
          rare: 3,
          legendary: 4,
          epic: 5,
        },
      },
      {
        name: "Reflect Damage %",
        values: {
          normal: 1,
          uncommon: 2,
          rare: 3,
          legendary: 4,
          epic: 5,
        },
      },
      {
        name: "Defense success rate % (PVM Only)",
        values: {
          normal: 3,
          uncommon: 6,
          rare: 9,
          legendary: 12,
          epic: 15,
        },
      },
      {
        name: "Increase Zen Drop Rate %",
        values: {
          normal: 5,
          uncommon: 10,
          rare: 15,
          legendary: 20,
          epic: 25,
        },
      },
    ],
  },
  [ITEM_TYPES.EARRINGS]: {
    level: { min: 0, max: 15 },
    options: { min: 0, max: 7, hpRecoveryPerLevel: 15 },
    luck: {
      on: [LUCK_OPTIONS.SUCCESS_RATE_INCREASE, LUCK_OPTIONS.CRITICAL_DAMAGE_RATE],
      off: LUCK_OPTIONS.NONE,
    },
    skill: false,
    excellentOptions: [],
  },
  [ITEM_TYPES.WINGS]: {
    level: { min: 0, max: 15 },
    options: { min: 0, max: 7, hpRecoveryPerLevel: 1 },
    luck: {
      on: [LUCK_OPTIONS.SUCCESS_RATE_INCREASE, LUCK_OPTIONS.CRITICAL_DAMAGE_RATE],
      off: LUCK_OPTIONS.NONE,
    },
    skill: false,
    excellentOptions: [
      {
        name: "Increases attack speed 50",
        values: { single: 50 },
      },
      {
        name: "Increases double damage rate 3%",
        values: { single: 3 },
      },
      {
        name: "Enemy's Attack Return Rate 3%",
        values: { single: 3 },
      },
      {
        name: "Enemy's Defense Ignore Rate 3%",
        values: { single: 3 },
      },
    ],
  },
};
