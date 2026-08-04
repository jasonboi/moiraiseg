# Store Mask categories in project metadata

Mask category definitions belong to the reviewed dataset and must move with it. Active and archived category metadata is stored in `.dataseg/project.json` rather than the machine-local `config.json`. Archived Mask pixels are stored under `.dataseg/mask_archive/<archive-id>` in the same output project. Copying the complete output project therefore preserves display names, stable folder names, overlay colors, archives, and review progress across computers.

Project metadata uses `schema_version=3` and is written atomically with category lifecycle changes. Legacy `schema_version=2` projects migrate in place. A legacy `vessel_only=true` project activates only `vessel`. Other legacy projects activate `vessel` and `lesion`. Their existing folders and Mask files are not moved or rewritten.
