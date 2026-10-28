import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { UsageService } from '../common/usage.service';
import { IntegrationsService } from './integrations.service';

export interface Mail { to: string; subject: string; html: string; text: string; headers?: Record<string, string> }
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));

@Injectable()
export class MailService {
  private log = new Logger('Mail');
  constructor(private integ: IntegrationsService, private usage: UsageService) {}

  async logo() { try { return await this.integ.emailLogo(); } catch { return ''; } }

  async available() { return !!(await this.integ.resend()); }

  /** Sends through Resend using the key stored (encrypted) in the database. Throws if mail is not configured. */
  async send(m: Mail) {
    const r = await this.integ.resend();
    if (!r) throw new ServiceUnavailableException('Email is not configured. Add your Resend details in Admin → Integrations.');
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${r.apiKey}`, 'content-type': 'application/json' },
      body: JSON.stringify({ from: r.from, to: [m.to], subject: m.subject, html: m.html, text: m.text, ...(r.replyTo ? { reply_to: r.replyTo } : {}), ...(m.headers ? { headers: m.headers } : {}) }),
    });
    if (!res.ok) {
      const j: any = await res.json().catch(() => ({}));
      this.log.warn(`Resend ${res.status}: ${j?.message ?? ''}`);
      const e: any = new ServiceUnavailableException(`Resend could not send the email: ${j?.message ?? res.status}`);
      e.resendStatus = res.status;
      throw e;
    }
    void this.usage.track('email');
  }

  /** Best effort: never breaks the caller's flow if mail is down. Returns whether it was sent. */
  async trySend(m: Mail) {
    try { await this.send(m); return true; } catch { return false; }
  }

  /** Simple branded layout with one call-to-action button. */
  static layout(title: string, body: string, cta?: { label: string; url: string }, logo = '') {
    const html = `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:24px;color:#1f2937">${logo.startsWith('https://') ? `<p style="margin:0 0 20px"><img src="${esc(logo)}" alt="" height="48" style="height:48px;width:auto;border:0"></p>` : ''}<h2 style="margin:0 0 16px">${esc(title)}</h2><p style="line-height:1.6">${esc(body)}</p>${
      cta ? `<p style="margin:24px 0"><a href="${esc(cta.url)}" style="background:#2f6b3a;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none">${esc(cta.label)}</a></p><p style="font-size:12px;color:#6b7280">If the button does not work, copy this link: ${esc(cta.url)}</p>` : ''}</div>`;
    return { html, text: `${title}\n\n${body}${cta ? `\n\n${cta.label}: ${cta.url}` : ''}` };
  }
}
