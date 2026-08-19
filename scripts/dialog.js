import { SAVING_THROWS, SKILLS } from "./constants.js";
import { getOnlinePlayerActorCheckboxes } from "./player-service.js";
import { requestRollsForSelectedActors } from "./request-service.js";

function localize(key, fallback) {
    const localized = game.i18n.localize(key);
    return localized === key ? fallback : localized;
}

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

            <h2>${localize("PF2E_CINEMATICROLLS.Sections.Skills", "Escolha uma Perícia")}</h2>
            <div class="skill-buttons">
                ${renderCheckButtons(SKILLS, "skill-button")}
            </div>

            <h2>${localize("PF2E_CINEMATICROLLS.Sections.Saves", "Salvamentos")}</h2>
            <div class="saving-buttons">
                ${renderCheckButtons(SAVING_THROWS, "saving-button")}
            </div>

            <h2>${localize("PF2E_CINEMATICROLLS.Sections.Actors", "Jogadores Online")}</h2>
            <div class="actor-list">
                ${getOnlinePlayerActorCheckboxes()}
            </div>
        </div>
    `;
}

function readForm(dialog, state) {
    const dcInput = dialog.element.querySelector('input[name="dc"]');
    const dc = Number(dcInput?.value);
    const selectedActors = Array.from(
        dialog.element.querySelectorAll('input[name="actor"]:checked'),
        checkbox => checkbox.value
    );

    state.dc = dc;
    state.actorIds = selectedActors;

    return state;
}

function validateState(state) {
    if (!Number.isInteger(state.dc) || state.dc <= 0) {
        ui.notifications.warn(
            localize(
                "PF2E_CINEMATICROLLS.Warnings.InvalidDC",
                "Informe uma DC inteira maior que zero."
            )
        );
        return false;
    }

    if (!state.statisticSlug) {
        ui.notifications.warn(
            localize(
                "PF2E_CINEMATICROLLS.Warnings.MissingStatistic",
                "Escolha uma perícia ou salvamento!"
            )
        );
        return false;
    }

    if (state.actorIds.length === 0) {
        ui.notifications.warn(
            localize(
                "PF2E_CINEMATICROLLS.Warnings.MissingActor",
                "Selecione ao menos um Ator."
            )
        );
        return false;
    }

    return true;
}

/**
 * Abre o diálogo principal e coordena a seleção e as rolagens.
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
                action: "confirmar",
                label: localize(
                    "PF2E_CINEMATICROLLS.Actions.Confirm",
                    "Confirmar"
                ),
                default: true,
                callback: async (event, button, dialog) => {
                    readForm(dialog, state);

                    if (!validateState(state)) return;

                    const configuration = {
                        statistic: state.statisticSlug,
                        dc: state.dc,
                        actors: state.actorIds
                    };

                    console.log(
                        localize(
                            "PF2E_CINEMATICROLLS.Console.Configuration",
                            "Cinematic Rolls | Configuração:"
                        ),
                        configuration
                    );

                    requestRollsForSelectedActors(
                        state.actorIds,
                        state.statisticSlug,
                        selecionadoText(dialog, state.statisticSlug),
                        state.dc
                    );

                    console.log(
                        localize(
                            "PF2E_CINEMATICROLLS.Console.Requests",
                            "Cinematic Rolls | Pedidos enviados:"
                        ),
                        state.actorIds
                    );

                    return configuration;
                }
            },
            {
                action: "cancelar",
                label: localize(
                    "PF2E_CINEMATICROLLS.Actions.Cancel",
                    "Cancelar"
                )
            }
        ]
    });
}

function selecionadoText(dialog, statisticSlug) {
    const selectedButton = dialog.element.querySelector(
        `[data-skill="${statisticSlug}"]`
    );

    return selectedButton?.textContent.trim() ?? statisticSlug;
}
