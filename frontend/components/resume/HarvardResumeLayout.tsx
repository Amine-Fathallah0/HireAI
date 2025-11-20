import React from 'react';

type Section = { title?: string; text?: string };
type Profile = { name?: string; email?: string };
type HarvardProps = {
  resume: {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
    links?: { label: string; url: string }[];
    sections?: Section[];
    text?: string;
  };
  profile?: Profile;
};

const emailRegex = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const phoneRegex = /(\+?\d[\d\s\-()]{7,}\d)/;

function extractFromText(text?: string) {
  if (!text) return { name: undefined, email: undefined, phone: undefined, location: undefined };
  const lines = text.split(/\n+/).map(l => l.trim()).filter(Boolean);

  let email: string | undefined;
  let phone: string | undefined;
  let name: string | undefined;
  let location: string | undefined;

  for (const l of lines) {
    if (!email) {
      const m = l.match(emailRegex);
      if (m) email = m[0];
    }
    if (!phone) {
      const p = l.match(phoneRegex);
      if (p) phone = p[0];
    }
  }

  // Heuristic for name: first non-empty line without email/phone, 2+ words
  for (const l of lines) {
    if (emailRegex.test(l) || phoneRegex.test(l)) continue;
    if (l.split(/\s+/).length >= 2) { name = l; break; }
  }

  // Heuristic for location: a line with comma that isn't email/phone
  for (const l of lines) {
    if (emailRegex.test(l) || phoneRegex.test(l)) continue;
    if (/,/.test(l) && l.length <= 60) { location = l; break; }
  }

  return { name, email, phone, location };
}

const splitBullets = (text?: string) => {
  if (!text) return [] as string[];
  // Split by bullet/lines, normalize dashes
  return text
    .replace(/^\s*[•\-]\s*/gm, '')
    .split(/\n+/)
    .map(s => s.trim())
    .filter(Boolean);
};

function normalizeSections(input?: Section[], fallbackText?: string): Section[] {
  if (Array.isArray(input) && input.length > 0) return input;
  return [{ title: 'Summary', text: fallbackText || '' }];
}

export const HarvardResumeLayout: React.FC<HarvardProps> = ({ resume, profile }) => {
  const baseText = resume?.text || (resume?.sections || []).map(s => s.text).filter(Boolean).join('\n') || '';
  const parsed = extractFromText(baseText);

  const name = profile?.name || resume?.name || parsed.name || '';
  const email = profile?.email || resume?.email || parsed.email;
  const phone = resume?.phone || parsed.phone;
  const location = resume?.location || parsed.location;

  const contactParts = [email, phone, location].filter(Boolean) as string[];
  const contactLine = contactParts.join(' \u2022 ');

  const sections = normalizeSections(resume?.sections, resume?.text);

  return (
    <div className="mx-auto bg-white max-w-[210mm] min-h-[297mm] border border-gray-200">
      <div className="px-10 py-8">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-[28px] font-semibold tracking-tight text-gray-900 leading-tight">
            {name || 'Your Name'}
          </h1>
          <div className="text-[13px] text-gray-700 mt-1">
            {contactLine || 'email@example.com \u2022 (555) 555-5555 \u2022 City, ST'}
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-6">
          {sections.map((s, idx) => (
            <div key={idx}>
              {s.title && (
                <h2 className="text-[11px] font-semibold tracking-[0.2em] text-gray-800 border-b border-gray-300 pb-1">
                  {s.title.toUpperCase()}
                </h2>
              )}
              <ul className="mt-2 space-y-1">
                {splitBullets(s.text).map((line, i) => (
                  <li key={i} className="text-[13px] text-gray-800 leading-6 relative pl-4">
                    <span className="absolute left-0 top-2 h-1 w-1 rounded-full bg-gray-700" />
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HarvardResumeLayout;
