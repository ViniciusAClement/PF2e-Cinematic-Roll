/**
 * Escapes a value before it is inserted into generated HTML.
 *
 * @param {*} value Value to escape.
 * @returns {string} HTML-safe string.
 */
function escapeHtml(value) {
    return foundry.utils.escapeHTML(String(value ?? ""));
}

/**
 * Resolves a localization key and falls back to the supplied English text.
 *
 * @param {string} key Localization key.
 * @param {string} fallback Text returned when the key is unavailable.
 * @returns {string} Localized or fallback text.
 */
function localize(key, fallback) {
    const localized = game.i18n.localize(key);
    return localized === key ? fallback : localized;
}

/**
 * Returns Actors assigned to active online users.
 * Duplicate Actors are returned only once.
 *
 * @returns {Actor[]} Actors assigned to online players.
 */
export function getOnlinePlayerActors() {
    const actors = new Map();

    for (const user of game.users.filter(user => user.active)) {
        if (!user.character) continue;
        actors.set(user.character.id, user.character);
    }

    return Array.from(actors.values());
}

/**
 * Returns checkbox markup for Actors assigned to online players.
 *
 * @returns {string} HTML containing online player Actor checkboxes.
 */
export function getOnlinePlayerActorCheckboxes() {
    const actors = getOnlinePlayerActors();

    if (actors.length === 0) {
        return `<p class="notes">${localize(
            "PF2E_CINEMATICROLLS.Messages.NoOnlineActors",
            "No online player characters were found."
        )}</p>`;
    }

    return actors.map(actor => `
        <label class="actor-option">
            <input
                type="checkbox"
                name="actor"
                value="${escapeHtml(actor.id)}"
            >
            <span>${escapeHtml(actor.name)}</span>
        </label>
    `).join("");
}
