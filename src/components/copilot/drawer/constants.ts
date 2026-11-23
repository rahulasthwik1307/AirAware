import { WorkspaceKey } from '@/domain/types';

export const WORKSPACE_PROMPT_CHIPS: Record<WorkspaceKey, readonly string[]> = {
  'indoor-air': [
    'Can indoor plants like Snake Plant and Areca Palm reduce indoor smog?',
    'What CADR purifier capacity is needed for my room size?',
    'When should I open my windows today during winter inversions?',
    'How does a Corsi-Rosenthal box fan compare to commercial units?',
  ],
  'family-planner': [
    'Can my child play outside this evening in Delhi?',
    'Is it safe for senior citizens to take a morning walk today?',
    'How should working professionals plan their commute during morning smog?',
    'Why does morning thermal inversion trap toxic particulate near ground?',
  ],
  'air-intelligence': [
    'What does India CPCB NAQI "Very Poor" mean for vulnerable families?',
    'Why does cold winter weather trap vehicle tailpipe exhaust near the ground?',
    'What is the difference between PM2.5 soot and Ozone?',
  ],
  'cleaner-choices': [
    'Why does electric metro save 80% emissions over solo car driving?',
    'How does combining weekend errand trips prevent cold-start smog spikes?',
    'What is the scientific distinction between personal exposure and carbon footprint?',
  ],
  'community-alerts': [
    'What are the mandatory restrictions under CAQM GRAP Stage IV?',
    'When does the daily thermal inversion breakup window occur today?',
    'How do I file an illegal garbage burning complaint on CPCB Sameer?',
    'What clean air advisory should our RWA share with apartment residents?',
  ],
};

export const WORKSPACE_LABELS: Record<WorkspaceKey, string> = {
  'air-intelligence': 'Air Intelligence',
  'family-planner': 'Family Daily Planner',
  'indoor-air': 'Indoor Air Intelligence',
  'cleaner-choices': 'Cleaner Choices & Impact',
  'community-alerts': 'Community & Alerts',
};
