// Describes what each permission means in plain words, for the Roles & permissions screen (Admin → Users → Roles).
// The tick marks themselves are NOT stored here: they are read from the database, so the screen always shows what is really enforced.
export const COLUMNS = ['View', 'Create', 'Edit', 'Delete', 'Publish', 'Configure'] as const;
type Col = (typeof COLUMNS)[number];
/** area → which permission (resource:action) fills each column. `null`/missing = that action does not exist for the area. */
export const AREAS: { key: string; label: string; cells: Partial<Record<Col, string>> }[] = [
  { key: 'pages', label: 'Pages and sections', cells: { View: 'page:read', Edit: 'page:update', Publish: 'page:publish' } },
  { key: 'entries', label: 'Galleries, categories and detail pages', cells: { View: 'entry:read', Create: 'entry:create', Edit: 'entry:update', Delete: 'entry:delete', Publish: 'entry:publish' } },
  { key: 'media', label: 'Photo and video library', cells: { View: 'media:read', Create: 'media:create', Edit: 'media:update', Delete: 'media:delete' } },
  { key: 'menus', label: 'Menus', cells: { View: 'menu:read', Configure: 'menu:update' } },
  { key: 'theme', label: 'Theme, colours and fonts', cells: { View: 'theme:read', Configure: 'theme:update' } },
  { key: 'seo', label: 'SEO', cells: { View: 'seo:read', Edit: 'seo:update' } },
  { key: 'settings', label: 'Site settings (contact, map, cookies, forms)', cells: { View: 'settings:read', Configure: 'settings:update' } },
  { key: 'testimonials', label: 'Parent reviews', cells: { View: 'testimonial:read', Create: 'testimonial:update', Edit: 'testimonial:update', Delete: 'testimonial:update' } },
  { key: 'leads', label: 'Enquiries and admissions', cells: { View: 'lead:read', Edit: 'lead:update', Delete: 'lead:delete' } },
  { key: 'campaigns', label: 'Follow-up email campaigns', cells: { View: 'campaign:read', Create: 'campaign:create', Edit: 'campaign:update', Delete: 'campaign:delete', Publish: 'campaign:send' } },
  { key: 'email', label: 'Email templates and email branding', cells: { View: 'email:read', Edit: 'email:update' } },
  { key: 'visitors', label: 'Visitors', cells: { View: 'visitor:read', Delete: 'visitor:delete' } },
  { key: 'analytics', label: 'Analytics', cells: { View: 'analytics:read' } },
  { key: 'users', label: 'Users and roles', cells: { View: 'user:read', Create: 'user:create', Edit: 'user:update', Delete: 'user:delete' } },
  { key: 'integrations', label: 'Integrations and secret keys', cells: { View: 'integration:read', Configure: 'integration:update' } },
  { key: 'audit', label: 'Audit log', cells: { View: 'audit:read' } },
];

export const BRIEFS: Record<string, { summary: string; can: string[]; cannot: string[] }> = {
  SUPER_ADMIN: {
    summary: 'Owns the whole system. The only role that can see secret keys and the audit trail, and the only one that can create or change other Super Admins.',
    can: ['Everything an Admin can do', 'Connect Cloudinary, Resend, Google Maps and Google Translate (secret keys)', 'Read the audit log', 'Create, change and remove Super Admins', 'Reset anyone’s two-step sign-in'],
    cannot: ['Remove the last active Super Admin (the system always keeps one)'],
  },
  ADMIN: {
    summary: 'Runs the website day to day: all content, the look of the site, settings, enquiries, emails and the team.',
    can: ['Edit, publish and schedule pages, galleries and detail pages', 'Manage photos and videos, menus, theme, SEO and site settings', 'Handle enquiries and parent reviews', 'Design and send follow-up emails and edit email templates', 'Invite, change and deactivate users (not Super Admins)'],
    cannot: ['See or change secret keys in Integrations', 'Read the audit log', 'Create or change a Super Admin'],
  },
  EDITOR: {
    summary: 'Writes and updates content. Can prepare work, but a person with publishing rights makes it live.',
    can: ['Edit pages and sections (saved as drafts)', 'Create and edit galleries, categories and detail pages', 'Upload and organise photos and videos', 'Manage parent reviews', 'See analytics'],
    cannot: ['Publish pages, galleries or detail pages', 'Delete galleries or detail pages', 'Change theme, menus, settings or SEO', 'Send emails, see enquiries or manage users'],
  },
  MARKETING: {
    summary: 'Runs email campaigns and looks at how the website performs.',
    can: ['Create, design, test and send follow-up email campaigns', 'Edit email templates and email branding', 'View visitors, analytics and enquiries', 'Upload photos and videos for emails'],
    cannot: ['Edit website pages, galleries or settings', 'Change enquiry status or delete anything outside campaigns', 'Manage users or integrations'],
  },
  VIEWER: {
    summary: 'Read-only access to look around the dashboard. Nothing can be changed.',
    can: ['View pages, galleries, media, menus, theme, SEO, settings and analytics'],
    cannot: ['Create, edit, delete, publish or configure anything'],
  },
  ADMISSIONS: {
    summary: 'Follows up admissions enquiries.',
    can: ['View and update enquiries, send the admissions pack', 'Read parent reviews'],
    cannot: ['Edit any website content', 'Send campaigns or manage users'],
  },
  TEACHER: { summary: 'Reserved for a future staff area. No dashboard access today.', can: [], cannot: ['Sign in to the admin dashboard'] },
  PARENT: { summary: 'Reserved for a future parent area. No dashboard access today.', can: [], cannot: ['Sign in to the admin dashboard'] },
};
