export interface BrandTemplate {
  id: string;
  label: string;
  emoji: string;
  description: string;
  buildPrompt: (postText: string) => string;
}

export interface BrandConfig {
  brandColors: Record<string, string>;
  accentColor: string;
  templates: BrandTemplate[];
}

export const BRAND_TEMPLATES: Record<string, BrandConfig> = {
  disc: {
    brandColors: { D: '#E53935', I: '#FDD835', S: '#43A047', C: '#1E88E5' },
    accentColor: '#a855f7',
    templates: [
      {
        id: 'disc-4panel',
        label: '4-Panel Type Reaction',
        emoji: '🟥🟨🟩🟦',
        description: 'How each DISC type reacts to the same situation',
        buildPrompt: (postText) => `Four-panel grid illustration, square format. Each panel labeled with a large bold letter: D (red #E53935), I (yellow #FDD835), S (green #43A047), C (blue #1E88E5). Each panel shows a simple flat-design icon or emoji conveying how that personality type would react to: "${postText.slice(0, 120)}". White background, bold sans-serif labels, clean flat design. No people, no faces, no text beyond D/I/S/C labels. Infographic style.`,
      },
      {
        id: 'disc-spotlight',
        label: 'Personality Spotlight Card',
        emoji: '🎯',
        description: 'Bold feature card for one DISC type',
        buildPrompt: (postText) => `Bold graphic design card, square format. Dominant color background chosen to match the personality type most relevant to: "${postText.slice(0, 100)}". Large centered letter (D, I, S, or C) in a white circle. 3-4 bold personality trait keywords arranged around it. Bottom: horizontal color bar with all four DISC colors (red, yellow, green, blue). Clean white typography, flat design. No faces or people.`,
      },
      {
        id: 'disc-team',
        label: 'Team Dynamics Scene',
        emoji: '👥',
        description: 'Four personality types in action together',
        buildPrompt: (postText) => `Flat vector illustration, square format. Four abstract geometric character shapes in a collaborative scene — meeting table, whiteboard, or team huddle. Each character a distinct DISC color: red (D), yellow (I), green (S), blue (C). Body language reflects personality: red=assertive/standing, yellow=animated/hands raised, green=calm/listening, blue=thoughtful/taking notes. Clean minimal background, no faces, no text. Modern friendly illustration style. Scene loosely inspired by: "${postText.slice(0, 80)}"`,
      },
      {
        id: 'disc-humor',
        label: 'Relatable Workplace Moment',
        emoji: '😄',
        description: 'Funny, scroll-stopping scene people tag friends in',
        buildPrompt: (postText) => `Bold colorful flat-design illustration, square format. A single funny workplace or everyday moment that DISC personality types would immediately recognize. Use DISC brand colors as accents (red, yellow, green, blue). Slightly exaggerated, humorous body language. Clean white background. Modern, warm, relatable style — NOT corporate clip art. Inspired by this scenario: "${postText.slice(0, 120)}". No text in image. No faces — abstract shapes or silhouettes only.`,
      },
    ],
  },

  bloomsuite: {
    brandColors: { primary: '#22c55e', light: '#bbf7d0', dark: '#15803d', accent: '#f59e0b' },
    accentColor: '#22c55e',
    templates: [
      {
        id: 'bloom-seasonal',
        label: 'Seasonal Garden Scene',
        emoji: '🌱',
        description: 'Beautiful seasonal garden imagery that stops the scroll',
        buildPrompt: (postText) => `Warm, vibrant flat-design illustration of a thriving independent garden center or nursery, square format. Lush plants, flowers, and seasonal colors — greens, warm yellows, earthy oranges. Small-business charm: wooden signs, outdoor plant tables, hand-lettered feel. Friendly, inviting, local business energy. Slightly whimsical but professional. No text in image. Color palette: rich greens #22c55e, warm amber #f59e0b, earthy tones. Inspired by this seasonal theme: "${postText.slice(0, 120)}"`,
      },
      {
        id: 'bloom-owner',
        label: 'Garden Center Owner Moment',
        emoji: '🏡',
        description: '"I felt that" moment for garden center owners',
        buildPrompt: (postText) => `Flat-design illustration of a small business garden center owner in a relatable, slightly humorous everyday moment. Warm green and amber color palette. Single character (no face — abstract shape), surrounded by plants, tools, or customers. The scene captures the emotional truth of running a garden center. Charming, small-business feel. Square format. Clean white or soft natural background. No text. Inspired by: "${postText.slice(0, 120)}"`,
      },
      {
        id: 'bloom-results',
        label: 'Before/After Growth Visual',
        emoji: '📈',
        description: 'Visual proof of marketing growth for garden centers',
        buildPrompt: (postText) => `Bold split-panel infographic illustration, square format. Left panel: simple stressed plant or empty shelf (muted grey/brown tones, labeled "Before"). Right panel: thriving lush plant or full colorful display (rich greens and yellows, labeled "After"). Clean flat design, friendly sans-serif labels, arrow pointing left to right. Brand colors: green #22c55e, amber #f59e0b. Concept: "${postText.slice(0, 100)}"`,
      },
      {
        id: 'bloom-tip',
        label: 'Marketing Tip Visual',
        emoji: '💡',
        description: 'Eye-catching graphic for marketing advice posts',
        buildPrompt: (postText) => `Clean, bold infographic-style illustration, square format. Large lightbulb or plant-growing-from-idea icon as centerpiece. Green and amber color palette (#22c55e, #f59e0b). Surrounding elements: small icons representing marketing concepts (phone, email envelope, social media, calendar). Flat design, professional but warm. Small business energy. No body text — icon-driven visual only. Concept from: "${postText.slice(0, 100)}"`,
      },
    ],
  },

  clinicleader: {
    brandColors: { primary: '#3b82f6', dark: '#1d4ed8', light: '#bfdbfe', accent: '#10b981' },
    accentColor: '#3b82f6',
    templates: [
      {
        id: 'clinic-data',
        label: 'Leadership Metrics Visual',
        emoji: '📊',
        description: 'Professional data-forward graphic for clinic leaders',
        buildPrompt: (postText) => `Clean professional infographic, square format. Minimal clinic leadership dashboard aesthetic — a simple scorecard, KPI chart, or metric visualization. Blue (#3b82f6) and emerald green (#10b981) color palette. Bold numbers or status indicators. Flat design, corporate-clean but not cold. Inspired by: "${postText.slice(0, 120)}". No real data — illustrative only. No text beyond axis labels.`,
      },
      {
        id: 'clinic-insight',
        label: '"Finally Someone Gets It" Moment',
        emoji: '💡',
        description: 'Relatable clinic ops insight that leaders nod at',
        buildPrompt: (postText) => `Bold flat-design illustration for healthcare clinic professionals, square format. A single relatable leadership or operations moment — meeting room, whiteboard, or clinic hallway setting. Abstract character shapes (no faces), professional body language. Blue and emerald green color palette. Clean, credible, slightly understated humor. Not medical clip art. Square format. Inspired by: "${postText.slice(0, 120)}"`,
      },
      {
        id: 'clinic-structure',
        label: 'Operational Structure Diagram',
        emoji: '🏗️',
        description: 'Visual framework showing leadership clarity',
        buildPrompt: (postText) => `Clean organizational or process diagram illustration, square format. Simple flowchart or pillar structure showing structured clinic leadership. Blue #3b82f6 primary color, emerald #10b981 accent. Bold geometric shapes, arrows, connecting lines. Flat professional design. Inspired by the concept: "${postText.slice(0, 100)}". No real text — placeholder boxes with lines only.`,
      },
      {
        id: 'clinic-contrast',
        label: 'Chaos vs. Clarity Split',
        emoji: '⚡',
        description: 'Before/after showing what structured leadership looks like',
        buildPrompt: (postText) => `Bold split-panel illustration, square format. Left panel labeled "Without Structure" — chaotic, messy desk, scattered papers, stressed abstract figure, muted grey/red tones. Right panel labeled "With ClinicLeader" — clean desk, organized chart, calm confident figure, blue and green tones. Sharp dividing line between panels. Flat design, slightly humorous. Professional healthcare setting. Concept: "${postText.slice(0, 100)}"`,
      },
    ],
  },

  projectpath: {
    brandColors: { primary: '#f59e0b', dark: '#b45309', light: '#fde68a', steel: '#374151' },
    accentColor: '#f59e0b',
    templates: [
      {
        id: 'pp-jobsite',
        label: 'Job Site Scene',
        emoji: '🏗️',
        description: 'Rugged, real construction energy',
        buildPrompt: (postText) => `Bold flat-design construction job site illustration, square format. Crane, scaffolding, hard hats, blueprints — classic construction imagery. Amber/yellow #f59e0b primary with steel grey #374151 and white. Gritty but clean flat design — not cartoonish but not photorealistic. Trades-proud aesthetic. No faces, abstract worker silhouettes. Inspired by: "${postText.slice(0, 120)}"`,
      },
      {
        id: 'pp-chaos',
        label: 'Chaos vs. System',
        emoji: '📋',
        description: 'The pain of no system vs. running a tight job',
        buildPrompt: (postText) => `Bold split-panel illustration, square format. Left panel "Without ProjectPath" — tangled paperwork, confused worker, missed deadline, red warning icons, grey tones. Right panel "With ProjectPath" — clean clipboard, organized timeline, confident foreman, amber and white tones. Bold dividing line. Flat design, slightly rugged style. Construction site context. Concept: "${postText.slice(0, 100)}"`,
      },
      {
        id: 'pp-numbers',
        label: 'Job Cost Reality Check',
        emoji: '💰',
        description: 'Hits the nerve of every contractor who has lost money',
        buildPrompt: (postText) => `Bold financial infographic illustration, square format. Construction estimate vs actual cost comparison. Amber #f59e0b and steel grey #374151. Simple bar chart or side-by-side numbers (illustrative, not real data). Hard hat and dollar sign icons. Rugged flat design — not corporate. No-nonsense contractor aesthetic. Inspired by: "${postText.slice(0, 100)}"`,
      },
      {
        id: 'pp-crew',
        label: 'Crew Culture',
        emoji: '👷',
        description: 'Human side of construction — resonates with trades',
        buildPrompt: (postText) => `Warm flat-design illustration of a construction crew, square format. 3-4 abstract worker silhouettes in hard hats — fist bump, end-of-day celebration, or working in sync. Amber and steel color palette with warm sunset or golden-hour feel. Trades-proud, honest, human. No faces. Inspired by: "${postText.slice(0, 120)}"`,
      },
    ],
  },
};

/**
 * Resolves the workspace ID from an agent role string.
 * Falls back to 'disc' if no match found.
 */
export function getWorkspaceFromAgentRole(agentRole: string): string {
  const role = agentRole.toLowerCase();
  if (role.includes('bloom')) return 'bloomsuite';
  if (role.includes('clinic')) return 'clinicleader';
  if (role.includes('project') || role.includes('pp')) return 'projectpath';
  if (role.includes('disc')) return 'disc';
  // Check workspace IDs directly
  if (['bloomsuite', 'clinicleader', 'projectpath', 'disc'].includes(role)) return role;
  return 'disc'; // default fallback
}

export function getTemplatesForAgent(agentRole: string): BrandConfig {
  const workspace = getWorkspaceFromAgentRole(agentRole);
  return BRAND_TEMPLATES[workspace] || BRAND_TEMPLATES.disc;
}
