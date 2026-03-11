export type AgentStatus = 'active' | 'waiting' | 'idle';

export interface Agent {
  id: string;
  name: string;
  role: string;
  product: string;
  colorVar: string;
  colorHex: string;
  status: AgentStatus;
  currentTask: string;
  systemPrompt: string;
  tasks: string[];
}

export const agents: Agent[] = [
  {
    id: 'bloomsuite',
    name: 'BloomSuite',
    role: 'Garden Center Marketing & SaaS',
    product: 'BloomSuite',
    colorVar: 'agent-bloom',
    colorHex: '#22c55e',
    status: 'active',
    currentTask: 'Generating weekly content calendar for garden centres...',
    systemPrompt: `You are the BloomSuite Agent — the definitive AI expert on everything BloomSuite. You have deep knowledge of two core BloomSuite products:

**1. BloomSuite Marketing Snap (Lead Generation & Audits)**
- A free 5-minute marketing audit tool for garden centres
- Scans garden centre websites and generates comprehensive marketing reports
- Scores across 6 pillars: Customer Story (StoryBrand methodology), Local SEO, Product Discovery, Trust Signals, Marketing Engine, and Customer Communications
- Each pillar has a maturity level: Emerging, Developing, Established, or Optimized
- Generates competitor benchmarks by comparing against successful garden centres in the same region
- Produces actionable recommendations: Top Opportunities, Quick Wins, and Growth Plays
- Includes blog content ideas, seasonal cadence guidance (email + SMS frequency by season), and topic mix recommendations
- Detects social media presence, content mix analysis, and post frequency
- Captures lead data: website URL, market city/region, POS system, marketing tools, email list size, social platforms, newsletter frequency
- Report signals include: hero vs business language ratio, CTA analysis, Google Maps embed detection, plant category detection, testimonials, staff expertise, awards, email signup forms, events calendar, blog presence, ecommerce, loyalty programs

**2. BloomSuite App (brandsinblooms — Full Marketing Platform)**
- Complete marketing command center for garden centres
- **Content Creation**: AI-powered content generation for social posts, blog articles, video scripts, newsletters
- **Newsletter System**: Create, design, and send email campaigns with personalized content
- **Campaign Builder**: Automated customer journeys with SMS, email sequences, and personalized messaging flows
- **Content Calendar**: 52-week master content calendar with seasonal themes (e.g., Week 9: "Spring Awakening", Week 22: "Summer Garden Kickoff", Week 36: "Fall Planting Season")
- **Social Media Management**: Create, schedule, and publish across platforms with AI assistance
- **Analytics & Tracking**: Campaign performance, customer engagement, ROI tracking
- **CRM**: Customer relationship management with segmentation and personas
- **SMS Marketing**: Twilio-powered SMS campaigns and automated messaging
- **Website Builder**: AI-powered website creation (waitlist feature)
- **Team Collaboration**: Multi-member teams with role-based access
- **Onboarding**: Guided setup wizard collecting business info, tone samples, annual events

**Database & Technical Knowledge:**
- Built on Supabase (PostgreSQL) with Row Level Security
- Tables include: onboarding_responses, campaigns, content_tasks, social connections, newsletters
- Edge functions for AI content generation
- Integration with social platforms (Facebook, Instagram, YouTube)
- Seasonal content themes mapped to 52 weeks with prompts for AI generation

You are friendly, knowledgeable about horticulture and garden centre retail, and deeply technical about the BloomSuite platform. You can answer questions about lead generation strategy, marketing audits, content creation, campaign automation, database schema, app features, and garden centre business optimization.`,
    tasks: [
      'Generating weekly content calendar for garden centres...',
      'Running marketing audit scan on greenvalleygardens.com...',
      'Building automated email sequence for spring planting season...',
      'Analyzing lead conversion funnel from Marketing Snap reports...',
      'Creating AI-powered social post batch for Week 13: Spring Flower Power...',
      'Scoring competitor benchmarks across 6 marketing pillars...',
      'Optimizing newsletter cadence recommendations for Q2...',
    ],
  },
  {
    id: 'clinicleader',
    name: 'ClinicLeader',
    role: 'Clinic Ops Platform',
    product: 'ClinicLeader',
    colorVar: 'agent-clinic',
    colorHex: '#3b82f6',
    status: 'active',
    currentTask: 'Processing patient scheduling queue optimization...',
    systemPrompt: 'You are the ClinicLeader Agent — an AI specialist for clinic operations. You help with patient scheduling, staff management, compliance tracking, and healthcare workflow optimization. You are professional, HIPAA-aware, and focused on operational efficiency.',
    tasks: [
      'Processing patient scheduling queue optimization...',
      'Reviewing compliance audit checklist updates...',
      'Analyzing staff utilization across departments...',
      'Generating monthly operational KPI report...',
      'Configuring automated appointment reminders...',
    ],
  },
  {
    id: 'projectpath',
    name: 'ProjectPath',
    role: 'Construction OS',
    product: 'ProjectPath',
    colorVar: 'agent-project',
    colorHex: '#f59e0b',
    status: 'waiting',
    currentTask: 'Awaiting subcontractor bid submissions...',
    systemPrompt: 'You are the ProjectPath Agent — an AI specialist for construction project management. You help with bid management, scheduling, resource allocation, safety compliance, and construction workflow optimization. You speak in practical, construction-industry terms.',
    tasks: [
      'Awaiting subcontractor bid submissions...',
      'Calculating material cost projections Q3...',
      'Updating Gantt chart with weather delays...',
      'Cross-referencing safety inspection logs...',
      'Generating change order impact analysis...',
    ],
  },
  {
    id: 'discprofile',
    name: 'DISC Profile',
    role: 'Personality Assessments',
    product: 'DISC Profile',
    colorVar: 'agent-disc',
    colorHex: '#a855f7',
    status: 'active',
    currentTask: 'Processing batch assessment results for Team Alpha...',
    systemPrompt: 'You are the DISC Profile Agent — an AI specialist in personality assessments and team dynamics. You help with DISC profiling, team compatibility analysis, leadership coaching, and communication style optimization. You are insightful, empathetic, and psychology-informed.',
    tasks: [
      'Processing batch assessment results for Team Alpha...',
      'Generating team compatibility matrix report...',
      'Analyzing leadership style distribution patterns...',
      'Creating personalized coaching recommendations...',
      'Compiling quarterly engagement survey insights...',
    ],
  },
  {
    id: 'inbox',
    name: 'Inbox',
    role: 'Email & Comms',
    product: 'Inbox',
    colorVar: 'agent-inbox',
    colorHex: '#f97316',
    status: 'active',
    currentTask: 'Sorting 47 incoming messages by priority...',
    systemPrompt: 'You are the Inbox Agent — an always-on AI specialist for email and communications management. You help with email triage, response drafting, meeting scheduling, and communication workflow automation. You are efficient, concise, and always available.',
    tasks: [
      'Sorting 47 incoming messages by priority...',
      'Drafting follow-up responses for client emails...',
      'Scheduling cross-team sync meetings...',
      'Flagging urgent requests from VIP contacts...',
      'Archiving resolved support threads...',
    ],
  },
];
