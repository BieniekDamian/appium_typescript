import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

/**
 * Helper, not a test: saves what Appium sees on the current screen so you can
 * pick locators. Leave the app on the screen you want, then run `npm run dump`.
 * Output: artifacts/screen.xml (full tree) and artifacts/screen.png.
 */
describe('Dump current screen', () => {
	it('saves page source and screenshot', async () => {
		const dir = path.resolve('artifacts');
		mkdirSync(dir, { recursive: true });

		// Give the WebView a moment to expose its accessibility tree.
		await driver.pause(3_000);

		const xml = await driver.getPageSource();
		writeFileSync(path.join(dir, 'screen.xml'), xml);
		await driver.saveScreenshot(path.join(dir, 'screen.png'));

		const interesting = [...xml.matchAll(/<(\S+)[^>]*?(?:text|content-desc|resource-id)="[^"]+"[^>]*>/g)].map(
			(m) => {
				const attr = (name: string) => m[0].match(new RegExp(`${name}="([^"]*)"`))?.[1] ?? '';
				return [m[1].split('.').pop(), attr('resource-id'), attr('content-desc'), attr('text')]
					.filter(Boolean)
					.join(' | ');
			},
		);
		console.log(`\n${interesting.length} elements with text/id/description:\n${interesting.join('\n')}`);
	});
});
