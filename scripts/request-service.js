import { rollForSelectedActors } from "./roll-service.js";
import { CINEMATIC_ASSETS } from "./assets.js";

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
 * Escapes a value before it is inserted into generated HTML.
 *
 * @param {*} value Value to escape.
 * @returns {string} HTML-safe string.
 */
function escapeHtml(value) {
    return foundry.utils.escapeHTML(String(value ?? ""));
}

const handledRequestIds = new Set();

/**
 * Opens the player-facing dialog for a pending roll request.
 *
 * @param {object} request Roll request received through the module socket.
 * @returns {void}
 */
function openPlayerRollRequest(request) {
    const actor = game.actors.get(request.actorId);

    if (!actor) {
        console.warn(
            `Cinematic Rolls | Actor ${request.actorId} was not found on this client.`
        );
        return;
    }

    let completed = false;

    const outcomeLabels = {
        criticalSuccess: "Critical Success",
        success: "Success",
        failure: "Failure",
        criticalFailure: "Critical Failure"
    };

    const performRoll = async (dialog) => {
        if (completed) return;
        completed = true;

        const dieButton = dialog?.element.querySelector(
            ".cinematic-die-button"
        );
        const outcomeElement = dialog?.element.querySelector(
            ".cinematic-roll-outcome"
        );
        const doneButton = dialog?.element.querySelector(
            ".cinematic-roll-done"
        );

        dieButton?.classList.add("is-rolling");
        if (outcomeElement) {
            outcomeElement.textContent = "Rolling...";
            outcomeElement.classList.add("is-visible", "is-rolling");
        }

        const [result] = await rollForSelectedActors(
            [request.actorId],
            request.statisticSlug,
            request.dc,
            request.secret
        );

        game.socket.emit("module.pf2e-cinematicrolls", {
            type: "roll-result",
            requestId: request.requestId,
            requesterUserId: request.requesterUserId,
            result: result ?? null
        });

        if (!result) return null;

        await new Promise(resolve => setTimeout(resolve, 3000));

        if (outcomeElement) {
            outcomeElement.textContent = outcomeLabels[result.outcome] ?? "Result";
            outcomeElement.classList.remove("is-rolling");
            outcomeElement.dataset.outcome = result.outcome ?? "";
        }

        doneButton?.classList.add("is-visible");

        return result;
    };

    const isSave = ["fortitude", "reflex", "will"].includes(
        String(request.statisticSlug).toLowerCase()
    );
    const titleTemplate = isSave
        ? localize("PF2E_CINEMATICROLLS.PlayerRequest.Save", "{label} Save")
        : localize("PF2E_CINEMATICROLLS.PlayerRequest.Check", "{label} Check");
    const checkTitle = titleTemplate.replace(
        "{label}",
        request.statisticLabel || request.statisticSlug
    );

    foundry.applications.api.DialogV2.wait({
        window: {
            title: localize(
                "PF2E_CINEMATICROLLS.PlayerRequest.Title",
                "Roll request"
            )
        },
        render: (event, dialog) => {
            const windowElement = dialog.element.closest(".application");
            const targetElement = windowElement ?? dialog.element;

            targetElement.classList.add("cinematic-roll-player-window");

            const dieButton = dialog.element.querySelector(
                ".cinematic-die-button"
            );
            const doneButton = dialog.element.querySelector(
                ".cinematic-roll-done"
            );

            if (dieButton) {
                dieButton.addEventListener("click", event => {
                    event.preventDefault();
                    event.stopPropagation();
                    performRoll(dialog);
                });
            }

            doneButton?.addEventListener("click", event => {
                event.preventDefault();
                event.stopPropagation();
                targetElement.classList.add("is-closing");
                dialog.close({ animate: false });
            });
        },
        content: `
            <div class="cinematic-roll-wrapper">
                <h1 class="cinematic-roll-title">${escapeHtml(checkTitle)}</h1>
                <div class="cinematic-roll-card">
                    <div class="cinematic-card-top">
                        <span class="cinematic-dc-label">
                            ${localize(
                                "PF2E_CINEMATICROLLS.PlayerRequest.DifficultyClass",
                                "DIFFICULTY CLASS"
                            )}
                        </span>
                        <span class="cinematic-dc-value">${escapeHtml(request.dc)}</span>
                    </div>

                    <div class="cinematic-card-bottom">
                        <button
                            type="button"
                            class="cinematic-die-button"
                            aria-label="${localize("PF2E_CINEMATICROLLS.Actions.Roll", "Roll")}"
                            title="${localize("PF2E_CINEMATICROLLS.Actions.Roll", "Roll")}"
                        >
                            <img
                                class="cinematic-die-icon"
                                src="${CINEMATIC_ASSETS.icons.die}"
                                alt="d20"
                            >
                        </button>
                        <div class="cinematic-roll-outcome" aria-live="polite"></div>
                        <button
                            type="button"
                            class="cinematic-roll-done"
                            aria-label="Done"
                        >
                            Done
                        </button>
                    </div>
                </div>
            </div>
        `,
        buttons: [
            {
                action: "roll",
                label: "Roll",
                callback: (_event, _button, dialog) => performRoll(dialog)
            }
        ]
    });
}

/**
 * Registers the socket channel used to communicate between the GM and players.
 *
 * @returns {void}
 */
export function registerRequestSocket() {
    console.log(
        "Cinematic Rolls | Socket registered for user:",
        game.user.id
    );

    game.socket.on("module.pf2e-cinematicrolls", request => {
        if (request.type === "roll-request") {
            console.log(
                "Cinematic Rolls | Request received:",
                request
            );

            if (String(request.targetUserId) !== String(game.user.id)) {
                return;
            }

            if (handledRequestIds.has(request.requestId)) return;

            handledRequestIds.add(request.requestId);
            openPlayerRollRequest(request);
            return;
        }

        if (request.type === "roll-result") {
            if (String(request.requesterUserId) !== String(game.user.id)) {
                return;
            }
            console.log(
                "Cinematic Rolls | Result received from player:",
                request.result
            );
        }
    });
}

/**
 * Sends an individual roll request for each selected Actor.
 *
 * @param {string[]} actorIds Selected Actor IDs.
 * @param {string} statisticSlug PF2e skill or saving throw slug.
 * @param {string} statisticLabel Human-readable statistic label.
 * @param {number} dc Positive integer difficulty class.
 * @param {boolean} secret Whether the check result should be visible only to the GM.
 * @returns {void}
 */
export function requestRollsForSelectedActors(
    actorIds,
    statisticSlug,
    statisticLabel,
    dc,
    secret
) {
    const usersByActor = new Map();

    for (const user of game.users.filter(user => user.active)) {
        if (!user.character) continue;
        usersByActor.set(user.character.id, user);
    }

    for (const actorId of actorIds) {
        const user = usersByActor.get(actorId);

        if (!user) {
            console.warn(
                `Cinematic Rolls | No online player found for Actor ${actorId}.`
            );
            continue;
        }

        const request = {
            type: "roll-request",
            requestId: foundry.utils.randomID(),
            requesterUserId: game.user.id,
            targetUserId: user.id,
            actorId,
            statisticSlug,
            statisticLabel,
            dc,
            secret
        };

        console.log(
            "Cinematic Rolls | Request sent:",
            request
        );

        game.socket.emit("module.pf2e-cinematicrolls", request);
    }
}
