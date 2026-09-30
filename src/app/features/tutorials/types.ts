/**
 * The Get Started checklist, read fresh from the database on every render:
 * 1/3 profile fields filled, 2/3 a risk profile exists, 3/3 an order filled.
 * Lives here, not in the frame's shell data, so tutorials never import the
 * frame: the frame mounts tutorials, not the other way round.
 */
export type SetupProgress = { profile: boolean; quiz: boolean; trade: boolean }
