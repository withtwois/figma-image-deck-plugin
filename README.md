# Image deck — Figma plugin

Randomly draw images from an uploaded deck, one at a time, without repeats — like drawing cards from a shuffled deck.

## How it works

1. **Add images** — click "+ Add images" to upload any number of images
2. **Draw card** — each click randomly picks one unused image and places it on the canvas as a frame
3. **No repeats** — drawn images are crossed out in the list; the same image won't be drawn twice
4. **Reset** — restores all images to available so you can draw again from the start

The deck state persists across sessions — close and reopen the plugin and your progress is saved.

## Development setup

```bash
npm install --save-dev @figma/plugin-typings
tsc -p tsconfig.json
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["ES2017"],
    "strict": true,
    "outDir": ".",
    "typeRoots": ["./node_modules/@figma/plugin-typings"]
  },
  "include": ["code.ts"]
}
```

## Load locally in Figma

1. Open the Figma Desktop app
2. Go to **Plugins → Development → Import plugin from manifest**
3. Select `manifest.json` from this folder

## Publishing to the Figma Community

1. Generate a new plugin ID and update `manifest.json`
2. Remove the `isTool` field if present
3. Test in Figma Desktop
4. Go to **Plugins → Publish** to submit to the Community
