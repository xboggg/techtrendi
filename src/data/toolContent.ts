export interface ToolContent {
  intro: string;
  howTo: string[];
  whyNeedIt: string;
  faqs: { q: string; a: string }[];
}

export const toolContentData: Record<string, ToolContent> = {
  // ==========================================
  // BUSINESS & FREELANCER TOOLS
  // ==========================================

  'invoice-generator': {
    intro:
      'Create clean, professional invoices in seconds without touching a spreadsheet. I built this because most invoice tools either cost money or make you sign up for an account just to send a bill. Whether you freelance on the side or run a small shop, this gets the job done fast.',
    howTo: [
      'Fill in your business name and your client\'s details',
      'Add line items with descriptions, quantities, and rates',
      'Set your payment terms and due date',
      'Preview the invoice and download it as a PDF',
    ],
    whyNeedIt:
      'Chasing money is already awkward enough — sending a sloppy invoice makes it worse. A proper invoice shows clients you take your work seriously and gives them fewer excuses to delay payment.',
    faqs: [
      {
        q: 'Can I add my logo to the invoice?',
        a: 'Yes. There\'s an upload area at the top where you can drop in your logo. It\'ll show up in the header of the PDF.',
      },
      {
        q: 'Does this save my invoices anywhere?',
        a: 'Everything stays in your browser. We don\'t store your data on any server. Download the PDF before you close the tab.',
      },
      {
        q: 'Can I include tax or discounts?',
        a: 'Yep, there are fields for tax percentage and flat discounts. They\'ll be calculated automatically in the total.',
      },
      {
        q: 'What currencies are supported?',
        a: 'You can pick from a list of common currencies or type in your own. The symbol will appear on the invoice.',
      },
    ],
  },

  'invoice-chaser': {
    intro:
      'Write polite but firm follow-up emails for unpaid invoices without spending 20 minutes stressing over the wording. Just tell us how overdue the payment is and we\'ll draft the right message. Perfect for freelancers who hate the awkward "hey, about that invoice..." conversation.',
    howTo: [
      'Enter the invoice number and amount owed',
      'Select how many days overdue it is',
      'Pick a tone — friendly reminder, firm nudge, or final notice',
      'Copy the generated email and send it to your client',
    ],
    whyNeedIt:
      'Late payments kill cash flow, and most people put off chasing them because it feels uncomfortable. Having a ready-made email removes the friction so you actually follow up instead of just hoping the money shows up.',
    faqs: [
      {
        q: 'Will the emails sound like templates?',
        a: 'They\'re written to sound natural and personal. You can edit anything before copying, so tweak it to match your voice.',
      },
      {
        q: 'How many follow-up stages are there?',
        a: 'Three: a gentle reminder (1-7 days late), a firmer follow-up (7-30 days), and a final notice (30+ days). Each gets progressively more direct.',
      },
      {
        q: 'Can I use this for recurring invoices?',
        a: 'Absolutely. Just update the invoice number and date each time. The structure works for any overdue payment.',
      },
    ],
  },

  'proposal-generator': {
    intro:
      'Put together a solid project proposal without staring at a blank document for an hour. You fill in the key details — scope, timeline, pricing — and get a structured proposal you can send to clients right away. Great for freelancers and small agencies who pitch regularly.',
    howTo: [
      'Enter your project title and a brief description of the work',
      'Break down the scope into phases or deliverables',
      'Add your pricing, timeline, and payment terms',
      'Review the formatted proposal and export it as PDF',
    ],
    whyNeedIt:
      'A well-structured proposal wins more jobs. Period. Clients want to see that you\'ve thought things through before they hand over money. This tool makes sure you don\'t forget the important sections.',
    faqs: [
      {
        q: 'Can I save proposals as templates for later?',
        a: 'You can download the data and re-import it later. It\'s all stored locally so nothing gets lost between sessions.',
      },
      {
        q: 'Is there a limit on how many sections I can add?',
        a: 'No limits. Add as many deliverables, phases, or line items as the project needs.',
      },
      {
        q: 'Can I include terms and conditions?',
        a: 'Yes, there\'s a section at the bottom for custom terms. You can paste in your standard contract clauses.',
      },
    ],
  },

  'simple-crm': {
    intro:
      'Track your clients, deals, and follow-ups in one place — no sign-ups, no monthly fees, no bloated features you\'ll never use. This is a lightweight CRM that runs right in your browser. If you\'re juggling 5-50 clients and just need to stay organized, this is for you.',
    howTo: [
      'Add contacts with names, emails, and notes',
      'Create deals and assign them to contacts',
      'Set follow-up reminders so nothing falls through the cracks',
      'Filter and search your contacts by status or tag',
    ],
    whyNeedIt:
      'Spreadsheets get messy fast. Real CRMs cost $15-50 a month. If you\'re a solo operator or tiny team, you need something in between — organized enough to be useful, simple enough to actually stick with.',
    faqs: [
      {
        q: 'Where is my data stored?',
        a: 'In your browser\'s local storage. Nothing leaves your machine. You can export everything as JSON if you want a backup.',
      },
      {
        q: 'Can multiple people use this?',
        a: 'It\'s designed for solo use. Since data is stored locally, each person would have their own separate set of contacts.',
      },
      {
        q: 'Is there a limit on contacts?',
        a: 'Not really. Browser storage can handle thousands of entries before you\'d notice any slowdown.',
      },
      {
        q: 'Can I import contacts from a spreadsheet?',
        a: 'Yes, you can import a CSV file. Just make sure the column headers match the expected format.',
      },
    ],
  },

  'appointment-booking': {
    intro:
      'Generate a shareable booking page so clients can pick a time that works for both of you. No more back-and-forth emails trying to find a slot. Set your availability, share the link, and let people book directly.',
    howTo: [
      'Set the days and hours you\'re available',
      'Choose your appointment duration and buffer time between meetings',
      'Copy your unique booking link and share it with clients',
      'View and manage upcoming bookings from the dashboard',
    ],
    whyNeedIt:
      'The "when are you free?" email chain is a time sink. Giving people a link where they can just pick a slot saves you both the hassle and makes you look way more put-together.',
    faqs: [
      {
        q: 'Does this sync with Google Calendar?',
        a: 'Not yet — it works as a standalone booking tool. You can manually add confirmed slots to your calendar.',
      },
      {
        q: 'Can I set different availability for different days?',
        a: 'Yes. You can customize each day of the week separately, or block out specific dates entirely.',
      },
      {
        q: 'Will clients get a confirmation?',
        a: 'The tool generates a confirmation page with all the details. You can also set up email notifications if you connect your email.',
      },
    ],
  },

  'freelance-rate-calculator': {
    intro:
      'Figure out what to actually charge per hour or per project based on your real expenses and income goals. Most freelancers pick a number out of thin air — this tool does the math so you\'re not accidentally working for less than minimum wage after expenses.',
    howTo: [
      'Enter your annual income goal and estimated expenses',
      'Set how many billable hours you work per week',
      'Account for vacation days and non-billable time',
      'Get your minimum hourly and daily rates',
    ],
    whyNeedIt:
      'Undercharging is the number one mistake freelancers make. Once you see the actual math — taxes, software, insurance, unbillable hours — you realize that $30/hour freelance rate is really $12/hour take-home. This tool shows you the truth.',
    faqs: [
      {
        q: 'What expenses should I include?',
        a: 'Everything: software subscriptions, hardware, internet, office space, insurance, taxes, retirement savings. The more honest you are, the more accurate your rate.',
      },
      {
        q: 'Does it account for taxes?',
        a: 'Yes. Enter your estimated tax rate and it\'ll factor that into your minimum rate calculation.',
      },
      {
        q: 'Can I compare different scenarios?',
        a: 'Tweak any input and the rate updates instantly. Try different income goals or hour counts to find your sweet spot.',
      },
    ],
  },

  'contract-generator': {
    intro:
      'Put together a basic freelance or service contract without paying a lawyer $500. Pick your contract type, fill in the details, and get a formatted agreement you can share with your client. Not a replacement for legal advice on big deals, but perfect for everyday projects.',
    howTo: [
      'Select the type of contract (freelance, service, NDA, etc.)',
      'Fill in both parties\' details and the project scope',
      'Customize clauses like payment terms, IP rights, and termination',
      'Download the contract as a PDF ready for signatures',
    ],
    whyNeedIt:
      'Working without a contract is asking for trouble. Even a simple agreement protects both sides and sets clear expectations. This tool takes the intimidation out of the process so you actually use one.',
    faqs: [
      {
        q: 'Are these contracts legally binding?',
        a: 'They cover the basics and are a solid starting point. For high-value deals or complex situations, have a lawyer review it.',
      },
      {
        q: 'Can I edit the clauses?',
        a: 'Every section is editable. Remove what you don\'t need, reword anything that doesn\'t fit your situation.',
      },
      {
        q: 'What types of contracts are available?',
        a: 'Freelance agreements, NDAs, service contracts, and basic partnership agreements. More types get added based on what people ask for.',
      },
    ],
  },

  'client-portal': {
    intro:
      'Set up a simple client-facing page where you can share project updates, files, and milestones without clogging up email threads. Think of it as a mini project dashboard your clients can check whenever they want. Especially handy if you work with multiple clients at once.',
    howTo: [
      'Create a new project and add your client\'s name',
      'Upload files and add status updates or milestones',
      'Share the unique portal link with your client',
      'Update the portal as the project progresses',
    ],
    whyNeedIt:
      'Clients love transparency. When they can check progress on their own instead of emailing you every other day, everyone\'s happier. It also keeps all your project communication in one place instead of scattered across inboxes.',
    faqs: [
      {
        q: 'Is the portal password-protected?',
        a: 'Each portal has a unique link that\'s hard to guess. You can also add a simple access code for extra security.',
      },
      {
        q: 'Can clients upload files too?',
        a: 'Yes, there\'s a section where clients can drop in files like brand assets, content, or feedback documents.',
      },
      {
        q: 'How many projects can I run at once?',
        a: 'As many as you need. Each project gets its own portal and link.',
      },
    ],
  },

  'expense-tracker': {
    intro:
      'Log your business expenses as they happen so you\'re not scrambling at tax time trying to remember what that $47 charge was. Simple categories, running totals, and export to CSV. No accounts, no subscriptions — just a tool that does one thing well.',
    howTo: [
      'Add expenses with the amount, category, and a quick note',
      'View your spending by category or date range',
      'Check your totals and spot where the money\'s going',
      'Export everything as a CSV for your accountant',
    ],
    whyNeedIt:
      'You don\'t need fancy accounting software if you\'re a freelancer or solopreneur. But you do need to track what you spend, both for taxes and for knowing whether you\'re actually making money. This keeps it dead simple.',
    faqs: [
      {
        q: 'Can I track income too?',
        a: 'The focus is on expenses, but you can add income entries with a positive amount to see a profit/loss overview.',
      },
      {
        q: 'Does it support multiple currencies?',
        a: 'You can set your default currency. If you deal with multiple currencies, just note the original amount in the description.',
      },
      {
        q: 'Will I lose my data if I clear my browser?',
        a: 'Yes — export regularly. The CSV export is your backup. We recommend downloading it at least once a month.',
      },
    ],
  },

  'pricing-calculator': {
    intro:
      'Calculate project-based pricing that actually covers your costs and leaves a profit margin. Enter your time estimate, expenses, and desired margin, and get a price you can confidently quote. Stops the guesswork that leads to undercharging.',
    howTo: [
      'Estimate the hours the project will take',
      'Add any direct costs like software, materials, or subcontractors',
      'Set your desired profit margin',
      'Get a total project price broken down by component',
    ],
    whyNeedIt:
      'Flat-rate pricing sounds great until you\'re 40 hours deep on a "quick project" that you quoted too low. Running the numbers first means you actually get paid fairly and can explain your pricing to clients.',
    faqs: [
      {
        q: 'What profit margin should I aim for?',
        a: 'Most service businesses target 20-40%. The tool lets you try different margins to see what feels right for your market.',
      },
      {
        q: 'Can I factor in revisions?',
        a: 'Yes. Add a revision buffer to your hours estimate — most projects need 10-20% extra for changes.',
      },
      {
        q: 'Does it work for product pricing too?',
        a: 'It\'s geared toward service pricing, but the cost-plus-margin approach works for physical or digital products as well.',
      },
    ],
  },

  'time-tracker': {
    intro:
      'Track how long you spend on tasks and projects with a simple start/stop timer. No sign-up, no app to install — just click and go. I use this myself when I need to bill hours or just want to see where my day actually went.',
    howTo: [
      'Name your task and hit start',
      'Switch between tasks as you work throughout the day',
      'View time summaries by project or date',
      'Export your time logs for invoicing or reporting',
    ],
    whyNeedIt:
      'We\'re all terrible at estimating how long things take. Tracking your time — even roughly — helps you quote better, invoice accurately, and figure out which clients or tasks are eating more hours than they should.',
    faqs: [
      {
        q: 'Can I edit time entries after the fact?',
        a: 'Yes. If you forget to stop the timer or need to adjust an entry, you can manually edit start and end times.',
      },
      {
        q: 'Does it run in the background?',
        a: 'The timer keeps running even if you switch tabs. Just don\'t close the browser entirely.',
      },
      {
        q: 'Can I set billable vs non-billable hours?',
        a: 'Each entry can be marked as billable or not. Your reports will separate them so you know what to invoice.',
      },
      {
        q: 'Is there a Pomodoro mode?',
        a: 'Not built in, but you can use the timer in short focused bursts and the entries will show exactly how long each session was.',
      },
    ],
  },

  'meeting-cost-calculator': {
    intro:
      'Find out how much that meeting actually costs in salary time. Plug in the number of attendees, their approximate hourly rates, and the meeting length. It\'s a quick reality check for anyone who schedules (or gets dragged into) too many meetings.',
    howTo: [
      'Enter the number of people attending',
      'Set average hourly rates or salaries for each group',
      'Specify the meeting duration',
      'See the total cost and cost-per-minute breakdown',
    ],
    whyNeedIt:
      'That "quick 30-minute sync" with 8 people might cost $400 in productive time. Seeing the number makes teams think twice about whether a meeting could\'ve been an email.',
    faqs: [
      {
        q: 'How do I estimate hourly rates?',
        a: 'Divide annual salary by 2,080 (working hours per year) for a rough hourly rate. Or just use your best guess — even ballpark numbers are eye-opening.',
      },
      {
        q: 'Does it account for preparation time?',
        a: 'You can add prep time as a separate field. It\'ll be included in the total cost calculation.',
      },
      {
        q: 'Can I calculate recurring meeting costs?',
        a: 'Yes. Set the frequency (weekly, biweekly, monthly) and see the annual cost. Weekly standups add up fast.',
      },
    ],
  },

  'startup-cost-calculator': {
    intro:
      'Estimate how much it\'ll actually cost to launch your business idea. Walk through common startup expense categories — registration, equipment, marketing, initial inventory — and get a realistic total. Way better than the napkin math most people do.',
    howTo: [
      'Select your business type for suggested expense categories',
      'Fill in estimated costs for each category',
      'Add any custom expenses specific to your situation',
      'Review the total startup cost and monthly burn rate',
    ],
    whyNeedIt:
      'Most new businesses fail because they run out of money, often because the founder underestimated costs. A realistic estimate upfront helps you plan funding, set milestones, and avoid nasty surprises three months in.',
    faqs: [
      {
        q: 'What if I don\'t know the exact costs yet?',
        a: 'Use the suggested ranges for your business type as starting points. It\'s better to overestimate than underestimate.',
      },
      {
        q: 'Does it cover ongoing monthly expenses?',
        a: 'Yes, there\'s a separate section for recurring costs so you can estimate your monthly burn rate alongside one-time startup costs.',
      },
      {
        q: 'Can I compare different business models?',
        a: 'Save your estimates and create another scenario. Compare them side by side to see which approach requires less capital.',
      },
    ],
  },

  'business-name-generator': {
    intro:
      'Stuck on what to call your business? Type in your industry and a few keywords, and get a list of name ideas to spark some inspiration. It\'s not going to name your company for you, but it\'ll get the creative gears turning when you\'re drawing a blank.',
    howTo: [
      'Enter your industry or niche',
      'Add a few keywords that describe your brand vibe',
      'Pick a style — modern, playful, professional, etc.',
      'Browse the generated names and save your favorites',
    ],
    whyNeedIt:
      'Naming a business is harder than people think. You need something memorable, available as a domain, and not already taken. This tool gives you a starting list so you\'re not working from nothing.',
    faqs: [
      {
        q: 'Does it check if the domain is available?',
        a: 'It suggests names but doesn\'t do live domain checks. You\'ll want to search on a registrar like Namecheap or GoDaddy for availability.',
      },
      {
        q: 'How many names does it generate?',
        a: 'You\'ll get around 20-30 options per search. Run it again with different keywords for more ideas.',
      },
      {
        q: 'Can I filter by name length?',
        a: 'Yes, you can set a max character count if you want something short and punchy.',
      },
    ],
  },

  'business-registration': {
    intro:
      'Walk through the steps to register a business in Ghana — from choosing a structure to filing with the Registrar General\'s Department. This is a step-by-step checklist, not legal advice, but it covers what most people get confused about when starting out.',
    howTo: [
      'Select your business type (sole proprietorship, limited company, etc.)',
      'Follow the checklist of required documents and forms',
      'Get estimated costs for registration fees',
      'Track your progress through each registration step',
    ],
    whyNeedIt:
      'The registration process isn\'t complicated, but it\'s confusing if you\'ve never done it. Missing a step or filing the wrong form wastes time and money. This gives you a clear roadmap.',
    faqs: [
      {
        q: 'Is this specific to Ghana?',
        a: 'Yes, the steps and fees are based on Ghana\'s Registrar General\'s Department requirements. Other countries will have different processes.',
      },
      {
        q: 'How much does it cost to register a business in Ghana?',
        a: 'It depends on the structure. Sole proprietorships start around GHS 100-200, while limited companies cost more. The tool gives current estimates.',
      },
      {
        q: 'Do I need a lawyer to register?',
        a: 'Not for sole proprietorships. For limited companies, you\'ll need a lawyer to help with the regulations, but this tool tells you what to prepare.',
      },
    ],
  },

  'network-crm': {
    intro:
      'Keep track of the people in your professional network — who you met, when, and what you talked about. It\'s like a personal rolodex with notes and reminders. For anyone who goes to events, conferences, or just meets a lot of people and forgets names two days later.',
    howTo: [
      'Add contacts with notes about where you met them',
      'Tag people by industry, event, or relationship type',
      'Set reminders to follow up with key contacts',
      'Search and filter your network when you need a specific connection',
    ],
    whyNeedIt:
      'Your network is only valuable if you actually maintain it. Remembering that you met someone at a conference six months ago and following up makes a real difference. This tool makes that easy instead of relying on your memory.',
    faqs: [
      {
        q: 'How is this different from LinkedIn?',
        a: 'LinkedIn is public and social. This is your private notes — things you wouldn\'t post publicly, like "met at bar after conference, interested in partnership on X project."',
      },
      {
        q: 'Can I import my existing contacts?',
        a: 'Yes, you can import from CSV. Export your phone contacts or LinkedIn connections and bring them in.',
      },
      {
        q: 'Does it send follow-up reminders?',
        a: 'You can set reminder dates for each contact. The dashboard shows who\'s due for a check-in.',
      },
    ],
  },

  'brand-pitch': {
    intro:
      'Draft a brand collaboration pitch that doesn\'t sound like every other DM in a brand manager\'s inbox. Fill in your stats, niche, and what you\'re offering, and get a structured pitch you can customize. Built for creators and influencers who want to land paid deals.',
    howTo: [
      'Enter your platform stats and audience demographics',
      'Describe your niche and content style',
      'Select the type of collaboration you\'re proposing',
      'Customize the generated pitch and copy it',
    ],
    whyNeedIt:
      'Brands get hundreds of pitches. The ones that stand out are specific, professional, and make the value clear. This tool structures your pitch so you hit all those notes without sounding like a generic template.',
    faqs: [
      {
        q: 'What platforms does this work for?',
        a: 'Any — YouTube, Instagram, TikTok, Twitter, blogs. Just enter your relevant stats for that platform.',
      },
      {
        q: 'What follower count do I need?',
        a: 'Brands work with creators of all sizes. Micro-influencers (1K-10K) often get better engagement rates. The pitch tool works regardless of your numbers.',
      },
      {
        q: 'Should I include my rates?',
        a: 'It\'s optional in the pitch. Some creators prefer to negotiate after the brand shows interest. The tool lets you include or omit pricing.',
      },
    ],
  },

  // ==========================================
  // MARKETING & CONTENT TOOLS
  // ==========================================

  'email-subject-tester': {
    intro:
      'Test your email subject lines before you hit send. Paste in a subject line and get a score based on length, power words, personalization, and spam trigger avoidance. Helps you pick the version most likely to get opened.',
    howTo: [
      'Type or paste your email subject line',
      'Review the score and specific feedback',
      'Try different variations to improve the score',
      'Pick the highest-scoring option for your campaign',
    ],
    whyNeedIt:
      'Your email is worthless if nobody opens it. Subject lines make or break open rates, and most people just wing it. A quick score check takes 10 seconds and could double your opens.',
    faqs: [
      {
        q: 'What makes a good subject line score?',
        a: 'Anything above 70 is solid. The tool checks length (40-60 chars is ideal), urgency words, personalization tokens, and known spam triggers.',
      },
      {
        q: 'Does it test for different email clients?',
        a: 'It checks character length for mobile preview cutoffs. Most phones show 35-40 characters, so the tool flags if yours gets truncated.',
      },
      {
        q: 'Can I test A/B variations?',
        a: 'Yes, enter multiple versions and compare scores side by side. It\'ll highlight the differences between them.',
      },
    ],
  },

  'social-caption-generator': {
    intro:
      'Get caption ideas for your social media posts when writer\'s block hits. Tell it what the post is about, pick your platform and tone, and get a few options to work with. Not meant to replace your voice — just to get you unstuck.',
    howTo: [
      'Describe what your post is about in a sentence or two',
      'Select the platform (Instagram, Twitter, LinkedIn, etc.)',
      'Choose a tone — casual, professional, funny, inspirational',
      'Browse the generated captions and edit your favorite',
    ],
    whyNeedIt:
      'Posting consistently is half the battle on social media. But staring at a blank caption box kills your momentum. Having a starting point — even if you rewrite most of it — makes posting way faster.',
    faqs: [
      {
        q: 'Will the captions include hashtags?',
        a: 'Yes, platform-appropriate hashtags are suggested. You can toggle them off if you prefer to add your own.',
      },
      {
        q: 'Does it handle different post types?',
        a: 'You can specify if it\'s a product post, behind-the-scenes, educational content, etc. The tone adjusts accordingly.',
      },
      {
        q: 'Are the captions optimized for each platform?',
        a: 'Yes. Twitter captions stay under 280 characters, LinkedIn ones are longer-form, and Instagram ones include line breaks and hashtag spacing.',
      },
    ],
  },

  'content-calendar': {
    intro:
      'Plan and organize your content across platforms with a visual calendar. Drag and drop posts, see what\'s scheduled for the week, and spot gaps before they become missed posting days. Simple enough to actually use, unlike those monster spreadsheet templates.',
    howTo: [
      'Pick your platforms and posting frequency',
      'Add content ideas to specific dates',
      'Drag posts around to rearrange your schedule',
      'Use the month view to check for gaps and balance',
    ],
    whyNeedIt:
      'Posting "whenever you remember" means you don\'t post. Having a calendar turns content from a daily stress into a weekly planning session. You batch your thinking and just execute during the week.',
    faqs: [
      {
        q: 'Can I schedule posts to auto-publish?',
        a: 'This is a planning tool, not a scheduler. Use it to plan, then copy your content into your publishing tool of choice.',
      },
      {
        q: 'Does it suggest what to post?',
        a: 'It has awareness of content mix — so it\'ll flag if you\'re posting too much of one type and not enough variety.',
      },
      {
        q: 'Can I plan for multiple accounts?',
        a: 'Yes. Color-code different platforms or accounts so you can see everything at a glance.',
      },
      {
        q: 'How far ahead can I plan?',
        a: 'As far as you want. Most people plan 2-4 weeks ahead, but you can map out months if you\'re that organized.',
      },
    ],
  },

  'content-repurposer': {
    intro:
      'Turn one piece of content into many. Paste a blog post and get Twitter threads, LinkedIn posts, Instagram captions, email snippets, and more. Created this because I was tired of making something once and only using it on one platform.',
    howTo: [
      'Paste your original content (blog post, article, script, etc.)',
      'Select which platforms you want to repurpose for',
      'Review and edit each platform version',
      'Copy the formatted versions and post away',
    ],
    whyNeedIt:
      'Most content only reaches a fraction of your audience because it lives on one platform. Repurposing isn\'t lazy — it\'s smart. Different people hang out in different places, and they consume content differently on each platform.',
    faqs: [
      {
        q: 'What\'s the best source content to repurpose?',
        a: 'Long-form works best — blog posts, newsletter issues, podcast transcripts. More source material gives better output across platforms.',
      },
      {
        q: 'Will the repurposed content be unique enough?',
        a: 'Each platform version is restructured for that format. A Twitter thread looks nothing like the LinkedIn post, even though both come from the same article.',
      },
      {
        q: 'How many platforms can I repurpose for at once?',
        a: 'All supported platforms at once if you want. Currently covers Twitter, LinkedIn, Instagram, Facebook, email newsletters, and TikTok scripts.',
      },
    ],
  },

  'hook-scorer': {
    intro:
      'Score your content hooks — those first 1-2 lines that decide whether someone keeps reading or scrolls past. Works for tweets, video intros, blog openings, anything. Tells you what\'s working and what\'s weak so you can fix it before posting.',
    howTo: [
      'Paste your hook text (first line or two of your content)',
      'Select the content type and platform',
      'Review the score and specific feedback',
      'Rework weak areas and re-score until you\'re happy',
    ],
    whyNeedIt:
      'You have about 1.5 seconds to grab attention online. A strong hook is the difference between viral and invisible. Most people spend hours on content but seconds on the hook — this tool flips that.',
    faqs: [
      {
        q: 'What does the score measure?',
        a: 'Curiosity gap, specificity, emotional pull, and clarity. Each factor gets its own sub-score so you know exactly what to improve.',
      },
      {
        q: 'What score should I aim for?',
        a: 'Above 75 is strong. Anything below 50 probably needs a rewrite. The feedback tells you specifically what to change.',
      },
      {
        q: 'Can I test video hooks too?',
        a: 'Yes, just type out what you\'d say in the first 3-5 seconds. Video and text hooks follow similar principles.',
      },
    ],
  },

  'blog-outline-generator': {
    intro:
      'Get a structured outline for your next blog post so you don\'t just ramble for 2,000 words. Enter your topic and target audience, and get a logical flow of sections with suggested talking points. Makes the actual writing part way faster.',
    howTo: [
      'Enter your blog topic and primary keyword',
      'Specify your target audience',
      'Choose a blog format (how-to, listicle, comparison, etc.)',
      'Get a structured outline with section headers and bullet points',
    ],
    whyNeedIt:
      'Writing without an outline is like driving without a map — you\'ll get somewhere, but probably not where you wanted. A good outline means less editing, better flow, and articles that actually rank for something.',
    faqs: [
      {
        q: 'Does it optimize for SEO?',
        a: 'It suggests header structures (H2, H3) that follow SEO best practices and includes keyword placement hints.',
      },
      {
        q: 'How detailed are the outlines?',
        a: 'You get section headers, 2-3 bullet points per section, and suggested word count targets. Enough structure to write from but not so rigid you can\'t go off-script.',
      },
      {
        q: 'What blog lengths does it support?',
        a: 'Short (500-800 words), medium (1,000-1,500), and long-form (2,000+). The outline scales accordingly.',
      },
    ],
  },

  'ai-content-idea-generator': {
    intro:
      'Generate content ideas when you\'ve hit a creative wall. Enter your niche, audience, and platforms, and get a batch of ideas ranging from blog topics to video concepts to social posts. Useful for creators who post regularly and need fresh angles.',
    howTo: [
      'Enter your niche and target audience',
      'Select the content types you create (blogs, videos, social, etc.)',
      'Set any themes or topics you want ideas around',
      'Browse and save the ideas that spark your interest',
    ],
    whyNeedIt:
      'The hardest part of content creation isn\'t the creation — it\'s figuring out what to create. A steady pipeline of ideas means you spend less time brainstorming and more time actually making things.',
    faqs: [
      {
        q: 'Are these ideas original?',
        a: 'They\'re generated based on trending patterns and your niche inputs. Think of them as starting points you put your own spin on.',
      },
      {
        q: 'Can I filter by content type?',
        a: 'Yes. Ask for only video ideas, or only blog topics, or a mix. You can also filter by difficulty level — quick posts vs deep dives.',
      },
      {
        q: 'How often should I use this?',
        a: 'Do a weekly batch to fill your content calendar. Most creators find 15-20 minutes of idea generation covers a full week of content.',
      },
    ],
  },

  'product-description-generator': {
    intro:
      'Write product descriptions that actually make people want to buy. Enter the product details, target customer, and key benefits, and get copy that highlights value instead of just listing features. Works for e-commerce, marketplaces, or your own shop.',
    howTo: [
      'Enter the product name and key features',
      'Describe your target customer in a sentence',
      'Select a tone — professional, playful, luxury, etc.',
      'Get multiple description versions to choose from',
    ],
    whyNeedIt:
      'Good product copy sells. Bad product copy sounds like it was copied from the manufacturer\'s spec sheet. The difference between "16GB RAM" and "Run 30 browser tabs without your laptop crying" is the difference between a bounce and a sale.',
    faqs: [
      {
        q: 'Does it write for specific marketplaces?',
        a: 'You can select formats optimized for Amazon, Shopify, Etsy, or general e-commerce. Each has different length and style conventions.',
      },
      {
        q: 'Can I generate descriptions in bulk?',
        a: 'One at a time for now. For bulk needs, save your outputs and iterate through your product list.',
      },
      {
        q: 'How long are the descriptions?',
        a: 'You get a short version (50-80 words) and a longer version (150-250 words). Use whichever fits your listing.',
      },
    ],
  },

  'viral-post-analyzer': {
    intro:
      'Paste any viral social media post and get a breakdown of why it worked. The tool analyzes structure, emotional triggers, timing patterns, and engagement hooks. Handy for learning from what\'s already winning instead of guessing.',
    howTo: [
      'Paste the text of a viral post (or enter the URL)',
      'Select the platform it was posted on',
      'Review the detailed breakdown of engagement factors',
      'Apply the patterns to your own content',
    ],
    whyNeedIt:
      'Virality isn\'t random — there are patterns. Studying what works and understanding why gives you a repeatable playbook instead of hoping your next post hits. It\'s the difference between luck and strategy.',
    faqs: [
      {
        q: 'What counts as "viral"?',
        a: 'The tool analyzes any post, viral or not. But it\'s most useful when you feed it posts that clearly outperformed — that\'s where the patterns are most visible.',
      },
      {
        q: 'What factors does it analyze?',
        a: 'Hook strength, emotional triggers, readability, structure, call-to-action presence, and controversial or relatable elements.',
      },
      {
        q: 'Can I compare multiple posts?',
        a: 'Analyze them one at a time and compare the breakdowns. Look for common patterns across your top-performing content.',
      },
    ],
  },

  'meta-tag-generator': {
    intro:
      'Generate proper meta titles, descriptions, and Open Graph tags for your web pages. Just enter your page topic and target keywords, and get copy-paste-ready HTML tags. Because showing up as "Untitled" in Google results is not a growth strategy.',
    howTo: [
      'Enter your page title and a brief description',
      'Add your target keywords',
      'Select the page type (article, product, homepage, etc.)',
      'Copy the generated HTML meta tags into your page head',
    ],
    whyNeedIt:
      'Meta tags are how Google and social media platforms understand your page. Getting them right means better search rankings and better-looking link previews when people share your content. It takes two minutes and pays off forever.',
    faqs: [
      {
        q: 'What meta tags does this generate?',
        a: 'Title, description, Open Graph (for Facebook/LinkedIn), Twitter Card tags, and canonical URL. Everything you need for SEO and social sharing.',
      },
      {
        q: 'How long should meta descriptions be?',
        a: 'Between 150-160 characters for Google. The tool enforces this automatically and warns you if you go over.',
      },
      {
        q: 'Do I need different tags for each page?',
        a: 'Yes. Every page should have unique meta tags. Duplicate descriptions across pages can hurt your SEO.',
      },
    ],
  },

  'seo-auditor': {
    intro:
      'Run a quick SEO check on any webpage and get a list of what\'s working and what\'s not. Checks meta tags, heading structure, image alt text, page speed indicators, and more. Like a health checkup for your page\'s search visibility.',
    howTo: [
      'Enter the URL you want to audit',
      'Wait for the analysis to complete',
      'Review issues sorted by priority (critical, warning, info)',
      'Follow the fix suggestions for each issue',
    ],
    whyNeedIt:
      'Most websites have easy SEO wins they don\'t know about — missing alt text, broken meta tags, slow images. An audit finds these low-hanging fruit so you can fix them without hiring a consultant.',
    faqs: [
      {
        q: 'How accurate is this compared to paid tools?',
        a: 'It covers the fundamentals that account for 80% of on-page SEO. Paid tools go deeper into backlinks and competitive analysis, but this handles the basics.',
      },
      {
        q: 'How often should I audit my pages?',
        a: 'After any major content update, or once a month for important pages. SEO isn\'t set-and-forget.',
      },
      {
        q: 'Does it check mobile-friendliness?',
        a: 'It flags common mobile issues like viewport settings and font sizes, but for a full mobile test, use Google\'s mobile-friendly tool too.',
      },
    ],
  },

  'link-in-bio': {
    intro:
      'Create a clean link-in-bio page with all your important links in one place. No sign-up, no monthly fee — just pick a layout, add your links, and share the page. For creators who want something better than a bare Linktree without paying for it.',
    howTo: [
      'Add your profile picture and display name',
      'Enter your links with custom labels and optional icons',
      'Choose a color scheme and layout style',
      'Copy your page link to use in your bio',
    ],
    whyNeedIt:
      'Every platform gives you one link. One. Making that link count by sending people to a curated page of your best stuff is the smart move. And you shouldn\'t have to pay a subscription for what\'s basically a list of links.',
    faqs: [
      {
        q: 'Is the page hosted for free?',
        a: 'The tool generates the page. You can self-host it or use the generated link. No ongoing costs.',
      },
      {
        q: 'Can I track clicks?',
        a: 'Basic click tracking is included so you can see which links people actually tap on.',
      },
      {
        q: 'Can I customize the design?',
        a: 'Yes — colors, fonts, button styles, and layout. Enough customization to match your brand without being overwhelming.',
      },
    ],
  },

  'creator-analytics': {
    intro:
      'Get a dashboard view of your content performance across platforms. Enter your stats manually or connect feeds, and see growth trends, engagement rates, and best-performing content in one place. Beats jumping between five different apps to check numbers.',
    howTo: [
      'Add your social platforms and enter current stats',
      'Update numbers weekly to track trends over time',
      'View engagement rates, growth velocity, and comparisons',
      'Identify your best-performing content and platforms',
    ],
    whyNeedIt:
      'You can\'t improve what you don\'t measure. Seeing all your numbers in one dashboard reveals patterns — like which platform is actually growing and which one you\'re wasting time on.',
    faqs: [
      {
        q: 'Does it pull data automatically?',
        a: 'Currently you enter stats manually. It\'s a bit of work upfront but means no API permissions or security concerns.',
      },
      {
        q: 'What metrics does it track?',
        a: 'Followers, engagement rate, posting frequency, reach, and growth percentage. You can add custom metrics too.',
      },
      {
        q: 'Can I export reports?',
        a: 'Yes, download your analytics as PDF or CSV. Great for brand pitches or monthly reviews.',
      },
    ],
  },

  'creator-monetization': {
    intro:
      'Calculate your earning potential across different monetization strategies — sponsorships, affiliate marketing, digital products, memberships, and more. Plug in your audience size and engagement, and see realistic revenue estimates for each model.',
    howTo: [
      'Enter your follower count and average engagement rate',
      'Select the monetization methods you\'re considering',
      'Adjust variables like conversion rates and pricing',
      'Compare estimated monthly revenue across strategies',
    ],
    whyNeedIt:
      'Most creators leave money on the table because they only use one revenue stream. Seeing the math on different models helps you prioritize what to build next and set realistic income expectations.',
    faqs: [
      {
        q: 'How accurate are the estimates?',
        a: 'They\'re based on industry benchmarks and averages. Your results will vary, but it gives you a solid ballpark to plan around.',
      },
      {
        q: 'What\'s the best monetization method for small creators?',
        a: 'Affiliate marketing and digital products tend to work best under 10K followers because you don\'t need massive reach — just an engaged niche audience.',
      },
      {
        q: 'Does it account for platform-specific rates?',
        a: 'Yes, sponsorship rates differ by platform. YouTube CPMs are different from Instagram story rates. The tool adjusts accordingly.',
      },
    ],
  },

  'cold-email-writer': {
    intro:
      'Write cold emails that actually get replies instead of landing in the trash. Enter who you\'re reaching out to, what you want, and a bit about yourself, and get a concise, personalized email draft. No fluff, no "I hope this finds you well" nonsense.',
    howTo: [
      'Describe the recipient and their role or company',
      'State what you\'re offering or asking for',
      'Add a personal detail or connection point',
      'Review and customize the generated email',
    ],
    whyNeedIt:
      'Cold email is still one of the most effective outreach channels — when done right. The problem is most cold emails are terrible. A well-structured, concise, personalized email stands out in a sea of lazy mass blasts.',
    faqs: [
      {
        q: 'How long should a cold email be?',
        a: 'Under 150 words. The tool keeps it tight. Nobody reads a cold email that\'s four paragraphs long.',
      },
      {
        q: 'Should I follow up if they don\'t reply?',
        a: 'Yes, 2-3 follow-ups spaced 3-5 days apart is standard. The tool can generate follow-up sequences too.',
      },
      {
        q: 'Does it work for sales or just networking?',
        a: 'Both. Select your goal — partnership, sales, job inquiry, collaboration — and the tone and structure adjust.',
      },
    ],
  },

  'youtube-title-optimizer': {
    intro:
      'Test and optimize your YouTube video titles before publishing. Get a score based on click-worthiness, keyword presence, length, and emotional triggers. Because a great video with a boring title gets zero views.',
    howTo: [
      'Enter your draft video title',
      'Add your target keyword or topic',
      'Review the score and improvement suggestions',
      'Try variations until you find a winner',
    ],
    whyNeedIt:
      'YouTube is a search engine. Your title is the most important ranking and click-through factor you control. Spending 5 minutes optimizing it can mean the difference between 100 views and 10,000.',
    faqs: [
      {
        q: 'What makes a good YouTube title?',
        a: 'Under 60 characters, front-loaded keyword, curiosity or value hook, and no clickbait that doesn\'t deliver. The tool scores all of these.',
      },
      {
        q: 'Should I include numbers in titles?',
        a: 'Numbers often boost CTR — "5 Ways to..." outperforms "Ways to..." in most niches. The tool gives bonus points for strategic number use.',
      },
      {
        q: 'Can I test thumbnail + title combos?',
        a: 'The tool focuses on titles only. Pair it with a thumbnail preview tool for the full picture.',
      },
    ],
  },

  'youtube-thumbnail-downloader': {
    intro:
      'Grab the full-resolution thumbnail from any YouTube video. Paste the video URL and download the image in different sizes. Useful for research, inspiration boards, or when you need to reference a competitor\'s thumbnail style.',
    howTo: [
      'Paste the YouTube video URL',
      'See all available thumbnail sizes',
      'Click to download the resolution you need',
    ],
    whyNeedIt:
      'Studying what thumbnails work in your niche is one of the best ways to improve your own. But YouTube doesn\'t make it easy to download them directly. This tool does.',
    faqs: [
      {
        q: 'What sizes are available?',
        a: 'Default (120x90), medium (320x180), high (480x360), standard (640x480), and maxres (1280x720) when available.',
      },
      {
        q: 'Can I use downloaded thumbnails for my own videos?',
        a: 'For reference and inspiration only. Using someone else\'s thumbnail as your own would be misleading and likely violate copyright.',
      },
      {
        q: 'Does it work for private or unlisted videos?',
        a: 'It works for any video that has a publicly accessible thumbnail, which includes most unlisted videos but not private ones.',
      },
    ],
  },

  // ==========================================
  // DEVELOPER TOOLS
  // ==========================================

  'json-formatter': {
    intro:
      'Paste messy JSON and get it formatted, validated, and syntax-highlighted instantly. Also catches errors and tells you exactly where the problem is. I use this daily because API responses never come pretty-printed.',
    howTo: [
      'Paste your JSON into the input area',
      'Click format to pretty-print it with proper indentation',
      'If there\'s an error, the exact line and character are highlighted',
      'Copy the formatted output or switch between 2-space and 4-space indentation',
    ],
    whyNeedIt:
      'Reading minified JSON is miserable. And hunting for a missing comma in 500 lines of unformatted data is even worse. This tool makes both problems go away in one click.',
    faqs: [
      {
        q: 'Can it handle large JSON files?',
        a: 'It handles files up to a few megabytes without issues. For really massive datasets, a desktop tool might be faster.',
      },
      {
        q: 'Does it validate against a schema?',
        a: 'It validates JSON syntax (structure and formatting). Schema validation against a JSON Schema spec isn\'t supported yet.',
      },
      {
        q: 'Can I minify JSON too?',
        a: 'Yes, there\'s a minify button that strips all whitespace. Useful when you need to pack JSON into a URL parameter or config field.',
      },
    ],
  },

  'base64-encoder': {
    intro:
      'Encode text to Base64 or decode Base64 back to readable text. Drop in a file and get its Base64 representation, or paste a Base64 string and see what it actually says. One of those tools you don\'t need often, but when you do, you really do.',
    howTo: [
      'Paste text or a Base64 string into the input field',
      'Click encode or decode',
      'Copy the result from the output field',
      'Optionally upload a file to get its Base64 encoding',
    ],
    whyNeedIt:
      'Base64 shows up everywhere — email attachments, API tokens, embedded images, data URIs. When you need to quickly encode or decode something, opening a terminal and remembering the right command is slower than just pasting it here.',
    faqs: [
      {
        q: 'What\'s the max size for file encoding?',
        a: 'Files up to about 5MB work fine in the browser. Larger files should be handled with command-line tools.',
      },
      {
        q: 'Is Base64 encryption?',
        a: 'No. Base64 is encoding, not encryption. Anyone can decode it. Never use it to hide sensitive data.',
      },
      {
        q: 'Does it support URL-safe Base64?',
        a: 'Yes, there\'s a toggle for URL-safe encoding that replaces + and / with - and _ characters.',
      },
    ],
  },

  'regex-tester': {
    intro:
      'Test regular expressions against sample text with real-time highlighting of matches. See capture groups, get explanations of what your pattern does, and debug why it\'s not matching what you expect. Regex is hard enough without doing it blind.',
    howTo: [
      'Enter your regex pattern in the pattern field',
      'Paste sample text in the test area',
      'Matches highlight in real-time as you type',
      'Check the explanation panel to understand each part of your pattern',
      'Toggle flags like global, case-insensitive, and multiline',
    ],
    whyNeedIt:
      'Writing regex from memory and hoping it works is a recipe for bugs. Testing against real data with visual feedback catches edge cases and saves you from deploying patterns that match too much or too little.',
    faqs: [
      {
        q: 'Which regex flavor does this use?',
        a: 'JavaScript regex (since it runs in your browser). Most patterns are compatible with other languages, but some features like lookbehinds may behave differently.',
      },
      {
        q: 'Can I save patterns for later?',
        a: 'You can bookmark or copy your pattern. The tool also keeps a history of recent patterns in your session.',
      },
      {
        q: 'Does it explain the regex in plain English?',
        a: 'Yes. The explanation panel breaks down each part of the pattern so you can understand (and debug) what it\'s actually doing.',
      },
    ],
  },

  'cron-builder': {
    intro:
      'Build cron expressions with a visual interface instead of memorizing that the day-of-week field is the fifth one. Pick your schedule from dropdowns and get the cron string, or paste a cron expression and see what it means in plain English.',
    howTo: [
      'Use the dropdowns to select minute, hour, day, month, and weekday',
      'Or paste an existing cron expression to decode it',
      'See the next 5 scheduled run times to verify it\'s right',
      'Copy the cron expression for your crontab or scheduler',
    ],
    whyNeedIt:
      'Cron syntax is one of those things you look up every single time. Is the month field third or fourth? Does Sunday start at 0 or 1? This tool means you never have to wonder — just pick what you want and get the right expression.',
    faqs: [
      {
        q: 'Does it support non-standard cron formats?',
        a: 'It handles standard 5-field cron and also the 6-field version (with seconds) used by some schedulers like Quartz.',
      },
      {
        q: 'What timezone are the preview times in?',
        a: 'Your local browser timezone. The preview shows the next 5 runs so you can verify the schedule is what you intended.',
      },
      {
        q: 'Can I use special characters like L and W?',
        a: 'Yes, extended syntax including L (last), W (weekday), and # (nth day of month) is supported.',
      },
    ],
  },

  'jwt-decoder': {
    intro:
      'Decode and inspect JSON Web Tokens without installing anything. Paste a JWT and see the header, payload, and signature decoded and formatted. Checks expiration too so you know immediately if the token is still valid.',
    howTo: [
      'Paste your JWT into the input field',
      'View the decoded header and payload sections',
      'Check the expiration status and issued-at time',
      'Verify the signature if you have the secret key',
    ],
    whyNeedIt:
      'When you\'re debugging auth issues, you need to see what\'s actually in the token. Is it expired? Is the role claim wrong? Does the audience match? Decoding it manually is tedious — this shows everything instantly.',
    faqs: [
      {
        q: 'Is it safe to paste my JWT here?',
        a: 'The decoding happens entirely in your browser. Nothing is sent to any server. That said, don\'t paste production tokens in tools you don\'t trust.',
      },
      {
        q: 'Can it verify the signature?',
        a: 'For HMAC tokens, enter the secret and it\'ll verify. For RSA/EC tokens, you can paste the public key. Both happen client-side.',
      },
      {
        q: 'What JWT algorithms are supported?',
        a: 'HS256, HS384, HS512, RS256, RS384, RS512, ES256, and ES384. Covers the vast majority of tokens you\'ll encounter.',
      },
    ],
  },

  'fake-data-generator': {
    intro:
      'Generate realistic fake data for testing — names, emails, addresses, phone numbers, dates, whatever you need. Set the count and format, and get a dataset you can use to populate your database, test forms, or build demos without using real user data.',
    howTo: [
      'Select the data fields you need (name, email, address, etc.)',
      'Set how many records to generate',
      'Choose the output format — JSON, CSV, or SQL inserts',
      'Download or copy the generated dataset',
    ],
    whyNeedIt:
      'Testing with real data is risky and usually violates privacy rules. But testing with obviously fake data like "test@test.com" doesn\'t catch the bugs that real-looking data does. This gives you the realism without the risk.',
    faqs: [
      {
        q: 'Is the data truly random?',
        a: 'Names and addresses are pulled from realistic datasets, so they look real but don\'t correspond to actual people.',
      },
      {
        q: 'Can I generate data in specific locales?',
        a: 'Yes, pick a locale to get region-appropriate names, addresses, and phone number formats.',
      },
      {
        q: 'What\'s the max number of records?',
        a: 'Up to 10,000 records at once. For bigger datasets, generate in batches and combine them.',
      },
      {
        q: 'Can I define custom field types?',
        a: 'Beyond the presets, you can define fields with custom regex patterns or pick-lists for domain-specific data.',
      },
    ],
  },

  'placeholder-image': {
    intro:
      'Generate placeholder images in any size for your mockups and prototypes. Set the dimensions, background color, and optional text, then download the image or use the direct URL. Way quicker than hunting for stock photos during the design phase.',
    howTo: [
      'Enter the width and height in pixels',
      'Optionally set a background color and text label',
      'Preview the image',
      'Download it or copy the direct URL to use in your HTML',
    ],
    whyNeedIt:
      'Every prototype needs placeholder images, and manually creating them in Photoshop is a waste of time. Having them generated on the fly with exact dimensions keeps your layouts accurate during development.',
    faqs: [
      {
        q: 'What formats are generated?',
        a: 'PNG by default. The images are lightweight and work anywhere.',
      },
      {
        q: 'Can I add custom text to the image?',
        a: 'Yes. Most people add the dimensions (like "800x600") but you can put any text — section names, component labels, whatever.',
      },
      {
        q: 'Is there a max size?',
        a: 'Up to 4000x4000 pixels. Anything larger would be impractical for placeholder purposes.',
      },
    ],
  },

  'favicon-generator': {
    intro:
      'Upload an image and get a full set of favicons in every size you need — ICO, PNG, Apple Touch Icon, Android Chrome icons, the works. Also generates the HTML link tags you need to paste into your page head. One upload, all sizes handled.',
    howTo: [
      'Upload your source image (ideally square, at least 512x512)',
      'Preview all the generated sizes',
      'Download the complete favicon package as a ZIP',
      'Copy the HTML tags and paste them into your site\'s head section',
    ],
    whyNeedIt:
      'Every browser and device wants a different favicon size, and getting them wrong means a blurry icon or no icon at all. This tool handles the tedious resizing and format conversion so your site looks polished everywhere.',
    faqs: [
      {
        q: 'What sizes are included?',
        a: '16x16, 32x32, 48x48 (ICO), 180x180 (Apple Touch), 192x192 and 512x512 (Android), plus the web app manifest icons.',
      },
      {
        q: 'What image format should I upload?',
        a: 'PNG or SVG works best. JPEGs work too but you might get artifacts at small sizes. Use a square image for best results.',
      },
      {
        q: 'Does it generate a web manifest file?',
        a: 'Yes, a site.webmanifest file is included in the download package with the proper icon references.',
      },
    ],
  },

  'color-palette-extractor': {
    intro:
      'Upload an image and pull out the dominant colors as a usable palette. Get hex codes, RGB values, and a visual swatch you can copy straight into your CSS or design tool. Great for when you see a photo with colors you love and want to use them.',
    howTo: [
      'Upload any image — photo, screenshot, design reference',
      'The tool extracts 5-8 dominant colors automatically',
      'Click any color swatch to copy its hex code',
      'Export the full palette in various formats',
    ],
    whyNeedIt:
      'Picking colors from scratch is hard. Starting from a photo or reference image you already like is much easier. This tool bridges the gap between inspiration and implementation.',
    faqs: [
      {
        q: 'How many colors does it extract?',
        a: 'By default, 5-8 dominant colors. You can adjust the count if you want more or fewer.',
      },
      {
        q: 'Does it work with any image format?',
        a: 'JPG, PNG, GIF, and WebP all work. SVGs are converted to raster first.',
      },
      {
        q: 'Can I get the colors in formats other than hex?',
        a: 'Yes — hex, RGB, HSL, and Tailwind CSS class names are all available.',
      },
    ],
  },

  'color-picker': {
    intro:
      'Pick a color using a visual picker and get the value in every format — hex, RGB, HSL, CMYK, and Tailwind classes. Includes a contrast checker so you can verify text readability against your chosen background. Dead simple, always handy.',
    howTo: [
      'Use the color wheel or spectrum to pick a color',
      'Or paste a hex/RGB value to start from an existing color',
      'Copy the color in whatever format you need',
      'Use the contrast checker to test text/background combinations',
    ],
    whyNeedIt:
      'You\'d think picking colors would be easy, but getting the right shade and making sure it\'s accessible takes more work than people realize. Having all the formats and a contrast check in one place speeds everything up.',
    faqs: [
      {
        q: 'What contrast ratio should I aim for?',
        a: 'WCAG recommends 4.5:1 for normal text and 3:1 for large text. The tool shows the ratio and gives you a pass/fail.',
      },
      {
        q: 'Can I save favorite colors?',
        a: 'Yes, there\'s a palette tray where you can save colors during your session for easy reference.',
      },
      {
        q: 'Does it support Tailwind CSS colors?',
        a: 'It shows the closest matching Tailwind color class for any color you pick.',
      },
    ],
  },

  'gradient-generator': {
    intro:
      'Create CSS gradients visually — linear, radial, and conic. Drag color stops, adjust angles, and see the gradient update in real time. Copy the CSS code when you\'re happy. Way faster than tweaking gradient values by hand in your stylesheet.',
    howTo: [
      'Pick your gradient type (linear, radial, or conic)',
      'Add and position color stops on the gradient bar',
      'Adjust the angle or center point',
      'Copy the generated CSS code',
    ],
    whyNeedIt:
      'CSS gradients have tricky syntax, and small changes in stop positions or angles make a big visual difference. A visual editor lets you dial in exactly what you want instead of refreshing the browser 50 times.',
    faqs: [
      {
        q: 'Can I add more than two colors?',
        a: 'Yes, add as many color stops as you want. Most gradients look best with 2-4 stops, but the tool handles any number.',
      },
      {
        q: 'Does it generate vendor prefixes?',
        a: 'Modern browsers don\'t need them anymore, but there\'s a toggle to include -webkit- prefixes if you need legacy support.',
      },
      {
        q: 'Can I save gradients?',
        a: 'You can bookmark the URL (which encodes your gradient settings) or copy the CSS to save it in your project.',
      },
    ],
  },

  'markdown-editor': {
    intro:
      'Write Markdown with a live preview side by side. Supports tables, code blocks, images, and all the standard syntax. If you write docs, READMEs, or blog posts in Markdown, this gives you a distraction-free writing environment with instant visual feedback.',
    howTo: [
      'Type or paste Markdown in the left panel',
      'See the rendered preview update in real time on the right',
      'Use the toolbar for quick formatting shortcuts',
      'Export as HTML or copy the raw Markdown',
    ],
    whyNeedIt:
      'Writing Markdown without a preview means pushing to GitHub just to see if your table formatted correctly. A live preview catches formatting issues as you type and makes the writing experience way more pleasant.',
    faqs: [
      {
        q: 'Does it support GitHub-flavored Markdown?',
        a: 'Yes — tables, task lists, strikethrough, fenced code blocks, and syntax highlighting are all supported.',
      },
      {
        q: 'Can I export to other formats?',
        a: 'HTML export is built in. For PDF, use the browser\'s print function on the preview panel.',
      },
      {
        q: 'Is there a word count?',
        a: 'Yes, word and character counts are shown at the bottom of the editor. Reading time estimate too.',
      },
    ],
  },

  'file-converter': {
    intro:
      'Convert files between common formats right in your browser — images, documents, data files. No uploads to external servers, no software to install. Drag in a file, pick the output format, and download the result.',
    howTo: [
      'Upload or drag-and-drop your file',
      'Select the output format from the available options',
      'Adjust any conversion settings (quality, resolution, etc.)',
      'Download the converted file',
    ],
    whyNeedIt:
      'Installing a whole app just to convert a PNG to SVG or a CSV to JSON is overkill. This handles the common conversions that come up all the time during development and design work.',
    faqs: [
      {
        q: 'What file formats are supported?',
        a: 'Image conversions (PNG, JPG, WebP, SVG), data formats (JSON, CSV, XML, YAML), and basic document formats. The list keeps growing.',
      },
      {
        q: 'Is there a file size limit?',
        a: 'Since it runs in your browser, practical limits depend on your device. Files up to 50MB generally work fine.',
      },
      {
        q: 'Are my files sent to a server?',
        a: 'No. All conversion happens locally in your browser. Your files never leave your machine.',
      },
    ],
  },

  'tech-stack-recommender': {
    intro:
      'Describe your project and get tech stack suggestions based on the type, scale, team size, and goals. Covers frontend, backend, database, hosting, and deployment tools. Helpful when you\'re starting a new project and want to make informed choices instead of just using whatever you used last time.',
    howTo: [
      'Describe your project type and requirements',
      'Indicate your team size and experience level',
      'Set priorities — speed, scalability, cost, learning curve',
      'Review recommended technologies for each layer of the stack',
    ],
    whyNeedIt:
      'Choosing a tech stack has long-term consequences. The wrong choice can mean rewriting everything in a year. Getting recommendations based on actual project needs (not just hype) saves future headaches.',
    faqs: [
      {
        q: 'How does it decide what to recommend?',
        a: 'Based on your project type, scale, and priorities. A solo developer building an MVP gets different suggestions than a team of 10 building an enterprise app.',
      },
      {
        q: 'Does it cover DevOps and infrastructure?',
        a: 'Yes — hosting, CI/CD, containerization, and monitoring are included alongside the application stack.',
      },
      {
        q: 'Is it biased toward certain technologies?',
        a: 'It considers popularity, community support, maturity, and fit for your use case. No sponsorships or hidden preferences.',
      },
    ],
  },

  'ai-prompt-generator': {
    intro:
      'Craft better prompts for AI tools like ChatGPT, Claude, Midjourney, and others. Pick your use case, add context, and get a structured prompt that\'s more likely to give you useful output. Because "write me a blog post" gets mediocre results compared to a well-structured prompt.',
    howTo: [
      'Select the AI tool and your use case',
      'Describe what you want in your own words',
      'Add context like audience, tone, format, and constraints',
      'Copy the optimized prompt and use it in your AI tool',
    ],
    whyNeedIt:
      'The quality of AI output depends massively on the input. A prompt with clear context, constraints, and examples gets 10x better results than a vague one-liner. This tool helps you write those prompts even if you\'re not a "prompt engineer."',
    faqs: [
      {
        q: 'Does it work for image generation prompts?',
        a: 'Yes. There are templates for Midjourney, DALL-E, and Stable Diffusion with the right style keywords and parameters.',
      },
      {
        q: 'Can I save my prompts?',
        a: 'You can copy them or bookmark the page. A prompt library feature where you save favorites is on the roadmap.',
      },
      {
        q: 'What makes a "good" prompt?',
        a: 'Specificity, context, format instructions, and examples. The tool guides you through each of these elements so nothing gets left out.',
      },
      {
        q: 'Do the prompts work with any AI model?',
        a: 'The core principles work everywhere. Some templates are optimized for specific tools, but you can adapt any prompt to any model.',
      },
    ],
  },

  // ==========================================
  // SECURITY, FINANCE, EDUCATION, PRODUCTIVITY,
  // HEALTH, LIFESTYLE & MORE
  // ==========================================

// Security & Privacy
"password-generator": {
  intro: "Create strong, random passwords in seconds. Pick your length, choose whether to include symbols or numbers, and copy the result. No more using your pet's name for everything.",
  howTo: [
    "Set your desired password length (12+ characters recommended).",
    "Toggle options for uppercase, lowercase, numbers, and symbols.",
    "Click Generate and copy your new password to the clipboard.",
  ],
  whyNeedIt: "Weak passwords are the number one reason accounts get hacked. A random password generator removes human bias and creates combinations that are nearly impossible to guess. Your brain is terrible at being random — let the tool handle it.",
  faqs: [
    { q: "Is it safe to generate passwords in my browser?", a: "Yes. The password is generated entirely on your device and never sent to any server. Nothing is stored or logged." },
    { q: "How long should my password be?", a: "At least 12 characters, but 16 or more is better. Every extra character makes it exponentially harder to crack." },
    { q: "Should I include symbols?", a: "Whenever a site allows it, yes. Symbols increase the pool of possible characters and make brute-force attacks much slower." },
  ],
},
"password-checker": {
  intro: "Paste a password and find out if it has appeared in known data breaches. This tool checks against a database of billions of leaked credentials without ever sending your full password over the internet.",
  howTo: [
    "Type or paste the password you want to check.",
    "The tool hashes your password locally and checks only a partial hash against the breach database.",
    "Review the results — you will see how many times that password has appeared in breaches.",
  ],
  whyNeedIt: "Even a password that looks strong might already be compromised. If attackers have it in a leaked database, they will try it on every major site. Checking your passwords against known breaches is one of the simplest things you can do to protect yourself.",
  faqs: [
    { q: "Is it safe to type my real password here?", a: "Yes. Your password is hashed on your device, and only the first few characters of that hash are sent to check the database. The full password never leaves your browser." },
    { q: "What should I do if my password was found in a breach?", a: "Change it immediately on every site where you used it. Use the password generator to create a unique replacement for each account." },
    { q: "How does the breach database work?", a: "It uses the Have I Been Pwned API, which collects passwords from publicly known data breaches. The check uses a k-anonymity model so your password stays private." },
  ],
},
"password-strength": {
  intro: "Type a password and get an instant strength rating. The tool analyzes length, character variety, common patterns, and dictionary words to tell you how resistant your password really is.",
  howTo: [
    "Enter the password you want to evaluate.",
    "Watch the strength meter update in real time as you type.",
    "Read the specific suggestions to improve your password if needed.",
  ],
  whyNeedIt: "Most people overestimate how strong their passwords are. Adding a number to the end of a word does not make it secure. This tool gives you honest feedback based on how password cracking actually works, not just whether you ticked a checkbox.",
  faqs: [
    { q: "What makes a password strong?", a: "Length is the biggest factor, followed by randomness. A long passphrase of random words beats a short string of mixed characters every time." },
    { q: "Why does it flag common substitutions like @ for a?", a: "Attackers know all the common tricks — replacing letters with numbers or symbols. Cracking tools try these substitutions automatically, so they add almost no real security." },
    { q: "Is a 'strong' rating enough?", a: "It is a good sign, but also make sure you are not reusing that password elsewhere. A strong password used on ten sites is still a risk if one of those sites gets breached." },
  ],
},
"hash-generator": {
  intro: "Generate MD5, SHA-1, SHA-256, and other hash values from any text input. Useful for verifying file integrity, storing passwords, or just understanding how hashing works.",
  howTo: [
    "Enter or paste the text you want to hash.",
    "Select the hashing algorithm (MD5, SHA-1, SHA-256, etc.).",
    "Copy the resulting hash value.",
  ],
  whyNeedIt: "Hashes are everywhere in security — from verifying downloads to storing passwords to checking data integrity. Having a quick way to generate and compare hashes saves you from installing command-line tools or writing scripts every time you need one.",
  faqs: [
    { q: "What is the difference between MD5 and SHA-256?", a: "MD5 is older and faster but considered broken for security purposes. SHA-256 is part of the SHA-2 family and is currently the standard for most security applications." },
    { q: "Can I reverse a hash to get the original text?", a: "No. Hashing is a one-way function by design. You can only compare a known input against a hash to check for a match." },
    { q: "Which algorithm should I use?", a: "For security purposes, use SHA-256 or higher. MD5 and SHA-1 are fine for checksums or non-security tasks, but they should not be used for passwords or digital signatures." },
  ],
},
"ip-lookup": {
  intro: "Enter any IP address and get its approximate location, ISP, and other public details. You can also check your own public IP to see what information websites can see about your connection.",
  howTo: [
    "Enter an IP address or click the button to use your own.",
    "View the geolocation, ISP, timezone, and other details.",
    "Use the map to see the approximate physical location.",
  ],
  whyNeedIt: "Knowing what your IP reveals helps you understand your online privacy. It is also useful for troubleshooting network issues, checking VPN connections, or investigating suspicious activity in your server logs.",
  faqs: [
    { q: "How accurate is IP geolocation?", a: "It is usually accurate to the city level, sometimes just the region. It will not pinpoint a street address — that is a Hollywood myth." },
    { q: "Can I hide my IP address?", a: "Yes, using a VPN or Tor. A VPN replaces your real IP with the VPN server's IP, so websites see a different location." },
    { q: "Is looking up an IP address legal?", a: "Yes. IP geolocation data is publicly available information. You are simply querying a database that maps IP ranges to locations." },
  ],
},
"privacy-checker": {
  intro: "See what your browser is telling every website you visit. This tool reveals your digital fingerprint — screen resolution, installed fonts, browser plugins, and dozens of other details that can be used to track you.",
  howTo: [
    "Open the tool and let it scan your browser automatically.",
    "Review each category of information your browser exposes.",
    "Follow the recommendations to reduce your trackability.",
  ],
  whyNeedIt: "Cookies are not the only way websites track you. Browser fingerprinting combines dozens of small details to create a unique profile, even without cookies. Understanding what you are leaking is the first step to reducing it.",
  faqs: [
    { q: "What is browser fingerprinting?", a: "It is a technique that combines your screen size, timezone, language, installed fonts, and other browser properties to create a unique identifier. Even without cookies, this fingerprint can track you across sites." },
    { q: "How can I reduce my fingerprint?", a: "Use a privacy-focused browser like Firefox with strict settings, disable JavaScript where possible, and avoid installing unusual plugins or fonts. The more you blend in, the harder you are to track." },
    { q: "Does incognito mode help?", a: "Not much. Incognito mode clears cookies and history but does almost nothing to change your browser fingerprint. Your fingerprint stays the same across normal and incognito windows." },
  ],
},
"speed-test": {
  intro: "Test your internet connection speed right from this page. Measure download speed, upload speed, and ping without needing a separate app or visiting a cluttered speed test site full of ads.",
  howTo: [
    "Click the Start Test button.",
    "Wait a few seconds while the tool measures your download, upload, and latency.",
    "Compare your results against your ISP's promised speeds.",
  ],
  whyNeedIt: "ISPs promise certain speeds but rarely deliver them consistently. Running regular speed tests helps you know if you are getting what you pay for, and gives you evidence if you need to complain or switch providers.",
  faqs: [
    { q: "Why is my speed lower than what my ISP advertises?", a: "ISPs advertise 'up to' speeds, which are theoretical maximums. Actual speeds depend on network congestion, distance from the router, time of day, and many other factors." },
    { q: "What is a good ping?", a: "Under 20ms is excellent for gaming. Under 50ms is fine for video calls. Anything over 100ms and you will start noticing lag in real-time applications." },
    { q: "Should I test over WiFi or ethernet?", a: "Ethernet gives you a more accurate measure of your actual internet speed. WiFi adds its own bottleneck, so test with ethernet if you want to know what your ISP is actually delivering." },
  ],
},
"phishing-quiz": {
  intro: "Think you can spot a phishing email? This quiz shows you real and fake emails side by side and challenges you to identify which ones are trying to steal your information. Most people score lower than they expect.",
  howTo: [
    "Look at each email screenshot and decide if it is legitimate or phishing.",
    "Click your choice and see the explanation of what to look for.",
    "Complete all rounds to get your final score and learn the red flags.",
  ],
  whyNeedIt: "Phishing is the most common way people lose access to their accounts and personal data. Attackers are getting better at making fake emails look real. Practicing with examples trains your eye to catch the subtle details that give scams away.",
  faqs: [
    { q: "What are the most common signs of a phishing email?", a: "Urgency (act now or lose your account), mismatched sender domains, generic greetings, and suspicious links. Hover over links before clicking to see where they actually go." },
    { q: "Can phishing emails come from people I know?", a: "Yes. If someone's account gets compromised, attackers can send phishing emails from their real address. Always verify unexpected requests through a different communication channel." },
    { q: "Is this quiz based on real phishing emails?", a: "The examples are inspired by real-world phishing campaigns. The techniques shown are ones that attackers actively use today." },
  ],
},
"cyber-risk-scorecard": {
  intro: "Answer a series of quick questions about your online habits and get a personalized cyber risk score. The tool evaluates your password practices, device security, social media exposure, and more.",
  howTo: [
    "Answer each question honestly about your current security habits.",
    "Review your overall risk score and the breakdown by category.",
    "Follow the prioritized recommendations to improve your weakest areas first.",
  ],
  whyNeedIt: "Most people do not know where their biggest security gaps are. You might have a great password manager but leave your phone unlocked. This scorecard highlights your specific weak spots so you can focus your efforts where they matter most.",
  faqs: [
    { q: "Is my data stored when I take this assessment?", a: "No. Everything runs in your browser and nothing is saved or sent anywhere. Your answers and score exist only during your session." },
    { q: "How often should I retake this?", a: "Every few months, or whenever you make a major change like getting a new phone, switching email providers, or starting a new job." },
    { q: "What score should I aim for?", a: "Perfection is not realistic for most people. Focus on getting out of the high-risk zone first, then gradually improve. Even small changes like enabling two-factor authentication make a big difference." },
  ],
},
"incident-response": {
  intro: "Been hacked, scammed, or had a data breach? This tool walks you through exactly what to do, step by step. Select your situation and get a customized response plan with actionable instructions.",
  howTo: [
    "Select the type of incident (hacked account, stolen device, data breach, etc.).",
    "Follow the step-by-step checklist tailored to your situation.",
    "Check off completed steps and save your progress if needed.",
  ],
  whyNeedIt: "When something goes wrong, panic makes you forget important steps. Having a clear, ordered checklist ensures you do not miss anything critical — like changing passwords on related accounts or notifying your bank before the attacker can move money.",
  faqs: [
    { q: "What should I do first if I think I have been hacked?", a: "Change the password of the affected account immediately from a different device. If you cannot access the account, use the service's account recovery process. Then enable two-factor authentication." },
    { q: "Should I report cyber incidents to the police?", a: "Yes, especially if money was lost. In Ghana, you can report to the Cyber Crime Unit. Having a police report also helps when dealing with banks or insurance companies." },
    { q: "How do I know if I have been part of a data breach?", a: "Check haveibeenpwned.com with your email address. You can also set up alerts to be notified of future breaches that include your information." },
  ],
},
"scam-analyzer": {
  intro: "Paste a suspicious message, email, or URL and get an instant analysis of whether it looks like a scam. The tool checks for common red flags like urgency tactics, fake domains, and known scam patterns.",
  howTo: [
    "Paste the suspicious text, email content, or URL into the analyzer.",
    "Click Analyze to run the scam detection checks.",
    "Review the risk rating and the specific red flags that were found.",
  ],
  whyNeedIt: "Scammers are creative, and new schemes appear every day. When you get a message that feels off but you are not sure, running it through the analyzer can confirm your suspicion or point out warning signs you missed.",
  faqs: [
    { q: "Can this tool catch every scam?", a: "No tool can catch everything. New scams appear constantly. Use this as one layer of protection alongside your own judgment. If something feels wrong, it probably is." },
    { q: "What are the most common scams right now?", a: "Investment scams, fake job offers, romance scams, and mobile money fraud are all very common. Scammers also frequently impersonate banks, delivery services, and government agencies." },
    { q: "What should I do if the tool says it is a scam?", a: "Do not respond to the message or click any links. Block the sender, report it to the platform, and warn others who might receive the same message." },
  ],
},
"whatsapp-audit": {
  intro: "Review your WhatsApp privacy and security settings with this guided audit. The tool walks you through every important setting and explains what each one does for your privacy.",
  howTo: [
    "Open WhatsApp settings on your phone alongside this tool.",
    "Follow each audit step and check the recommended setting.",
    "Mark each item as done to track your progress through the full audit.",
  ],
  whyNeedIt: "WhatsApp has a lot of privacy settings buried in menus that most people never explore. This audit makes sure you have not accidentally left your profile photo visible to strangers, or your last-seen status open to everyone, or your groups joinable by anyone with your number.",
  faqs: [
    { q: "Does this tool access my WhatsApp account?", a: "No. It is a guided checklist that you follow manually. The tool never connects to WhatsApp or accesses any of your data." },
    { q: "What is the most important WhatsApp privacy setting?", a: "Two-step verification. It adds a PIN that prevents someone from registering your number on a new device, even if they have your SIM card." },
    { q: "Can people still track me on WhatsApp after this audit?", a: "The audit significantly reduces your exposure, but WhatsApp itself collects metadata. For maximum privacy, consider using Signal for sensitive conversations." },
  ],
},

// Finance
"ghana-tax-calculator": {
  intro: "Calculate your Ghana income tax based on the latest GRA tax brackets. Enter your gross monthly or annual salary and instantly see your PAYE, SSNIT contribution, and take-home pay.",
  howTo: [
    "Enter your gross monthly or annual salary in Ghana Cedis.",
    "Select whether you want monthly or annual calculations.",
    "View the breakdown of SSNIT, PAYE tax, and your net take-home pay.",
  ],
  whyNeedIt: "Understanding your tax obligations should not require an accountant. This tool uses the current GRA tax tables so you can quickly verify your payslip deductions or estimate take-home pay before accepting a job offer.",
  faqs: [
    { q: "Are the tax brackets up to date?", a: "Yes, the calculator uses the latest Ghana Revenue Authority tax rates. We update it whenever GRA announces changes." },
    { q: "Does this include SSNIT contributions?", a: "Yes. The calculator deducts the employee SSNIT contribution (5.5% for Tier 1) before calculating PAYE tax, just like your employer does." },
    { q: "Can I use this for self-employed income?", a: "This tool is designed for PAYE employees. Self-employed taxpayers have different rules and should consult the GRA guidelines or a tax professional." },
  ],
},
"compound-interest": {
  intro: "See how your money grows over time with compound interest. Enter your initial amount, monthly contributions, interest rate, and timeframe to visualize the power of compounding.",
  howTo: [
    "Enter your starting amount and any regular monthly contributions.",
    "Set the annual interest rate and the number of years.",
    "View the chart showing how your money grows, with a breakdown of contributions vs. interest earned.",
  ],
  whyNeedIt: "Compound interest is the most powerful concept in personal finance, but it is hard to intuit. Seeing the actual numbers — especially how small monthly contributions snowball over decades — can change the way you think about saving.",
  faqs: [
    { q: "What is compound interest?", a: "It means you earn interest on your interest. Instead of only earning returns on your original deposit, each period's interest gets added to the balance, and the next period earns interest on the bigger number." },
    { q: "How often is interest compounded?", a: "It depends on the account. Banks may compound daily, monthly, or annually. This calculator lets you choose the compounding frequency to match your situation." },
    { q: "Is the result guaranteed?", a: "No. The calculator assumes a constant rate of return. Real investments fluctuate. Use it for planning and comparison, not as a prediction." },
  ],
},
"mortgage-calculator": {
  intro: "Calculate your monthly mortgage payment, total interest, and amortization schedule. Adjust the loan amount, interest rate, and term to compare different scenarios before committing.",
  howTo: [
    "Enter the property price and your down payment amount.",
    "Set the interest rate and loan term in years.",
    "Review your monthly payment and the full amortization schedule showing principal vs. interest over time.",
  ],
  whyNeedIt: "A mortgage is probably the biggest financial commitment you will make. Seeing how different interest rates or down payments affect your monthly cost and total interest paid helps you negotiate better and choose the right loan structure.",
  faqs: [
    { q: "What is an amortization schedule?", a: "It shows how each monthly payment splits between principal and interest over the life of the loan. Early payments go mostly to interest; later payments go mostly to principal." },
    { q: "Should I choose a shorter or longer loan term?", a: "A shorter term means higher monthly payments but much less total interest. A longer term is more affordable month to month but costs significantly more overall. Run both scenarios to see the difference." },
    { q: "Does this include property taxes and insurance?", a: "This calculator focuses on the loan payment itself. Your actual monthly cost will include property tax, insurance, and possibly maintenance fees depending on your location." },
  ],
},
"rent-vs-buy": {
  intro: "Not sure whether renting or buying makes more financial sense? Enter your rent, potential purchase price, and a few other details to see a side-by-side comparison over time.",
  howTo: [
    "Enter your current monthly rent and expected annual rent increase.",
    "Enter the home purchase price, down payment, interest rate, and other costs.",
    "Compare the total cost of renting vs. buying over your chosen timeframe.",
  ],
  whyNeedIt: "The 'rent is throwing money away' advice is not always correct. Sometimes renting and investing the difference beats buying, especially with high interest rates or when you might move soon. This tool does the actual math so you can decide based on numbers, not assumptions.",
  faqs: [
    { q: "Does this account for property value appreciation?", a: "Yes. You can set an expected annual appreciation rate. The tool factors this into the comparison, but remember that property values are not guaranteed to increase." },
    { q: "What costs does the buy side include?", a: "Mortgage payments, property taxes, insurance, maintenance, closing costs, and opportunity cost of your down payment. It is designed to give a realistic total cost, not just the mortgage." },
    { q: "Over what timeframe should I compare?", a: "Buying usually only makes sense if you plan to stay at least 5 to 7 years. The tool lets you see the crossover point where buying becomes cheaper than renting." },
  ],
},
"fire-calculator": {
  intro: "Find out when you can reach financial independence and retire early. Enter your income, expenses, savings rate, and investments to see your projected FIRE date and the portfolio size you need.",
  howTo: [
    "Enter your annual income and annual expenses.",
    "Set your current savings and expected investment return rate.",
    "See your FIRE number, projected date, and how changes in savings rate affect the timeline.",
  ],
  whyNeedIt: "The FIRE movement shows that retirement is not about age — it is about having enough invested to cover your expenses. Even if early retirement is not your goal, knowing your number gives you a target to work toward and helps you make better financial trade-offs.",
  faqs: [
    { q: "What is a FIRE number?", a: "It is the amount you need invested so that the returns cover your annual expenses. The common rule is 25 times your annual spending, based on a 4% safe withdrawal rate." },
    { q: "Is the 4% rule reliable?", a: "It is based on historical US market data and works for 30-year retirements in most scenarios. For very early retirees or different markets, many people use a more conservative 3% or 3.5% rate." },
    { q: "What if I cannot save a large percentage of my income?", a: "Even small increases in your savings rate make a big difference over time. Going from 10% to 15% can shave years off your timeline. The calculator lets you experiment with different rates to see the impact." },
  ],
},
"roi-calculator": {
  intro: "Calculate the return on investment for any project, purchase, or business decision. Enter what you spent and what you gained to get a clear percentage return and break-even analysis.",
  howTo: [
    "Enter the total cost of the investment or project.",
    "Enter the total returns or value gained.",
    "View your ROI percentage, net profit, and annualized return if applicable.",
  ],
  whyNeedIt: "ROI is the simplest way to compare different opportunities. Whether you are evaluating a marketing campaign, a certification course, or a rental property, knowing the percentage return lets you make apples-to-apples comparisons.",
  faqs: [
    { q: "What is a good ROI?", a: "It depends entirely on the context. A 10% annual return is great for stock investments, but a marketing campaign that only returns 10% is usually not worth the effort." },
    { q: "Does this account for time?", a: "Yes, if you enter the investment duration. The annualized return lets you compare investments held for different periods. A 50% return over five years is less impressive than 50% in one year." },
    { q: "Should I include all costs?", a: "Yes. Include everything — your time, transaction fees, taxes, opportunity costs. Underestimating costs is the most common way people overstate their ROI." },
  ],
},
"bill-splitter": {
  intro: "Split a restaurant bill fairly among friends, including tax and tip. Handle uneven splits when people ordered different things, or just divide equally. No more awkward math at the table.",
  howTo: [
    "Enter the total bill amount, tax, and tip percentage.",
    "Add each person and either split equally or assign specific items.",
    "Share the results so everyone knows exactly what they owe.",
  ],
  whyNeedIt: "Splitting bills by hand always leads to someone overpaying and someone underpaying. This tool handles the math cleanly, including tricky parts like splitting shared appetizers or dividing tax proportionally.",
  faqs: [
    { q: "Can I split individual items between people?", a: "Yes. You can assign each item to specific people or mark items as shared. The tool divides shared items and calculates tax and tip proportionally." },
    { q: "How is the tip calculated?", a: "The tip is applied to the pre-tax total, which is the standard practice. You can set any tip percentage or enter a custom amount." },
    { q: "Can I save and share the split?", a: "You can share the breakdown link with your group so everyone can see what they owe on their own device." },
  ],
},
"salary-comparison": {
  intro: "Compare salaries across different roles, industries, and locations. Enter your current compensation and see how it stacks up against market rates for similar positions.",
  howTo: [
    "Enter your job title, industry, and location.",
    "Add your current salary and any additional compensation like bonuses.",
    "See where you fall relative to market ranges and similar roles.",
  ],
  whyNeedIt: "Most people have no idea if they are underpaid because salary information is hard to find. Having real comparison data gives you confidence in negotiations and helps you make informed decisions about job offers.",
  faqs: [
    { q: "How accurate are the salary ranges?", a: "The ranges are based on aggregated data and should be used as general guidance. Actual salaries vary based on experience, company size, specific skills, and many other factors." },
    { q: "Should I compare total compensation or just base salary?", a: "Always compare total compensation. Benefits, bonuses, stock options, and other perks can make a huge difference. A lower base salary with great benefits might be worth more overall." },
    { q: "How often should I check my market value?", a: "At least once a year, and definitely before any salary negotiation. Markets move fast, especially in tech and finance." },
  ],
},
"cost-of-living": {
  intro: "Compare the cost of living between two cities to understand what your salary is really worth. See how housing, food, transport, and other expenses differ so you can make informed relocation decisions.",
  howTo: [
    "Select or type your current city.",
    "Select the city you are comparing it to.",
    "Review the breakdown showing how each cost category compares and what salary you would need to maintain your lifestyle.",
  ],
  whyNeedIt: "A higher salary in a different city might actually be a pay cut once you account for living costs. This tool shows you the real picture so you do not end up earning more on paper but struggling more in practice.",
  faqs: [
    { q: "What categories does this cover?", a: "Housing, groceries, restaurants, transport, utilities, and other everyday expenses. Housing is usually the biggest factor in cost differences between cities." },
    { q: "How should I use this for a job offer in another city?", a: "Find the equivalent salary you would need in the new city to maintain your current lifestyle. If the job offer is below that number, you would effectively be taking a pay cut." },
    { q: "Are the figures updated regularly?", a: "Yes. The comparison data is updated periodically to reflect current prices. Keep in mind that averages may not match your specific spending habits." },
  ],
},
"subscription-tracker": {
  intro: "Track all your recurring subscriptions in one place and see exactly how much you spend per month and year. That Netflix plus Spotify plus iCloud plus gym membership adds up faster than you think.",
  howTo: [
    "Add each subscription with its name, cost, and billing cycle.",
    "View the dashboard showing your total monthly and annual spending.",
    "Identify subscriptions you forgot about or no longer use.",
  ],
  whyNeedIt: "The average person underestimates their subscription spending by a lot. Services are designed to be easy to sign up for and easy to forget. Seeing all of them listed with a running total is often a wake-up call.",
  faqs: [
    { q: "Is my subscription data stored securely?", a: "Your data is saved locally in your browser. Nothing is sent to any server. If you clear your browser data, you will need to re-enter your subscriptions." },
    { q: "Can I set reminders for renewal dates?", a: "The tool shows upcoming renewal dates so you can cancel before being charged. Check it at the start of each month to stay on top of things." },
    { q: "How do I handle annual subscriptions?", a: "Enter them with the annual cost and the tool automatically calculates the monthly equivalent so you can compare everything on the same basis." },
  ],
},
"stock-alert": {
  intro: "Set price alerts for stocks you are watching and get notified when they hit your target. Track multiple stocks at once with a clean dashboard showing current prices and your alert thresholds.",
  howTo: [
    "Search for a stock by name or ticker symbol.",
    "Set your target price — above or below the current price.",
    "Get notified when the stock hits your target.",
  ],
  whyNeedIt: "You should not need to check stock prices all day. Set your alerts once and go live your life. When the price you are waiting for hits, you will know. No more missed opportunities because you were not staring at a chart.",
  faqs: [
    { q: "How quickly do alerts trigger?", a: "Alerts are checked regularly during market hours. There may be a short delay, so do not rely on this for split-second trading decisions." },
    { q: "Can I set alerts for crypto too?", a: "Currently the tool focuses on stocks. Crypto support may be added in the future." },
    { q: "Is there a limit to how many alerts I can set?", a: "No hard limit. Add as many as you need. The dashboard keeps them organized so you can manage them easily." },
  ],
},
"side-hustle-calculator": {
  intro: "Figure out how much you can realistically earn from a side hustle after accounting for time, expenses, and taxes. Compare different side hustle ideas to find which one gives the best return for your hours.",
  howTo: [
    "Enter the side hustle type and your expected hourly rate or revenue.",
    "Add your estimated startup costs and ongoing expenses.",
    "See your projected monthly and annual profit, and your effective hourly rate after all costs.",
  ],
  whyNeedIt: "A side hustle that earns GHS 500 but costs GHS 300 in expenses and takes 40 hours is paying you GHS 5 per hour. This calculator strips away the hype and shows you the real numbers so you can pick hustles that are actually worth your time.",
  faqs: [
    { q: "Does this include taxes?", a: "Yes, you can set a tax rate and the calculator deducts it from your profit. Many people forget that side hustle income is taxable, which changes the picture significantly." },
    { q: "What if my income varies month to month?", a: "Enter your best estimate of average monthly revenue. You can run multiple scenarios with low, medium, and high estimates to get a range." },
    { q: "Should I count my own time as a cost?", a: "Absolutely. The tool calculates your effective hourly rate for exactly this reason. If your side hustle pays less per hour than your day job, you might be better off working overtime instead." },
  ],
},
"pay-yourself-first": {
  intro: "Set up a pay-yourself-first budget by deciding what percentage goes to savings and investments before anything else. Enter your income and savings goals to see exactly how to allocate each paycheck.",
  howTo: [
    "Enter your monthly income.",
    "Set your savings target as a percentage or fixed amount.",
    "See how much remains for expenses and get a suggested allocation.",
  ],
  whyNeedIt: "Most people save whatever is left over at the end of the month — which is usually nothing. Flipping the order and saving first forces you to live on what remains. This tool helps you figure out the right split so your savings goal is realistic.",
  faqs: [
    { q: "How much should I pay myself first?", a: "The common advice is 20% of your income, but start with whatever you can manage consistently. Even 5% is better than nothing. You can always increase it over time." },
    { q: "What if I cannot cover my expenses after saving?", a: "Then your savings target is too aggressive for now. Dial it back until you find a rate that is uncomfortable but still doable. The tool helps you find that balance." },
    { q: "Where should the saved money go?", a: "Emergency fund first (3 to 6 months of expenses), then high-interest debt, then investments. The specific accounts depend on your situation and goals." },
  ],
},
"variable-income-budget": {
  intro: "Budget effectively even when your income changes every month. This tool is built for freelancers, gig workers, and anyone with irregular pay — it smooths out the highs and lows into a workable plan.",
  howTo: [
    "Enter your income for the past several months.",
    "Set your essential and non-essential expenses.",
    "Get a budget based on your baseline income with guidance on how to handle surplus months.",
  ],
  whyNeedIt: "Traditional budgets assume a fixed monthly income, which does not work when you earn differently every month. This tool uses your income history to find a safe baseline for spending and tells you what to do with extra money in good months.",
  faqs: [
    { q: "What is baseline income?", a: "It is a conservative estimate of what you can reliably expect to earn each month, usually based on your lowest recent months. You budget essentials off this number so you are never caught short." },
    { q: "What should I do in high-income months?", a: "Build your buffer fund first, then pay down debt or invest. The tool shows you a priority order for surplus cash so the good months protect you during the lean ones." },
    { q: "How many months of data do I need?", a: "At least 3 months gives you a starting point. Six to twelve months gives a much more reliable baseline. The more data you enter, the better the recommendation." },
  ],
},
"couples-finance": {
  intro: "Navigate shared finances with your partner using this tool. Compare incomes, split expenses proportionally or equally, and set shared savings goals without the arguments.",
  howTo: [
    "Enter both partners' monthly incomes.",
    "Add your shared and individual expenses.",
    "Choose a split method (proportional, equal, or custom) and see the breakdown.",
  ],
  whyNeedIt: "Money is one of the top causes of relationship conflict. Having a clear, agreed-upon system removes ambiguity and prevents resentment. Whether you split 50/50 or proportionally, seeing the numbers helps you have the conversation productively.",
  faqs: [
    { q: "What is a proportional split?", a: "Each person pays a share of shared expenses based on their income. If one partner earns 60% of the total household income, they pay 60% of shared costs. It is often considered fairer than a straight 50/50 split." },
    { q: "Should we combine all our money?", a: "That is a personal decision. Many couples use a hybrid approach — a shared account for bills and joint goals, with separate accounts for personal spending. This tool works with any arrangement." },
    { q: "How do we handle different spending habits?", a: "Agree on the shared expenses and savings goals first. What each person does with their remaining personal money is up to them. This approach gives structure where it matters and freedom where it does not." },
  ],
},
"adsense-calculator": {
  intro: "Estimate your potential Google AdSense earnings based on your traffic, click-through rate, and cost per click. Useful for bloggers and website owners planning their monetization strategy.",
  howTo: [
    "Enter your daily page views or monthly traffic.",
    "Set your estimated CTR (click-through rate) and CPC (cost per click).",
    "See your projected daily, monthly, and annual AdSense revenue.",
  ],
  whyNeedIt: "Before investing time in a blog or website, you should know what the realistic earning potential looks like. This calculator gives you honest numbers so you can set proper expectations and plan your content strategy accordingly.",
  faqs: [
    { q: "What is a realistic CTR for AdSense?", a: "Most sites see between 1% and 3%. Higher than 5% is unusual and could even trigger Google's invalid click filters. Do not inflate this number when estimating." },
    { q: "Why does CPC vary so much by niche?", a: "Advertisers pay more for clicks in high-value industries like finance, insurance, and legal services. A finance blog can earn 10 times more per click than an entertainment blog with the same traffic." },
    { q: "How much traffic do I need to make decent money?", a: "With average CPCs, you typically need at least 50,000 monthly page views to earn a meaningful amount. High-CPC niches can do well with less traffic, but building traffic takes consistent effort over months." },
  ],
},

// Education
"essay-outline": {
  intro: "Generate a structured outline for any essay topic. Enter your subject and thesis, and get a clear framework with introduction, body paragraphs, and conclusion that you can build on.",
  howTo: [
    "Enter your essay topic and your main argument or thesis.",
    "Select the essay type (argumentative, expository, narrative, etc.).",
    "Get a complete outline with suggested points for each section.",
  ],
  whyNeedIt: "Starting an essay is the hardest part. Staring at a blank page kills motivation. An outline gives you a roadmap so you can focus on writing instead of figuring out structure. It also helps you spot weak arguments before you waste time writing them out.",
  faqs: [
    { q: "Can I use this for academic essays?", a: "Yes. The outlines follow standard academic essay structures. But remember — the outline is a starting point. You still need to do the research and write the actual content in your own words." },
    { q: "Does this write the essay for me?", a: "No. It creates the skeleton — the structure and key points. You fill in the flesh with your own research, arguments, and writing. Think of it as a map, not the journey." },
    { q: "What essay types are supported?", a: "Argumentative, expository, compare-and-contrast, persuasive, narrative, and descriptive. Each type has a slightly different structure that the tool adapts to." },
  ],
},
"concept-explainer": {
  intro: "Struggling with a concept? Enter any topic and get a plain-English explanation at the level you choose — from beginner to advanced. Great for students, self-learners, or anyone hitting a wall with textbook jargon.",
  howTo: [
    "Type the concept or topic you want explained.",
    "Select your current understanding level.",
    "Read the explanation, complete with analogies and examples.",
  ],
  whyNeedIt: "Textbooks and Wikipedia often explain things in a way that assumes you already know the basics. This tool meets you where you are and builds understanding from there, using everyday language and relatable examples.",
  faqs: [
    { q: "What subjects does this cover?", a: "Pretty much anything — science, math, economics, technology, history, and more. If a concept can be explained, the tool will try to break it down for you." },
    { q: "Can I use this instead of studying?", a: "It is a supplement, not a replacement. Use it to get unstuck on confusing topics, then go back to your course materials with better understanding." },
    { q: "How do I pick the right level?", a: "Start with beginner if you are completely new to the topic. If the explanation feels too simple, step up a level. There is no shame in starting at the beginning." },
  ],
},
"exam-predictor": {
  intro: "Enter your study habits, practice test scores, and time until the exam to get a predicted score range. The tool also tells you which topics to focus on to maximize your grade.",
  howTo: [
    "Enter details about your study schedule and practice scores.",
    "Add the exam date and the topics you have covered.",
    "Get a predicted score range and a prioritized study plan for the remaining time.",
  ],
  whyNeedIt: "Studying everything equally is inefficient. If you are strong in some areas and weak in others, you should spend more time on the weak spots. This tool helps you allocate your remaining study time where it will have the biggest impact on your final grade.",
  faqs: [
    { q: "How accurate is the prediction?", a: "It is an estimate based on the data you provide. The more honest and detailed your inputs, the closer the prediction will be. It is most useful for identifying weak areas, not guaranteeing a specific score." },
    { q: "Can this work for any exam?", a: "Yes. It works with any exam where you can track practice scores by topic. The principles of prioritized studying apply universally." },
    { q: "What if my predicted score is lower than I want?", a: "That is actually useful information. The study plan shows you exactly where to focus to improve. Knowing the gap early gives you time to close it." },
  ],
},
"ai-startup-name-generator": {
  intro: "Coming up with a startup name is harder than it should be. Enter your industry, keywords, and vibe, and get a batch of creative name suggestions. Check domain availability right from the results.",
  howTo: [
    "Enter your industry, a few keywords, and the tone you want (professional, playful, techy, etc.).",
    "Browse the generated name suggestions.",
    "Check domain availability for your favorites with one click.",
  ],
  whyNeedIt: "Your startup name is the first thing people encounter, and changing it later is painful. This tool gives you a big list to work from so you can find something that sounds right, is memorable, and actually has an available domain.",
  faqs: [
    { q: "Can I use these names for my business?", a: "The names are generated suggestions. Before committing, do a trademark search in your country to make sure the name is not already registered by someone else." },
    { q: "Why does domain availability matter?", a: "If your business is called 'TechNova' but technova.com is taken, you will have a harder time with branding, SEO, and credibility. Checking availability early saves headaches later." },
    { q: "How many names does it generate?", a: "Each run gives you a batch of suggestions. You can regenerate as many times as you want with different keywords or settings until something clicks." },
  ],
},

// Productivity
"pomodoro-timer": {
  intro: "Work in focused 25-minute intervals with 5-minute breaks using the Pomodoro technique. The timer tracks your sessions, handles the breaks automatically, and keeps count of how many rounds you complete.",
  howTo: [
    "Click Start to begin a 25-minute focus session.",
    "Work without interruption until the timer rings.",
    "Take the 5-minute break, then repeat. After four rounds, take a longer 15-minute break.",
  ],
  whyNeedIt: "Working for hours straight sounds productive but usually is not. Your focus degrades after about 25 minutes. The Pomodoro technique gives your brain regular recovery periods, which actually increases total output over a workday.",
  faqs: [
    { q: "Can I change the timer lengths?", a: "Yes. While 25/5 is the classic Pomodoro ratio, you can adjust both the focus and break durations to match your personal rhythm. Some people prefer 50/10." },
    { q: "What should I do during breaks?", a: "Step away from your screen. Stretch, get water, look out a window. Scrolling social media on your phone does not count as a real break for your brain." },
    { q: "What if I am in the zone when the timer goes off?", a: "Finish your current thought and then take the break anyway. The whole point is that the breaks make the next session more productive. Trust the process." },
  ],
},
"daily-standup": {
  intro: "Structure your daily standup or check-in with a simple template. Answer three questions: what you did yesterday, what you are doing today, and what is blocking you. Save and share with your team.",
  howTo: [
    "Fill in yesterday's accomplishments.",
    "Write today's planned tasks.",
    "Note any blockers or things you need help with.",
  ],
  whyNeedIt: "Standups work best when they are short and structured. This tool keeps everyone focused on the three things that matter and prevents the meeting from turning into a 30-minute discussion. Write it up, share it, move on.",
  faqs: [
    { q: "Is this just for software teams?", a: "No. Any team that benefits from daily check-ins can use this format. Marketing teams, sales teams, even student project groups. The three questions work universally." },
    { q: "Can I look back at previous standups?", a: "Yes. Your entries are saved locally so you can review what you committed to yesterday and track patterns in your blockers over time." },
    { q: "What makes a good standup entry?", a: "Be specific. Instead of 'worked on the project', say 'finished the login page design and sent it for review'. Specific entries are more useful for you and your team." },
  ],
},
"meeting-notes-summarizer": {
  intro: "Paste your messy meeting notes and get a clean summary with action items, decisions made, and key discussion points. Stop spending 20 minutes after every meeting reformatting your notes.",
  howTo: [
    "Paste your raw meeting notes — they can be messy, that is fine.",
    "Click Summarize to process the notes.",
    "Get organized output with sections for decisions, action items, and discussion points.",
  ],
  whyNeedIt: "Everyone takes notes differently, and raw notes are often a jumble of half-sentences. This tool extracts what actually matters — the decisions and action items — so you can share clear notes with your team immediately after the meeting.",
  faqs: [
    { q: "Do my notes need to be in a specific format?", a: "No. The tool handles freeform notes, bullet points, or even stream-of-consciousness text. Just paste whatever you have." },
    { q: "How does it identify action items?", a: "It looks for task-like language — things assigned to people, deadlines mentioned, commitments made. Review the output to make sure nothing was missed." },
    { q: "Can I edit the summary after it is generated?", a: "Yes. The output is fully editable. Adjust anything that does not look right before sharing with your team." },
  ],
},
"project-timeline": {
  intro: "Create a visual project timeline by adding tasks with start dates, end dates, and dependencies. See your whole project laid out as a Gantt chart so you can spot scheduling conflicts and bottlenecks.",
  howTo: [
    "Add your project tasks with estimated durations.",
    "Set dependencies between tasks (which tasks must finish before others can start).",
    "View the timeline chart and adjust as needed to balance the workload.",
  ],
  whyNeedIt: "Keeping a project schedule in your head or a flat list does not work once you have more than a few tasks. A visual timeline shows you where tasks overlap, what is on the critical path, and where delays will cascade into bigger problems.",
  faqs: [
    { q: "What are task dependencies?", a: "They define the order of operations. If task B depends on task A, B cannot start until A is complete. Setting these correctly prevents you from planning to do things before their prerequisites are done." },
    { q: "Can I share the timeline with my team?", a: "You can export or share the timeline view so everyone can see the same plan and know where their tasks fit in the bigger picture." },
    { q: "What if my project changes?", a: "Just drag and adjust. The timeline recalculates automatically based on dependencies. Real projects always change — the tool is designed to handle updates easily." },
  ],
},
"decision-matrix": {
  intro: "Make better decisions by weighing multiple options against your criteria. Score each option, assign importance weights, and let the math reveal which choice actually makes the most sense.",
  howTo: [
    "List your options (the choices you are deciding between).",
    "Define your criteria and assign importance weights to each.",
    "Score each option against each criterion and see the weighted totals.",
  ],
  whyNeedIt: "Big decisions feel overwhelming because you are trying to juggle too many factors in your head. Writing them down and scoring them forces clarity. Sometimes the winner surprises you because your gut was overweighting one factor and ignoring others.",
  faqs: [
    { q: "How do I assign weights?", a: "Think about which criteria matter most to you. If location matters twice as much as salary, give location double the weight. There is no wrong answer — it reflects your priorities." },
    { q: "What if two options score very close?", a: "Close scores mean both options are genuinely good. You could adjust weights to see if one edges ahead, or go with the one that feels right. The matrix already narrowed your choices." },
    { q: "Can I use this for team decisions?", a: "Yes. Have each team member fill out their own scores and compare. It makes disagreements visible and helps the group discuss specific criteria instead of arguing in circles." },
  ],
},
"brain-dump": {
  intro: "Get everything out of your head and onto the screen. Type freely without any structure, then sort your thoughts into categories like tasks, ideas, worries, and things to follow up on.",
  howTo: [
    "Type or paste everything on your mind — do not worry about organization.",
    "Click Sort to automatically categorize your thoughts.",
    "Review the organized output and turn items into actionable tasks.",
  ],
  whyNeedIt: "Your brain is great at having ideas and terrible at holding them. When you are feeling overwhelmed or scattered, dumping everything out frees up mental space. Once it is all on screen, it usually looks more manageable than it felt in your head.",
  faqs: [
    { q: "Is there a limit to how much I can write?", a: "No. Write as much as you need. The whole point is to get everything out without filtering or editing yourself." },
    { q: "How does the sorting work?", a: "The tool looks for patterns in your text — task-like items, questions, worries, creative ideas — and groups them. You can rearrange or recategorize anything it gets wrong." },
    { q: "Should I do this regularly?", a: "Many people find a weekly brain dump helpful. It clears the mental backlog and ensures nothing important slips through the cracks." },
  ],
},
"daily-journal": {
  intro: "Write a quick daily journal entry with guided prompts. Reflect on what went well, what you learned, and what you want to focus on tomorrow. Entries are saved locally for you to look back on.",
  howTo: [
    "Open the journal and see today's prompts.",
    "Write your reflections — even a few sentences is enough.",
    "Save the entry and browse past entries anytime.",
  ],
  whyNeedIt: "Journaling is one of the most consistently recommended habits for mental clarity and personal growth, but most people overthink it. Simple daily prompts remove the 'what do I write about' barrier and make it easy to build the habit.",
  faqs: [
    { q: "How long should each entry be?", a: "There is no minimum. Three sentences is fine. The goal is consistency, not length. A short entry every day beats a long entry once a month." },
    { q: "Is my journal private?", a: "Yes. Entries are stored locally in your browser. No one else can see them unless they access your device." },
    { q: "What if I miss a day?", a: "Just pick it up the next day. Do not try to fill in yesterday's entry from memory. The habit matters more than perfection." },
  ],
},
"focus-score": {
  intro: "Track how focused your work sessions are by rating distractions, task completion, and time on task. See your focus trends over time and identify what helps or hurts your concentration.",
  howTo: [
    "Start a focus session and set your intended task.",
    "During or after the session, log any distractions that occurred.",
    "View your focus score and trends over days and weeks.",
  ],
  whyNeedIt: "You cannot improve what you do not measure. Most people think they are focused when they are actually switching tasks every few minutes. Tracking your focus reveals patterns — maybe you are sharpest in the morning, or maybe open-plan offices kill your productivity.",
  faqs: [
    { q: "What counts as a distraction?", a: "Anything that pulls your attention from the task you set — checking your phone, switching to social media, responding to a non-urgent message, or even just daydreaming." },
    { q: "How is the focus score calculated?", a: "It combines time on task, number of distractions, and task completion rate into a simple score. Higher scores mean you stayed on track better." },
    { q: "What is a good focus score?", a: "Do not compare yourself to anyone else. Track your own baseline and try to improve gradually. A 10% improvement in focus is a 10% improvement in real output." },
  ],
},
"habit-tracker": {
  intro: "Build and maintain habits with a simple daily tracker. Check off each habit as you complete it and watch your streak grow. The visual chain of completed days makes it harder to skip.",
  howTo: [
    "Add the habits you want to build or maintain.",
    "Check off each habit as you complete it each day.",
    "View your streaks, completion rates, and trends over time.",
  ],
  whyNeedIt: "Motivation fades, but habits stick. The trick is making habits visible and trackable. When you can see a 14-day streak, you are much less likely to break it. This tool gives you that visual accountability without the complexity of a full productivity system.",
  faqs: [
    { q: "How many habits should I track at once?", a: "Start with 3 or fewer. Adding too many habits at once is the fastest way to fail at all of them. Once the first habits are automatic, add more." },
    { q: "What if I break a streak?", a: "Do not spiral. Missing one day does not erase your progress. The rule is never miss twice in a row. Get back on track tomorrow." },
    { q: "Does this sync across devices?", a: "Data is stored locally in your browser. Use the same browser and device for consistency, or export your data if you need to switch." },
  ],
},
"countdown-timer": {
  intro: "Set a countdown to any date that matters — a product launch, graduation, wedding, or deadline. See the days, hours, and minutes ticking down in real time.",
  howTo: [
    "Enter the event name and target date.",
    "Customize the display style if you want.",
    "Watch the countdown update live, or bookmark it to check back later.",
  ],
  whyNeedIt: "Having a visible countdown creates urgency in a healthy way. It turns an abstract deadline into a concrete, shrinking number. When you can see '14 days remaining' instead of 'due in two weeks', it hits differently.",
  faqs: [
    { q: "Can I set multiple countdowns?", a: "Yes. Add as many as you need. They all run simultaneously on the same page." },
    { q: "Does it account for time zones?", a: "It uses your local device time. If your event is in a different time zone, adjust the target time accordingly." },
    { q: "Can I share a countdown link?", a: "Yes. Share the link so others can see the same countdown on their own device." },
  ],
},
"world-clock": {
  intro: "See the current time in multiple cities around the world at once. Add the cities that matter to you — where your team is, where your family lives, or where your next client is based.",
  howTo: [
    "Add cities by searching for their name.",
    "See all their current times displayed side by side.",
    "Use the time slider to find a meeting time that works across all zones.",
  ],
  whyNeedIt: "Scheduling across time zones is a constant headache for remote teams and anyone with international connections. Having all the clocks visible at once, with a tool to find overlapping work hours, saves you from doing mental math every time.",
  faqs: [
    { q: "Does it handle daylight saving time?", a: "Yes. The clocks automatically adjust for DST changes. You do not need to manually update anything." },
    { q: "How does the meeting planner work?", a: "Drag the time slider and watch all clocks update simultaneously. Find a slot where all cities are within reasonable hours — the tool highlights these overlap windows." },
    { q: "Can I save my list of cities?", a: "Yes. Your selected cities are saved locally so they are there every time you open the tool." },
  ],
},
"typing-test": {
  intro: "Measure your typing speed and accuracy with a quick test. See your words per minute, error rate, and how you compare to average typists. Practice regularly to watch your speed climb.",
  howTo: [
    "Select a test duration (1 minute, 2 minutes, or 5 minutes).",
    "Start typing the displayed text as quickly and accurately as you can.",
    "Review your WPM, accuracy percentage, and problem keys.",
  ],
  whyNeedIt: "Typing speed directly affects how quickly you get work done at a computer. The difference between 40 WPM and 80 WPM means you finish text-heavy tasks in half the time. Regular practice shows real improvement within weeks.",
  faqs: [
    { q: "What is a good typing speed?", a: "The average is about 40 WPM. Professionals typically aim for 60 to 80 WPM. Over 100 WPM puts you in the top tier. Speed matters, but accuracy matters more." },
    { q: "How can I improve my typing speed?", a: "Practice regularly, focus on accuracy first, and learn proper finger placement if you have not already. Speed comes naturally once you stop looking at the keyboard." },
    { q: "Does the test count errors?", a: "Yes. Both corrected and uncorrected errors are tracked. Your WPM reflects only correctly typed words, so accuracy directly affects your score." },
  ],
},

// Health & Wellness
"bmi-calculator": {
  intro: "Calculate your Body Mass Index by entering your height and weight. Get your BMI category and understand what the number means in context — BMI is a rough guide, not a diagnosis.",
  howTo: [
    "Enter your height in cm or feet/inches.",
    "Enter your weight in kg or pounds.",
    "View your BMI value and its category (underweight, normal, overweight, obese).",
  ],
  whyNeedIt: "BMI gives you a quick snapshot of where you fall on the weight spectrum. It is not perfect — it does not account for muscle mass or body composition — but it is a simple starting point for understanding your overall health picture.",
  faqs: [
    { q: "Is BMI actually accurate?", a: "It is a useful screening tool but not a complete picture. A muscular athlete might have a high BMI despite being very healthy. Use it as one data point alongside other health indicators." },
    { q: "What is a healthy BMI range?", a: "The standard range is 18.5 to 24.9. But individual health depends on many factors including age, gender, muscle mass, and overall fitness level." },
    { q: "Should I use BMI to set my goal weight?", a: "It can help set a general target, but do not obsess over the number. Focus on how you feel, your energy levels, and what your doctor recommends for your specific situation." },
  ],
},
"water-tracker": {
  intro: "Track your daily water intake and make sure you are staying hydrated. Set a daily goal, log each glass, and see your progress throughout the day. It also adjusts recommendations based on your activity level.",
  howTo: [
    "Set your daily water goal based on your weight and activity level.",
    "Tap to log each glass or bottle of water you drink.",
    "Check your progress bar throughout the day and hit your target.",
  ],
  whyNeedIt: "Most people are mildly dehydrated without knowing it. Dehydration causes headaches, fatigue, poor concentration, and bad moods — symptoms people often blame on other things. Tracking water intake is simple and the benefits are immediate.",
  faqs: [
    { q: "How much water should I drink daily?", a: "A common guideline is 8 glasses or about 2 liters, but it varies by body size, activity level, and climate. The tool calculates a personalized recommendation for you." },
    { q: "Do coffee and tea count?", a: "Yes, they contribute to your total fluid intake. The old idea that caffeine dehydrates you has been debunked — the water in coffee and tea still counts." },
    { q: "What if I forget to log?", a: "Set reminders or log during natural breaks — after meals, during work breaks. You do not need to be precise. A rough count is much better than no tracking at all." },
  ],
},
"screen-time-calculator": {
  intro: "Calculate how much time you spend on screens daily, weekly, and yearly. Enter your habits and see the total — it usually shocks people. The tool also shows what you could do with that time instead.",
  howTo: [
    "Estimate your daily screen time for work, social media, streaming, and other activities.",
    "See the weekly, monthly, and yearly totals.",
    "Compare your screen time to alternative activities and see what you could accomplish.",
  ],
  whyNeedIt: "We all know we spend too much time on screens, but seeing the actual annual total makes it real. When you find out you spent 45 days last year scrolling social media, it puts things in perspective and motivates real change.",
  faqs: [
    { q: "Does work screen time count?", a: "The tool tracks it separately. Work screen time is often necessary, but it still affects your eyes and posture. The focus is usually on reducing recreational screen time." },
    { q: "How much screen time is too much?", a: "There is no universal number. The issue is when screen time replaces sleep, exercise, or face-to-face social interaction. If it is crowding out important things, it is too much." },
    { q: "What can I do to reduce screen time?", a: "Start with your biggest time sink (usually social media). Set app timers, charge your phone outside the bedroom, and replace one screen activity with something offline. Small changes add up." },
  ],
},
"nutrition-analyzer": {
  intro: "Enter a food item or meal and get a nutritional breakdown including calories, macronutrients, vitamins, and minerals. Useful for tracking what you eat without needing a separate app.",
  howTo: [
    "Type a food item or describe your meal.",
    "View the nutritional breakdown including calories, protein, carbs, fat, and key micronutrients.",
    "Add multiple items to analyze a full meal.",
  ],
  whyNeedIt: "Most people have only a vague idea of what is in their food. You might think a salad is always healthy until you see the dressing added 400 calories. Knowing the actual numbers helps you make better food choices without guessing.",
  faqs: [
    { q: "How accurate are the nutritional values?", a: "The values are based on standard food databases and are good estimates. Exact nutrition varies by preparation method, brand, and portion size. Use them as a guide, not a lab report." },
    { q: "Can I track a full day of meals?", a: "Yes. Add each meal or snack throughout the day and see your cumulative intake compared to recommended daily values." },
    { q: "Does it include local Ghanaian foods?", a: "The database includes many common foods. If a specific local dish is not found, try entering its individual ingredients for a close approximation." },
  ],
},
"carbon-footprint": {
  intro: "Calculate your personal carbon footprint based on your transportation, energy use, diet, and shopping habits. See where your biggest impact areas are and get practical suggestions to reduce them.",
  howTo: [
    "Answer questions about your transportation, home energy, food, and consumption habits.",
    "See your estimated annual carbon footprint in tonnes of CO2.",
    "Review the breakdown by category and the most effective reduction steps for your situation.",
  ],
  whyNeedIt: "Climate change feels overwhelming because it seems like an individual cannot make a difference. But knowing your actual footprint and where it comes from lets you make targeted changes. Sometimes the biggest impact comes from one or two changes you had not considered.",
  faqs: [
    { q: "What is an average carbon footprint?", a: "The global average is about 4 tonnes per person per year. In developed countries it is much higher. The target to limit warming is about 2 tonnes per person by 2050." },
    { q: "What has the biggest impact on my footprint?", a: "For most people, it is transportation (especially flying), home energy, and diet — in that order. A single long-haul flight can equal months of driving." },
    { q: "Does this account for my country's energy mix?", a: "It uses estimates based on your location. Countries with cleaner electricity grids will show lower emissions from home energy use." },
  ],
},

// Lifestyle & Fun
"username-generator": {
  intro: "Generate unique usernames for social media, gaming, or any platform. Enter keywords or your real name and get creative suggestions that are not already taken by millions of other people.",
  howTo: [
    "Enter keywords, your name, or interests.",
    "Select a style (gaming, professional, creative, etc.).",
    "Browse the suggestions and check availability on popular platforms.",
  ],
  whyNeedIt: "Every simple username is already taken. You end up adding random numbers and underscores that make your profile look lazy. This tool generates creative alternatives that are memorable, available, and do not have 'xX' around them.",
  faqs: [
    { q: "Can I check if the username is available?", a: "The tool checks availability on major platforms. Keep in mind that availability changes constantly, so claim your preferred username quickly once you find one." },
    { q: "Should I use the same username everywhere?", a: "For personal branding, consistency helps people find you. For privacy, different usernames on different platforms make it harder to link your accounts together." },
    { q: "What makes a good username?", a: "Short, memorable, easy to spell, and easy to say out loud. Avoid numbers and special characters unless they are part of a deliberate style choice." },
  ],
},
"meme-generator": {
  intro: "Create memes with popular templates or upload your own image. Add top and bottom text, adjust the font, and download your creation. No watermarks, no sign-up.",
  howTo: [
    "Choose a meme template or upload your own image.",
    "Add your text — top, bottom, or custom positioned.",
    "Download the meme or share it directly.",
  ],
  whyNeedIt: "Sometimes you just need to make a meme. Maybe for a group chat, a presentation, or to win an argument. This tool is fast, free, and does not plaster its logo across your creation.",
  faqs: [
    { q: "Can I upload my own photos?", a: "Yes. Upload any image from your device and use it as a meme template. The text tools work the same way as with built-in templates." },
    { q: "What font do memes typically use?", a: "Impact is the classic meme font — white text with a black outline. The tool defaults to this but you can change it if you want a different look." },
    { q: "Can I save my memes for later editing?", a: "Download the finished image. If you want to edit it later, you will need to start from the template again." },
  ],
},
"decision-wheel": {
  intro: "Cannot decide where to eat, what to watch, or who goes first? Add your options to the wheel, spin it, and let fate decide. It is genuinely random, so no one can argue with the result.",
  howTo: [
    "Add your options to the wheel — at least two, as many as you want.",
    "Click Spin and watch the wheel go.",
    "Accept the result. No re-spins unless everyone agrees.",
  ],
  whyNeedIt: "Decision fatigue is real. When you and your friends have been debating where to eat for 20 minutes, the wheel ends the suffering. It is also surprisingly fun and removes any accusation of bias.",
  faqs: [
    { q: "Is the wheel truly random?", a: "Yes. Each option has an equal probability of being selected, generated by a random number algorithm. No one is rigging it." },
    { q: "Can I weight certain options?", a: "You can add an option multiple times to increase its probability. Add 'Pizza' three times and 'Sushi' once if you really want pizza." },
    { q: "Can I save my wheel?", a: "Yes. Your options are saved so you can reuse the same wheel next time. Great for recurring decisions like weekly lunch picks." },
  ],
},
"text-counter": {
  intro: "Count characters, words, sentences, and paragraphs in any text. Also shows reading time and speaking time. Essential for anyone working with character limits or preparing speeches.",
  howTo: [
    "Paste or type your text into the input area.",
    "See real-time counts for characters, words, sentences, and paragraphs.",
    "Check the estimated reading and speaking times.",
  ],
  whyNeedIt: "Twitter has character limits, college essays have word counts, and speeches need to fit time slots. Instead of counting manually or relying on word processor word counts that might not match, get all the stats you need in one place.",
  faqs: [
    { q: "How is reading time calculated?", a: "It assumes an average reading speed of 200 to 250 words per minute. This is a general estimate — actual reading speed varies by person and content complexity." },
    { q: "Does it count spaces and punctuation?", a: "The tool shows both character count with spaces and without spaces. Punctuation is included in the character count." },
    { q: "Is there a maximum text length?", a: "The tool handles very large texts, but for extremely long documents, you might notice a slight delay in the real-time counting." },
  ],
},
"lorem-ipsum": {
  intro: "Generate placeholder text for your designs and mockups. Choose how many paragraphs, sentences, or words you need, and get standard Lorem Ipsum or more entertaining alternatives.",
  howTo: [
    "Select the amount of text you need (paragraphs, sentences, or words).",
    "Choose the style — classic Lorem Ipsum or a fun alternative.",
    "Copy the generated text to your clipboard.",
  ],
  whyNeedIt: "Designers and developers need placeholder text constantly. Typing 'text here text here' looks unprofessional in mockups, and writing real content before the design is ready is a waste of time. Lorem Ipsum fills the space while keeping focus on the design.",
  faqs: [
    { q: "What is Lorem Ipsum?", a: "It is scrambled Latin text that has been used as placeholder content since the 1500s. It looks like real text at a glance, which helps people evaluate a design without getting distracted by the words." },
    { q: "Are there alternatives to classic Lorem Ipsum?", a: "Yes. The tool offers fun alternatives like Hipster Ipsum, Bacon Ipsum, and others. They generate the same type of placeholder text but with more entertaining vocabulary." },
    { q: "Can I generate text in a specific language?", a: "The standard Lorem Ipsum is pseudo-Latin. For actual language-specific placeholder text, the tool focuses on Latin-based variants that work universally in any design context." },
  ],
},
"unit-converter": {
  intro: "Convert between any common units — length, weight, temperature, volume, speed, data size, and more. Fast, simple, and covers both metric and imperial systems.",
  howTo: [
    "Select the category (length, weight, temperature, etc.).",
    "Enter the value and select the source unit.",
    "Choose the target unit and see the conversion instantly.",
  ],
  whyNeedIt: "Unless you have every conversion factor memorized, you are going to need this tool regularly. How many cups in a liter? How many kilometers in a mile? It is faster than searching Google and shows the exact number without scrolling past ads.",
  faqs: [
    { q: "What unit categories are available?", a: "Length, weight/mass, temperature, volume, area, speed, time, data storage, energy, pressure, and more. If a common conversion exists, it is probably covered." },
    { q: "Are the conversions exact?", a: "Yes for most units. Conversions that are defined precisely (like meters to feet) give exact results. Temperature conversions use the standard formulas." },
    { q: "Can I convert between unusual units?", a: "The tool covers all commonly used units. Very specialized or obsolete units might not be included, but everything you are likely to encounter in daily life is there." },
  ],
},
"url-parser": {
  intro: "Paste any URL and see it broken down into its components — protocol, domain, path, query parameters, hash, and more. Useful for debugging, API work, or understanding how URLs are structured.",
  howTo: [
    "Paste a URL into the input field.",
    "See the URL broken into protocol, host, port, path, query parameters, and fragment.",
    "Edit individual components and see the reconstructed URL.",
  ],
  whyNeedIt: "When you are debugging web requests, building API calls, or trying to understand tracking parameters in a link, manually parsing a long URL is tedious and error-prone. This tool does it instantly and lets you edit parts without breaking the rest.",
  faqs: [
    { q: "What are query parameters?", a: "They are the key-value pairs after the ? in a URL. For example, in 'example.com?page=2&sort=date', there are two parameters: page (value 2) and sort (value date). They pass information to the server." },
    { q: "Can I use this to check suspicious links?", a: "Yes. Paste a suspicious link here instead of clicking it. You can see the real domain and any hidden redirect parameters without actually visiting the page." },
    { q: "Does it handle encoded URLs?", a: "Yes. The tool decodes percent-encoded characters so you can read the actual values. It also shows the encoded version for reference." },
  ],
},
"text-to-speech": {
  intro: "Convert any text into spoken audio using your browser's built-in speech engine. Choose from available voices, adjust speed and pitch, and listen to your text read aloud.",
  howTo: [
    "Paste or type the text you want to hear.",
    "Select a voice and adjust speed and pitch settings.",
    "Click Play to hear the text spoken aloud.",
  ],
  whyNeedIt: "Hearing your writing read aloud is one of the best ways to catch errors and awkward phrasing. It is also useful for accessibility, language learning, or just listening to an article instead of reading it when your eyes are tired.",
  faqs: [
    { q: "What voices are available?", a: "It depends on your device and browser. Most systems come with several voices in different languages. The tool shows all voices available on your specific setup." },
    { q: "Can I save the audio as a file?", a: "The browser speech engine plays audio in real time. For saving audio files, you would need a dedicated text-to-speech service. This tool is designed for quick listening." },
    { q: "Does it support other languages?", a: "Yes, if your device has voices installed for that language. Most modern devices include at least a few language options." },
  ],
},
"qr-generator": {
  intro: "Generate a QR code for any text, URL, email, phone number, or WiFi network. Customize the size and download it as an image. No sign-up, no watermarks, works instantly.",
  howTo: [
    "Enter the content you want to encode — a URL, text, contact info, etc.",
    "Customize the size and error correction level if needed.",
    "Download the QR code image or copy it to your clipboard.",
  ],
  whyNeedIt: "QR codes are everywhere — menus, business cards, event tickets, payments. Instead of using a sketchy website that tracks your URLs or adds watermarks, generate clean QR codes right here with no catches.",
  faqs: [
    { q: "What can I put in a QR code?", a: "Practically anything text-based — URLs, plain text, phone numbers, email addresses, WiFi credentials, calendar events, and more. Most phones can scan and interpret all of these." },
    { q: "What is error correction?", a: "It determines how much of the QR code can be damaged or obscured and still scan correctly. Higher error correction means the code still works even if part of it is covered — useful for printed materials." },
    { q: "Do QR codes expire?", a: "No. A QR code is just encoded data. It will work forever as long as the content it points to (like a URL) still exists." },
  ],
},
"wifi-qr-generator": {
  intro: "Generate a QR code that lets people join your WiFi network instantly by scanning it. No more spelling out passwords or watching guests type it wrong three times.",
  howTo: [
    "Enter your WiFi network name (SSID) and password.",
    "Select the security type (WPA2, WPA3, etc.).",
    "Download or print the QR code and put it somewhere guests can see it.",
  ],
  whyNeedIt: "Sharing your WiFi password is annoying, especially when it is long and complex (as it should be). A printed QR code near your front door or on the fridge lets guests connect with a single scan. No dictation required.",
  faqs: [
    { q: "Is it safe to have my WiFi password in a QR code?", a: "It is as safe as your physical space. Anyone who can see the QR code can get the password, so treat the printed code like you would a written password — keep it where only trusted people can see it." },
    { q: "Does this work on all phones?", a: "Most modern Android and iOS devices can scan WiFi QR codes directly from their camera app. Older devices might need a QR scanner app." },
    { q: "What if I change my WiFi password?", a: "You will need to generate and print a new QR code. The old one will stop working since the password embedded in it is no longer correct." },
  ],
},
"image-compressor": {
  intro: "Reduce image file sizes without visible quality loss. Upload photos and graphics, set your target quality, and download smaller files perfect for websites, emails, or saving storage space.",
  howTo: [
    "Upload one or more images (JPEG, PNG, or WebP).",
    "Adjust the quality slider — lower means smaller file but more compression.",
    "Download the compressed images and compare the before/after.",
  ],
  whyNeedIt: "Large images slow down websites, clog email attachments, and eat up storage. A 5MB photo that gets compressed to 200KB with no visible difference loads 25 times faster. Your website visitors and email recipients will thank you.",
  faqs: [
    { q: "Will compression make my images look bad?", a: "Not noticeably at reasonable quality settings. Most images can lose 60 to 80 percent of their file size before you can see any difference. The tool lets you preview before downloading." },
    { q: "What format should I use?", a: "WebP gives the best compression for web use. JPEG is great for photos. PNG is best when you need transparency. The tool can convert between formats during compression." },
    { q: "Is there a file size limit?", a: "The tool processes images in your browser, so it depends on your device's memory. Most images under 20MB process without issues." },
  ],
},
"image-converter": {
  intro: "Convert images between formats — JPEG, PNG, WebP, GIF, and more. Upload your file, pick the target format, and download. Everything happens in your browser, no upload to any server.",
  howTo: [
    "Upload the image you want to convert.",
    "Select the target format from the dropdown.",
    "Download the converted image.",
  ],
  whyNeedIt: "Different platforms and tools require different image formats. A PNG for your website, a JPEG for email, a WebP for performance. Instead of opening Photoshop or searching for a converter site that adds watermarks, do it right here in seconds.",
  faqs: [
    { q: "Does conversion affect image quality?", a: "Converting to lossy formats like JPEG involves some quality loss. Converting from JPEG to PNG will not magically improve quality — it just changes the container. For best results, keep your original high-quality file." },
    { q: "Can I convert multiple images at once?", a: "Yes. Upload a batch and convert them all to the same format in one go. Much faster than doing them one by one." },
    { q: "Why does the file size change after conversion?", a: "Different formats use different compression methods. A PNG will usually be larger than a JPEG of the same image because PNG is lossless. WebP typically gives the smallest files." },
  ],
},
"url-shortener": {
  intro: "Shorten long URLs into clean, short links that are easy to share. No sign-up needed. Just paste your long URL and get a short one back instantly.",
  howTo: [
    "Paste the long URL you want to shorten.",
    "Click Shorten to generate the short link.",
    "Copy the short link and share it anywhere.",
  ],
  whyNeedIt: "Long URLs with tracking parameters and query strings look messy in messages, presentations, and print materials. A short link is cleaner, easier to type, and does not break across line wraps in emails.",
  faqs: [
    { q: "Do short links expire?", a: "It depends on the service used. Most short links remain active indefinitely, but check the specific terms. If the shortening service shuts down, the links stop working." },
    { q: "Can I track clicks?", a: "Basic click tracking is available, showing how many times your link was used. For detailed analytics, dedicated URL shortening services offer more features." },
    { q: "Are shortened URLs safe to click?", a: "As safe as the destination URL. Short links just redirect — they do not add any risk themselves. But because they hide the destination, always be cautious clicking short links from unknown sources." },
  ],
},
"life-progress-bar": {
  intro: "Enter your age and see a visual progress bar of your life. It also breaks down how you have spent your years so far — sleeping, working, eating, commuting — and how many years you have left for each.",
  howTo: [
    "Enter your current age and your expected lifespan.",
    "See your life progress bar and the breakdown by activity.",
    "Reflect on how you want to spend the remaining time.",
  ],
  whyNeedIt: "It is a bit unsettling, but seeing your life as a progress bar makes time feel more tangible. When you realize you have already spent 12 years of your life sleeping and might have 15 summers left with your parents, it changes how you prioritize things.",
  faqs: [
    { q: "Is this supposed to be depressing?", a: "Not at all. It is meant to be motivating. Knowing your time is finite — and seeing it visually — helps you stop wasting time on things that do not matter to you." },
    { q: "How are the activity breakdowns calculated?", a: "They use population averages for sleep, work, eating, commuting, and other common activities. Your personal breakdown will differ, but the estimates give you a useful picture." },
    { q: "What lifespan should I enter?", a: "The default uses the average life expectancy for your country. You can adjust it based on your family history or personal health. The point is the exercise, not the exact number." },
  ],
},
"this-day-in-history": {
  intro: "See what happened on this day throughout history. Browse notable events, famous birthdays, and historical milestones for any date. A fun way to start the morning or spice up a conversation.",
  howTo: [
    "The tool loads events for today's date automatically.",
    "Browse through historical events, births, and deaths for this day.",
    "Select a different date if you want to explore another day.",
  ],
  whyNeedIt: "History is full of surprising coincidences and fascinating stories. Knowing what happened on today's date gives you interesting conversation starters and a bit of perspective on how much the world has changed.",
  faqs: [
    { q: "How far back do the events go?", a: "The database covers thousands of years, from ancient history to recent events. Major historical moments from every era are included." },
    { q: "Can I look up any date?", a: "Yes. Use the date picker to explore any day of the year. It is especially fun to look up birthdays and anniversaries." },
    { q: "Where does the historical data come from?", a: "The events are sourced from public historical databases and are curated for accuracy and significance. Major well-documented events are prioritized." },
  ],
},
"math-tug-of-war": {
  intro: "A competitive math game where two players solve problems to pull a rope in their direction. Answer faster and more accurately to win. Play locally on one screen or challenge someone online.",
  howTo: [
    "Choose local (split screen) or online multiplayer mode.",
    "Both players solve math problems as fast as they can.",
    "Correct answers pull the rope toward your side. First to pull it past the line wins.",
  ],
  whyNeedIt: "Math practice should not feel like homework. This game makes mental math fun and competitive, which keeps you engaged longer than any flash card app. It is also a great way to practice with friends or classmates.",
  faqs: [
    { q: "What difficulty levels are available?", a: "Multiple levels from basic addition to complex calculations. The game adjusts or you can set it manually. Harder problems pull the rope further, rewarding those who tackle tougher math." },
    { q: "How does online multiplayer work?", a: "Share a room code with a friend. Both players connect in real time and the tug of war happens live. An internet connection is needed for both players." },
    { q: "Is this good for kids?", a: "Absolutely. The easier levels are perfect for kids learning basic arithmetic, and the competitive aspect keeps them motivated. Adjust the difficulty to match their skill level." },
  ],
},
"resume-builder": {
  intro: "Create a professional resume by filling in your details and choosing a template. The tool handles formatting so you can focus on content. Export as PDF when you are done.",
  howTo: [
    "Fill in your personal information, work experience, education, and skills.",
    "Choose a template that matches your industry and style.",
    "Preview your resume and export it as a PDF.",
  ],
  whyNeedIt: "Formatting a resume from scratch is a time sink, and bad formatting can get you rejected before anyone reads your qualifications. This tool ensures your resume looks polished and professional without fighting with margins and fonts in a word processor.",
  faqs: [
    { q: "Which template should I use?", a: "For corporate and traditional industries, use a clean, minimal template. For creative roles, you have more flexibility. When in doubt, simpler is better — content matters more than design." },
    { q: "How long should my resume be?", a: "One page if you have less than 10 years of experience. Two pages maximum for senior professionals. Anything longer will not be read." },
    { q: "Can I save and edit my resume later?", a: "Yes. Your resume data is saved locally so you can come back and update it anytime. Always keep it current — you never know when you will need it." },
  ],
},
"resume-roaster": {
  intro: "Upload your resume and get brutally honest feedback. This tool tears apart weak bullet points, vague descriptions, and common mistakes that make hiring managers skip your application.",
  howTo: [
    "Upload your resume or paste the text content.",
    "Review the detailed critique of each section.",
    "Use the specific suggestions to strengthen your resume.",
  ],
  whyNeedIt: "Your friends will tell you your resume is fine. A roaster will tell you the truth. Weak action verbs, vague accomplishments, and formatting issues are invisible to you but obvious to recruiters. Getting harsh feedback before you submit is much better than getting silence after.",
  faqs: [
    { q: "Is this going to be mean?", a: "It is direct, not mean. Every criticism comes with a specific suggestion for improvement. The goal is to make your resume better, not to make you feel bad." },
    { q: "What does it check for?", a: "Weak language (responsible for vs. achieved), missing metrics, formatting inconsistencies, overused buzzwords, gaps in logic, and overall structure. It covers what real recruiters look for." },
    { q: "Should I use this after the resume builder?", a: "Ideally yes. Build your resume first, then run it through the roaster to catch anything you missed. Think of it as a second pair of very critical eyes." },
  ],
},
"cover-letter-generator": {
  intro: "Generate a tailored cover letter by entering the job description and your relevant experience. The tool creates a draft that you can customize — it handles the structure and you make it personal.",
  howTo: [
    "Paste the job description and enter your relevant experience.",
    "Optionally add specific points you want to highlight.",
    "Review the generated draft and personalize it with your voice.",
  ],
  whyNeedIt: "Nobody enjoys writing cover letters. They take forever and often feel generic. This tool gives you a solid starting point that is already tailored to the job, saving you from the dreaded blank page. Just make sure to add your own personality before sending.",
  faqs: [
    { q: "Should I send the generated letter as-is?", a: "No. Always edit it to add specific details about why you want this particular job and what makes you unique. The generated version is a strong draft, not a finished product." },
    { q: "Do cover letters still matter?", a: "For many roles, yes. Not every recruiter reads them, but when they do, a good cover letter can be the difference between getting an interview and being skipped." },
    { q: "How long should a cover letter be?", a: "Three to four paragraphs, under one page. Hiring managers are busy. Say why you are interested, why you are qualified, and what you will bring — then stop." },
  ],
},
"job-tracker": {
  intro: "Track every job application in one organized dashboard. Log where you applied, the status, follow-up dates, and notes. Stop losing track of which company you sent what resume to.",
  howTo: [
    "Add each job application with the company, position, and date.",
    "Update the status as you progress (applied, phone screen, interview, offer, rejected).",
    "Set reminders for follow-ups and track your overall application stats.",
  ],
  whyNeedIt: "A serious job search involves dozens of applications. Without tracking, you forget to follow up, mix up company details before interviews, and lose motivation because you do not see your progress. This tool keeps everything organized.",
  faqs: [
    { q: "What should I track for each application?", a: "Company name, position, date applied, resume version sent, contact person, current status, and any notes from conversations. The more detail you log, the better prepared you are for each interaction." },
    { q: "How often should I follow up?", a: "If you have not heard back in one to two weeks after applying, a polite follow-up email is appropriate. The tracker helps you time these correctly." },
    { q: "Is my job search data private?", a: "Everything is stored locally in your browser. No one can see your application data." },
  ],
},
"career-matcher": {
  intro: "Answer questions about your skills, interests, and values to get career suggestions that match your profile. Helpful for students choosing a path or professionals considering a career switch.",
  howTo: [
    "Answer questions about your interests, skills, and work preferences.",
    "Review the matched career paths ranked by compatibility.",
    "Explore each suggestion with salary ranges, required skills, and growth outlook.",
  ],
  whyNeedIt: "Choosing a career based on what your parents want or what seems popular is a recipe for dissatisfaction. This tool helps you discover paths that align with who you actually are and what you actually enjoy doing.",
  faqs: [
    { q: "Is this like a personality test?", a: "It overlaps with career aptitude tests but focuses on practical matching. Your skills and interests are mapped to real careers, not abstract personality types." },
    { q: "Can this tell me the 'right' career?", a: "No tool can tell you that definitively. It shows you strong matches to explore further. Use the suggestions as a starting point for research, not as a final decision." },
    { q: "What if I am not qualified for my top match?", a: "The tool shows what skills and qualifications each career requires. Use that as a roadmap — you can build toward a career over time through education, certifications, and experience." },
  ],
},
"personal-brand-audit": {
  intro: "Evaluate your online presence and personal brand. Enter your social media profiles and the tool analyzes consistency, professionalism, and how you appear to potential employers or clients.",
  howTo: [
    "Enter your social media handles and any professional profiles.",
    "Review the audit results for each platform.",
    "Follow the recommendations to strengthen your personal brand.",
  ],
  whyNeedIt: "Recruiters and clients will Google you. If your LinkedIn says one thing, your Twitter says another, and your Instagram is full of questionable content, that inconsistency hurts your credibility. This audit shows you what others see.",
  faqs: [
    { q: "What platforms does it check?", a: "LinkedIn, Twitter/X, Instagram, GitHub, personal websites, and other common professional platforms. You can add whichever ones you actively use." },
    { q: "What makes a strong personal brand?", a: "Consistency across platforms, a clear professional headline, quality profile photos, and content that aligns with how you want to be perceived. It does not have to be fancy — just intentional." },
    { q: "Should I delete old social media posts?", a: "If they contradict the image you want to present professionally, yes. At minimum, make old personal accounts private. A quick cleanup can prevent embarrassing surprises." },
  ],
},
"statistics-visualizer": {
  intro: "Enter a dataset and instantly generate charts, summary statistics, and distributions. See mean, median, mode, standard deviation, and more — with visual graphs that make the numbers easier to understand.",
  howTo: [
    "Enter your data as comma-separated values or paste from a spreadsheet.",
    "View the automatically generated summary statistics.",
    "Explore different chart types — histogram, box plot, scatter plot, and more.",
  ],
  whyNeedIt: "Raw numbers are hard to interpret. A table of 100 values tells you almost nothing at a glance, but a histogram or box plot reveals the whole story instantly. This tool bridges the gap between data and understanding.",
  faqs: [
    { q: "What statistics does it calculate?", a: "Mean, median, mode, standard deviation, variance, range, quartiles, skewness, and kurtosis. It covers everything you would need for a basic statistical analysis." },
    { q: "Can I compare two datasets?", a: "Yes. Enter two datasets and see them plotted together. This is useful for comparing groups, before/after measurements, or any two sets of numbers." },
    { q: "What chart types are available?", a: "Histogram, bar chart, box plot, scatter plot, and line chart. The tool suggests the best chart type for your data, but you can switch between them." },
  ],
},
"farm-calculator": {
  intro: "Calculate costs, yields, and profits for farming operations. Enter your crop type, land size, input costs, and expected market price to see whether the numbers work out before you plant.",
  howTo: [
    "Select your crop or enter custom crop details.",
    "Enter your land size, input costs (seeds, fertilizer, labor, etc.), and expected yield.",
    "View the projected revenue, total costs, and profit or loss.",
  ],
  whyNeedIt: "Farming involves real financial risk, and many smallholder farmers operate on gut feeling rather than calculated projections. Running the numbers beforehand helps you choose the right crops, negotiate better prices, and avoid planting something that will lose money.",
  faqs: [
    { q: "Does this work for Ghanaian crops?", a: "Yes. It includes common crops grown in Ghana like maize, cassava, cocoa, rice, and vegetables. You can also enter custom crop data for anything not listed." },
    { q: "How accurate are the yield estimates?", a: "They are based on average yields for each crop. Your actual yield depends on soil quality, weather, farming practices, and many other factors. Use the estimates as a starting point and adjust based on your experience." },
    { q: "Can I compare different crops?", a: "Yes. Run the calculator for each crop you are considering and compare the projected profits. This helps you decide what to plant if you have limited land." },
  ],
},
"world-economic-map": {
  intro: "Explore the global economy through an interactive map. See GDP, inflation, unemployment, trade balances, and other economic indicators for every country. Compare nations side by side.",
  howTo: [
    "Click on any country on the map to see its economic data.",
    "Select different indicators from the menu (GDP, inflation, etc.).",
    "Use the comparison tool to place two or more countries side by side.",
  ],
  whyNeedIt: "Economic data is scattered across dozens of websites and reports. This map puts it all in one visual interface. Whether you are a student studying economics, a business owner exploring markets, or just curious about the world, having everything on one map saves time.",
  faqs: [
    { q: "How current is the data?", a: "The data is updated periodically from international sources like the World Bank and IMF. Most indicators reflect the most recently published figures." },
    { q: "Can I see historical trends?", a: "Yes. Select a country and view how its indicators have changed over time. This is useful for spotting trends and understanding long-term economic shifts." },
    { q: "What indicators are available?", a: "GDP, GDP per capita, inflation rate, unemployment rate, trade balance, public debt, population, and more. The most commonly discussed economic metrics are all covered." },
  ],
},
"phone-comparison": {
  intro: "Compare smartphones side by side — specs, prices, cameras, battery life, and more. Enter two or more models and get a clear breakdown of how they stack up against each other.",
  howTo: [
    "Search for and select the phones you want to compare.",
    "View the side-by-side spec comparison.",
    "Read the summary highlighting key differences and which phone wins in each category.",
  ],
  whyNeedIt: "Choosing a new phone is overwhelming with hundreds of models on the market. Spec sheets are hard to compare when they are on different websites in different formats. This tool puts everything in one table so the differences are obvious.",
  faqs: [
    { q: "How many phones can I compare at once?", a: "You can compare two or more phones simultaneously. Comparing more than three at once gets crowded, so two or three is the sweet spot for readability." },
    { q: "Does it include phone prices?", a: "Yes, where available. Prices vary by region and retailer, so use them as a general guide. The tool tries to show current market prices." },
    { q: "Are budget phones included?", a: "Yes. The database covers phones across all price ranges, from budget devices to flagships. Not everyone needs the most expensive phone — sometimes a mid-range model does everything you need." },
  ],
},
"upgrade-calculator": {
  intro: "Trying to decide whether to upgrade your phone, laptop, or other tech? Enter your current device and the upgrade you are considering, and see if the performance improvement justifies the cost.",
  howTo: [
    "Select your current device and the one you are considering upgrading to.",
    "View the performance difference as a percentage across key metrics.",
    "See the cost-per-improvement analysis to decide if it is worth it.",
  ],
  whyNeedIt: "Tech companies want you to upgrade every year, but the real improvement between generations is often small. This tool shows you the actual performance gains so you can decide whether the upgrade is worth the money or if waiting another year makes more sense.",
  faqs: [
    { q: "How is 'worth it' determined?", a: "The tool calculates cost per percentage improvement in key areas. A GHS 5,000 upgrade for a 5% speed boost is very different from the same price for a 50% boost. You decide what your threshold is." },
    { q: "Does it factor in trade-in value?", a: "You can enter your current device's trade-in value to see the net cost of upgrading. This makes the comparison more realistic since you are not starting from zero." },
    { q: "When is the best time to upgrade?", a: "Generally, when your current device no longer does what you need it to. If it is slow, unsupported, or missing features you actually use daily, it is time. If it works fine, the upgrade can wait." },
  ],
},
"startup-readiness": {
  intro: "Find out if your startup idea is actually ready to launch or if there are gaps you should fill first. This quiz-style tool walks you through key areas like market research, funding, team, and product readiness.",
  howTo: [
    "Answer questions about your current startup stage — product, market, team, and finances.",
    "The tool scores each area and highlights where you're strong and where you're not.",
    "Review your overall readiness score and the specific recommendations for improvement.",
  ],
  whyNeedIt: "Launching too early wastes money and burns you out. Launching too late means someone else beats you to it. This tool helps you find the sweet spot by being honest about where you actually stand right now.",
  faqs: [
    { q: "Is this for any type of startup?", a: "Yes. Whether it's a SaaS app, a physical product, or a service business, the readiness factors are similar. The questions are general enough to apply broadly." },
    { q: "What score means I'm ready?", a: "There's no magic number. But if you're scoring below 50% in critical areas like product-market fit or funding, those are signals to address before you go all in." },
    { q: "Can I retake it later?", a: "Absolutely. Run it again after you've worked on the weak areas. It's a good way to track your progress over time." },
  ],
},
"startup-validator": {
  intro: "Test your startup idea against real-world viability factors before investing serious time or money. This tool checks market size, competition, differentiation, and monetization potential.",
  howTo: [
    "Describe your startup idea in a few sentences — what it does and who it's for.",
    "Answer follow-up questions about your target market, competitors, and revenue model.",
    "Get a validation report with scores across key areas and honest feedback on each.",
  ],
  whyNeedIt: "Most startup ideas sound great in your head but fall apart when you stress-test them. Running your idea through a structured validation process saves you from spending months on something the market doesn't want.",
  faqs: [
    { q: "Will this tell me if my idea will succeed?", a: "No tool can guarantee that. But it can flag obvious problems — like a tiny market or no clear way to make money — before you find out the hard way." },
    { q: "How is this different from the readiness tool?", a: "Readiness checks if YOU are ready to launch. Validation checks if your IDEA is viable. Use both for the full picture." },
    { q: "Do I need a business plan first?", a: "No. You just need a clear idea of what you want to build and who would pay for it. The tool helps you think through the rest." },
  ],
},
};
