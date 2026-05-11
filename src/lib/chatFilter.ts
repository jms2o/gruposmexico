// Filters out phone numbers, emails, URLs, WhatsApp mentions, and other external contact info
// to keep all communication within the platform (Airbnb-style)

const PHONE_REGEX = /(\+?\d[\d\s\-().]{6,15}\d)/g;
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const URL_REGEX = /https?:\/\/[^\s]+/gi;
const WHATSAPP_REGEX = /whats\s*app|wha?ts|wa\.me|whatsap/gi;
const SOCIAL_REGEX = /facebook|instagram|telegram|tiktok|twitter|snapchat|signal|messenger|fb\.com|ig:|t\.me/gi;
const CONTACT_PHRASES_REGEX = /(?:mi\s*(?:número|numero|cel|celular|teléfono|telefono|fono|contacto|mail|correo)|llám[ae]me|márc[ae]me|escríb[ae]me\s*(?:al|por|a\s*mi)|te\s*(?:paso|doy|mando)\s*(?:mi|el)\s*(?:número|numero|cel|contacto|correo))/gi;

const REPLACEMENT = "***";

export function containsContactInfo(message: string): boolean {
  return (
    PHONE_REGEX.test(message) ||
    EMAIL_REGEX.test(message) ||
    URL_REGEX.test(message) ||
    WHATSAPP_REGEX.test(message) ||
    SOCIAL_REGEX.test(message) ||
    CONTACT_PHRASES_REGEX.test(message)
  );
}

export function sanitizeChatMessage(message: string): string {
  let sanitized = message;
  sanitized = sanitized.replace(PHONE_REGEX, REPLACEMENT);
  sanitized = sanitized.replace(EMAIL_REGEX, REPLACEMENT);
  sanitized = sanitized.replace(URL_REGEX, REPLACEMENT);
  sanitized = sanitized.replace(WHATSAPP_REGEX, REPLACEMENT);
  sanitized = sanitized.replace(SOCIAL_REGEX, REPLACEMENT);
  return sanitized;
}

export const CONTACT_WARNING = " Por seguridad, los datos de contacto se desbloquean cuando el cliente paga el anticipo y el evento se confirma.";
