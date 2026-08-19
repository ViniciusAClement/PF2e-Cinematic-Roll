import { SAVING_THROWS, SKILLS } from "./constants.js";
import { getOnlinePlayerActorCheckboxes } from "./player-service.js";
import { requestRollsForSelectedActors } from "./request-service.js";

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
 * Renders buttons for skills or saving throws.
 *
 * @param {[string, string, string][]} options Statistic slug, localization key, and fallback label.
 * @param {string} className CSS class applied to each button.
 * @returns {string} HTML button markup.
 */
function renderCheckButtons(options, className) {
    return options.map(([slug, labelKey, fallback]) => `
        <button
            type="button"
            class="${className}"
            data-skill="${slug}"
            aria-pressed="false"
        >
            ${localize(labelKey, fallback)}
        </button>
    `).join("");
}

/**
 * Builds the main roll request dialog content.
 *
 * @returns {string} HTML content for the dialog.
 */
function getContent() {
    return `
        <div class="cinematic-rolls">
            <label for="cinematic-rolls-dc">
                ${localize("PF2E_CINEMATICROLLS.Fields.DC", "DC")}
            </label>

            <input
                id="cinematic-rolls-dc"
                name="dc"
                type="number"
                min="1"
                step="1"
                required
            >

            <label class="switchbox">
                <input
                    name="secret"
                    type="checkbox"
                >
                <span>${localize(
                    "PF2E_CINEMATICROLLS.Fields.SecretTest",
                    "Secret Test"
                )}</span>
            </label>

            <h2>${localize("PF2E_CINEMATICROLLS.Sections.Skills", "Skills")}</h2>
            <div class="skill-buttons">
                ${renderCheckButtons(SKILLS, "skill-button")}
            </div>

            <h2>${localize("PF2E_CINEMATICROLLS.Sections.Saves", "Saving Throws")}</h2>
            <div class="saving-buttons">
                ${renderCheckButtons(SAVING_THROWS, "saving-button")}
            </div>

            <h2>${localize("PF2E_CINEMATICROLLS.Sections.Actors", "Online Players")}</h2>
            <div class="actor-list">
                ${getOnlinePlayerActorCheckboxes()}
            </div>
        </div>
    `;
}

/**
 * Reads DC and selected Actor IDs from the dialog into the current state.
 *
 * @param {object} dialog Foundry DialogV2 instance.
 * @param {object} state Mutable dialog state.
 * @returns {object} Updated dialog state.
 */
function readForm(dialog, state) {
    const dcInput = dialog.element.querySelector('input[name="dc"]');
    const dc = Number(dcInput?.value);
    const selectedActors = Array.from(
        dialog.element.querySelectorAll('input[name="actor"]:checked'),
        checkbox => checkbox.value
    );
    const secret = dialog.element.querySelector(
        'input[name="secret"]'
    )?.checked ?? false;

    state.dc = dc;
    state.actorIds = selectedActors;
    state.secret = secret;

    return state;
}

/**
 * Validates the values required to send roll requests.
 *
 * @param {object} state Dialog state to validate.
 * @returns {boolean} Whether the state is valid.
 */
function validateState(state) {
    if (!Number.isInteger(state.dc) || state.dc <= 0) {
        ui.notifications.warn(
            localize(
                "PF2E_CINEMATICROLLS.Warnings.InvalidDC",
                "Enter a positive integer DC."
            )
        );
        return false;
    }

    if (!state.statisticSlug) {
        ui.notifications.warn(
            localize(
                "PF2E_CINEMATICROLLS.Warnings.MissingStatistic",
                "Choose a skill or saving throw."
            )
        );
        return false;
    }

    if (state.actorIds.length === 0) {
        ui.notifications.warn(
            localize(
                "PF2E_CINEMATICROLLS.Warnings.MissingActor",
                "Select at least one actor."
            )
        );
        return false;
    }

    return true;
}

/**
 * Opens the main dialog and coordinates selection and roll requests.
 */
export function openCinematicRolls() {
    const state = {
        statisticSlug: null,
        dc: null,
        actorIds: []
    };

    foundry.applications.api.DialogV2.wait({
        window: {
            title: localize("PF2E_CINEMATICROLLS.Title", "Cinematic Rolls")
        },
        content: getContent(),
        render: (event, dialog) => {
            const checkButtons = dialog.element.querySelectorAll(
                ".skill-button, .saving-button"
            );

            for (const checkButton of checkButtons) {
                checkButton.addEventListener("click", () => {
                    state.statisticSlug = checkButton.dataset.skill;

                    for (const button of checkButtons) {
                        const isSelected = button === checkButton;
                        button.setAttribute(
                            "aria-pressed",
                            String(isSelected)
                        );
                        button.classList.toggle("selected", isSelected);
                    }
                });
            }
        },
        buttons: [
            {
                action: "confirm",
                label: localize(
                    "PF2E_CINEMATICROLLS.Actions.Confirm",
                    "Confirm"
                ),
                default: true,
                callback: async (event, button, dialog) => {
                    readForm(dialog, state);

                    if (!validateState(state)) return;

                    const configuration = {
                        statistic: state.statisticSlug,
                        dc: state.dc,
                        actors: state.actorIds,
                        secret: state.secret
                    };

                    console.log(
                        localize(
                            "PF2E_CINEMATICROLLS.Console.Configuration",
                            "Cinematic Rolls | Configuration:"
                        ),
                        configuration
                    );

                    requestRollsForSelectedActors(
                        state.actorIds,
                        state.statisticSlug,
                        getSelectedStatisticLabel(dialog, state.statisticSlug),
                        state.dc,
                        state.secret
                    );

                    console.log(
                        localize(
                            "PF2E_CINEMATICROLLS.Console.Requests",
                            "Cinematic Rolls | Requests sent:"
                        ),
                        state.actorIds
                    );

                    return configuration;
                }
            },
            {
                action: "cancel",
                label: localize(
                    "PF2E_CINEMATICROLLS.Actions.Cancel",
                    "Cancel"
                )
            }
        ]
    });
}

/**
 * Reads the visible label for the selected statistic button.
 *
 * @param {object} dialog Foundry DialogV2 instance.
 * @param {string} statisticSlug Selected PF2e statistic slug.
 * @returns {string} Visible statistic label or its slug.
 */
function getSelectedStatisticLabel(dialog, statisticSlug) {
    const selectedButton = dialog.element.querySelector(
        `[data-skill="${statisticSlug}"]`
    );

    return selectedButton?.textContent.trim() ?? statisticSlug;
}
