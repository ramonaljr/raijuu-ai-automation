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
    title: "Business-First AI Strategy",
    description: "We design solutions aligned with your revenue goals.",
    icon: "sparkles",
  },
  {
    number: "02",
    title: "End-to-End Implementation",
    description: "From strategy to development, followed by deployment.",
    icon: "rocket",
  },
  {
    number: "03",
    title: "Custom-Built Automation",
    description:
      "No templates. Every workflow is tailored to your unique operations.",
    icon: "blocks",
  },
] as const;

export const SERVICES = [
  {
    title: "AI Workflow Automation",
    description:
      "Automate repetitive tasks across departments using intelligent triggers and decision logic.",
    features: [
      "Workflow mapping",
      "Real-time system integration.",
      "Validated output",
    ],
    visual: "workflow",
  },
  {
    title: "AI Chatbots & Conversational Agents",
    description:
      "24/7 customer support, lead qualification, booking systems, and AI sales reps.",
    visual: "chatbot",
  },
  {
    title: "AI Data & Reporting Systems",
    description:
      "Automated dashboards, business intelligence, performance forecasting.",
    visual: "chart",
  },
  {
    title: "CRM & Sales Automation",
    description:
      "Pipeline automation, AI lead scoring, follow-ups, predictive insights.",
    visual: "crm",
  },
  {
    title: "Marketing Automation",
    description:
      "Email sequences, personalization engines, AI-generated content systems.",
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
    title: "Discovery & Audit",
    description:
      "We analyze your workflows, bottlenecks, and revenue opportunities.",
    icon: "search",
  },
  {
    number: "02",
    title: "Automation Blueprint",
    description:
      "We design a detailed automation architecture aligned with KPIs.",
    icon: "layout",
  },
  {
    number: "03",
    title: "Build & Integration",
    description:
      "Our engineers implement AI systems and integrate with your existing tools.",
    icon: "settings",
  },
  {
    number: "04",
    title: "Testing & Optimization",
    description: "Performance testing, data validation, refinement.",
    icon: "check",
  },
  {
    number: "05",
    title: "Deployment & Scaling",
    description: "Launch, monitor, and continuously optimize for growth.",
    icon: "rocket",
  },
] as const;

export const CASE_STUDIES = [
  {
    title: "AI Workflow Automation for SaaS Company",
    description:
      "We analyze your workflows, bottlenecks, and revenue opportunities.",
    metrics: [
      { value: "+40%", label: "Demo Booking" },
      { value: "+25%", label: "Closing Rate" },
      { value: "3x", label: "Engagement" },
    ],
    image: "/images/case-study-1.jpg",
  },
  {
    title: "AI Project Management Automation for Creative Teams",
    description:
      "Streamlining project coordination and task assignments for faster delivery and smoother collaboration.",
    metrics: [
      { value: "+38%", label: "Faster Delivery" },
      { value: "-62%", label: "Admin Work" },
      { value: "4x", label: "Productivity" },
    ],
    image: "/images/case-study-2.jpg",
  },
  {
    title: "AI Property Inquiry Chatbot for Real Estate Firms",
    description:
      "An intelligent chatbot that qualifies property inquiries, answers buyer questions, and schedules property viewings automatically.",
    metrics: [
      { value: "3x", label: "Lead Response" },
      { value: "+40%", label: "Viewing Bookings" },
      { value: "24/7", label: "Engagement" },
    ],
    image: "/images/case-study-3.jpg",
  },
] as const;

export const INTEGRATION_ROWS = [
  [
    "HubSpot",
    "Salesforce",
    "Zoho",
    "Mailchimp",
    "ActiveCampaign",
    "Zapier",
    "OpenAI",
    "Cloud AI",
    "Make",
    "Custom APIs",
  ],
  [
    "Pipedrive",
    "Monday",
    "Copper",
    "Close",
    "Klaviyo",
    "Marketo",
    "Brevo",
    "ConvertKit",
    "N8N",
    "Customerio",
  ],
  [
    "Pabbly",
    "Workato",
    "Anthropic",
    "Vertex",
    "Azure",
    "Hugging Face",
    "Intercom",
    "Drift",
    "Crisp",
    "LiveChat",
  ],
] as const;

export const TESTIMONIALS = [
  {
    name: "David Lee",
    role: "Founder, Atodio Studio",
    quote:
      "We were spending hours on repetitive tasks. Their automation system saved us 30+ hours per week and dramatically improved our sales performance.",
    avatar: "/images/avatar-1.jpg",
  },
  {
    name: "Daniel Kim",
    role: "Founder, ScaleLabs Education",
    quote:
      "Our enrollment process used to require manual follow-ups and spreadsheet tracking. Now, AI handles lead qualification, scheduling, reminders, and CRM updates automatically. We've increased enrollment conversion by 35% in just one quarter.",
    avatar: "/images/avatar-2.jpg",
  },
  {
    name: "Alex Johnson",
    role: "Head of Operations, Finovate Consulting",
    quote:
      "Security and compliance were major concerns for us. They designed an automation architecture that was not only efficient but enterprise-grade secure.",
    avatar: "/images/avatar-3.jpg",
  },
  {
    name: "Sarah Mitchell",
    role: "COO, BrightPath SaaS",
    quote:
      "We struggled with inconsistent lead follow-ups and slow response times. Their AI automation blueprint gave us clarity first, then execution. Now, our CRM runs intelligently, leads are scored automatically, and follow-ups happen without manual effort. We've increased demo bookings by 40% while reducing operational friction.",
    avatar: "/images/avatar-4.jpg",
  },
  {
    name: "Jonathan Reed",
    role: "Managing Director, Nexora Digital Agency",
    quote:
      "We were scaling fast but drowning in manual workflows. Their automation system connected our CRM, email marketing, and reporting into one intelligent flow. The result? 30+ hours saved per week and complete visibility across our pipeline.",
    avatar: "/images/avatar-5.jpg",
  },
  {
    name: "Michael Tran",
    role: "Founder & CEO, Skyline Realty Group",
    quote:
      "We reduced admin work by nearly 50% and doubled our qualified appointment bookings. The ROI was faster than we expected — and the system continues to scale with us.",
    avatar: "/images/avatar-6.jpg",
  },
  {
    name: "Laura Martinez",
    role: "CMO, Elevate Commerce Co.",
    quote:
      "Marketing automation always felt fragmented — too many tools, not enough cohesion. They unified everything into one intelligent ecosystem. Campaign triggers, abandoned cart flows, segmentation — all automated with precision.",
    avatar: "/images/avatar-7.jpg",
  },
] as const;

export const PRICING_PLANS = {
  monthly: [
    {
      name: "Starter Automation",
      description: "For small teams beginning their journey",
      price: "$499.00",
      period: "/Month",
      features: [
        "Workflow setup (1\u20133 systems)",
        "Basic AI chatbot",
        "CRM integration",
      ],
      cta: "Get Starter Package",
      popular: false,
      includes: "What's included:",
    },
    {
      name: "Growth Automation",
      description: "For scaling businesses",
      price: "$1199.00",
      period: "/Month",
      features: [
        "Advanced workflow automation",
        "Multi-channel AI chatbot",
        "Sales & marketing automation",
        "Dashboard & reporting",
      ],
      cta: "Get Growth Package",
      popular: true,
      includes: "Included everything in Starter, plus:",
    },
  ],
  annually: [
    {
      name: "Starter Automation",
      description: "For small teams beginning their journey",
      price: "$399.00",
      period: "/Month",
      features: [
        "Workflow setup (1\u20133 systems)",
        "Basic AI chatbot",
        "CRM integration",
      ],
      cta: "Get Starter Package",
      popular: false,
      includes: "What's included:",
    },
    {
      name: "Growth Automation",
      description: "For scaling businesses",
      price: "$1099.00",
      period: "/Month",
      features: [
        "Advanced workflow automation",
        "Multi-channel AI chatbot",
        "Sales & marketing automation",
        "Dashboard & reporting",
      ],
      cta: "Get Growth Package",
      popular: true,
      includes: "Included everything in Starter, plus:",
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
    question: "What industries do you work with?",
    answer:
      "We work across a wide range of industries including SaaS, real estate, e-commerce, education, financial services, healthcare, and professional services. Our AI automation solutions are adaptable to any business that relies on workflows, customer interactions, or data processing.",
  },
  {
    question: "How long does implementation take?",
    answer:
      "Project timelines typically range from 2 to 6 weeks, depending on complexity. Smaller automation systems \u2014 such as AI chatbots with CRM integration \u2014 can often be deployed within 2\u20133 weeks. More advanced projects involving multi-platform integrations, custom AI logic, internal workflow automation, and reporting dashboards may take 4\u20136 weeks or longer.",
  },
  {
    question: "Do we need technical knowledge to work with you?",
    answer:
      "Not at all. We handle everything from strategy to deployment. Our team works closely with you to understand your business needs, and we build systems that your team can use without any technical expertise. We also provide training and documentation.",
  },
  {
    question: "Is AI automation secure?",
    answer:
      "Absolutely. Security is built into every layer of our automation architecture. We use end-to-end encryption, secure API integrations, role-based access control, and data minimization practices. All systems are designed to meet enterprise-grade security standards.",
  },
  {
    question: "What kind of ROI can we expect?",
    answer:
      "Most clients see measurable ROI within the first 30\u201360 days. Common outcomes include 30+ hours saved per week, 25\u201340% increases in conversion rates, and significant reductions in operational costs. The exact ROI depends on your current workflows and automation scope.",
  },
] as const;

export const SOCIAL_LINKS = [
  { name: "LinkedIn", href: "https://www.linkedin.com" },
  { name: "Instagram", href: "https://www.instagram.com/" },
  { name: "Facebook", href: "https://www.facebook.com/" },
  { name: "Twitter X", href: "https://www.x.com" },
] as const;

export const CLIENT_LOGOS = [
  "Logoipsum",
  "Cripto",
  "Ipsum",
  "Logoipsum",
  "Ipsum",
  "Logoipsum",
  "Ipsum",
] as const;
