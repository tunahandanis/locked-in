export function splitText(
  text: string,
  chunkSize: number,
  chunkOverlap: number,
): string[] {
  const textLength = text.length
  const chunks: string[] = []
  let start = 0

  while (start < textLength) {
    const end = Math.min(start + chunkSize, textLength)
    const chunk = text.slice(start, end)
    chunks.push(chunk)
    start += chunkSize - chunkOverlap
  }

  return chunks
}
