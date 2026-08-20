/**
 * Converts a PF2e degree-of-success index to a stable module identifier.
 *
 * @param {number|null} degreeOfSuccess PF2e degree-of-success index.
 * @returns {string|null} Stable outcome identifier, or null when unavailable.
 */
function getDegreeOfSuccessLabel(degreeOfSuccess) {
    return [
        "criticalFailure",
        "failure",
        "success",
        "criticalSuccess"
    ][degreeOfSuccess] ?? null;
}

/**
 * Executes a PF2e check using the provided DC.
 * The PF2e system remains responsible for the complete result calculation.
 *
 * @param {Actor} actor Actor that performs the check.
 * @param {string} statisticSlug PF2e skill or saving throw slug.
 * @param {number} dc Positive integer difficulty class.
 * @param {boolean} secret Whether the result should be sent as a blind GM roll.
 * @returns {Promise<object|null>} Check result, or null when unavailable or cancelled.
 */
async function performPF2eCheck(actor, statisticSlug, dc, secret) {
    if (!actor) {
        console.warn("Cinematic Rolls | Invalid Actor.");
        return null;
    }

    const statistic = actor.getStatistic(statisticSlug);

    if (!statistic) {
        console.warn(
            `Cinematic Rolls | ${actor.name} does not have the statistic "${statisticSlug}".`
        );
        return null;
    }

    console.log(
        `Cinematic Rolls | ${actor.name} | ${statisticSlug} | DC ${dc}`
    );

    const rollOptions = {
        skipDialog: true,
        dc: {
            value: dc,
            visible: !secret
        }
    };

    if (secret) {
        rollOptions.rollMode = CONST.DICE_ROLL_MODES.BLIND;
        rollOptions.traits = ["secret"];
        rollOptions.extraRollOptions = ["secret", "trait:secret"];
    }

    const roll = await statistic.roll(rollOptions);

    if (!roll) {
        console.warn(
            `Cinematic Rolls | ${actor.name}'s roll was cancelled.`
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
 * Executes the check for all selected Actors sequentially.
 *
 * @param {string[]} actorIds Selected Actor IDs.
 * @param {string} statisticSlug PF2e skill or saving throw slug.
 * @param {number} dc Positive integer difficulty class.
 * @param {boolean} secret Whether the result should be sent as a blind GM roll.
 * @returns {Promise<object[]>} Completed check results.
 */
export async function rollForSelectedActors(
    actorIds,
    statisticSlug,
    dc,
    secret = false
) {
    const results = [];

    for (const actorId of actorIds) {
        const actor = game.actors.get(actorId);
        const result = await performPF2eCheck(
            actor,
            statisticSlug,
            dc,
            secret
        );

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
