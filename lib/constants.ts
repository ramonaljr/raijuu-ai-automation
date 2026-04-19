export const NAV_ITEMS = [
  { label: "About", href: "#about-section" },
  { label: "Values", href: "#values-section" },
  { label: "Services", href: "#service-section" },
  { label: "Process", href: "#process-section" },
  { label: "Projects", href: "#project-section" },
  { label: "Integrations", href: "#integrations-section" },
  { label: "Testimonials", href: "#testimonials-section" },
  { label: "Pricing", href: "#pricing-section" },
  { label: "Team", href: "#team-section" },
  { label: "FAQs", href: "#FAQ-section" },
] as const;

export const STATS = [
  { value: "500+", label: "saved hours" },
  { value: "80%", label: "productivity boost" },
  { value: "5x", label: "faster response" },
] as const;

export const VALUES = [
  {
    number: "01",
    title: "We start with your P&L, not the tech.",
    description:
      "Most automation projects fail by solving the wrong problem. We find the workflow with the fastest payback first — then build.",
    icon: "sparkles",
  },
  {
    number: "02",
    title: "One team, strategy to launch.",
    description:
      "No handoffs between strategist, builder, and support. You talk to the same people through scoping, build, and ongoing tune-ups.",
    icon: "rocket",
  },
  {
    number: "03",
    title: "Your workflows. Not a template.",
    description:
      "We don't resell a snapshot and call it custom. Every automation is fitted to how your team actually works today.",
    icon: "blocks",
  },
] as const;

export const SERVICES = [
  {
    title: "Stop copy-pasting between tools",
    description:
      "We wire your CRM, calendar, inbox, and docs together so work flows without a human in the middle.",
    features: [
      "Full workflow mapping",
      "Real-time cross-tool sync",
      "Exception handling that actually works",
    ],
    visual: "workflow",
  },
  {
    title: "Never lose an inbound lead at night again",
    description:
      "A 24/7 AI chat on your site that qualifies, books, and only hands off to a human when it matters.",
    visual: "chatbot",
  },
  {
    title: "Know the number before the Monday meeting",
    description:
      "Dashboards that refresh on their own and translate your data into plain English.",
    visual: "chart",
  },
  {
    title: "Your reps sell. The system does the admin.",
    description:
      "Lead scoring, follow-ups, pipeline hygiene — automatic. Reps spend time on deals, not data entry.",
    visual: "crm",
  },
  {
    title: "Personalization that doesn't feel creepy",
    description:
      "Emails, sequences, and content that match the buyer's moment — not a spray-and-pray blast.",
    visual: "marketing",
  },
] as const;

export const SECURITY_FEATURES = [
  "End-to-End Encryption",
  "Secure API Integrations",
  "Role-Based Access Control",
  "Data Minimization",
] as const;

export const PROCESS_STEPS = [
  {
    number: "01",
    title: "We audit your bottlenecks",
    description:
      "A working call plus async follow-ups. We map where your team is losing hours and where revenue is leaking.",
    icon: "search",
  },
  {
    number: "02",
    title: "You approve the blueprint",
    description:
      "We show the exact flow, the tools it replaces, and the payback math. If the numbers don't work, we tell you.",
    icon: "layout",
  },
  {
    number: "03",
    title: "We build. You review on Fridays.",
    description:
      "One demo every Friday, so nothing on launch day is a surprise. You approve each piece before it goes live.",
    icon: "settings",
  },
  {
    number: "04",
    title: "We test with real data",
    description:
      "We run your actual leads, emails, and records through the system before it touches a customer. First real run is never the first live run.",
    icon: "check",
  },
  {
    number: "05",
    title: "Live — with ongoing tune-ups",
    description:
      "We monitor, fix, and refine as your ops evolve. Monthly cadence, same team.",
    icon: "rocket",
  },
] as const;

export const CASE_STUDIES = [
  {
    title: "How ScaleLabs grew enrollment 35% in 90 days",
    description:
      "Enrollment used to mean manual follow-ups and spreadsheet tracking. Now AI qualifies leads, schedules calls, sends reminders, and updates the CRM — without a single human touch.",
    metrics: [
      { value: "+35%", label: "Enrollment Conversion" },
      { value: "+40%", label: "Demo Booking" },
      { value: "3x", label: "Lead Engagement" },
    ],
    image: "/images/case-study-1.jpg",
  },
  {
    title: "How a creative agency cut admin work by 62%",
    description:
      "Project coordination, task assignment, and client status updates were eating 25 hours a week. We connected their tools into one loop so work moves itself — and delivery got 38% faster.",
    metrics: [
      { value: "+38%", label: "Faster Delivery" },
      { value: "-62%", label: "Admin Work" },
      { value: "4x", label: "Team Productivity" },
    ],
    image: "/images/case-study-2.jpg",
  },
  {
    title: "How a realty team doubled viewing bookings",
    description:
      "Buyer inquiries came in at 11pm and got lost by morning. An AI chat now qualifies properties, answers questions, and books viewings — 24/7. Admin work dropped 50%, bookings doubled.",
    metrics: [
      { value: "3x", label: "Lead Response" },
      { value: "+40%", label: "Viewing Bookings" },
      { value: "24/7", label: "Buyer Engagement" },
    ],
    image: "/images/case-study-3.jpg",
  },
] as const;

export const INTEGRATION_ROWS = [
  [
    "HubSpot",
    "Salesforce",
    "Pipedrive",
    "Zoho",
    "Monday",
    "Close",
    "Airtable",
    "ClickUp",
    "Notion",
    "Google Workspace",
  ],
  [
    "Gmail",
    "Outlook",
    "Slack",
    "WhatsApp",
    "Intercom",
    "Drift",
    "Zoom",
    "Calendly",
    "Twilio",
    "Crisp",
  ],
  [
    "Mailchimp",
    "Klaviyo",
    "ConvertKit",
    "ActiveCampaign",
    "Meta Ads",
    "Google Ads",
    "Stripe",
    "QuickBooks",
    "Shopify",
    "Custom APIs",
  ],
] as const;

export const TESTIMONIALS = [
  {
    name: "David Lee",
    role: "Founder, Atodio Studio",
    quote:
      "We were spending hours on repetitive tasks. Their system saved us 30+ hours per week and sales performance went up alongside it.",
    avatar: "/images/avatar-1.jpg",
  },
  {
    name: "Daniel Kim",
    role: "Founder, ScaleLabs Education",
    quote:
      "Our enrollment used to need manual follow-ups and spreadsheet tracking. Now AI handles qualification, scheduling, reminders, and CRM updates. Enrollment conversion jumped 35% in a single quarter.",
    avatar: "/images/avatar-2.jpg",
  },
  {
    name: "Alex Johnson",
    role: "Head of Operations, Finovate Consulting",
    quote:
      "Security and compliance were non-negotiable for us. They designed an architecture that was efficient and matched our security posture — which very few agencies can actually deliver on.",
    avatar: "/images/avatar-3.jpg",
  },
  {
    name: "Sarah Mitchell",
    role: "COO, BrightPath SaaS",
    quote:
      "We struggled with inconsistent follow-ups and slow response times. They gave us clarity first, execution second. Our CRM now runs itself — demo bookings up 40%, operational friction gone.",
    avatar: "/images/avatar-4.jpg",
  },
  {
    name: "Jonathan Reed",
    role: "Managing Director, Nexora Digital Agency",
    quote:
      "We were scaling fast but drowning in manual work. They connected our CRM, email, and reporting into one flow. 30+ hours saved per week and full pipeline visibility.",
    avatar: "/images/avatar-5.jpg",
  },
  {
    name: "Michael Tran",
    role: "Founder & CEO, Skyline Realty Group",
    quote:
      "Admin work dropped nearly 50% and qualified appointments doubled. ROI was faster than we'd projected — and the system keeps scaling with us.",
    avatar: "/images/avatar-6.jpg",
  },
  {
    name: "Laura Martinez",
    role: "CMO, Elevate Commerce Co.",
    quote:
      "Marketing automation always felt fragmented — too many tools, not enough cohesion. They unified everything into one ecosystem. Triggers, abandoned carts, segmentation — automated with precision.",
    avatar: "/images/avatar-7.jpg",
  },
] as const;

export const PRICING_PLANS = {
  monthly: [
    {
      name: "More Leads",
      description: "Catch every lead, even at 2 AM.",
      price: "$299",
      period: "/month",
      features: [
        "A high-converting landing page",
        "24/7 AI chatbot that qualifies & books",
        "CRM + calendar + inbox connected",
      ],
      cta: "Get more leads",
      popular: false,
      includes: "What's included:",
    },
    {
      name: "More Sales",
      description: "Now fill the funnel.",
      price: "$499",
      period: "/month",
      features: [
        "Everything in More Leads",
        "Paid ads we run (Meta + Google)",
        "Email & SMS sequences that adapt",
        "Weekly performance report",
      ],
      cta: "Get more sales",
      popular: true,
      includes: "Everything in More Leads, plus:",
    },
    {
      name: "Less Admin",
      description: "Your marketing, sales, and ops run themselves.",
      price: "From $1,999",
      period: "/month",
      features: [
        "Everything in More Sales",
        "Custom workflow automations (scoped with you)",
        "Lead-to-close ops automation",
        "Scales as you add more automations",
        "+ one-time scoping fee, confirmed on fit call",
      ],
      cta: "Cut the admin",
      popular: false,
      includes: "Everything in More Sales, plus:",
    },
  ],
  annually: [
    {
      name: "More Leads",
      description: "Catch every lead, even at 2 AM.",
      price: "$299",
      period: "/month",
      features: [
        "A high-converting landing page",
        "24/7 AI chatbot that qualifies & books",
        "CRM + calendar + inbox connected",
      ],
      cta: "Get more leads",
      popular: false,
      includes: "What's included:",
    },
    {
      name: "More Sales",
      description: "Now fill the funnel.",
      price: "$499",
      period: "/month",
      features: [
        "Everything in More Leads",
        "Paid ads we run (Meta + Google)",
        "Email & SMS sequences that adapt",
        "Weekly performance report",
      ],
      cta: "Get more sales",
      popular: true,
      includes: "Everything in More Leads, plus:",
    },
    {
      name: "Less Admin",
      description: "Your marketing, sales, and ops run themselves.",
      price: "From $1,999",
      period: "/month",
      features: [
        "Everything in More Sales",
        "Custom workflow automations (scoped with you)",
        "Lead-to-close ops automation",
        "Scales as you add more automations",
        "+ one-time scoping fee, confirmed on fit call",
      ],
      cta: "Cut the admin",
      popular: false,
      includes: "Everything in More Sales, plus:",
    },
  ],
} as const;

export const TEAM_MEMBERS = [
  {
    name: "Ramon A. Vallejera, Jr.",
    role: "CEO & Founder",
    image: "/images/team-1.jpg",
    socials: {
      facebook: "https://facebook.com",
      linkedin: "https://linkedin.com",
      twitter: "https://x.com",
    },
  },
  {
    name: "Stephanie A. Anacio",
    role: "Finance Manager",
    image: "/images/team-2.jpg",
    socials: {
      facebook: "https://facebook.com",
      linkedin: "https://linkedin.com",
      twitter: "https://x.com",
    },
  },
  {
    name: "Li Joon Ki",
    role: "Design Lead",
    image: "/images/team-3.jpg",
    socials: {
      facebook: "https://facebook.com",
      linkedin: "https://linkedin.com",
      twitter: "https://x.com",
    },
  },
  {
    name: "Gwenchana Gwenchana",
    role: "Tech Lead",
    image: "/images/team-4.jpg",
    socials: {
      facebook: "https://facebook.com",
      linkedin: "https://linkedin.com",
      twitter: "https://x.com",
    },
  },
  {
    name: "Rebecca",
    role: "Marketing Lead",
    image: "/images/team-5.jpg",
    socials: {
      facebook: "https://facebook.com",
      linkedin: "https://linkedin.com",
      twitter: "https://x.com",
    },
  },
  {
    name: "Doo Sik",
    role: "Customer Relations",
    image: "/images/team-6.jpg",
    socials: {
      facebook: "https://facebook.com",
      linkedin: "https://linkedin.com",
      twitter: "https://x.com",
    },
  },
  {
    name: "Dong Gu",
    role: "Human Resource Manager",
    image: "/images/team-7.jpg",
    socials: {
      facebook: "https://facebook.com",
      linkedin: "https://linkedin.com",
      twitter: "https://x.com",
    },
  },
] as const;

export const FAQS = [
  {
    question: "How is this different from hiring a freelancer or a big agency?",
    answer:
      "A freelancer usually hands you one asset and disappears. A big agency typically starts around $5k–$15k/month with long discovery phases. We sit in the middle: productized pricing starting at $299/month, with one team that owns strategy, build, and ongoing tune-ups.",
  },
  {
    question: "How much does AI workflow automation cost for a small business?",
    answer:
      "Our plans start at $299/month for a landing page + AI chatbot, $499/month to add paid ads management, and from $1,999/month for the top tier with custom workflow automations. The top tier includes a one-time scoping fee, confirmed on the fit call.",
  },
  {
    question: "How long does implementation take?",
    answer:
      "Timelines depend on tier and scope. More Leads and More Sales deployments are faster because they're productized; Less Admin projects take longer because they include custom workflow automations and deeper integrations. You'll see a demo each Friday during the build, so there are no launch-day surprises.",
  },
  {
    question: "Do we need technical knowledge to work with you?",
    answer:
      "No. We handle strategy, build, launch, and ongoing tune-ups. Your team uses a simple dashboard — no scripts, no code, no new tools to learn. We also train your team and provide plain-English documentation.",
  },
  {
    question: "What industries do you work with?",
    answer:
      "SaaS, real estate, education, e-commerce, financial services, healthcare, and professional services. Our systems adapt to any business that runs on workflows, customer conversations, or data hand-offs — which is most of them.",
  },
  {
    question: "Is my data secure?",
    answer:
      "Yes. We use end-to-end encryption, secure API integrations, role-based access, and data minimization by default. Data stays in-region where possible, and we're happy to walk through the architecture with your security team as part of scoping.",
  },
  {
    question: "What ROI can we expect?",
    answer:
      "Clients typically report measurable ROI within the first few months — common outcomes include 30+ hours saved per week and meaningful lifts in conversion. Exact numbers depend on your current workflows and scope, and we show the payback math in the blueprint before you commit to build.",
  },
] as const;

export const SOCIAL_LINKS = [
  { name: "LinkedIn", href: "https://www.linkedin.com" },
  { name: "Instagram", href: "https://www.instagram.com/" },
  { name: "Facebook", href: "https://www.facebook.com/" },
  { name: "Twitter X", href: "https://www.x.com" },
] as const;

export const CLIENT_LOGOS = [
  "SaaS Teams",
  "Real Estate",
  "Education",
  "E-commerce",
  "Consulting",
  "Agencies",
  "Financial Services",
] as const;
