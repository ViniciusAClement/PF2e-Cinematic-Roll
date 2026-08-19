import { rollForSelectedActors } from "./roll-service.js";

function localize(key, fallback) {
    const localized = game.i18n.localize(key);
    return localized === key ? fallback : localized;
}

function escapeHtml(value) {
    return foundry.utils.escapeHTML(String(value ?? ""));
}

const handledRequestIds = new Set();

function openPlayerRollRequest(request) {
    const actor = game.actors.get(request.actorId);

    if (!actor) {
        console.warn(
            `Cinematic Rolls | Actor ${request.actorId} não encontrado neste cliente.`
        );
        return;
    }

    let completed = false;

    foundry.applications.api.DialogV2.wait({
        window: {
            title: localize(
                "PF2E_CINEMATICROLLS.PlayerRequest.Title",
                "Teste solicitado"
            )
        },
        content: `
            <div class="cinematic-roll-request">
                <p>
                    ${localize(
                        "PF2E_CINEMATICROLLS.PlayerRequest.Message",
                        "Você precisa realizar o seguinte teste:"
                    )}
                </p>
                <strong>${escapeHtml(request.statisticLabel)}</strong>
                <span>${localize("PF2E_CINEMATICROLLS.Fields.DC", "DC")}: ${request.dc}</span>
            </div>
        `,
        buttons: [
            {
                action: "roll",
                label: localize(
                    "PF2E_CINEMATICROLLS.Actions.Roll",
                    "Rolar"
                ),
                default: true,
                callback: async () => {
                    if (completed) return;
                    completed = true;

                    const [result] = await rollForSelectedActors(
                        [request.actorId],
                        request.statisticSlug,
                        request.dc
                    );

                    game.socket.emit("module.pf2e-cinematicrolls", {
                        type: "roll-result",
                        requestId: request.requestId,
                        requesterUserId: request.requesterUserId,
                        result: result ?? null
                    });

                    return result;
                }
            }
        ]
    });
}

/**
 * Registra o canal de comunicação entre o GM e os jogadores.
 */
export function registerRequestSocket() {
    console.log(
        "Cinematic Rolls | Socket registrado para o usuário:",
        game.user.id
    );

    game.socket.on("module.pf2e-cinematicrolls", request => {
        if (request.type === "roll-request") {
            console.log(
                "Cinematic Rolls | Pedido recebido:",
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
                "Cinematic Rolls | Resultado recebido do jogador:",
                request.result
            );
        }
    });
}

/**
 * Envia um pedido individual para cada Actor selecionado.
 */
export function requestRollsForSelectedActors(
    actorIds,
    statisticSlug,
    statisticLabel,
    dc
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
                `Cinematic Rolls | Nenhum jogador online encontrado para o Actor ${actorId}.`
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
            dc
        };

        console.log(
            "Cinematic Rolls | Pedido enviado:",
            request
        );

        game.socket.emit("module.pf2e-cinematicrolls", request);
    }
}
