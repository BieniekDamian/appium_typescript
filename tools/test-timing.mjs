// Where did the time of the last run go? Sums the response times in logs/appium.log by command type.
// Usage: npm run timing [-- path/to/appium.log]
//
// Every Appium response is logged as "<-- POST /session/<id>/elements 200 225 ms". We group them by
// the command (ids replaced with S / E) and add the milliseconds, so the biggest cost shows first.
// NOTE: logs/appium.log is overwritten by each run, so copy it first if you want to compare runs.
import { readFileSync } from 'node:fs';

const file = process.argv[2] ?? 'logs/appium.log';
const lines = readFileSync(file, 'utf8').split('\n');

const byCommand = {};
let first = null;
let last = null;

for (const line of lines) {
	const m = line.match(/^(\S+ \S+) .*<-- (GET|POST|DELETE) (\S+) (\d+) (\d+) ms/);
	if (!m) continue;
	const [, stamp, method, url, , ms] = m;
	const time = new Date(stamp.replace(/:(\d+)$/, '.$1')); // "17:48:19:822" -> "17:48:19.822"
	first ??= time;
	last = time;

	const key =
		url === '/session'
			? 'POST /session (start session)'
			: `${method} ${url.replace(/\/session\/[^/]+/, '/S').replace(/\/element\/[^/]+/, '/E')}`;
	byCommand[key] ??= { count: 0, ms: 0 };
	const entry = byCommand[key];
	entry.count++;
	entry.ms += Number(ms);
}

if (!first) {
	console.error(`No Appium responses found in ${file}. Did a test run produce it?`);
	process.exit(1);
}

const totalMs = Object.values(byCommand).reduce((sum, e) => sum + e.ms, 0);
console.log(
	`${file}: wall ${((last - first) / 1000).toFixed(0)} s, inside Appium commands ${(totalMs / 1000).toFixed(0)} s\n`,
);
console.log('   total   count    avg   command');
for (const [key, e] of Object.entries(byCommand)
	.sort((a, b) => b[1].ms - a[1].ms)
	.slice(0, 12)) {
	console.log(
		`${(e.ms / 1000).toFixed(1).padStart(6)} s ${String(e.count).padStart(6)} ${(e.ms / e.count).toFixed(0).padStart(5)} ms   ${key}`,
	);
}
