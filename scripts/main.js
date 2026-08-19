import { openCinematicRolls } from "./dialog.js";
import { registerRequestSocket } from "./request-service.js";

function localize(key, fallback) {
    const localized = game.i18n.localize(key);
    return localized === key ? fallback : localized;
}

Hooks.once("ready", () => {
    registerRequestSocket();
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