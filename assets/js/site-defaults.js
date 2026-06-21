/* Current site content — used to PRE-FILL the admin content editor so you can
   edit what's already on the pages. Once you Save a section, the database
   version takes over and these defaults are no longer used for it. */
window.SITE_DEFAULTS = {
  about_team: [
    { name: "D. Anders", role: "Chief Executive Officer", bio: "Two decades leading security teams across finance and technology." },
    { name: "S. Patel", role: "Chief Technology Officer", bio: "Offensive security researcher and red team lead." },
    { name: "M. Okafor", role: "VP, Managed Services", bio: "Built and scaled 24/7 security operations centers." }
  ],
  insights: [
    { tag: "Threat Intel", title: "Beyond the CVE: prioritizing what attackers actually exploit", summary: "Why exploit prediction beats raw CVSS for remediation planning.", url: "#" },
    { tag: "Cloud", title: "The five misconfigurations behind most cloud breaches", summary: "A field guide to the AWS, Azure and GCP defaults that hurt.", url: "#" },
    { tag: "AppSec", title: "Shifting left without slowing down: secure SDLC that ships", summary: "Embedding security into delivery without killing velocity.", url: "#" }
  ],
  careers: { positions: [
    { title: "Security Consultant", type: "Remote", desc: "Lead penetration tests and advisory engagements end to end." },
    { title: "Penetration Tester", type: "Remote", desc: "Hands-on web, mobile, API and network exploitation." },
    { title: "SOC Analyst", type: "Shift", desc: "Monitor, triage and respond across our 24/7 operation." },
    { title: "Security Engineer", type: "Hybrid", desc: "Build tooling, automation and detections that scale." },
    { title: "Cloud Security Consultant", type: "Remote", desc: "Assess and harden AWS, Azure and GCP environments." },
    { title: "Internship Program", type: "Intern", desc: "A mentored pathway into offensive and defensive security for emerging talent." }
  ] },
  partners: {
    strategic: ["Northwind Cloud", "Meridian MSP", "Atlas Compliance", "Vertex Integrators"],
    technology: ["SIEM Platform", "EDR Vendor", "Cloud CSPM", "Identity Provider", "Threat Intel Feed", "Code Scanning"]
  },
  contact: {
    address: "1 Cyber Plaza, Suite 1600\nMetro City, 00000",
    email1: "hello@example.com", email2: "sales@example.com",
    phone: "+60 3-1234 5678", phone_note: "24/7 incident hotline available",
    hours: "Mon–Fri, 9:00–18:00 (local)\nSecurity operations: 24/7/365"
  }
};
