/**
 * Copies the text to the clipboard. The async api of the browser is not
 * available in every environment, so a hidden field with the old command is
 * used as a second try. The function tells the caller whether it worked.
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  if (!text) return false

  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      // the browser refused the permission, the second try may still work
    }
  }

  if (typeof document === 'undefined') return false

  const field = document.createElement('textarea')
  field.value = text
  field.setAttribute('readonly', '')
  field.style.position = 'fixed'
  field.style.opacity = '0'
  field.style.pointerEvents = 'none'
  document.body.appendChild(field)

  try {
    field.select()
    const copied = document.execCommand?.('copy') ?? false
    return copied
  } catch {
    return false
  } finally {
    field.remove()
  }
}
