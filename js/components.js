/* ------------------ Tooltip Functions ------------------ */
function showItemTooltip(event, item, imageUrl) {
  hideItemTooltip(); // Remove any existing tooltip

  const tooltip = h(
    "div",
    { class: "item-tooltip" },
    imageUrl ? h("img", { src: imageUrl, alt: item.name }) : null,
    h("div", { class: "tooltip-name" }, item.name),
    h(
      "div",
      { class: "tooltip-meta" },
      `ID: ${item.displayId}`,
      item.slot != null ? ` • ${getSlotName(item.slot)}` : ""
    )
  );

  document.body.appendChild(tooltip);

  // Position tooltip
  const rect = event.target.getBoundingClientRect();
  const tooltipRect = tooltip.getBoundingClientRect();

  let left = rect.right + 10;
  let top = rect.top;

  // Adjust if tooltip would go off screen
  if (left + tooltipRect.width > window.innerWidth) {
    left = rect.left - tooltipRect.width - 10;
  }
  if (top + tooltipRect.height > window.innerHeight) {
    top = window.innerHeight - tooltipRect.height - 10;
  }

  tooltip.style.left = left + "px";
  tooltip.style.top = top + "px";
}

function hideItemTooltip() {
  const existingTooltip = document.querySelector(".item-tooltip");
  if (existingTooltip) {
    existingTooltip.remove();
  }
}

/* ------------------ Set Functions ------------------ */
function renderSetSelector() {
  const wrap = $("#set-selector");
  const searchInput = $("#set-search");
  const searchQuery = searchInput ? searchInput.value.toLowerCase() : "";

  wrap.innerHTML = "";

  const filteredSets = Object.keys(ITEM_SETS).filter((setKey) => {
    const set = ITEM_SETS[setKey];
    return set.name.toLowerCase().includes(searchQuery);
  });

  if (filteredSets.length === 0) {
    wrap.appendChild(
      h(
        "div",
        {
          style:
            "color: var(--muted); text-align: center; padding: 20px; font-style: italic;",
        },
        "No sets found matching your search."
      )
    );
    return;
  }

  filteredSets.forEach((setKey) => {
    const set = ITEM_SETS[setKey];

    // Create icons container
    const iconsContainer = h("div", {
      style:
        "display: flex; gap: 4px; flex-wrap: wrap; justify-content: center;",
    });

    // Add icons for each item in the set (up to 5)
    set.items.slice(0, 5).forEach((setItem) => {
      const actualItem = App.dataset.items.find(
        (item) =>
          item.name.toLowerCase().includes(setItem.name.toLowerCase()) &&
          Number(item.slot) === setItem.slot
      );

      if (actualItem) {
        const icon = h("img", {
          src: getItemImageUrl(actualItem.displayId),
          alt: setItem.name,
          style: "width: 24px; height: 24px; border-radius: 4px;",
          onerror: "this.style.display='none'",
        });
        iconsContainer.appendChild(icon);
      }
    });

    const option = h(
      "div",
      {
        class: `set-option${
          App.selectedSet === setKey ? " selected" : ""
        }`,
        onclick: () => selectSet(setKey),
      },
      iconsContainer,
      h(
        "div",
        { style: "text-align: center; font-weight: 500;" },
        set.name
      )
    );
    wrap.appendChild(option);
  });
}

function selectSet(setKey) {
  App.selectedSet = setKey;
  renderSetSelector();
  openSetModal();
}

function openSetModal() {
  const modal = $("#set-modal");
  const modalTitle = $("#modal-set-title");
  const modalContent = $("#modal-set-content");

  if (!App.selectedSet) return;

  const set = ITEM_SETS[App.selectedSet];
  modalTitle.textContent = `Configure ${set.name}`;

  renderSetModalContent(modalContent);
  modal.classList.add("active");
}

function closeSetModal() {
  const modal = $("#set-modal");
  modal.classList.remove("active");
  App.selectedSet = null;
  renderSetSelector();
}

function renderSetModalContent(wrap) {
  if (!App.selectedSet) return;

  const set = ITEM_SETS[App.selectedSet];

  // Initialize set config if not exists
  if (!App.setConfig[App.selectedSet]) {
    App.setConfig[App.selectedSet] = {
      level: 0,
      options: 0,
      luck: false,
      skill: false,
    };
  }

  const config = App.setConfig[App.selectedSet];

  wrap.innerHTML = "";

  // Global set configuration
  const globalConfig = h(
    "div",
    { class: "col", style: "margin-bottom: 24px;" },
    h(
      "div",
      {
        style: "font-weight: 600; margin-bottom: 16px; font-size: 16px;",
      },
      "Set Configuration"
    ),
    h(
      "div",
      {
        class: "row",
        style: "align-items: center; gap: 12px; margin-bottom: 12px;",
      },
      h(
        "label",
        { class: "small muted", style: "min-width: 80px;" },
        "Level:"
      ),
      h("input", {
        type: "range",
        min: "0",
        max: "15",
        value: config.level,
        onchange: (e) => {
          config.level = Number(e.target.value);
          renderSetModalContent(wrap);
        },
        style: "flex: 1;",
      }),
      h("input", {
        type: "number",
        min: "0",
        max: "15",
        value: config.level,
        onchange: (e) => {
          config.level = Number(e.target.value);
          renderSetModalContent(wrap);
        },
        style: "width: 60px; text-align: center;",
      })
    ),
    h(
      "div",
      {
        class: "row",
        style: "align-items: center; gap: 12px; margin-bottom: 12px;",
      },
      h(
        "label",
        { class: "small muted", style: "min-width: 80px;" },
        "Options:"
      ),
      h("input", {
        type: "range",
        min: "0",
        max: "7",
        value: config.options,
        onchange: (e) => {
          config.options = Number(e.target.value);
          renderSetModalContent(wrap);
        },
        style: "flex: 1;",
      }),
      h("input", {
        type: "number",
        min: "0",
        max: "7",
        value: config.options,
        onchange: (e) => {
          config.options = Number(e.target.value);
          renderSetModalContent(wrap);
        },
        style: "width: 60px; text-align: center;",
      })
    ),
    h(
      "div",
      { class: "row", style: "align-items: center; gap: 12px;" },
      h(
        "label",
        { class: "checkbox" },
        h("input", {
          type: "checkbox",
          checked: config.luck,
          onchange: (e) => {
            config.luck = e.target.checked;
            renderSetModalContent(wrap);
          },
        }),
        h("span", { class: "small" }, "Luck")
      ),
      h(
        "label",
        { class: "checkbox" },
        h("input", {
          type: "checkbox",
          checked: config.skill,
          onchange: (e) => {
            config.skill = e.target.checked;
            renderSetModalContent(wrap);
          },
        }),
        h("span", { class: "small" }, "Skill")
      )
    )
  );

  wrap.appendChild(globalConfig);

  // Set items grid
  const itemsGrid = h("div", { class: "set-items-grid" });

  set.items.forEach((setItem) => {
    // Find the actual item in the dataset
    const actualItem = App.dataset.items.find(
      (item) =>
        item.name.toLowerCase().includes(setItem.name.toLowerCase()) &&
        Number(item.slot) === setItem.slot
    );

    const itemCard = h(
      "div",
      { class: "set-item-card" },
      h(
        "div",
        { class: "set-item-header" },
        actualItem
          ? h("img", {
              class: "item-image",
              src: getItemImageUrl(actualItem.displayId),
              alt: setItem.name,
              onerror: "this.style.display='none'",
            })
          : h("div", { class: "item-image" }),
        h("div", { class: "set-item-name" }, setItem.name),
        h("div", { class: "set-item-slot" }, getSlotName(setItem.slot))
      ),
      actualItem
        ? h("div", { class: "hint" }, `Found: ${actualItem.name}`)
        : h(
            "div",
            { class: "hint", style: "color: #f87171;" },
            "Item not found in dataset"
          )
    );

    itemsGrid.appendChild(itemCard);
  });

  wrap.appendChild(itemsGrid);

  // Add set to collection button
  const addButton = h(
    "button",
    {
      class: "primary",
      style:
        "width: 100%; padding: 14px 16px; font-size: 16px; font-weight: 600; margin-top: 20px;",
      onclick: () => {
        addSetToCollection();
        closeSetModal();
      },
    },
    `Add ${set.name} to Collection`
  );

  wrap.appendChild(addButton);
}

function addSetToCollection() {
  if (!App.selectedSet) return;

  const set = ITEM_SETS[App.selectedSet];
  const config = App.setConfig[App.selectedSet];

  set.items.forEach((setItem) => {
    // Find the actual item in the dataset
    const actualItem = App.dataset.items.find(
      (item) =>
        item.name.toLowerCase().includes(setItem.name.toLowerCase()) &&
        Number(item.slot) === setItem.slot
    );

    if (actualItem) {
      // Create collection entry for this set item
      const entry = {
        id: actualItem.id,
        index: actualItem.index,
        displayId: actualItem.displayId,
        name: actualItem.name,
        level: config.level,
        options: config.options,
        luck: config.skill, // Note: using skill for luck as per config
        skill: config.skill,
        exeOptions: [], // No excellent options for set items by default
        done: false,
        ts: Date.now(),
        set: App.selectedSet, // Mark as part of a set
      };

      App.collection.push(entry);
    }
  });

  persistCollection();
  renderCollection();
}

function getItemSet(item) {
  // Check if item belongs to any set
  for (const [setKey, set] of Object.entries(ITEM_SETS)) {
    const setItem = set.items.find(
      (si) =>
        item.name.toLowerCase().includes(si.name.toLowerCase()) &&
        Number(item.slot) === si.slot
    );
    if (setItem) {
      return setKey;
    }
  }
  return null;
}

function groupCollectionBySets() {
  const setGroups = {};
  const individualItems = [];

  App.collection.forEach((item) => {
    const setKey = item.set || getItemSet(item);
    if (setKey) {
      if (!setGroups[setKey]) {
        setGroups[setKey] = [];
      }
      setGroups[setKey].push(item);
    } else {
      individualItems.push(item);
    }
  });

  return { setGroups, individualItems };
}

/* ------------------ Collection Manager ------------------ */
function renderCollectionManager() {
  const container = $("#collection-manager");
  if (!container) return;
  
  container.innerHTML = "";
  
  const activeCollection = Collections.getActiveCollection();
  const allCollections = Collections.getAllCollections();
  
  // Collection selector dropdown
  const selector = h(
    "div",
    { class: "collection-selector" },
    h(
      "select",
      {
        id: "collection-dropdown",
        onchange: (e) => {
          Collections.switchCollection(e.target.value);
          renderCollection();
          renderCollectionManager();
        }
      },
      ...allCollections.map(collection => 
        h(
          "option",
          {
            value: collection.id,
            selected: collection.id === Collections.activeCollectionId
          },
          `${collection.name} (${collection.items.length} items)`
        )
      )
    ),
    h(
      "button",
      {
        class: "ghost small",
        onclick: openCreateCollectionModal,
        style: "margin-left: 8px; padding: 6px 10px;"
      },
      "New"
    )
  );
  
  // Active collection info
  const info = h(
    "div",
    { class: "collection-info" },
    h(
      "div",
      { class: "collection-name" },
      activeCollection.name
    ),
    activeCollection.description && h(
      "div",
      { class: "collection-description" },
      activeCollection.description
    ),
    h(
      "div",
      { class: "collection-stats" },
      `${activeCollection.items.length} items • Last updated: ${new Date(activeCollection.updatedAt).toLocaleDateString()}`
    )
  );
  
  // Action buttons
  const actions = h(
    "div",
    { class: "collection-actions" },
    h(
      "button",
      {
        class: "ghost small",
        onclick: () => openEditCollectionModal(activeCollection.id),
        style: "margin-right: 8px;"
      },
      "Edit"
    ),
    h(
      "button",
      {
        class: "ghost small",
        onclick: () => exportCurrentCollection(),
        style: "margin-right: 8px;"
      },
      "Export"
    ),
    h(
      "button",
      {
        class: "ghost small",
        onclick: openImportCollectionModal,
        style: "margin-right: 8px;"
      },
      "Import"
    ),
    h(
      "button",
      {
        class: "ghost small danger",
        onclick: () => deleteCurrentCollection(),
        disabled: allCollections.length <= 1
      },
      "Delete"
    )
  );
  
  container.appendChild(selector);
  container.appendChild(info);
  container.appendChild(actions);
}

function openCreateCollectionModal() {
  const modal = createModal("Create New Collection", "");
  const content = modal.querySelector(".modal-content");
  
  content.innerHTML = "";
  content.appendChild(
    h(
      "div",
      { class: "col", style: "gap: 16px;" },
      h(
        "div",
        { class: "col" },
        h("label", { class: "small muted" }, "Collection Name"),
        h("input", {
          type: "text",
          id: "new-collection-name",
          placeholder: "Enter collection name",
          value: ""
        })
      ),
      h(
        "div",
        { class: "col" },
        h("label", { class: "small muted" }, "Description (optional)"),
        h("textarea", {
          id: "new-collection-description",
          placeholder: "Enter description",
          rows: 3,
          style: "resize: vertical; padding: 8px 12px; border-radius: 8px; border: 1px solid var(--border); background: #0f1320; color: var(--text);"
        })
      ),
      h(
        "div",
        { class: "row", style: "justify-content: flex-end; gap: 8px;" },
        h(
          "button",
          {
            class: "ghost",
            onclick: () => closeModal()
          },
          "Cancel"
        ),
        h(
          "button",
          {
            class: "primary",
            onclick: createNewCollection
          },
          "Create Collection"
        )
      )
    )
  );
  
  showModal(modal);
}

function createNewCollection() {
  const name = $("#new-collection-name").value.trim();
  const description = $("#new-collection-description").value.trim();
  
  if (!name) {
    alert("Please enter a collection name");
    return;
  }
  
  const newId = Collections.createCollection(name, description);
  Collections.switchCollection(newId);
  
  closeModal();
  renderCollection();
  renderCollectionManager();
}

function openEditCollectionModal(collectionId) {
  const collection = Collections.collections[collectionId];
  if (!collection) return;
  
  const modal = createModal("Edit Collection", "");
  const content = modal.querySelector(".modal-content");
  
  content.innerHTML = "";
  content.appendChild(
    h(
      "div",
      { class: "col", style: "gap: 16px;" },
      h(
        "div",
        { class: "col" },
        h("label", { class: "small muted" }, "Collection Name"),
        h("input", {
          type: "text",
          id: "edit-collection-name",
          placeholder: "Enter collection name",
          value: collection.name
        })
      ),
      h(
        "div",
        { class: "col" },
        h("label", { class: "small muted" }, "Description"),
        h("textarea", {
          id: "edit-collection-description",
          placeholder: "Enter description",
          rows: 3,
          style: "resize: vertical; padding: 8px 12px; border-radius: 8px; border: 1px solid var(--border); background: #0f1320; color: var(--text);"
        }, collection.description)
      ),
      h(
        "div",
        { class: "row", style: "justify-content: flex-end; gap: 8px;" },
        h(
          "button",
          {
            class: "ghost",
            onclick: () => closeModal()
          },
          "Cancel"
        ),
        h(
          "button",
          {
            class: "primary",
            onclick: () => saveCollectionEdit(collectionId)
          },
          "Save Changes"
        )
      )
    )
  );
  
  showModal(modal);
}

function saveCollectionEdit(collectionId) {
  const name = $("#edit-collection-name").value.trim();
  const description = $("#edit-collection-description").value.trim();
  
  if (!name) {
    alert("Please enter a collection name");
    return;
  }
  
  const collection = Collections.collections[collectionId];
  if (collection) {
    collection.name = name;
    collection.description = description;
    collection.updatedAt = Date.now();
    Collections.saveCollections();
  }
  
  closeModal();
  renderCollectionManager();
}

function exportCurrentCollection() {
  const activeCollection = Collections.getActiveCollection();
  if (!activeCollection) return;
  
  const jsonData = Collections.exportCollection(activeCollection.id);
  if (!jsonData) return;
  
  const blob = new Blob([jsonData], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${activeCollection.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_collection.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

function openImportCollectionModal() {
  const modal = createModal("Import Collection", "");
  const content = modal.querySelector(".modal-content");
  
  content.innerHTML = "";
  content.appendChild(
    h(
      "div",
      { class: "col", style: "gap: 16px;" },
      h(
        "div",
        { class: "col" },
        h("label", { class: "small muted" }, "Collection File"),
        h("input", {
          type: "file",
          id: "import-collection-file",
          accept: ".json",
          onchange: (e) => {
            const file = e.target.files[0];
            if (file) {
              importCollectionFromFile(file);
            }
          }
        })
      ),
      h(
        "div",
        { class: "hint" },
        "Select a collection JSON file to import. The collection will be added to your collections list."
      ),
      h(
        "div",
        { class: "row", style: "justify-content: flex-end;" },
        h(
          "button",
          {
            class: "ghost",
            onclick: () => closeModal()
          },
          "Cancel"
        )
      )
    )
  );
  
  showModal(modal);
}

function importCollectionFromFile(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const importedId = Collections.importCollection(reader.result);
      if (importedId) {
        closeModal();
        renderCollectionManager();
        alert("Collection imported successfully!");
      } else {
        alert("Failed to import collection. Please check the file format.");
      }
    } catch (e) {
      alert("Import failed: " + e.message);
    }
  };
  reader.readAsText(file);
}

function deleteCurrentCollection() {
  const activeCollection = Collections.getActiveCollection();
  if (!activeCollection) return;
  
  const confirmed = confirm(`Are you sure you want to delete "${activeCollection.name}"? This action cannot be undone.`);
  if (!confirmed) return;
  
  if (Collections.deleteCollection(activeCollection.id)) {
    renderCollection();
    renderCollectionManager();
  }
}
