/* ------------------ Rendering ------------------ */
function renderItemList() {
  const wrap = $("#item-list");
  wrap.innerHTML = "";
  const q = $("#search").value.trim().toLowerCase();
  const armorOnly = $("#armor-only").checked;

  // Debug info removed

  // Filter items to only show the defined types
  const allowedItems = App.dataset.items.filter((it) => {
    if (!it) return false;

    const itemName = it.name.toLowerCase();
    const slot = Number(it.slot); // Convert to number

    // Check if it's a staff (weapon slot but staff name)
    const isStaff = slot === 0 && itemName.includes("staff");

    // If armor-only filter is enabled, only show armor items
    if (armorOnly) {
      // Armor items: body (3), pants (4), helm (2), boots (6), gloves (5) - shield (1) is not armor
      return slot === 2 || slot === 3 || slot === 4 || slot === 5 || slot === 6;
    }

    // Weapon (All except staffs)
    if (slot === 0 && !isStaff) return true;

    // Weapon (Staffs)
    if (isStaff) return true;

    // Armor & Shields & Rings
    if (
      slot === 1 ||
      slot === 2 ||
      slot === 3 ||
      slot === 4 ||
      slot === 5 ||
      slot === 6 ||
      slot === 9 ||
      slot === 10
    )
      return true;

    // Wings
    if (slot === 7) return true;

    // Earrings
    if (slot === 12 || slot === 13) return true;

    return false;
  });

  const items = allowedItems.filter(
    (it) => !q || it.name.toLowerCase().includes(q)
  );

  if (items.length === 0) {
    wrap.appendChild(h("div", { class: "muted" }, "No items found."));
    return;
  }
  items.slice(0, 800).forEach((it) => {
    const imageUrl = getItemImageUrl(it.displayId);
    const row = h(
      "div",
      {
        class: "item-row" + (App.selectedId === it.id ? " active" : ""),
        onclick: () => selectItem(it.id),
        onmouseenter: (e) => showItemTooltip(e, it, imageUrl),
        onmouseleave: hideItemTooltip,
      },
      imageUrl
        ? h("img", {
            class: "item-image",
            src: imageUrl,
            alt: it.name,
            onerror: "this.style.display='none'",
          })
        : h("div", { class: "item-image" }),
      h("div", { class: "wrap", style: "flex:1" }, it.name),
      it.slot != null
        ? h("span", { class: "badge muted" }, getSlotName(it.slot))
        : null
    );
    wrap.appendChild(row);
  });
}

function renderSelection() {
  const it = App.dataset.items.find((i) => i.id === App.selectedId);

  // Show/hide sections based on item selection
  const sections = [
    "#level-section",
    "#options-section",
    "#luck-section",
    "#skill-section",
    "#excellent-section",
    "#action-section",
  ];

  if (!it) {
    // No item selected - show hint and hide all sections
    sections.forEach((selector) => {
      $(selector).style.display = "none";
    });

    // Hide selection header and main content when no item is selected
    $("#selection-header").style.display = "none";
    $("#main-content").style.display = "none";

    // Show the select notice
    $("#select-notice").style.display = "flex";

    // Clear collection checker
    const checker = $("#collection-checker");
    if (checker) {
      checker.innerHTML = "";
    }
    return;
  }

  // Item selected - show selection header and main content
  $("#selection-header").style.display = "block";
  $("#select-notice").style.display = "none";
  $("#main-content").style.display = "flex";

  sections.forEach((selector) => {
    $(selector).style.display = "block";
  });

  // Update selection metadata with image only (no stats)
  const imageUrl = getItemImageUrl(it.displayId);

  $(
    "#sel-meta"
  ).innerHTML = `<div style="display: flex; align-items: center; gap: 12px; justify-content: center;">
                 ${
                   imageUrl
                     ? `<img class="item-image large" src="${imageUrl}" alt="${it.name}" onerror="this.style.display='none'">`
                     : '<div class="item-image large"></div>'
                 }
                 <div style="font-size: 18px; font-weight: 600; color: var(--text);">
                   ${it.name}
                 </div>
                 ${
                   it.slot != null
                     ? `<span class="badge">${getSlotName(it.slot)}</span>`
                     : ""
                 }
               </div>`;

  // Get item type name for configuration (but don't display the header)
  const itemTypeName = getItemTypeName(it);

  // Update form controls based on item type configuration
  const config = ITEM_CONFIGS[itemTypeName];

  if (config) {
    // Update level controls
    $("#level-slider").max = config.level.max;
    $("#level-input").max = config.level.max;
    $("#level-slider").value = App.level;
    $("#level-input").value = App.level;
    $("#level-display").textContent = App.level;

    // Update options controls
    $("#options-slider").max = config.options.max;
    $("#options-input").max = config.options.max;
    $("#options-slider").value = App.options;
    $("#options-input").value = App.options;

    // Calculate options value and label based on item type
    let optionsValue = 0;
    let optionsLabel = "Additional damage:";

    if (config.options.damagePerLevel) {
      // Weapons
      optionsValue = App.options * config.options.damagePerLevel;
      optionsLabel = "Additional damage:";
    } else if (config.options.defensePerLevel) {
      // Shields and Armor
      optionsValue = App.options * config.options.defensePerLevel;
      optionsLabel = "Additional defense:";
    } else if (config.options.hpRecoveryPerLevel) {
      // Wings and Earrings
      optionsValue = App.options * config.options.hpRecoveryPerLevel;
      if (itemTypeName === ITEM_TYPES.WINGS) {
        optionsLabel = "Automatic HP recovery:";
        $("#options-display").textContent = `+${optionsValue}%`;
      } else {
        optionsLabel = "Automatic HP recovery:";
        $("#options-display").textContent = `+${optionsValue}%`;
      }
      $("#options-label").textContent = optionsLabel;
      // Continue with the rest of the function
    }

    $("#options-label").textContent = optionsLabel;
    $("#options-display").textContent = `+${optionsValue}`;

    // Update luck controls
    $("#luck-toggle").checked = App.luck;
    $("#luck-off-text").style.display = App.luck ? "none" : "block";
    $("#luck-on-text").style.display = App.luck ? "block" : "none";
    $("#luck-off-text").textContent = config.luck.off;
    $("#luck-on-text").innerHTML = config.luck.on.join("<br>");

    // Update skill controls
    $("#skill-toggle").checked = App.skill;
    $("#skill-off-text").style.display = App.skill ? "none" : "block";
    $("#skill-on-text").style.display = App.skill ? "block" : "none";

    // Show/hide skill section based on config
    $("#skill-section").style.display = config.skill ? "block" : "none";
  }

  // Update skill name if available
  $("#skill-name").textContent = getSkillName(it);

  // Excellent options - Item type specific
  const exeWrap = $("#exe-opts");
  exeWrap.innerHTML = "";

  // Get item type and configuration (reuse existing config variable)
  const exeConfig = ITEM_CONFIGS[itemTypeName];

  if (!exeConfig || !exeConfig.excellentOptions) {
    exeWrap.appendChild(
      h(
        "div",
        { class: "muted" },
        `No excellent options available for this item type: ${itemTypeName}`
      )
    );
  } else {
    // Check how many options are currently selected
    const selectedCount = App.required.exe.size;
    const maxOptions = 4;

    exeConfig.excellentOptions.forEach((option, index) => {
      const id = `exe-${index}`;
      const isChecked = App.required.exe.has(option.name);
      const currentRarity = App.exeRarities.get(option.name) || "normal";

      // Disable checkbox if max options reached and this one isn't selected
      const isDisabled = selectedCount >= maxOptions && !isChecked;

      // For Wings, use simple checkboxes without rarity dropdowns
      if (option.values.single !== undefined) {
        const optionDiv = h(
          "div",
          {
            class: `weapon-exe-option${isChecked ? " selected" : ""}`,
            "data-rarity": "single",
          },
          h("input", {
            type: "checkbox",
            id,
            checked: isChecked,
            disabled: isDisabled,
            onchange: (e) => {
              if (e.target.checked) {
                App.required.exe.add(option.name);
              } else {
                App.required.exe.delete(option.name);
              }
              renderSelection();
            },
          }),
          h(
            "label",
            {
              class: "option-label",
              for: id,
              style: "cursor: pointer;",
            },
            option.name
          )
        );
        exeWrap.appendChild(optionDiv);
      } else {
        // Regular options with rarity dropdowns
        const rarityDropdown = h(
          "select",
          {
            class: "rarity-dropdown",
            disabled: isDisabled,
            onchange: (e) => updateExeRarity(option.name, e.target.value),
          },
          h(
            "option",
            { value: "normal" },
            `Normal (${option.values.normal}${
              option.name.includes("%") ? "%" : ""
            })`
          ),
          h(
            "option",
            { value: "uncommon" },
            `Uncommon (${option.values.uncommon}${
              option.name.includes("%") ? "%" : ""
            })`
          ),
          h(
            "option",
            { value: "rare" },
            `Rare (${option.values.rare}${
              option.name.includes("%") ? "%" : ""
            })`
          ),
          h(
            "option",
            { value: "legendary" },
            `Legendary (${option.values.legendary}${
              option.name.includes("%") ? "%" : ""
            })`
          ),
          h(
            "option",
            { value: "epic" },
            `Epic (${option.values.epic}${
              option.name.includes("%") ? "%" : ""
            })`
          )
        );

        // Set the current rarity
        rarityDropdown.value = currentRarity;

        const optionDiv = h(
          "div",
          {
            class: `weapon-exe-option${isChecked ? " selected" : ""}`,
            "data-rarity": currentRarity,
          },
          h("input", {
            type: "checkbox",
            id,
            checked: isChecked,
            disabled: isDisabled,
            onchange: (e) => {
              if (e.target.checked) {
                App.required.exe.add(option.name);
              } else {
                App.required.exe.delete(option.name);
              }
              renderSelection();
            },
          }),
          h(
            "label",
            {
              class: "option-label",
              for: id,
              style: "cursor: pointer;",
            },
            option.name
          ),
          rarityDropdown
        );

        exeWrap.appendChild(optionDiv);
      }
    });
  }

  // Update button text based on whether we're editing an existing item
  const editingIndex = App.collection.findIndex((item) => item.id === it.id);
  const addButton = $("#add-to-collection");
  if (editingIndex !== -1) {
    addButton.textContent = "Update Item";
  } else {
    addButton.textContent = "Add to Collection";
  }

  // Show collection compatibility checker
  renderCollectionChecker(it);

  // Render live preview
  renderItemPreview(it);
}

function renderItemPreview(item) {
  if (!item) return;

  const previewWrap = $("#item-preview");
  if (!previewWrap) return;

  const imageUrl = getItemImageUrl(item.displayId);
  const itemTypeName = getItemTypeName(item);
  const config = ITEM_CONFIGS[itemTypeName];

  // Build properties array (same logic as collection view)
  const properties = [];

  // Options
  if (App.options > 0 && config) {
    let optionsValue = 0;
    let optionsLabel = "Additional damage:";

    if (config.options.damagePerLevel) {
      optionsValue = App.options * config.options.damagePerLevel;
      optionsLabel = "Additional damage:";
    } else if (config.options.defensePerLevel) {
      optionsValue = App.options * config.options.defensePerLevel;
      optionsLabel = "Additional defense:";
    } else if (config.options.hpRecoveryPerLevel) {
      optionsValue = App.options * config.options.hpRecoveryPerLevel;
      optionsLabel = "Automatic HP recovery:";
    }

    properties.push(
      h(
        "div",
        {
          style: "color: #60a5fa; font-size: 12px; margin-bottom: 2px;",
        },
        `${optionsLabel} +${optionsValue}${
          optionsLabel.includes("%") ? "%" : ""
        }`
      )
    );
  }

  // Luck
  if (App.luck) {
    properties.push(
      h(
        "div",
        {
          style: "color: #60a5fa; font-size: 12px; margin-bottom: 2px;",
        },
        "Luck (Success rate increase +25%)"
      )
    );
    properties.push(
      h(
        "div",
        {
          style: "color: #60a5fa; font-size: 12px; margin-bottom: 2px;",
        },
        "Luck (Critical damage rate +5%)"
      )
    );
  }

  // Skill
  if (App.skill) {
    const skillName = getSkillName(item);
    properties.push(
      h(
        "div",
        {
          style: "color: #60a5fa; font-size: 12px; margin-bottom: 2px;",
        },
        `Skill: ${skillName}`
      )
    );
  }

  // Excellent options
  const exeOptionsElements = [];
  if (App.required.exe.size > 0 && config?.excellentOptions) {
    App.required.exe.forEach((optionText) => {
      const optionConfig = config.excellentOptions.find(
        (o) => o.name === optionText
      );
      if (optionConfig) {
        const rarity = App.exeRarities.get(optionText) || "normal";
        let color = "#8b93a6"; // gray for normal

        // Set color based on rarity
        if (rarity === "uncommon") color = "#4ade80"; // green
        else if (rarity === "rare") color = "#a78bfa"; // purple
        else if (rarity === "legendary") color = "#fbbf24"; // orange
        else if (rarity === "epic") color = "#f87171"; // red

        if (optionConfig.values.single !== undefined) {
          // Wings options with single values
          const value = optionConfig.values.single;
          exeOptionsElements.push(
            h(
              "div",
              {
                style: `color: ${color}; font-size: 12px; margin-bottom: 2px;`,
              },
              `${optionText} ${value}${optionText.includes("%") ? "%" : ""}`
            )
          );
        } else if (optionConfig.values[rarity]) {
          // Regular options with rarity
          const value = optionConfig.values[rarity];
          exeOptionsElements.push(
            h(
              "div",
              {
                style: `color: ${color}; font-size: 12px; margin-bottom: 2px;`,
              },
              `[${rarity.toUpperCase()}] ${optionText} (${value}${
                optionText.includes("%") ? "%" : ""
              })`
            )
          );
        }
      }
    });
  }

  // Build the preview HTML
  previewWrap.innerHTML = "";
  previewWrap.appendChild(
    h(
      "div",
      {
        class: "col",
        style:
          "gap: 12px; align-items: center; text-align: center; justify-content: center; height: 100%;",
      },
      // Item header with image above name, both centered
      h(
        "div",
        {
          style:
            "display: flex; flex-direction: column; align-items: center; gap: 8px;",
        },
        imageUrl
          ? h("img", {
              class: "item-image large",
              src: imageUrl,
              alt: item.name,
              onerror: "this.style.display='none'",
              style: "width: 80px; height: 80px; object-fit: contain;",
            })
          : h("div", {
              class: "item-image large",
              style: "width: 80px; height: 80px;",
            }),
        h(
          "div",
          {
            style:
              "font-size: 18px; font-weight: 700; color: #4ade80; text-align: center;",
          },
          `${item.name} +${App.level || 0}`
        )
      ),
      // Properties section
      properties.length > 0
        ? h(
            "div",
            { style: "margin-bottom: 8px; text-align: center;" },
            ...properties
          )
        : null,
      // Excellent options section
      exeOptionsElements.length > 0
        ? h(
            "div",
            { style: "margin-bottom: 5px; text-align: center;" },
            // h(
            //   "div",
            //   {
            //     style:
            //       "color: var(--text); font-size: 13px; margin-bottom: 6px; font-weight: 600;",
            //   },
            //   "Excellent Options"
            // ),
            ...exeOptionsElements
          )
        : null
    )
  );
}

function renderCollection() {
  const wrap = $("#collection-list");
  if (!wrap) {
    console.error("Collection list element not found!");
    return;
  }

  // Get search filter
  const searchQuery = $("#collection-search").value.trim().toLowerCase();

  // Filter collection based on search and hide completed filter
  let filteredCollection = searchQuery
    ? App.collection.filter((item) =>
        item.name.toLowerCase().includes(searchQuery)
      )
    : App.collection;

  // Apply hide completed filter
  if (App.hideCompleted) {
    filteredCollection = filteredCollection.filter((item) => !item.done);
  }

  // Clear the collection list
  wrap.innerHTML = "";
  $("#coll-count").textContent = App.collection.length;

  // Calculate completion percentage (use filtered collection if searching)
  const totalItems = searchQuery
    ? filteredCollection.length
    : App.collection.length;
  const completedItems = searchQuery
    ? filteredCollection.filter((item) => item.done).length
    : App.collection.filter((item) => item.done).length;
  const completionPercentage =
    totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
  $("#coll-progress").textContent = `${completionPercentage}%`;
  $("#progress-fill").style.width = `${completionPercentage}%`;

  if (filteredCollection.length === 0) {
    wrap.appendChild(
      h(
        "div",
        { class: "muted" },
        searchQuery
          ? `No items found matching "${searchQuery}". Try a different search term.`
          : App.hideCompleted
          ? "All items are completed or no items in collection."
          : "Your collection is empty. Add items from the middle panel."
      )
    );
    return;
  }

  // Group items by sets
  const { setGroups, individualItems } = groupCollectionBySets();

  // Filter set groups based on search and hide completed
  const filteredSetGroups = {};
  Object.keys(setGroups).forEach((setKey) => {
    const setItems = setGroups[setKey];
    let filteredSetItems = searchQuery
      ? setItems.filter((item) => item.name.toLowerCase().includes(searchQuery))
      : setItems;

    // Apply hide completed filter to set items
    if (App.hideCompleted) {
      filteredSetItems = filteredSetItems.filter((item) => !item.done);
    }

    if (filteredSetItems.length > 0) {
      filteredSetGroups[setKey] = filteredSetItems;
    }
  });

  // Filter individual items based on search and hide completed
  let filteredIndividualItems = searchQuery
    ? individualItems.filter((item) =>
        item.name.toLowerCase().includes(searchQuery)
      )
    : individualItems;

  // Apply hide completed filter to individual items
  if (App.hideCompleted) {
    filteredIndividualItems = filteredIndividualItems.filter(
      (item) => !item.done
    );
  }

  // Render set groups first
  Object.keys(filteredSetGroups).forEach((setKey) => {
    const setItems = filteredSetGroups[setKey];
    const set = ITEM_SETS[setKey];

    if (!set) return;

    // Calculate set completion
    const totalSetItems = set.items.length;
    const completedSetItems = setItems.filter((item) => item.done).length;
    const setCompletionPercentage = Math.round(
      (completedSetItems / totalSetItems) * 100
    );

    // Create set group container
    const setGroup = h(
      "div",
      { class: "collection-set-group" },
      h(
        "div",
        { class: "collection-set-header" },
        h("div", { class: "collection-set-title" }, set.name),
        h(
          "div",
          { class: "collection-set-progress" },
          `${completedSetItems}/${totalSetItems} (${setCompletionPercentage}%)`
        )
      ),
      h("div", { class: "collection-set-items" })
    );

    const setItemsContainer = setGroup.querySelector(".collection-set-items");

    // Render each set item
    setItems.forEach((c) => {
      const originalIdx = App.collection.findIndex((item) => item.id === c.id);
      const imageUrl = getItemImageUrl(c.displayId || c.index);
      const originalItem = App.dataset.items.find((i) => i.id === c.id);

      // Build properties string for set items (same as individual items)
      const properties = [];

      // Options - show actual option string
      if (c.options !== undefined && c.options > 0) {
        const itemTypeName = getItemTypeName(originalItem);
        const config = ITEM_CONFIGS[itemTypeName];
        if (config) {
          let optionsValue = 0;
          let optionsLabel = "Additional damage:";

          if (config.options.damagePerLevel) {
            optionsValue = c.options * config.options.damagePerLevel;
            optionsLabel = "Additional damage:";
          } else if (config.options.defensePerLevel) {
            optionsValue = c.options * config.options.defensePerLevel;
            optionsLabel = "Additional defense:";
          } else if (config.options.hpRecoveryPerLevel) {
            optionsValue = c.options * config.options.hpRecoveryPerLevel;
            optionsLabel = "Automatic HP recovery:";
          }

          properties.push(
            h(
              "div",
              {
                style: "color: #60a5fa; font-size: 12px; margin-bottom: 2px;",
              },
              `${optionsLabel} +${optionsValue}${
                optionsLabel.includes("%") ? "%" : ""
              }`
            )
          );
        } else {
          properties.push(
            h(
              "div",
              {
                style: "color: #60a5fa; font-size: 12px; margin-bottom: 2px;",
              },
              `Options: ${c.options}`
            )
          );
        }
      } else if (c.optionLevel !== undefined && c.optionLevel > 0) {
        // Legacy support
        properties.push(
          h(
            "div",
            {
              style: "color: #60a5fa; font-size: 12px; margin-bottom: 2px;",
            },
            `Options: ${c.optionLevel}`
          )
        );
      }

      // Luck - blue color with proper text
      if (c.luck) {
        properties.push(
          h(
            "div",
            {
              style: "color: #60a5fa; font-size: 12px; margin-bottom: 2px;",
            },
            "Luck (Success rate increase +25%)"
          )
        );
        properties.push(
          h(
            "div",
            {
              style: "color: #60a5fa; font-size: 12px; margin-bottom: 2px;",
            },
            "Luck (Critical damage rate +5%)"
          )
        );
      }

      // Skill - blue color
      if (c.skill) {
        const skillName = getSkillName(originalItem);
        properties.push(
          h(
            "div",
            {
              style: "color: #60a5fa; font-size: 12px; margin-bottom: 2px;",
            },
            `Skill: ${skillName}`
          )
        );
      }

      // Excellent options with proper colors and values
      const exeOptionsElements = [];
      if (
        c.exeOptions &&
        Array.isArray(c.exeOptions) &&
        c.exeOptions.length > 0
      ) {
        c.exeOptions.forEach((opt) => {
          const rarity = opt.rarity || "normal";
          // Get item type from original item data
          const itemTypeName = getItemTypeName(originalItem);
          const config = ITEM_CONFIGS[itemTypeName];
          let value = "";
          let color = "#8b93a6"; // gray for normal

          // Set color based on rarity
          if (rarity === "uncommon") color = "#4ade80"; // green
          else if (rarity === "rare") color = "#a78bfa"; // purple
          else if (rarity === "legendary") color = "#fbbf24"; // orange
          else if (rarity === "epic") color = "#f87171"; // red

          if (config && config.excellentOptions) {
            const optionConfig = config.excellentOptions.find(
              (o) => o.name === opt.text
            );
            if (optionConfig) {
              if (optionConfig.values.single !== undefined) {
                // Wings options with single values
                value = optionConfig.values.single;
                exeOptionsElements.push(
                  h(
                    "div",
                    {
                      style: `color: ${color}; font-size: 12px; margin-bottom: 2px;`,
                    },
                    `${opt.text} ${value}${opt.text.includes("%") ? "%" : ""}`
                  )
                );
              } else if (optionConfig.values[rarity]) {
                // Regular options with rarity
                value = optionConfig.values[rarity];
                exeOptionsElements.push(
                  h(
                    "div",
                    {
                      style: `color: ${color}; font-size: 12px; margin-bottom: 2px;`,
                    },
                    `[${rarity.toUpperCase()}] ${opt.text} (${value}${
                      opt.text.includes("%") ? "%" : ""
                    })`
                  )
                );
              }
            }
          }
        });
      } else if (
        c.exeLines &&
        Array.isArray(c.exeLines) &&
        c.exeLines.length > 0
      ) {
        // Legacy support
        c.exeLines.forEach((line) => {
          exeOptionsElements.push(
            h(
              "div",
              {
                style:
                  "color: #8b93a6; font-size: 13px; margin-bottom: 4px; font-weight: 500;",
              },
              line
            )
          );
        });
      }

      const setItem = h(
        "div",
        {
          class: `collection-set-item${c.done ? " completed" : " missing"}`,
          onclick: () => toggleDone(originalIdx),
        },
        h("div", {
          class: "collection-checkbox",
        }),
        h("img", {
          class: "item-image",
          src: imageUrl,
          alt: c.name,
          onerror: "this.style.display='none'",
        }),
        h(
          "div",
          { class: "col", style: "flex: 1; min-width: 0;" },
          h("div", { class: "set-item-name" }, `${c.name} +${c.level || 0}`),
          // Properties section
          properties.length > 0
            ? h("div", {  }, ...properties)
            : null,
          // Excellent options section
          exeOptionsElements.length > 0
            ? h(
                "div",
                { style: "margin-bottom: 5px;" },
                // h(
                //   "div",
                //   {
                //     style:
                //       "color: var(--text); font-size: 13px; margin-bottom: 6px; font-weight: 600;",
                //   },
                //   "Excellent Options"
                // ),
                ...exeOptionsElements
              )
            : null,
          // Show "Nothing Required" if no properties and no excellent options
          properties.length === 0 && exeOptionsElements.length === 0
            ? h(
                "div",
                {
                  style:
                    "color: #8b93a6; font-size: 12px; font-style: italic; margin-top: 4px;",
                },
                "Nothing Required"
              )
            : null
        ),
        h(
          "div",
          { class: "row", style: "gap: 4px;" },
          h(
            "button",
            {
              class: "ghost small",
              onclick: (e) => {
                e.stopPropagation();
                editIntoConfigurator(originalIdx);
              },
              style: "padding: 4px 8px; font-size: 10px;",
            },
            "Edit"
          ),
          h(
            "button",
            {
              class: "ghost small danger",
              onclick: (e) => {
                e.stopPropagation();
                removeFromCollection(originalIdx);
              },
              style: "padding: 4px 8px; font-size: 10px;",
            },
            "×"
          )
        )
      );

      setItemsContainer.appendChild(setItem);
    });

    wrap.appendChild(setGroup);
  });

  // Render individual items
  filteredIndividualItems.forEach((c) => {
    const originalIdx = App.collection.findIndex((item) => item.id === c.id);
    const imageUrl = getItemImageUrl(c.displayId || c.index);
    const originalItem = App.dataset.items.find((i) => i.id === c.id);

    // Build properties string
    const properties = [];

    // Options - show actual option string
    if (c.options !== undefined && c.options > 0) {
      const itemTypeName = getItemTypeName(originalItem);
      const config = ITEM_CONFIGS[itemTypeName];
      if (config) {
        let optionsValue = 0;
        let optionsLabel = "Additional damage:";

        if (config.options.damagePerLevel) {
          optionsValue = c.options * config.options.damagePerLevel;
          optionsLabel = "Additional damage:";
        } else if (config.options.defensePerLevel) {
          optionsValue = c.options * config.options.defensePerLevel;
          optionsLabel = "Additional defense:";
        } else if (config.options.hpRecoveryPerLevel) {
          optionsValue = c.options * config.options.hpRecoveryPerLevel;
          optionsLabel = "Automatic HP recovery:";
        }

        properties.push(
          h(
            "div",
            {
              style: "color: #60a5fa; font-size: 12px; margin-bottom: 2px;",
            },
            `${optionsLabel} +${optionsValue}${
              optionsLabel.includes("%") ? "%" : ""
            }`
          )
        );
      } else {
        properties.push(
          h(
            "div",
            {
              style: "color: #60a5fa; font-size: 12px; margin-bottom: 2px;",
            },
            `Options: ${c.options}`
          )
        );
      }
    } else if (c.optionLevel !== undefined && c.optionLevel > 0) {
      // Legacy support
      properties.push(
        h(
          "div",
          {
            style: "color: #60a5fa; font-size: 12px; margin-bottom: 2px;",
          },
          `Options: ${c.optionLevel}`
        )
      );
    }

    // Luck - blue color with proper text
    if (c.luck) {
      properties.push(
        h(
          "div",
          {
            style: "color: #60a5fa; font-size: 12px; margin-bottom: 2px;",
          },
          "Luck (Success rate increase +25%)"
        )
      );
      properties.push(
        h(
          "div",
          {
            style: "color: #60a5fa; font-size: 12px; margin-bottom: 2px;",
          },
          "Luck (Critical damage rate +5%)"
        )
      );
    }

    // Skill - blue color
    if (c.skill) {
      const skillName = getSkillName(originalItem);
      properties.push(
        h(
          "div",
          {
            style: "color: #60a5fa; font-size: 12px; margin-bottom: 2px;",
          },
          `Skill: ${skillName}`
        )
      );
    }

    // Excellent options with proper colors and values
    const exeOptionsElements = [];
    if (
      c.exeOptions &&
      Array.isArray(c.exeOptions) &&
      c.exeOptions.length > 0
    ) {
      c.exeOptions.forEach((opt) => {
        const rarity = opt.rarity || "normal";
        // Get item type from original item data
        const itemTypeName = getItemTypeName(originalItem);
        const config = ITEM_CONFIGS[itemTypeName];
        let value = "";
        let color = "#8b93a6"; // gray for normal

        // Set color based on rarity
        if (rarity === "uncommon") color = "#4ade80"; // green
        else if (rarity === "rare") color = "#a78bfa"; // purple
        else if (rarity === "legendary") color = "#fbbf24"; // orange
        else if (rarity === "epic") color = "#f87171"; // red

        if (config && config.excellentOptions) {
          const optionConfig = config.excellentOptions.find(
            (o) => o.name === opt.text
          );
          if (optionConfig) {
            if (optionConfig.values.single !== undefined) {
              // Wings options with single values
              value = optionConfig.values.single;
              exeOptionsElements.push(
                h(
                  "div",
                  {
                    style: `color: ${color}; font-size: 12px; margin-bottom: 2px;`,
                  },
                  `${opt.text} ${value}${opt.text.includes("%") ? "%" : ""}`
                )
              );
            } else if (optionConfig.values[rarity]) {
              // Regular options with rarity
              value = optionConfig.values[rarity];
              exeOptionsElements.push(
                h(
                  "div",
                  {
                    style: `color: ${color}; font-size: 12px; margin-bottom: 2px;`,
                  },
                  `[${rarity.toUpperCase()}] ${opt.text} (${value}${
                    opt.text.includes("%") ? "%" : ""
                  })`
                )
              );
            }
          }
        }
      });
    } else if (
      c.exeLines &&
      Array.isArray(c.exeLines) &&
      c.exeLines.length > 0
    ) {
      // Legacy support
      c.exeLines.forEach((line) => {
        exeOptionsElements.push(
          h(
            "div",
            {
              style:
                "color: #8b93a6; font-size: 13px; margin-bottom: 4px; font-weight: 500;",
            },
            line
          )
        );
      });
    }

    const row = h(
      "div",
      {
        class: "collection-row" + (c.done ? " done" : ""),
      },
      h("div", {
        class: "collection-checkbox",
        onclick: () => toggleDone(originalIdx),
      }),
      h(
        "div",
        { class: "col", style: "flex:1; min-width: 0;" },
        // Item header with image and name
        h(
          "div",
          {
            style:
              "display: flex; align-items: center; gap: 12px; margin-bottom: 16px;",
          },
          imageUrl
            ? h("img", {
                class: "item-image large",
                src: imageUrl,
                alt: c.name,
                onerror: "this.style.display='none'",
              })
            : h("div", { class: "item-image large" }),
          h(
            "div",
            {
              style: "font-size: 18px; font-weight: 700; color: #4ade80;",
            },
            `${c.name} +${c.level || 0}`
          )
        ),
        // Properties section
        properties.length > 0
          ? h(
              "div",
              { style: "margin-bottom: 16px;" },
              ...properties
                .map((prop) =>
                  typeof prop === "string"
                    ? h(
                        "div",
                        {
                          style:
                            "color: #60a5fa; font-size: 13px; margin-bottom: 4px; font-weight: 500;",
                        },
                        prop
                      )
                    : prop
                )
                .filter(Boolean)
            )
          : null,
        // Excellent options section
        exeOptionsElements.length > 0
          ? h(
              "div",
              { style: "margin-bottom: 5px;" },
              // h(
              //   "div",
              //   {
              //     style:
              //       "color: var(--text); font-size: 13px; margin-bottom: 6px; font-weight: 600;",
              //   },
              //   "Excellent Options"
              // ),
              ...exeOptionsElements.filter(Boolean)
            )
          : null,
        // Show "Nothing Required" if no properties and no excellent options
        properties.length === 0 && exeOptionsElements.length === 0
          ? h(
              "div",
              {
                style:
                  "color: #8b93a6; font-size: 12px; font-style: italic; margin-top: 8px;",
              },
              "Nothing Required"
            )
          : null
      ),
      h(
        "div",
        { class: "col", style: "align-items: flex-end; gap: 6px;" },
        h(
          "button",
          {
            class: "ghost small",
            onclick: () => editIntoConfigurator(originalIdx),
            style: "padding: 6px 10px; font-size: 11px; border-radius: 6px;",
          },
          "Edit"
        ),
        h(
          "button",
          {
            class: "ghost small danger",
            onclick: () => removeFromCollection(originalIdx),
            style: "padding: 6px 10px; font-size: 11px; border-radius: 6px;",
          },
          "Remove"
        )
      )
    );

    wrap.appendChild(row);
  });
}

function renderCollectionChecker(item) {
  const container = $("#collection-checker");
  if (!container) return;

  const results = Collections.checkItemInCollections(item);

  if (results.length === 0) {
    container.innerHTML = "";
    return;
  }

  container.innerHTML = "";

  const header = h(
    "div",
    {
      style:
        "color: var(--text); font-size: 13px; margin-bottom: 8px; font-weight: 600; border-bottom: 1px solid var(--border); padding-bottom: 4px;",
    },
    "Other Collections"
  );
  container.appendChild(header);

  results.forEach((result) => {
    const resultDiv = h(
      "div",
      {
        style: `display: flex; align-items: center; gap: 8px; padding: 6px 8px; border-radius: 6px; margin-bottom: 4px; background: ${
          result.wouldFit
            ? "rgba(74, 222, 128, 0.1)"
            : "rgba(248, 113, 113, 0.1)"
        }; border: 1px solid ${
          result.wouldFit
            ? "rgba(74, 222, 128, 0.3)"
            : "rgba(248, 113, 113, 0.3)"
        };`,
      },
      h("div", {
        style: `width: 8px; height: 8px; border-radius: 50%; background: ${
          result.wouldFit ? "#4ade80" : "#f87171"
        }; flex-shrink: 0;`,
      }),
      h(
        "div",
        { style: "flex: 1; font-size: 12px;" },
        h(
          "div",
          { style: "font-weight: 500; color: var(--text);" },
          result.collectionName
        ),
        h(
          "div",
          { style: "font-size: 11px; color: var(--muted);" },
          result.reason
        )
      ),
      result.wouldFit &&
        h(
          "button",
          {
            class: "ghost small",
            style: "padding: 2px 6px; font-size: 10px;",
            onclick: () => addItemToCollection(item, result.collectionId),
          },
          "Add"
        )
    );

    container.appendChild(resultDiv);
  });
}

function addItemToCollection(item, collectionId) {
  // Save current collection
  Collections.saveActiveCollection();

  // Switch to target collection
  const wasActiveCollection = Collections.activeCollectionId;
  Collections.switchCollection(collectionId);

  // Add item to the target collection
  const entry = {
    id: item.id,
    index: item.index,
    displayId: item.displayId,
    name: item.name,
    level: App.level,
    options: App.options,
    luck: App.luck,
    skill: App.skill,
    exeOptions: Array.from(App.required.exe).map((optionText) => ({
      text: optionText,
      rarity: App.exeRarities.get(optionText) || "normal",
    })),
    done: false,
    ts: Date.now(),
  };

  App.collection.push(entry);
  Collections.saveActiveCollection();

  // Switch back to original collection
  Collections.switchCollection(wasActiveCollection);

  // Update UI
  renderCollection();
  renderCollectionManager();
  renderCollectionChecker(item);

  alert(
    `Added ${item.name} to "${Collections.collections[collectionId].name}" collection!`
  );
}
