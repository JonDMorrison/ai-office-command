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
    role: 'Garden Center SaaS',
    product: 'BloomSuite',
    colorVar: 'agent-bloom',
    colorHex: '#22c55e',
    status: 'active',
    currentTask: 'Optimizing inventory forecasting for spring season...',
    systemPrompt: 'You are the BloomSuite Agent — an AI specialist for garden center SaaS operations. You help with inventory management, seasonal forecasting, POS integrations, and garden center business optimization. You speak in a friendly, knowledgeable tone about horticulture and retail tech.',
    tasks: [
      'Optimizing inventory forecasting for spring season...',
      'Syncing POS data with supplier catalogs...',
      'Generating seasonal pricing recommendations...',
      'Analyzing foot traffic patterns vs sales data...',
      'Building automated reorder triggers for top sellers...',
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
