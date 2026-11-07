const HEX_COLOR = /^#[0-9a-f]{6}$/i

export function safeBrandColor(value: string | null | undefined, fallback: string): string {
  return value && HEX_COLOR.test(value) ? value : fallback
}

function channelLuminance(channel: number): number {
  const value = channel / 255
  return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
}

// Elige texto claro u oscuro según el contraste del color de marca.
export function readableTextColor(hex: string): string {
  const value = hex.slice(1)
  const luminance =
    0.2126 * channelLuminance(parseInt(value.slice(0, 2), 16)) +
    0.7152 * channelLuminance(parseInt(value.slice(2, 4), 16)) +
    0.0722 * channelLuminance(parseInt(value.slice(4, 6), 16))
  return luminance > 0.179 ? '#0f172a' : '#ffffff'
}
