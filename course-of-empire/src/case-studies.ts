// Adapted with the owner's permission from Ramon's AI Automation Portfolio.
// Working demonstration builds for fictional clients; not paid-client outcome claims.
export type PortfolioStudy = {
  slug: string; title: string; description: string; category: string; platform: string;
  organisation: string; image: string; logic: string; problem: string; solution: string;
  outcome: { value: string; label: string }; integrations: string[]; repoUrl: string;
  roi: { value: string; label: string; desc?: string }[]; failsafeHeadline: string;
  failsafeDesc: string; sampleClient: boolean;
};

export const CASE_STUDIES: PortfolioStudy[] = [
  {
    "slug": "ai-invoice-processing-approval",
    "title": "AI Invoice Processing & Approval",
    "description": "Reads invoices from Gmail, skips duplicates, has AI pull out the details, checks them against purchase orders and delivery records, gets approval in Slack and adds the bill to QuickBooks. Built for construction, including progress payments, retention and lien waivers.",
    "category": "Finance",
    "platform": "n8n",
    "organisation": "Construction Finance",
    "image": "assets/portfolio/ai-invoice-processing-approval.webp",
    "logic": "Invoice email → PDF text → duplicate check → AI reads the invoice → checked against PO and delivery record → approval in Slack → bill added to QuickBooks → logged.",
    "problem": "Construction invoices arrived by email and were checked by hand against purchase orders, delivery records and contract values. Progress payments made it easy to pay for the same work twice, pay in full when retention should be held back, or pay without a signed lien waiver.",
    "solution": "Built an n8n workflow that picks up invoice emails every 5 minutes, skips duplicates, has AI extract every billing figure, and checks them with fixed rules against the purchase order and delivery record in Airtable. Clean invoices go to the budget owner and invoices with issues to accounts payable, both in Slack. Approved bills are added to QuickBooks at the amount to pay after retention, and every outcome is logged.",
    "outcome": {
      "value": "3-way",
      "label": "Invoice, PO & delivery match"
    },
    "integrations": [
      "n8n",
      "QuickBooks",
      "Gmail",
      "Airtable",
      "Slack",
      "OpenAI"
    ],
    "repoUrl": "https://github.com/ramonaljr/n8n-ai-invoice-processing-approval",
    "roi": [
      {
        "value": "3-way",
        "label": "Invoice, PO & delivery match",
        "desc": "Each invoice is checked against its purchase order and delivery record before an approver sees it, so overbilling and missing deliveries are already flagged."
      },
      {
        "value": "2",
        "label": "Duplicate checks",
        "desc": "Once before the AI reads the invoice and once after, by vendor and invoice number, so a bill sent twice is never paid twice."
      },
      {
        "value": "100%",
        "label": "Invoices logged",
        "desc": "Approved, rejected or flagged, every invoice is logged with its outcome, so finance can see what happened to any bill and why."
      }
    ],
    "failsafeHeadline": "Nothing posts without approval",
    "failsafeDesc": "Every bill is approved by a person in Slack before it reaches QuickBooks, and anything uncertain is checked first.",
    "sampleClient": true
  },
  {
    "slug": "solar-lead-scoring-follow-up",
    "title": "Lead Scoring & Follow-Up",
    "description": "Website leads get a reply in under a second, then AI reads the enquiry, fixed rules score it, the right sales rep is assigned and alerted, and the lead gets a personal reply. If nobody follows up within 15 working minutes, the sales manager takes it.",
    "category": "Sales",
    "platform": "n8n",
    "organisation": "Commercial Solar Sales",
    "image": "assets/portfolio/solar-lead-scoring-follow-up.webp",
    "logic": "Website form → instant reply → check for existing lead → AI reads the enquiry → rule-based score → assign rep → personal reply → Slack alert → manager steps in after 15 working minutes.",
    "problem": "Website enquiries landed in an inbox and waited. Good leads went cold before anyone called, reps were assigned unevenly, existing customers and repeat enquiries were treated as new, and nobody noticed when a lead was never followed up.",
    "solution": "Built an n8n workflow that replies to the website form in under a second, checks Airtable for existing customers and repeat enquiries, has AI read the message, scores the lead by fixed rules, assigns the next rep for that lead type, sends a personal reply and alerts the rep in Slack. A check every 5 minutes hands any lead not followed up within 15 working minutes to the sales manager. Leads that arrive overnight or at the weekend are due at 08:15 the next working morning.",
    "outcome": {
      "value": "15 min",
      "label": "Follow-up deadline"
    },
    "integrations": [
      "n8n",
      "Airtable",
      "Gmail",
      "Slack",
      "OpenAI"
    ],
    "repoUrl": "https://github.com/ramonaljr/n8n-lead-scoring-follow-up",
    "roi": [
      {
        "value": "< 1 sec",
        "label": "Reply to the form",
        "desc": "The visitor gets a reply the moment they submit the form, before the AI has even read the enquiry or a rep is assigned."
      },
      {
        "value": "15 min",
        "label": "Follow-up deadline",
        "desc": "If the assigned rep has not followed up within 15 working minutes, the lead goes to the sales manager. Overnight and weekend leads are due at 08:15 the next working morning."
      },
      {
        "value": "100",
        "label": "Point rule-based score",
        "desc": "Fixed rules award points for electricity use, ownership, roof type and age, urgency and more, and list the reasons, so every score can be explained."
      }
    ],
    "failsafeHeadline": "No lead slips through",
    "failsafeDesc": "Leads without a rep, or not followed up in 15 working minutes, are reassigned to the sales manager and logged.",
    "sampleClient": true
  },
  {
    "slug": "ai-customer-support-agent",
    "title": "AI WhatsApp Customer Support Agent",
    "description": "A WhatsApp support agent for an online outdoor gear store that answers from the store policies, looks up orders and stock, accepts photos of damaged items, sends refunds to a person in Slack for approval, and turns a handover into a live chat between the customer on WhatsApp and the team in a Slack thread. Built with n8n, the WhatsApp Business Cloud API, OpenAI and Airtable.",
    "category": "Support",
    "platform": "n8n",
    "organisation": "Online Outdoor Store",
    "image": "assets/portfolio/ai-customer-support-agent.webp",
    "logic": "Customer messages on WhatsApp → agent searches the store policies and looks up the order or stock → answers in a few sentences → refunds go to a person in Slack, and the decision is emailed to the customer → an upset customer becomes a live chat in a Slack thread → every conversation is logged.",
    "problem": "A small online store answered every support message by hand: where is my order, can I return this, does this boot run small. The same few questions took most of the day, replies slowed down when the team was busy, and nothing came back at night or at weekends.",
    "solution": "Built an n8n support agent on WhatsApp, using OpenAI, that answers only from the store policies document and the real order and stock records in Airtable. A new chat starts with a greeting that asks for the customer name, email and order number, and routine questions go to a smaller, cheaper model while refunds, complaints and anything risky go to the full model. It asks for the order number and email before sharing anything about an order. Anything involving money, and any upset or unusual case, goes to a person in Slack instead of being promised in the chat. A handed-over customer keeps chatting on WhatsApp while the team replies from a Slack thread.",
    "outcome": {
      "value": "24/7",
      "label": "Customers answered"
    },
    "integrations": [
      "n8n",
      "WhatsApp",
      "OpenAI",
      "Airtable",
      "Slack",
      "Gmail",
      "Google Drive"
    ],
    "repoUrl": "https://github.com/ramonaljr/n8n-ai-customer-support-agent",
    "roi": [
      {
        "value": "24/7",
        "label": "Customers answered",
        "desc": "Order status, returns, shipping and product questions are answered straight away, nights and weekends included."
      },
      {
        "value": "30",
        "label": "Test questions",
        "desc": "A fixed set of 30 customer messages is re-run after every change. After the first fixes, all 30 passed in four of five runs and 29 in the other (on the earlier GPT-5.4 models)."
      },
      {
        "value": "0",
        "label": "Refunds promised by the bot",
        "desc": "Every refund, replacement or discount is sent to a person in Slack, who approves or rejects it before the customer hears back."
      }
    ],
    "failsafeHeadline": "Answers only what it can check",
    "failsafeDesc": "The agent answers from the policies document and the store records, asks for proof before sharing order details, and hands anything it cannot settle to a person.",
    "sampleClient": true
  },
  {
    "slug": "ai-unpaid-invoice-reminders",
    "title": "AI Unpaid Invoice Reminders",
    "description": "Every morning, checks QuickBooks, Pipedrive and the collections database for unpaid invoices and sends reminders by set rules. AI writes the emails and reads customer replies; a dispute stops all reminders until a person resolves it.",
    "category": "Finance",
    "platform": "n8n",
    "organisation": "Staffing & Collections",
    "image": "assets/portfolio/ai-unpaid-invoice-reminders.webp",
    "logic": "Daily check → unpaid invoices from QuickBooks → customer context and reminder history → policy rules decide who to remind → AI writes the email → sent and recorded → replies read by AI → dispute stops reminders.",
    "problem": "Chasing unpaid invoices was manual and inconsistent. Reminders went out too often or not at all, customers who had disputed an invoice or promised a date kept getting chased, and replies sat unread while the next reminder went out.",
    "solution": "Built an n8n workflow that runs every morning. It pulls unpaid invoices from QuickBooks, client context from Pipedrive and reminder history from Postgres, and fixed policy rules decide who gets reminded and how firmly. AI writes each email within the approved policy. Customer replies are read by AI and routed: a dispute stops all reminders until a person clears it, and promises, payments, copy requests and wrong contacts each set the next step.",
    "outcome": {
      "value": "0",
      "label": "Reminders during a dispute"
    },
    "integrations": [
      "n8n",
      "QuickBooks",
      "Pipedrive",
      "PostgreSQL",
      "Gmail",
      "Slack",
      "Airtable",
      "OpenAI"
    ],
    "repoUrl": "https://github.com/ramonaljr/n8n-ai-unpaid-invoice-reminders",
    "roi": [
      {
        "value": "0",
        "label": "Reminders during a dispute",
        "desc": "Once a customer disputes an invoice, reminders stop until a person clears it. No timer restarts them, so nobody is chased over a bill they are contesting."
      },
      {
        "value": "1",
        "label": "Row per invoice, enforced",
        "desc": "The database allows only one record per invoice, so even if the workflow runs twice, a customer never gets the same reminder twice."
      },
      {
        "value": "7",
        "label": "Reply types understood",
        "desc": "Replies are sorted into disputes, promises to pay, payments already sent, invoice copy requests, wrong contacts and payment questions, and each sets its own next step. Anything else goes to a person."
      }
    ],
    "failsafeHeadline": "A dispute stops everything",
    "failsafeDesc": "A disputed invoice gets no more reminders until a person clears it. No timer, no automatic restart.",
    "sampleClient": true
  },
  {
    "slug": "ai-prospecting-apollo",
    "title": "AI Prospecting with Apollo",
    "description": "Finds decision-makers in Apollo, scores them by fixed rules, researches each company website with AI and drafts a first email, then queues everyone in a Google Sheet for the team to approve. Approved prospects land in Pipedrive with the research attached. Nothing is sent automatically.",
    "category": "Sales",
    "platform": "n8n",
    "organisation": "Sales Prospecting",
    "image": "assets/portfolio/ai-prospecting-apollo.webp",
    "logic": "Request form → Apollo search → skip known prospects → enrich → rule-based score → AI researches the website and drafts an email → review sheet → approved prospects into Pipedrive.",
    "problem": "Outbound prospecting meant searching for contacts by hand, checking whether they had been contacted before, reading each company website and writing every first email from scratch. Apollo credits were spent on poor-fit contacts, and the same people were easily contacted twice.",
    "solution": "Built an n8n workflow where the sales team fills in one form. Apollo finds matching decision-makers, anyone already in the prospects sheet is skipped, the best are enriched and scored by fixed rules, AI reads each company website and drafts a grounded first email, and everything waits in a Google Sheet for the team to approve. Every 15 minutes, approved prospects are added to Pipedrive with the research pinned to a new deal.",
    "outcome": {
      "value": "0",
      "label": "Emails sent without review"
    },
    "integrations": [
      "n8n",
      "Apollo",
      "Pipedrive",
      "Google Sheets",
      "Slack",
      "OpenAI"
    ],
    "repoUrl": "https://github.com/ramonaljr/n8n-ai-prospecting-apollo",
    "roi": [
      {
        "value": "0",
        "label": "Emails sent without review",
        "desc": "The AI researches and drafts, but a person reads and approves every prospect. Nothing goes out on its own."
      },
      {
        "value": "60+",
        "label": "Score needed for review",
        "desc": "Prospects are scored out of 100 on seniority, title, verified email, company size and industry. Only those at 60 or more with a verified email reach the review queue."
      },
      {
        "value": "15 min",
        "label": "Approved to Pipedrive",
        "desc": "Mark a prospect approved in the sheet and within 15 minutes it is a new deal in Pipedrive, with the research attached."
      }
    ],
    "failsafeHeadline": "A person approves every prospect",
    "failsafeDesc": "Nothing is emailed automatically. Prospects only reach the CRM once the team marks them approved in the sheet.",
    "sampleClient": true
  },
  {
    "slug": "ai-appointment-setter",
    "title": "AI Appointment Setter",
    "description": "An AI voice agent that answers calls, checks the calendar, and books, moves or cancels appointments while the caller is still on the line, keeping Google Calendar and Airtable in step. Built with VAPI and n8n.",
    "category": "Sales",
    "platform": "n8n",
    "organisation": "Appointments & Voice AI",
    "image": "assets/portfolio/ai-appointment-setter.webp",
    "logic": "Caller asks for a time → agent checks Google Calendar → offers free times → books, moves or cancels the event → confirms on the call → call result saved in Airtable.",
    "problem": "Calls that came in after hours or while the team was busy went unanswered, and most callers never left a voicemail. The calls that were answered meant reading out free times, typing bookings into the calendar by hand, and doing it again whenever someone needed to reschedule or cancel, with the calendar and the records often out of step.",
    "solution": "Built five n8n flows that a VAPI voice agent calls during the conversation: one checks free times in Google Calendar, one checks the slot is still free, books it and logs it in Airtable, one finds an existing appointment and moves it once the new time is confirmed free, one finds and cancels it, and one saves the result of every call.",
    "outcome": {
      "value": "24/7",
      "label": "Booking line open"
    },
    "integrations": [
      "n8n",
      "VAPI",
      "Google Calendar",
      "Airtable"
    ],
    "repoUrl": "https://github.com/ramonaljr/n8n-ai-appointment-setter",
    "roi": [
      {
        "value": "24/7",
        "label": "Booking line open",
        "desc": "The voice agent answers every call, nights and weekends included, so a caller who rings after hours still leaves with an appointment."
      },
      {
        "value": "4",
        "label": "Caller requests handled",
        "desc": "Callers can ask for free times, book, move or cancel, and each request is finished on the call with nothing left for staff to do."
      },
      {
        "value": "2",
        "label": "Systems kept in step",
        "desc": "Every booking, move and cancellation is written to Google Calendar and Airtable together, so the calendar and the records never disagree."
      }
    ],
    "failsafeHeadline": "Checks before it commits",
    "failsafeDesc": "Nothing is booked, moved or cancelled until the details are complete, and nothing is booked or moved until the calendar confirms the time is free.",
    "sampleClient": true
  },
  {
    "slug": "hotel-employee-onboarding",
    "title": "New Employee Onboarding",
    "description": "One new-hire form sets up a Drive folder, employee record, orientation, IT access request and welcome email, then tracks every task and document. A daily check sends reminders and check-ins up to day 30, and the HR team has a chat assistant that answers policy questions from company policy only.",
    "category": "HR",
    "platform": "n8n",
    "organisation": "Hospitality HR",
    "image": "assets/portfolio/hotel-employee-onboarding.webp",
    "logic": "New hire form → onboarding plan for the role → folder, record, orientation, IT request and welcome email → tasks and documents tracked → daily reminders and check-ins to day 30 → policy assistant for the HR team.",
    "problem": "Every new hire meant the same setup by hand: folders, records, orientation, access requests and welcome emails. Documents were chased one email at a time, key cards and system access were forgotten, and the same policy questions reached HR again and again.",
    "solution": "Built an n8n workflow where HR fills in one form. It builds the onboarding plan for that role, sets up the Drive folder, employee record, orientation and IT request, sends the welcome email, and records every task and document in Airtable. A daily check sends milestone check-ins and document reminders up to day 30, chases IT for access and key cards, and closes onboarding when everything is done. The HR team gets a chat assistant that answers policy questions using only company policy.",
    "outcome": {
      "value": "30",
      "label": "Days followed up"
    },
    "integrations": [
      "n8n",
      "Airtable",
      "Google Drive",
      "Google Calendar",
      "Gmail",
      "Slack",
      "OpenAI"
    ],
    "repoUrl": "https://github.com/ramonaljr/n8n-employee-onboarding",
    "roi": [
      {
        "value": "30",
        "label": "Days followed up",
        "desc": "From the week before the start date to day 30, the new hire is followed up without HR chasing, and onboarding closes once every task and document is done."
      },
      {
        "value": "5",
        "label": "Check-in milestones",
        "desc": "Check-ins go out a week before the start date, on the first day, and on days 3, 7 and 30, so the new hire hears from HR at each step."
      },
      {
        "value": "1",
        "label": "Email a day, at most",
        "desc": "Reminders for missing documents are folded into the milestone emails, so a new hire never gets more than one email a day."
      }
    ],
    "failsafeHeadline": "Nothing half set up",
    "failsafeDesc": "If key details are missing from the form, onboarding stops and HR is alerted, so nobody starts half set up.",
    "sampleClient": true
  },
  {
    "slug": "hr-evaluation-assistant",
    "title": "HR Evaluation and Job Posting Assistant with AI",
    "description": "Every job application is read against the role it was made for, shortlisted or declined, and recorded. Shortlisted applicants get questions written for the role, a personal interview invite and a booked interview, and the interviewer gets screening questions. Built in n8n.",
    "category": "HR",
    "platform": "n8n",
    "organisation": "HR & Recruitment",
    "image": "assets/portfolio/hr-evaluation-assistant.webp",
    "logic": "Application form → CV filed and scored against the role → shortlist or decline → role-specific questions → personal invite → interview booked → screening questions for the interviewer.",
    "problem": "Every application meant opening a CV, comparing it with the job post and deciding by hand. Good applicants waited days for a reply, shortlisted ones got generic emails, interviews took rounds of back-and-forth to schedule, and interviewers walked in without questions prepared for the person in front of them.",
    "solution": "Built an n8n workflow with five AI steps. The application form saves the CV to Google Drive and the applicant to Airtable, AI reads the CV against the matching job posting and shortlists or declines, shortlisted applicants answer questions written for that role, AI writes a personal interview invite sent from Gmail, AI proposes an interview time that the workflow confirms is free before booking it in Google Calendar, and AI prepares screening questions for the interviewer.",
    "outcome": {
      "value": "5",
      "label": "Hiring stages automated"
    },
    "integrations": [
      "n8n",
      "Airtable",
      "Gmail",
      "Google Drive",
      "Google Calendar",
      "Groq",
      "OpenAI"
    ],
    "repoUrl": "https://github.com/ramonaljr/n8n-hr-evaluation-assistant",
    "roi": [
      {
        "value": "5",
        "label": "Hiring stages automated",
        "desc": "Screening, role questions, the interview invite, booking the interview and preparing the interviewer each run as their own AI step."
      },
      {
        "value": "100%",
        "label": "Applicants screened & recorded",
        "desc": "Every CV is read against the job it was sent for, and shortlisted and declined applicants are both recorded in Airtable, so the team can review any decision."
      },
      {
        "value": "0",
        "label": "Invites written by hand",
        "desc": "Each shortlisted applicant gets a personal invite written by AI for them and the role, sent from Gmail without anyone drafting it."
      }
    ],
    "failsafeHeadline": "Every decision is on record",
    "failsafeDesc": "Shortlisted and declined applicants are both written to Airtable, so the team can review any decision the AI made.",
    "sampleClient": true
  },
  {
    "slug": "airtable-crm-lead-engagement",
    "title": "Client Pipeline Emails",
    "description": "Move a client card to a new stage in Airtable and the next step happens on its own: a Drive folder and content task to start, follow-ups with a nudge two days later, an AI-written welcome when they approve, and a thank-you when the project is paid.",
    "category": "Sales",
    "platform": "Zapier",
    "organisation": "Agency Client Pipeline",
    "image": "assets/portfolio/airtable-crm-lead-engagement.webp",
    "logic": "Airtable stage change → only new, unhandled stages → claim the stage → Paths: Ready to Start folder and task, No Response or Quoted follow-up and 2-day nudge, Approved AI welcome, Paid and Closed AI thank-you → failed steps retry once, then alert.",
    "problem": "Every client sat on a pipeline board, but each stage still needed someone to remember the next step. Folders were made late, follow-ups were forgotten, quotes went quiet, and welcome and thank-you emails depended on whoever had time.",
    "solution": "Built a Zapier workflow that runs when a lead changes stage in Airtable. It continues only for a stage it has not handled, claims that stage so it runs once, then splits into Paths: a Drive folder and a content task for Ready to Start, a follow-up and a two-day nudge for No Response and Quoted, and AI-written welcome and thank-you emails for Approved and Paid and Closed. Every action is written to the lead log, and a failed step is retried before anyone is alerted.",
    "outcome": {
      "value": "5",
      "label": "Pipeline stages automated"
    },
    "integrations": [
      "Zapier",
      "Airtable",
      "Gmail",
      "Google Drive"
    ],
    "repoUrl": "https://github.com/ramonaljr/zapier-client-pipeline-emails",
    "roi": [
      {
        "value": "5",
        "label": "Pipeline stages automated",
        "desc": "Ready to Start, No Response, Quoted, Approved, and Paid and Closed each set off their own next step: a folder and task, a follow-up, a welcome or a thank-you."
      },
      {
        "value": "2 days",
        "label": "Wait before each nudge",
        "desc": "No Response and Quoted leads get a nudge two days after the follow-up, but only if they are still at that stage, so nobody is nudged after they reply."
      },
      {
        "value": "1",
        "label": "Run per stage, per lead",
        "desc": "Each stage is recorded on the lead before anything is sent, so moving a card back and forth never sends the same email twice."
      }
    ],
    "failsafeHeadline": "Nothing sent twice, nothing dropped",
    "failsafeDesc": "Each stage is claimed before it runs, a nudge is checked against the board before it goes out, and a failed step gets a second try.",
    "sampleClient": true
  },
  {
    "slug": "gmail-attachment-filing",
    "title": "Gmail Attachment Filing",
    "description": "Label a client email To File, and every real attachment is read and named by AI, saved to Google Drive, logged in Google Sheets, and confirmed to the sender in one receipt.",
    "category": "Finance",
    "platform": "Make",
    "organisation": "Bookkeeping Document Intake",
    "image": "assets/portfolio/gmail-attachment-filing.webp",
    "logic": "Every 15 minutes → emails labelled To File → keep real attachments → Gemini names each file → Drive upload → Sheets log → one receipt to the sender.",
    "problem": "Clients emailed receipts, statements and scans every day. Someone downloaded each attachment by hand, saved it under names like scan001.pdf, and nobody could say later what had arrived, from whom, or where it went.",
    "solution": "Built a Make scenario that checks Gmail every 15 minutes for emails labelled To File. It keeps only real attachments, has Gemini read each file and give it a short, descriptive name, saves it to the client documents folder in Google Drive, logs it in Google Sheets, and sends the sender one receipt listing every file saved.",
    "outcome": {
      "value": "15 min",
      "label": "Inbox check"
    },
    "integrations": [
      "Make",
      "Gmail",
      "Gemini",
      "Google Drive",
      "Google Sheets"
    ],
    "repoUrl": "https://github.com/ramonaljr/make-gmail-attachment-filing",
    "roi": [
      {
        "value": "15 min",
        "label": "Between inbox checks",
        "desc": "Label a client email To File and within 15 minutes its attachments are named, saved to Google Drive and logged, with nobody downloading anything."
      },
      {
        "value": "5",
        "label": "Details logged per file",
        "desc": "Every file gets a log row with the date, its original name, its new name, the file type and a Drive link, so anyone can find what arrived and where it went."
      },
      {
        "value": "1",
        "label": "Receipt per email",
        "desc": "The sender gets one email listing every file saved under its new name, and only when at least one file was saved."
      }
    ],
    "failsafeHeadline": "Only real files, and a second try",
    "failsafeDesc": "Signature logos and empty parts are skipped, and a failed AI or Drive step tries again before it stops.",
    "sampleClient": true
  },
  {
    "slug": "order-stock-check",
    "title": "Order Stock Check",
    "description": "Every new order is checked against live stock before anyone promises it. Orders that can be filled are confirmed and reserved, stock that drops below its reorder level is flagged in Slack, and short orders are put on hold with the customer told why.",
    "category": "Operations",
    "platform": "Make",
    "organisation": "Online Homeware Store",
    "image": "assets/portfolio/order-stock-check.webp",
    "logic": "Every 15 minutes → orders marked New → look up stock → Router: confirm and reserve, alert Slack below the reorder level, or hold the order and tell the customer.",
    "problem": "Orders were confirmed before anyone checked the shelf. Popular items sold out without warning, customers were promised products that were not there, and the first sign of low stock was an order that could not be filled.",
    "solution": "Built a Make scenario that checks the order sheet every 15 minutes for new orders and looks up each product in the inventory sheet. A Router sends every order down the right path: confirm it, reserve the stock and email the customer; alert operations in Slack when stock falls below its reorder level; or put the order on hold, email the customer about the delay and alert operations.",
    "outcome": {
      "value": "3",
      "label": "Stock outcomes routed"
    },
    "integrations": [
      "Make",
      "Google Sheets",
      "Gmail",
      "Slack"
    ],
    "repoUrl": "https://github.com/ramonaljr/make-order-stock-check",
    "roi": [
      {
        "value": "15 min",
        "label": "Between order checks",
        "desc": "A new order waits at most 15 minutes before it is checked against stock, so customers hear back quickly either way."
      },
      {
        "value": "3",
        "label": "Stock outcomes",
        "desc": "Enough stock: confirmed and reserved. Leaves stock low: confirmed, and operations told to reorder. Not enough: put on hold, and the customer told why."
      },
      {
        "value": "10",
        "label": "Orders per run",
        "desc": "Each check works through up to 10 new orders, and anything left over is picked up by the next check 15 minutes later."
      }
    ],
    "failsafeHeadline": "Stock is checked before every promise",
    "failsafeDesc": "An order is confirmed only when its full quantity is in stock, and every short order goes to a person.",
    "sampleClient": true
  }
];
