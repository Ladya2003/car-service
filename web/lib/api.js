import { iconText } from './icons.js';
const config = window.CAR_SERVICE_CONFIG || {};
export const API_URL = String(config.apiUrl || 'http://127.0.0.1:5086/api/car-service').replace(/\/$/, '');
export class ApiError extends Error { constructor(message, status) { super(message); this.status = status; } }
export async function api(path, options = {}) {
  const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 20000);
  const { token, ...init } = options;
  try {
    const response = await fetch(API_URL + path, { ...init, signal: controller.signal, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}), ...init.headers }, cache: 'no-store' });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new ApiError(body.error || 'Сервис временно недоступен. Попробуйте позже.', response.status);
    return body;
  } catch (e) {
    if (e instanceof ApiError) throw e;
    throw new ApiError(e.name === 'AbortError' ? 'Сервис отвечает дольше обычного. Попробуйте ещё раз.' : 'Не удалось связаться с сервисом. Проверьте соединение и повторите.', 0);
  } finally { clearTimeout(timer); }
}
export const money = n => new Intl.NumberFormat('ru-BY').format(n) + ' BYN';
export const dateLabel = date => new Intl.DateTimeFormat('ru-BY', { day: 'numeric', month: 'long', timeZone: 'Europe/Minsk' }).format(new Date(date + 'T12:00:00Z'));
export function element(tag, className, text) { const el = document.createElement(tag); if (className) el.className = className; if (text !== undefined) { if (['a','button'].includes(tag) || /^[↗←→↓✓☰↻▤▦⚙⌁◉⊕◎⌖●○×]$/u.test(String(text))) el.append(...iconText(text)); else el.textContent = text; } return el; }
export function requestId() { return crypto.randomUUID(); }
