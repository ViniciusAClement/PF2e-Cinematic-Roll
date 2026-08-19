function getDegreeOfSuccessLabel(degreeOfSuccess) {
    return [
        "criticalFailure",
        "failure",
        "success",
        "criticalSuccess"
    ][degreeOfSuccess] ?? null;
}

/**
 * Executa um Check PF2e usando a DC fornecida.
 * O sistema PF2e continua responsável pelo cálculo completo do resultado.
 */
async function performPF2eCheck(actor, statisticSlug, dc) {
    if (!actor) {
        console.warn("Cinematic Rolls | Actor inválido.");
        return null;
    }

    const statistic = actor.getStatistic(statisticSlug);

    if (!statistic) {
        console.warn(
            `Cinematic Rolls | ${actor.name} não possui a estatística "${statisticSlug}".`
        );
        return null;
    }

    console.log(
        `Cinematic Rolls | ${actor.name} | ${statisticSlug} | DC ${dc}`
    );

    const roll = await statistic.roll({
        dc: {
            value: dc,
            visible: true
        }
    });

    if (!roll) {
        console.warn(
            `Cinematic Rolls | A rolagem de ${actor.name} foi cancelada.`
        );
        return null;
    }

    const degreeOfSuccess = roll.degreeOfSuccess;

    return {
        actorId: actor.id,
        actorName: actor.name,
        statistic: statisticSlug,
        dc,
        total: roll.total,
        degreeOfSuccess,
        outcome: getDegreeOfSuccessLabel(degreeOfSuccess)
    };
}

/**
 * Executa o Check para todos os Actors selecionados, em sequência.
 */
export async function rollForSelectedActors(actorIds, statisticSlug, dc) {
    const results = [];

    for (const actorId of actorIds) {
        const actor = game.actors.get(actorId);
        const result = await performPF2eCheck(actor, statisticSlug, dc);

        if (!result) continue;

        results.push(result);

        console.log(`Cinematic Rolls | ${actor.name}:`, {
            total: result.total,
            dc,
            degreeOfSuccess: result.degreeOfSuccess,
            outcome: result.outcome
        });
    }

    return results;
}
