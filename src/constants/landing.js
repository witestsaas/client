import { Bot, Globe, Zap, BarChart3, Shield, GitBranch, Cpu, Layers, Monitor } from 'lucide-react';

export const codeLines = [
  { text: '✓ login_flow.spec.ts', color: '#22c55e' },
  { text: 'agent.navigate("/checkout")', color: '#ffb733' },
  { text: '✓ 248 tests passed', color: '#22c55e' },
  { text: 'AI: generating test cases...', color: '#60a5fa' },
  { text: 'assert(page.title).toBe("Home")', color: '#d4d4d4' },
  { text: '✓ api_health_check.spec.ts', color: '#22c55e' },
  { text: 'screenshot captured →', color: '#c084fc' },
  { text: 'agent.click("#submit-btn")', color: '#ffb733' },
];

export const features = [
  { icon: Bot,       title: 'Autonomous AI Agents',    desc: 'Smart agents that can move around, take actions, and fix issues on their own — no coding needed.', accent: '#ffb733' },
  { icon: Globe,     title: 'Real Browser Automation', desc: 'Works across all major browsers, with screenshots and recordings of what happens.',   accent: '#3b82f6' },
  { icon: Zap,       title: 'Parallel Execution',      desc: 'Handles lots of tasks at once and streams updates live, even with many agents running.',     accent: '#22c55e' },
  { icon: BarChart3, title: 'Deep AI Analytics',       desc: 'Uses AI to track test coverage, spot unstable tests, and monitor performance over time.',            accent: '#a855f7' },
  { icon: Shield,    title: 'Secure by Design',        desc: 'Secure login system with protected access and separate spaces for each organization.',      accent: '#ef4444' },
  { icon: GitBranch, title: 'CI/CD Native',            desc: 'Connects with tools like GitHub or GitLab and checks everything before changes are approved.',      accent: '#f97316' },
];

export const steps = [
  { number: '01', title: 'Connect your app',   desc: 'Point Qalion at your staging URL — no SDK, no code changes.',             icon: Globe,   color: '#ffb733' },
  { number: '02', title: 'AI generates tests', desc: 'functional-test-agent explores and auto-generates test scenarios.',        icon: Cpu,     color: '#3b82f6' },
  { number: '03', title: 'Execute at scale',   desc: 'Middleware queues and distributes across parallel browser agents.',        icon: Layers,  color: '#22c55e' },
  { number: '04', title: 'Monitor in real-time', desc: 'Socket.IO streams, instant alerts, and AI-generated reports.',          icon: Monitor, color: '#a855f7' },
];

export const stats = [
  { label: 'Tests executed daily',        value: 500, suffix: 'K+', color: '#ffb733' },
  { label: 'Average pass rate',           value: 98,  suffix: '%',  color: '#22c55e' },
  { label: 'Faster release cycles',       value: 3,   suffix: 'x',  color: '#60a5fa' },
  { label: 'Engineering hours saved/mo',  value: 240, suffix: 'h',  color: '#c084fc' },
];

export const testimonials = [
  { quote: "Qalion's AI agents caught a critical regression 2 hours before our release. We ship with confidence now.", author: 'Sarah M.', role: 'Head of Engineering, TechFlow' },
  { quote: "From 30% to 87% test coverage in a week. No test code written. This is the future of QA.",               author: 'James K.', role: 'CTO, Launchpad SaaS' },
  { quote: "The real-time Socket.IO dashboard is addictive. Watching tests run live during deploys is a game changer.", author: 'Amira L.', role: 'Senior QA Lead, Scalify' },
];

export const plans = [
  {
    name: 'Starter', price: 'Free', period: '', desc: 'Perfect to get started',
    features: ['Up to 50 tests/month', '1 browser agent', 'Real-time dashboard', 'Community support'],
    cta: 'Get started', highlight: false,
  },
  {
    name: 'Pro', price: '$499', period: '/mo', desc: 'For growing teams',
    features: ['Unlimited tests', '5 parallel agents', 'AI test generation', 'Slack & webhook alerts', 'Priority support'],
    cta: 'Start free trial', highlight: true,
  },
  {
    name: 'Enterprise', price: "Let's talk", period: '', desc: 'For large organisations',
    features: ['Unlimited everything', 'Dedicated agents', 'SSO & audit logs', 'SLA guarantee', 'Dedicated CSM'],
    cta: 'Contact sales', highlight: false,
  },
];

export const navLinks = ['Features', 'How it works', 'Pricing', 'Docs'];

export const footerColumns = [
  { title: 'Product',    links: ['Features', 'Pricing', 'Changelog', 'Roadmap'] },
  { title: 'Developers', links: ['Docs', 'API Reference', 'GitHub', 'Status'] },
  { title: 'Company',    links: ['About', 'Blog', 'Privacy', 'Terms'] },
];

export const logos = ['Playwright', 'LangChain', 'LangGraph', 'PostgreSQL', 'Redis', 'Socket.IO', 'Auth0', 'OpenAI'];
