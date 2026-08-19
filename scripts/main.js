Hooks.on("getSceneControlButtons", (controls) => {
    const tokenControls = controls.tokens;

    if (!tokenControls) return;

    tokenControls.tools.cinematicrolls = {
        name: "cinematicrolls",
        title: "Cinematic Rolls",
        icon: "fas fa-dice-d20",
        button: true,
        onChange: () => abrirCinematicRolls()
    };
});

function getPartyCheckboxes() {
    const parties = game.actors.filter(
        actor => actor.type === "party"
    );

    if (parties.length === 0) {
        return `
            <p class="notes">
                Nenhuma Party encontrada.
            </p>
        `;
    }

    const partyActors = parties.flatMap(party => {
        const members = party.members ?? [];

        if (members.length === 0) return [];

        return [
            `<h3>${party.name}</h3>`,
            ...members.map(actor => `
                <label class="party-option">
                    <input
                        type="checkbox"
                        name="actor"
                        value="${actor.id}"
                    >

                    <span>${actor.name}</span>
                </label>
            `)
        ];
    });

    if (partyActors.length === 0) {
        return `
            <p class="notes">
                Nenhum Ator pertencente a uma Party foi encontrado.
            </p>
        `;
    }

    return partyActors.join("");
}

function abrirCinematicRolls() {
    foundry.applications.api.DialogV2.wait({
        window: {
            title: "Cinematic Rolls"
        },

        content: `
            <div class="cinematic-rolls">

                <label for="cinematic-rolls-dc">DC</label>
                <input
                    id="cinematic-rolls-dc"
                    name="dc"
                    type="number"
                    min="1"
                    step="1"
                    required
                >

                <h2>Escolha uma Perícia</h2>

                <div class="skill-buttons">

                    <button
                        type="button"
                        class="skill-button"
                        data-skill="athletics"
                        aria-pressed="false"
                    >
                        Atletismo
                    </button>

                    <button
                        type="button"
                        class="skill-button"
                        data-skill="arcana"
                        aria-pressed="false"
                    >
                        Arcanismo
                    </button>

                    <button
                        type="button"
                        class="skill-button"
                        data-skill="acrobatics"
                        aria-pressed="false"
                    >
                        Acrobacia
                    </button>

                    <button
                        type="button"
                        class="skill-button"
                        data-skill="diplomacy"
                        aria-pressed="false"
                    >
                        Diplomacia
                    </button>

                    <button
                        type="button"
                        class="skill-button"
                        data-skill="stealth"
                        aria-pressed="false"
                    >
                        Furtividade
                    </button>

                    <button type="button" class="skill-button" data-skill="deception" aria-pressed="false">
                        Dissimulação
                    </button>

                    <button type="button" class="skill-button" data-skill="intimidation" aria-pressed="false">
                        Intimidação
                    </button>

                    <button type="button" class="skill-button" data-skill="thievery" aria-pressed="false">
                        Ladronagem
                    </button>

                    <button type="button" class="skill-button" data-skill="crafting" aria-pressed="false">
                        Manufatura
                    </button>

                    <button type="button" class="skill-button" data-skill="medicine" aria-pressed="false">
                        Medicina
                    </button>

                    <button type="button" class="skill-button" data-skill="nature" aria-pressed="false">
                        Natureza
                    </button>

                    <button type="button" class="skill-button" data-skill="occultism" aria-pressed="false">
                        Ocultismo
                    </button>

                    <button type="button" class="skill-button" data-skill="performance" aria-pressed="false">
                        Performance
                    </button>

                    <button type="button" class="skill-button" data-skill="religion" aria-pressed="false">
                        Religião
                    </button>

                    <button type="button" class="skill-button" data-skill="survival" aria-pressed="false">
                        Sobrevivência
                    </button>

                    <button type="button" class="skill-button" data-skill="society" aria-pressed="false">
                        Sociedade
                    </button>

                </div>

                <h2>Salvamentos</h2>

                <div class="saving-buttons">

                    <button type="button" class="saving-button" data-skill="fortitude" aria-pressed="false">
                        Fortitude
                    </button>

                    <button type="button" class="saving-button" data-skill="reflex" aria-pressed="false">
                        Reflexo
                    </button>

                    <button type="button" class="saving-button" data-skill="will" aria-pressed="false">
                        Vontade
                    </button>

                </div>

                <h2>Atores das Parties</h2>

                <div class="party-buttons">
                    ${getPartyCheckboxes()}
                </div>

            </div>
        `,

        render: (event, dialog) => {
            const skillButtons =
                dialog.element.querySelectorAll(
                    ".skill-button, .saving-button"
                );

            for (const skillButton of skillButtons) {
                skillButton.addEventListener("click", () => {

                    for (const button of skillButtons) {
                        const isSelected =
                            button === skillButton;

                        button.setAttribute(
                            "aria-pressed",
                            String(isSelected)
                        );

                        button.classList.toggle(
                            "selected",
                            isSelected
                        );
                    }
                });
            }
        },

        buttons: [
            {
                action: "confirmar",
                label: "Confirmar",
                default: true,

                callback: (event, button, dialog) => {
                    const dcInput =
                        dialog.element.querySelector('input[name="dc"]');
                    const dc = Number(dcInput?.value);

                    if (!Number.isInteger(dc) || dc <= 0) {
                        ui.notifications.warn(
                            "Informe uma DC inteira maior que zero."
                        );
                        return;
                    }

                    const selecionado =
                        dialog.element.querySelector(
                            '.skill-button[aria-pressed="true"], .saving-button[aria-pressed="true"]'
                        );

                    if (!selecionado) {
                        ui.notifications.warn(
                            "Escolha uma perícia ou salvamento!"
                        );
                        return;
                    }

                    const actors = Array.from(
                        dialog.element.querySelectorAll(
                            'input[name="actor"]:checked'
                        ),
                        checkbox => checkbox.value
                    );

                    if (actors.length === 0) {
                        ui.notifications.warn(
                            "Selecione ao menos um Ator."
                        );
                        return;
                    }

                    const resultado = {
                        opcao: selecionado.dataset.skill,
                        dc,
                        actors
                    };

                    console.log("Resultado do Cinematic Rolls:", resultado);

                    return resultado;
                }
            },

            {
                action: "cancelar",
                label: "Cancelar"
            }
        ]
    });
}