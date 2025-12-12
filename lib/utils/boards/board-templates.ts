
export const communityLibrary = {
  getTemplate: async (
    name: string,
  ): Promise<{ outline: Array<{ x: number; y: number }> } | null> => {
    if (communityTemplates[name]) return communityTemplates[name]
    return null
  },
}

const communityTemplates: Record<
  string,
  { outline: Array<{ x: number; y: number }> }
> = {
  arduinoshield: {
    outline: [
      { x: 0, y: 0 },
      { x: 68.58, y: 0 },
      { x: 68.58, y: 53.34 },
      { x: 0, y: 53.34 },
    ],
  },
  raspberrypihat: {
    outline: [
      { x: 0, y: 0 },
      { x: 65, y: 0 },
      { x: 65, y: 56 },
      { x: 0, y: 56 },
    ],
  },
  sparkfunmicromod_processor: {
    outline: [
      { x: 0, y: 0 },
      { x: 22, y: 0 },
      { x: 22, y: 22 },
      { x: 0, y: 22 },
    ],
  },
  sparkfunmicromod_host: {
    outline: [
      { x: 0, y: 0 },
      { x: 22, y: 0 },
      { x: 22, y: 22 },
      { x: 0, y: 22 },
    ],
  },
}
