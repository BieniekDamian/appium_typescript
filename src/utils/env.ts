/**
 * Reads a required setting from the environment (loaded from `.env` by `dotenv/config`).
 *
 * Why not `process.env.X || 'some-default'`? A default would put the identity of the app under test
 * into the committed code. Failing early with a clear message is also friendlier than an Appium
 * error about an unknown package three layers down.
 */
export function requireEnv(name: string): string {
	const value = process.env[name];
	if (!value) {
		throw new Error(`Missing ${name}. Copy .env.example to .env and set it (see README).`);
	}
	return value;
}
