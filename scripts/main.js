import { openCinematicRolls } from "./dialog.js";
import { registerRequestSocket } from "./request-service.js";

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

Hooks.once("ready", () => {
    registerRequestSocket();
});

Hooks.on("diceSoNiceRollStart", (messageId, context) => {
    if (game.user.isGM) return;

    const message = game.messages.get(messageId);
    const hasSecretTrait = message?.flags?.pf2e?.context?.traits?.includes("secret");
    const isBlindMessage = message?.blind || message?.rolls?.[0]?.options?.rollMode === "blindroll";

    if (hasSecretTrait || isBlindMessage) {
        context.blind = true;
    }
});

Hooks.on("preCreateChatMessage", (message, data, options, userId) => {
    const hasSecretTrait = message.flags?.pf2e?.context?.traits?.includes("secret");
    const isBlindRoll = message.blind || message.rolls?.[0]?.options?.rollMode === "blindroll" || data.rollMode === "blindroll";

    if (hasSecretTrait || isBlindRoll) {
        const gmUserIds = game.users.filter(user => user.isGM).map(user => user.id);
        message.updateSource({
            blind: true,
            whisper: gmUserIds
        });
    }
});

Hooks.on("getSceneControlButtons", controls => {
    const tokenControls = controls.tokens;

    if (!tokenControls) return;

    tokenControls.tools.cinematicrolls = {
        name: "cinematicrolls",
        title: localize("PF2E_CINEMATICROLLS.Title", "Cinematic Rolls"),
        icon: "fas fa-dice-d20",
        button: true,
        onChange: () => openCinematicRolls()
    };
});