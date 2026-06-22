/* Current site content — used to PRE-FILL the admin content editor so you can
   edit what's already on the pages. Once you Save a section, the database
   version takes over and these defaults are no longer used for it. */
window.SITE_DEFAULTS = {
  services: [
    { tag:"Offensive Security", title:"Vulnerability Assessment & Penetration Testing", intro:"Depth-first, manual testing that emulates real adversaries across every layer of your environment.",
      col1_title:"Engagements", col1:"Web Application Testing\nMobile Application Testing\nAPI Security Testing\nExternal Penetration Testing\nInternal Penetration Testing\nWireless Security Testing\nRed Team Assessments",
      col2_title:"Methodology", col2:"OWASP Testing Guide & PTES\nMITRE ATT&CK mapping\nManual exploitation & chaining\nBusiness-logic abuse cases\nSafe, validated proof-of-concept",
      col3_title:"Deliverables", col3:"Executive risk summary\nCVSS-scored findings\nReproduction & evidence\nPrioritized remediation\nFree re-test of fixes",
      benefits:"Reduce breach risk, satisfy auditor and customer requirements, and give engineering a clear, ranked fix list." },
    { tag:"AppSec", title:"Source Code Review", intro:"Find the vulnerabilities that black-box testing can't — at the source.",
      col1_title:"Scope", col1:"Secure Code Review\nOWASP Assessment\nSAST Validation\nSecure Development Practices\nRemediation Guidance",
      col2_title:"Approach", col2:"Threat-model driven review\nManual + tool-assisted analysis\nData-flow & taint tracing\nDependency & supply-chain checks\nDeveloper pairing sessions",
      col3_title:"Deliverables", col3:"Findings with code references\nValidated, de-duplicated results\nSecure coding recommendations\nFix examples per language\nSDLC improvement plan",
      benefits:"Eliminate entire vulnerability classes early, reduce false positives from your SAST, and level up developer security skills." },
    { tag:"Cloud", title:"Cloud Security", intro:"Secure your AWS, Azure and Google Cloud estates against misconfiguration and identity risk.",
      col1_title:"Assessments", col1:"AWS Assessment\nAzure Assessment\nGoogle Cloud Assessment\nCloud Hardening\nCloud Compliance Review",
      col2_title:"Focus areas", col2:"IAM & privilege escalation\nNetwork & exposure analysis\nData storage & encryption\nLogging & detection coverage\nContainer & serverless security",
      col3_title:"Deliverables", col3:"Benchmarked configuration report\nPrioritized hardening backlog\nIaC remediation snippets\nCompliance gap mapping\nRe-assessment of fixes",
      benefits:"Close the misconfigurations behind most cloud breaches and prove a defensible, well-governed cloud posture." },
    { tag:"Infrastructure", title:"Server Configuration Review", intro:"Harden the systems your business runs on, measured against recognized baselines.",
      col1_title:"Scope", col1:"Linux Hardening\nWindows Hardening\nCIS Benchmark Review\nSecurity Baseline Validation\nPatch Management Review",
      col2_title:"What we check", col2:"Access & privilege controls\nService & port exposure\nLogging & auditing\nEncryption & key management\nUpdate & patch hygiene",
      col3_title:"Deliverables", col3:"CIS-mapped gap report\nHardening checklist\nConfig remediation guidance\nPatch & lifecycle plan\nValidation re-check",
      benefits:"Shrink your infrastructure attack surface and maintain a consistent, auditable security baseline across fleets." }
  ],
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
