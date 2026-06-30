const TOOL_ID = "dac2ca8c-314e-4d0b-a3f0-5f213f1cecbe"
const DISPLAY_NAME = "Image deck"
const DECK_KEY = `${TOOL_ID}:deck`

type DeckImage = { hash: string; name: string; used: boolean }
type DeckState = { images: DeckImage[] }

type IncomingMsg =
  | { type: 'add-images'; images: Array<{ bytes: number[]; name: string }> }
  | { type: 'draw' }
  | { type: 'reset' }
  | { type: 'clear' }
  | { type: 'resize'; height: number }

function loadDeck(): DeckState {
  const raw = figma.root.getPluginData(DECK_KEY)
  if (!raw) return { images: [] }
  try {
    const parsed = JSON.parse(raw) as { images: unknown[] }
    if (!Array.isArray(parsed.images)) return { images: [] }
    return {
      images: parsed.images.filter(
        (img): img is DeckImage =>
          typeof (img as DeckImage).hash === 'string' &&
          typeof (img as DeckImage).name === 'string' &&
          typeof (img as DeckImage).used === 'boolean',
      ),
    }
  } catch {
    return { images: [] }
  }
}

function saveDeck(deck: DeckState): void {
  figma.root.setPluginData(DECK_KEY, JSON.stringify(deck))
}

function pushDeckState(deck: DeckState): void {
  const remaining = deck.images.filter((img) => !img.used).length
  figma.ui.postMessage({
    type: 'deck-state',
    total: deck.images.length,
    remaining,
    images: deck.images.map((img) => ({ name: img.name, used: img.used })),
  })
}

figma.root.setRelaunchData({ [TOOL_ID]: DISPLAY_NAME })
figma.showUI(__html__, { width: 280, height: 420 })

const deck = loadDeck()
pushDeckState(deck)

figma.ui.onmessage = async (msg: IncomingMsg) => {
  if (msg.type === 'resize') {
    figma.ui.resize(280, Math.max(200, Math.min(900, Math.round(msg.height))))
    return
  }

  if (msg.type === 'add-images') {
    for (const imgData of msg.images) {
      const bytes = new Uint8Array(imgData.bytes)
      const image = figma.createImage(bytes)
      const alreadyExists = deck.images.some((img) => img.hash === image.hash)
      if (!alreadyExists) {
        deck.images.push({ hash: image.hash, name: imgData.name, used: false })
      }
    }
    saveDeck(deck)
    pushDeckState(deck)
    return
  }

  if (msg.type === 'draw') {
    const available = deck.images.filter((img) => !img.used)
    if (available.length === 0) {
      figma.notify('All images drawn — reset the deck to start over.')
      return
    }

    const picked = available[Math.floor(Math.random() * available.length)]
    picked.used = true
    saveDeck(deck)

    const image = figma.getImageByHash(picked.hash)
    if (!image) {
      figma.notify('Could not load image.')
      return
    }

    const { width, height } = await image.getSizeAsync()
    const maxSize = 500
    const scale = Math.min(1, maxSize / Math.max(width, height, 1))
    const w = Math.max(1, Math.round(width * scale))
    const h = Math.max(1, Math.round(height * scale))

    const frame = figma.createFrame()
    frame.name = picked.name.replace(/\.[^.]+$/, '')
    frame.resize(w, h)
    frame.fills = [{ type: 'IMAGE', scaleMode: 'FILL', imageHash: picked.hash }]
    frame.clipsContent = true
    frame.setRelaunchData({ [TOOL_ID]: DISPLAY_NAME })

    const usedCount = deck.images.filter((img) => img.used).length
    const center = figma.viewport.center
    const offset = (usedCount - 1) * 24
    frame.x = Math.round(center.x - w / 2 + offset)
    frame.y = Math.round(center.y - h / 2 + offset)

    figma.currentPage.selection = [frame]
    figma.viewport.scrollAndZoomIntoView([frame])

    pushDeckState(deck)
    figma.notify(`Drew: ${picked.name}`)
    return
  }

  if (msg.type === 'reset') {
    for (const img of deck.images) img.used = false
    saveDeck(deck)
    pushDeckState(deck)
    figma.notify('Deck reset — all images available again.')
    return
  }

  if (msg.type === 'clear') {
    deck.images = []
    saveDeck(deck)
    pushDeckState(deck)
    figma.notify('Deck cleared.')
    return
  }
}
