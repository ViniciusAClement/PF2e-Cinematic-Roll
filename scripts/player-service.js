function escapeHtml(value) {
    return foundry.utils.escapeHTML(String(value ?? ""));
}

function localize(key, fallback) {
    const localized = game.i18n.localize(key);
    return localized === key ? fallback : localized;
}

/**
 * Retorna os Actors associados a usuários ativos e online.
 * Actors repetidos são retornados apenas uma vez.
 *
 * @returns {Actor[]} Actors dos jogadores online.
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
 * Retorna o markup dos Actors dos jogadores online.
 *
 * @returns {string} HTML dos checkboxes dos jogadores online.
 */
export function getOnlinePlayerActorCheckboxes() {
    const actors = getOnlinePlayerActors();

    if (actors.length === 0) {
        return `<p class="notes">${localize(
            "PF2E_CINEMATICROLLS.Messages.NoOnlineActors",
            "Nenhum personagem de jogador online foi encontrado."
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
