
import './App.css'
import { useState, useEffect, useRef, useCallback } from "react";
import Api from './Api.jsx'
// ─── DATA ────────────────────────────────────────────────────────────────────

const CONCEPTS = [
  {
    id: 1, title: "API Design", category: "ARCHITECTURE", categoryColor: "#6366f1",
    subtitle: "Seven Best Practices for robust and scalable API Design architectures.",
    emoji: "🔌", icon: "⚙️",
    description: "API Design is the process of creating interfaces that allow different software systems to communicate. Good API design ensures consistency, reliability, and ease of use for developers consuming your services.",
    diagram: [{ from: "Client", to: "API Gateway", label: "Request" }, { from: "API Gateway", to: "Auth Service", label: "Validate" }, { from: "API Gateway", to: "Backend Service", label: "Forward" }, { from: "Backend Service", to: "Database", label: "Query" }],
    diagramType: "flow",
    pros: ["Enables system interoperability", "Promotes reusability", "Clear separation of concerns", "Easy to version and evolve", "Supports multiple clients"],
    cons: ["Requires upfront design investment", "Versioning complexity over time", "Can create tight coupling if poorly designed", "Documentation overhead"],
    whenToUse: ["Building microservices architecture", "Creating public-facing developer APIs", "Enabling third-party integrations", "Building multi-platform applications (web, mobile, IoT)"],
    whenNotToUse: ["Simple monolithic apps with no external integrations", "Internal scripts with no external consumers", "When performance overhead of HTTP is unacceptable"],
    color: "#6366f1",
  },
  {
    id: 2, title: "DNS", category: "NETWORK", categoryColor: "#8b5cf6",
    subtitle: "Understanding the Domain Name System and how it resolves network identities.",
    emoji: "🌐", icon: "🔗",
    description: "DNS (Domain Name System) is the internet's phonebook, translating human-readable domain names like 'google.com' into machine-readable IP addresses. It's a hierarchical distributed system crucial to all internet communication.",
    diagramType: "hierarchy", diagramNodes: ["Root DNS", "TLD (.com)", "Authoritative NS", "IP Address"],
    pros: ["Human-readable addresses", "Load distribution via multiple IPs", "Geographic routing capabilities", "Caching reduces latency", "Fault tolerance through redundancy"],
    cons: ["Propagation delays (TTL)", "Cache poisoning vulnerabilities", "Single point of failure if misconfigured", "Complex debugging"],
    whenToUse: ["All internet-facing applications", "Content delivery networks", "Load balancing across regions", "Service discovery in distributed systems"],
    whenNotToUse: ["Internal service-to-service calls in a private network (use service mesh instead)", "When sub-millisecond resolution is critical"],
    color: "#8b5cf6",
  },
  {
    id: 3, title: "Saga Pattern", category: "PATTERNS", categoryColor: "#f59e0b",
    subtitle: "Managing distributed transactions and data consistency in microservices.",
    emoji: "🔄", icon: "🔄",
    description: "The Saga pattern manages distributed transactions across multiple microservices by breaking them into a series of local transactions. Each step publishes events or messages to trigger the next step, with compensating transactions for rollback.",
    diagramType: "saga",
    pros: ["Maintains data consistency across services", "No distributed locks needed", "Services remain loosely coupled", "Supports long-running transactions", "Resilient to partial failures"],
    cons: ["Complex to implement and debug", "Eventual consistency (not immediate)", "Compensating transactions are tricky", "Risk of data anomalies between steps"],
    whenToUse: ["E-commerce order processing", "Financial transactions spanning services", "Multi-step workflows in microservices", "When ACID transactions span service boundaries"],
    whenNotToUse: ["Simple single-service transactions", "When strong consistency is required immediately", "Small applications that don't need microservices"],
    color: "#f59e0b",
  },
  {
    id: 4, title: "Idempotency", category: "DATA", categoryColor: "#ef4444",
    subtitle: "Ensuring safe retries and consistent results in distributed operations.",
    emoji: "🔁", icon: "🔁",
    description: "Idempotency ensures that performing the same operation multiple times has the same effect as doing it once. This is critical in distributed systems where network failures can cause requests to be retried.",
    diagramType: "idempotency",
    pros: ["Safe to retry on failure", "Eliminates duplicate operations", "Simplifies client error handling", "Improves system reliability", "Essential for at-least-once delivery"],
    cons: ["Requires unique request IDs", "Storage overhead for tracking processed requests", "Complex to implement for all operations", "Idempotency key management"],
    whenToUse: ["Payment processing APIs", "Email/notification delivery", "Any operation that should not be duplicated", "Distributed systems with unreliable networks"],
    whenNotToUse: ["Read-only operations (already idempotent)", "When tracking duplicate requests is too costly", "Real-time counters where each event matters"],
    color: "#ef4444",
  },
  {
    id: 5, title: "JWT", category: "SECURITY", categoryColor: "#10b981",
    subtitle: "How JSON Web Tokens enable stateless authentication.",
    emoji: "🔑", icon: "🔑",
    description: "JWT (JSON Web Token) is a compact, self-contained token for securely transmitting information between parties as a JSON object. It consists of a header, payload, and signature — enabling stateless authentication.",
    diagramType: "jwt",
    pros: ["Stateless — no server-side session storage", "Self-contained with all needed info", "Cross-domain authentication", "Widely supported", "Compact and URL-safe"],
    cons: ["Cannot be invalidated before expiry", "Payload is base64-encoded (not encrypted by default)", "Token size larger than session cookies", "Secret key management is critical"],
    whenToUse: ["Single Sign-On (SSO) systems", "API authentication", "Mobile app auth", "Microservices inter-service auth"],
    whenNotToUse: ["When you need immediate token revocation", "Storing sensitive data in payload", "When session-based auth is simpler"],
    color: "#10b981",
  },
  {
    id: 6, title: "HTTPS", category: "SECURITY", categoryColor: "#10b981",
    subtitle: "How Modern Web Security Works with TLS encryption.",
    emoji: "🔒", icon: "🔒",
    description: "HTTPS combines HTTP with TLS/SSL to encrypt data between client and server. It ensures confidentiality, integrity, and authentication — making it the foundation of secure web communication.",
    diagramType: "tls",
    pros: ["Encrypts data in transit", "Authenticates server identity", "Prevents man-in-the-middle attacks", "Required for HTTP/2 and modern APIs", "Boosts SEO ranking"],
    cons: ["Certificate management overhead", "Slight performance overhead (TLS handshake)", "Certificate expiry risks", "Costs for some certificate types"],
    whenToUse: ["All production web applications", "Any site handling user data", "APIs transmitting sensitive information", "Authentication flows"],
    whenNotToUse: ["Internal dev environments (HTTP acceptable)", "Air-gapped systems with no external exposure"],
    color: "#10b981",
  },
  {
    id: 7, title: "Redis", category: "PERFORMANCE", categoryColor: "#f97316",
    subtitle: "Redis use cases for high-performance caching and data structures.",
    emoji: "⚡", icon: "⚡",
    description: "Redis is an in-memory data structure store used as a database, cache, and message broker. Its sub-millisecond response times make it ideal for caching, session management, real-time leaderboards, and pub/sub messaging.",
    diagramType: "redis",
    pros: ["Sub-millisecond latency", "Rich data structures (strings, hashes, sets, sorted sets)", "Pub/sub messaging built-in", "Atomic operations", "Persistence options available"],
    cons: ["Data limited by available RAM", "Not suited for complex queries", "Persistence has performance trade-offs", "Single-threaded (mostly)", "Data loss risk if not configured correctly"],
    whenToUse: ["Session caching", "Real-time leaderboards", "Rate limiting", "Pub/sub messaging", "Distributed locks"],
    whenNotToUse: ["Large datasets that don't fit in memory", "Complex relational queries", "Long-term primary data storage"],
    color: "#f97316",
  },
  {
    id: 8, title: "RPC", category: "NETWORK", categoryColor: "#8b5cf6",
    subtitle: "How Remote Procedure Calls enable service-to-service communication.",
    emoji: "📡", icon: "📡",
    description: "RPC (Remote Procedure Call) allows a program to execute a procedure on a remote server as if it were a local function call. Modern implementations like gRPC use Protocol Buffers for efficient binary serialization.",
    diagramType: "rpc",
    pros: ["Feels like local function calls", "Strong typing with Protobuf", "High performance with gRPC", "Bi-directional streaming", "Code generation from schemas"],
    cons: ["Tighter coupling than REST", "Debugging is harder", "Less human-readable than JSON/REST", "Learning curve for Protobuf"],
    whenToUse: ["Internal microservice communication", "High-performance backends", "Real-time streaming data", "Polyglot environments needing strong contracts"],
    whenNotToUse: ["Public APIs (REST is more accessible)", "Browser-to-server (limited gRPC-web support)", "When human-readability is important"],
    color: "#8b5cf6",
  },
  {
    id: 9, title: "Architectural Patterns", category: "ARCHITECTURE", categoryColor: "#6366f1",
    subtitle: "Monolith vs Microservices — choosing the right architecture.",
    emoji: "🏛️", icon: "🏛️",
    description: "Architectural patterns define the high-level structure of software systems. The key tension is between monoliths (single deployable unit) and microservices (independent services), each with distinct trade-offs in complexity, scalability, and team organization.",
    diagramType: "architecture",
    pros: ["Clear system boundaries", "Independent scaling per service", "Technology flexibility", "Team autonomy", "Fault isolation"],
    cons: ["Distributed system complexity", "Network overhead between services", "Data consistency challenges", "Operational overhead", "Higher initial cost"],
    whenToUse: ["Large teams needing independent deployment", "Services with different scaling requirements", "When fault isolation is critical", "Long-lived systems that need to evolve independently"],
    whenNotToUse: ["Small teams or early-stage startups", "Applications with simple, uniform load", "When operational complexity is a constraint"],
    color: "#6366f1",
  },
  {
    id: 10, title: "Modular Monolith", category: "ARCHITECTURE", categoryColor: "#6366f1",
    subtitle: "Modular Monolith architecture explained — the best of both worlds.",
    emoji: "🗿", icon: "🗿",
    description: "A Modular Monolith is a single deployable unit organized into well-defined, loosely coupled modules with clear boundaries. It offers the simplicity of a monolith while preparing for future microservice extraction.",
    diagramType: "modular",
    pros: ["Simpler deployment than microservices", "No network overhead between modules", "Easy refactoring within the monolith", "Can evolve to microservices gradually", "Strong boundaries enforce good design"],
    cons: ["Still shares a single database (usually)", "Scaling requires scaling the whole app", "Large codebase can become hard to navigate", "Module boundary violations possible"],
    whenToUse: ["Teams new to distributed systems", "When microservices overhead is too high", "When transitioning from a big ball of mud", "Startups that may need to scale later"],
    whenNotToUse: ["When independent scaling per module is required NOW", "Large enterprises with many independent teams"],
    color: "#6366f1",
  },
  {
    id: 11, title: "Web Request Path", category: "NETWORK", categoryColor: "#8b5cf6",
    subtitle: "What happens when you type a URL into your browser.",
    emoji: "🌍", icon: "🌍",
    description: "The journey of a web request involves DNS resolution, TCP/TLS handshakes, HTTP request/response, and browser rendering. Understanding this path is fundamental to debugging, performance optimization, and security.",
    diagramType: "webrequest",
    pros: ["Understanding enables optimization at each layer", "Foundation for debugging network issues", "Essential knowledge for security analysis", "Helps design better caching strategies"],
    cons: ["Many layers introduce potential failure points", "Latency accumulates across each step", "Complex to debug end-to-end"],
    whenToUse: ["Always relevant for web developers", "Performance optimization analysis", "Security auditing", "Debugging slow page loads"],
    whenNotToUse: ["N/A — this is a fundamental concept, not a design choice"],
    color: "#8b5cf6",
  },
  {
    id: 12, title: "Must-Know Concepts", category: "PATTERNS", categoryColor: "#f59e0b",
    subtitle: "Eleven essential system design concepts every engineer should know.",
    emoji: "💡", icon: "💡",
    description: "Core system design concepts include scalability, availability, consistency, latency, throughput, CAP theorem, load balancing, caching, sharding, replication, and message queues — the building blocks of all large-scale systems.",
    diagramType: "concepts",
    pros: ["Foundation for all system design interviews", "Universal applicability across tech stacks", "Enables better architectural decisions", "Common vocabulary for engineering teams"],
    cons: ["Broad surface area requires deep study", "Trade-offs are highly context-dependent", "No one-size-fits-all solutions"],
    whenToUse: ["System design interviews", "Architecting new systems", "Reviewing existing architectures", "Onboarding new engineers"],
    whenNotToUse: ["N/A — foundational knowledge always applies"],
    color: "#f59e0b",
  },
  {
    id: 13, title: "Caching", category: "PERFORMANCE", categoryColor: "#f97316",
    subtitle: "Multi-level data storage strategies for high-performance access.",
    emoji: "🗄️", icon: "🗄️",
    description: "Caching stores copies of data in fast-access storage to reduce latency and backend load. Strategies include browser cache, CDN cache, application-level cache (Redis/Memcached), and database query cache.",
    diagramType: "caching",
    pros: ["Dramatically reduces latency", "Reduces database and backend load", "Improves throughput", "Enables offline capability", "Cost savings at scale"],
    cons: ["Cache invalidation is notoriously hard", "Stale data risk", "Memory constraints", "Cache warming time after restart", "Consistency challenges in distributed caches"],
    whenToUse: ["Read-heavy workloads", "Expensive computed results", "Static assets delivery", "Session data storage", "Database query results"],
    whenNotToUse: ["Write-heavy workloads with low read frequency", "Data that changes every request", "When data freshness is absolutely critical"],
    color: "#f97316",
  },
  {
    id: 14, title: "Security", category: "SECURITY", categoryColor: "#10b981",
    subtitle: "OAuth2, JWT, and modern authentication/authorization protocols.",
    emoji: "🛡️", icon: "🛡️",
    description: "Modern application security encompasses authentication (who are you?), authorization (what can you do?), and data protection. OAuth2 and OpenID Connect are the industry standards for delegated access and identity.",
    diagramType: "oauth",
    pros: ["Delegated access without sharing passwords", "Industry standard with broad support", "Separation of identity from resource servers", "Fine-grained scopes", "Token-based — works across domains"],
    cons: ["Complex implementation", "Multiple redirect flows confuse developers", "Token leakage risks", "Dependency on authorization server availability"],
    whenToUse: ["Social login (Google, GitHub, etc.)", "Third-party API access delegation", "Single Sign-On (SSO)", "Mobile apps needing API access"],
    whenNotToUse: ["Simple apps with only first-party users", "When a simple session auth suffices", "M2M communication (use client credentials grant instead)"],
    color: "#10b981",
  },
  {
    id: 15, title: "Observability", category: "OPS", categoryColor: "#06b6d4",
    subtitle: "Logging, metrics, and tracing for deep system visibility.",
    emoji: "📊", icon: "📊",
    description: "Observability is the ability to understand a system's internal state from its external outputs. The three pillars are logs (discrete events), metrics (numeric measurements over time), and traces (request journey across services).",
    diagramType: "observability",
    pros: ["Proactive issue detection", "Faster incident resolution (MTTR)", "Performance insights", "Capacity planning data", "User experience monitoring"],
    cons: ["Significant storage costs at scale", "Data volume can be overwhelming", "Complex to correlate across pillars", "Performance overhead of instrumentation", "Expertise required to use effectively"],
    whenToUse: ["All production systems", "Distributed/microservices architectures", "High-availability requirements", "SLA-bound systems", "Performance-sensitive applications"],
    whenNotToUse: ["Small scripts or batch jobs with no SLA", "Development environments (simpler debugging tools suffice)"],
    color: "#06b6d4",
  },
  {
    id: 16, title: "Containers", category: "INFRASTRUCTURE", categoryColor: "#64748b",
    subtitle: "Docker and Kubernetes for consistent, reliable deployments.",
    emoji: "📦", icon: "📦",
    description: "Containers package code and its dependencies together, ensuring consistent environments from development to production. Docker creates containers; Kubernetes (K8s) orchestrates them at scale with scheduling, scaling, and self-healing.",
    diagramType: "containers",
    pros: ["Environment consistency", "Fast startup vs VMs", "Resource efficiency", "Easy horizontal scaling", "Immutable infrastructure"],
    cons: ["Kubernetes complexity is steep", "Container security requires care", "Persistent storage is complex", "Debugging inside containers", "Overhead vs bare metal"],
    whenToUse: ["Microservices deployments", "Teams needing dev/prod parity", "Applications needing rapid scaling", "CI/CD pipelines", "Multi-cloud deployments"],
    whenNotToUse: ["Simple single-server apps", "Windows-only workloads (complex)", "When team lacks K8s expertise and load is low"],
    color: "#64748b",
  },
  {
    id: 17, title: "Consistent Hashing", category: "DATA", categoryColor: "#ef4444",
    subtitle: "How consistent hashing distributes load with minimal reshuffling.",
    emoji: "⭕", icon: "⭕",
    description: "Consistent hashing distributes data across nodes in a way that minimizes remapping when nodes are added or removed. It uses a virtual ring where each node owns a range, making it ideal for distributed caches and databases.",
    diagramType: "hashing",
    pros: ["Minimal data movement on node changes", "Even load distribution", "Supports dynamic scaling", "No single point of coordination", "Virtual nodes enable fine-grained balancing"],
    cons: ["Uneven distribution without virtual nodes", "Complex to implement correctly", "Hot spots with skewed data", "Less intuitive than simple modulo hashing"],
    whenToUse: ["Distributed caches (Redis Cluster, Memcached)", "Distributed databases (Cassandra, DynamoDB)", "Load balancers", "Content delivery networks", "Peer-to-peer systems"],
    whenNotToUse: ["Small-scale systems where simple sharding suffices", "When data is not evenly distributable by key"],
    color: "#ef4444",
  },
  {
    id: 18, title: "API Versioning", category: "ARCHITECTURE", categoryColor: "#6366f1",
    subtitle: "Strategies for evolving APIs without breaking existing clients.",
    emoji: "📋", icon: "📋",
    description: "API versioning allows APIs to evolve over time while maintaining backward compatibility. Common strategies include URL versioning (/v1/), header versioning, and query parameter versioning.",
    diagramType: "versioning",
    pros: ["Non-breaking changes for existing clients", "Clear evolution path", "Multiple client versions supported simultaneously", "Enables gradual migration", "Better API governance"],
    cons: ["Maintenance burden of multiple versions", "Deprecation management complexity", "Documentation overhead", "Risk of clients staying on old versions", "Version proliferation"],
    whenToUse: ["Public APIs with external consumers", "APIs used by mobile apps (cannot force updates)", "Multi-tenant APIs with varied client needs", "APIs undergoing major redesign"],
    whenNotToUse: ["Internal APIs where you control all clients", "Early-stage APIs that change frequently", "GraphQL APIs (handled differently via schema evolution)"],
    color: "#6366f1",
  },
  {
    id: 19, title: "Microservices 101", category: "ARCHITECTURE", categoryColor: "#6366f1",
    subtitle: "Microservices lessons from Netflix and real-world deployments.",
    emoji: "🧩", icon: "🧩",
    description: "Microservices architecture decomposes an application into small, independently deployable services. Netflix pioneered many patterns: circuit breakers, service discovery, and chaos engineering to build resilient systems at scale.",
    diagramType: "microservices",
    pros: ["Independent deployment per service", "Technology diversity", "Fault isolation", "Team autonomy aligned to services", "Independent scaling"],
    cons: ["Distributed systems complexity", "Network latency between services", "Data consistency across services", "Operational overhead multiplied", "Service discovery and load balancing needed"],
    whenToUse: ["Large organizations with multiple teams", "Services with different scaling needs", "Long-term products needing independent evolution", "Netflix/Amazon/Uber scale problems"],
    whenNotToUse: ["Small teams (< 10 engineers)", "Simple CRUD applications", "Startups without PMF yet", "When a modular monolith suffices"],
    color: "#6366f1",
  },
  {
    id: 20, title: "Frontend 101", category: "ARCHITECTURE", categoryColor: "#6366f1",
    subtitle: "Frontend system design concepts for scalable UI architecture.",
    emoji: "🖥️", icon: "🖥️",
    description: "Frontend system design covers rendering strategies (CSR, SSR, SSG, ISR), state management, component architecture, performance optimization, and micro-frontends — ensuring scalable, performant user interfaces.",
    diagramType: "frontend",
    pros: ["Proper rendering strategy improves SEO and performance", "Component architecture enables reuse", "State management prevents prop drilling", "Code splitting reduces bundle size", "Micro-frontends enable team independence"],
    cons: ["JavaScript bundle size can explode", "Hydration complexity with SSR", "State management can over-engineer simple apps", "Micro-frontends add coordination overhead"],
    whenToUse: ["Large-scale web applications", "SEO-critical marketing sites (SSR/SSG)", "Complex interactive dashboards (CSR)", "Teams building independent UI features"],
    whenNotToUse: ["Simple static sites (use plain HTML/CSS)", "When bundle optimization is premature", "Small apps where React overhead is unnecessary"],
    color: "#6366f1",
  },
];

const PLAYBOOK_CHAPTERS = [
  {
    id: 1, icon: "🧭", tag: "FOUNDATIONS",
    title: "Why Editorial Intelligence Exists",
    body: "The modern engineering landscape is noisy. New frameworks launch weekly, architectural trends shift quarterly, and engineers are flooded with half-baked tutorials that optimize for virality over rigor. Editorial Intelligence was built as an antidote — a curated, opinionated signal in a world drowning in content.\n\nOur mission is to distil the hard-earned wisdom of practitioners who have designed systems at scale and translate it into concise, actionable knowledge. Every concept in our library has been stress-tested against real production environments — not hypothetical toy systems.",
    acr: "For ACR, this means every piece of content that passes through our editorial layer is grounded in practitioner reality. Before a concept ships, it undergoes a three-stage review: accuracy audit, relevance calibration, and narrative coherence — ensuring what you read is both technically sound and strategically useful.",
  },
  {
    id: 2, icon: "🏗️", tag: "ARCHITECTURE",
    title: "The Knowledge Architecture",
    body: "Editorial Intelligence structures knowledge into five tiers: Concepts (atomic building blocks), Patterns (repeating solutions to recurring problems), Architectures (system-level configurations), Playbooks (decision frameworks for real scenarios), and Deep Dives (long-form explorations of complex territory).\n\nThis taxonomy is deliberate. Engineering knowledge collapses when it's treated as a flat list. Our tiered model lets engineers navigate from curiosity to competence — starting with a concept card, drilling into a pattern, then graduating to a full architectural blueprint.",
    acr: "ACR can leverage this architecture to build learning pathways that map directly to role progression. Junior engineers navigate Concepts; senior ICs explore Architectures; staff engineers live in Playbooks. The result is a self-service knowledge stack that reduces onboarding time and accelerates architectural decision-making.",
  },
  {
    id: 3, icon: "⚙️", tag: "USE CASES",
    title: "How ACR Uses Editorial Intelligence",
    body: "Architecture review processes generate enormous amounts of institutional knowledge — but that knowledge rarely survives the meeting. It lives in Confluence pages that no one re-reads, Slack threads that expire, and the heads of engineers who eventually leave.\n\nEditorial Intelligence provides ACR with a structured framework to capture, codify, and surface this knowledge at the point of decision. When an engineer opens a PR that introduces a new caching layer, the relevant playbook surfaces contextually. When a team debates between gRPC and REST, both concept cards are a single search away.",
    acr: "The immediate ROI for ACR manifests in three dimensions: reduced design review cycles (because reviewers and authors share a common conceptual vocabulary), faster onboarding (new engineers ramp on the organisation's architectural standards through curated content), and institutional memory preservation (decisions are linked to the knowledge that informed them).",
  },
  {
    id: 4, icon: "📐", tag: "DECISION FRAMEWORKS",
    title: "Playbook Methodology",
    body: "Every Playbook entry follows a consistent structure: Context (the scenario and constraints), Decision Points (the critical forks), Trade-off Matrix (a structured comparison of approaches), Recommendation (an opinionated default with clear caveats), and Anti-patterns (what to explicitly avoid).\n\nThis format was designed to mirror how senior engineers actually think when facing architectural decisions — not a listicle, but a structured reasoning process. The goal is to give engineers not just an answer, but the mental model to derive better answers in novel situations.",
    acr: "For ACR's review panels, the Playbook Methodology transforms subjective debate into structured dialogue. Reviewers can reference a shared framework rather than arguing from personal preference. This dramatically reduces decision fatigue and leads to faster, higher-confidence sign-offs.",
  },
  {
    id: 5, icon: "🔁", tag: "CONTINUOUS LEARNING",
    title: "Keeping Knowledge Current",
    body: "Technical knowledge has a half-life. What was best practice in 2020 may be an anti-pattern in 2025. Editorial Intelligence runs a quarterly freshness audit on every concept in the library, flagging entries that need updates based on ecosystem changes, emerging alternatives, or community feedback.\n\nOur editorial board includes practitioners from distributed systems, security, frontend infrastructure, and platform engineering — ensuring coverage across the full stack and preventing the siloed expertise that plagues most knowledge bases.",
    acr: "ACR benefits from an always-current knowledge layer without the maintenance overhead. The editorial team handles staleness detection and content refresh cycles. Your engineering organisation gets to focus on building, not curating.",
  },
  {
    id: 6, icon: "🔭", tag: "ROADMAP",
    title: "What's Coming Next",
    body: "The next phase of Editorial Intelligence introduces interactive decision trees — a guided, branching interface that walks engineers through architectural choices in real time. Input your constraints (team size, traffic patterns, consistency requirements) and receive a tailored recommendation with full rationale.\n\nWe're also building an API layer that lets platforms like ACR embed knowledge cards directly inside review tooling — surfacing the right concept at the moment an engineer needs it, without context switching.",
    acr: "Early access to the decision tree API is available for ACR integration partners. Contact the team to discuss embedding Editorial Intelligence's knowledge layer directly into your review workflow — turning every PR into a teachable moment.",
  },
];

const NEWSLETTER_ISSUES = [
  {
    id: 1, issue: "Issue #047", date: "Mar 18, 2025", tag: "DEEP DIVE",
    tagColor: "#6366f1",
    title: "Why Your API Gateway is a Single Point of Failure (and What to Do About It)",
    preview: "Most teams treat the API gateway as infrastructure. They configure it once and forget it. That's a mistake that has brought down production systems at companies you use every day.",
    readTime: "9 min read", views: "24.3k",
  },
  {
    id: 2, issue: "Issue #046", date: "Mar 11, 2025", tag: "PATTERNS",
    tagColor: "#f59e0b",
    title: "The Saga Pattern is More Complicated Than Anyone Admits",
    preview: "Every article about the Saga pattern starts with the same cheerful diagram. Four boxes, three arrows, a rollback step. What those diagrams don't show you is the nightmare that starts at step five.",
    readTime: "7 min read", views: "18.9k",
  },
  {
    id: 3, issue: "Issue #045", date: "Mar 4, 2025", tag: "SECURITY",
    tagColor: "#10b981",
    title: "JWT Revocation: The Problem Nobody Wants to Talk About",
    preview: "The JWT spec gives you a beautiful stateless system. It also gives you an expiry. What it doesn't give you is a way to say 'this token is no longer valid right now'. Here's how teams solve that in practice.",
    readTime: "6 min read", views: "31.2k",
  },
  {
    id: 4, issue: "Issue #044", date: "Feb 25, 2025", tag: "ARCHITECTURE",
    tagColor: "#6366f1",
    title: "The Modular Monolith is Having a Comeback. Here's Why That's Correct.",
    preview: "The microservices era produced genuinely useful patterns — and a lot of accidental complexity. A quiet counter-movement is underway. The modular monolith deserves serious re-evaluation.",
    readTime: "8 min read", views: "42.7k",
  },
  {
    id: 5, issue: "Issue #043", date: "Feb 18, 2025", tag: "PERFORMANCE",
    tagColor: "#f97316",
    title: "Redis at the Limit: What Happens When Your Cache Runs Out of RAM",
    preview: "You've built a beautiful caching layer. It works perfectly. Then your dataset grows by 10x. This is the issue nobody reads in the Redis docs until it's 2am and the alerts are firing.",
    readTime: "10 min read", views: "19.4k",
  },
  {
    id: 6, issue: "Issue #042", date: "Feb 11, 2025", tag: "OPS",
    tagColor: "#06b6d4",
    title: "Observability Is Not Monitoring: A Precise Distinction That Changes Everything",
    preview: "Engineers conflate these terms constantly. The distinction isn't semantic pedantry — it changes how you instrument systems, what you alert on, and how fast you recover when things go wrong.",
    readTime: "5 min read", views: "27.8k",
  },
];

const INITIAL_VISIBLE = 8;

// ─── DIAGRAM ─────────────────────────────────────────────────────────────────

function DiagramSVG({ concept }) {
  const { diagramType, color } = concept;
  if (diagramType === "flow") {
    return (
      <svg viewBox="0 0 500 200" className="diagram-svg">
        {[["Client", 30], ["Gateway", 155], ["Auth", 280], ["Backend", 380]].map(([label, x], i, arr) => (
          <g key={label}>
            <rect x={x} y={70} width={90} height={44} rx={8} fill={`${color}22`} stroke={color} strokeWidth={1.5} />
            <text x={x + 45} y={97} textAnchor="middle" fill={color} fontSize={12} fontWeight={600}>{label}</text>
            {i < arr.length - 1 && <line x1={x + 90} y1={92} x2={arr[i + 1][1]} y2={92} stroke={color} strokeWidth={1.5} markerEnd="url(#arr)" strokeDasharray="4,2" />}
          </g>
        ))}
        <defs><marker id="arr" markerWidth={8} markerHeight={8} refX={6} refY={3} orient="auto"><path d="M0,0 L0,6 L8,3 z" fill={color} /></marker></defs>
      </svg>
    );
  }
  if (diagramType === "hierarchy") {
    return (
      <svg viewBox="0 0 500 200" className="diagram-svg">
        {[["Root DNS", 220, 20], ["TLD (.com)", 130, 90], ["Auth NS", 320, 90], ["IP Address", 220, 160]].map(([label, x, y]) => (
          <g key={label}>
            <rect x={x - 55} y={y} width={110} height={36} rx={8} fill={`${color}22`} stroke={color} strokeWidth={1.5} />
            <text x={x} y={y + 23} textAnchor="middle" fill={color} fontSize={11} fontWeight={600}>{label}</text>
          </g>
        ))}
        {[[220, 56, 185, 90], [220, 56, 375, 90], [185, 126, 220, 160], [375, 126, 220, 160]].map(([x1, y1, x2, y2], i) => (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={1.5} strokeDasharray="4,2" />
        ))}
      </svg>
    );
  }
  if (diagramType === "saga") {
    const steps = ["Order", "Payment", "Inventory", "Delivery"];
    return (
      <svg viewBox="0 0 500 200" className="diagram-svg">
        {steps.map((s, i) => (
          <g key={s}>
            <rect x={20 + i * 115} y={60} width={95} height={44} rx={8} fill={`${color}22`} stroke={color} strokeWidth={1.5} />
            <text x={67 + i * 115} y={87} textAnchor="middle" fill={color} fontSize={11} fontWeight={600}>{s}</text>
            {i < steps.length - 1 && <path d={`M${115 + i * 115},82 L${135 + i * 115},82`} stroke={color} strokeWidth={2} markerEnd="url(#arr2)" />}
            <text x={67 + i * 115} y={130} textAnchor="middle" fill="#ef4444" fontSize={9} opacity={0.7}>↩ compensate</text>
          </g>
        ))}
        <defs><marker id="arr2" markerWidth={8} markerHeight={8} refX={6} refY={3} orient="auto"><path d="M0,0 L0,6 L8,3 z" fill={color} /></marker></defs>
      </svg>
    );
  }
  if (diagramType === "jwt") {
    return (
      <svg viewBox="0 0 500 180" className="diagram-svg">
        {[["Header", "#6366f1", 20], ["Payload", "#f59e0b", 185], ["Signature", "#10b981", 350]].map(([label, c, x]) => (
          <g key={label}>
            <rect x={x} y={50} width={120} height={50} rx={8} fill={`${c}33`} stroke={c} strokeWidth={1.5} />
            <text x={x + 60} y={80} textAnchor="middle" fill={c} fontSize={13} fontWeight={700}>{label}</text>
          </g>
        ))}
        <text x={250} y={140} textAnchor="middle" fill="#94a3b8" fontSize={11}>eyJhbGciOiJIUzI1NiJ9.eyJ1c2VyIjoiMTIzIn0.abc</text>
        <text x={250} y={30} textAnchor="middle" fill="#94a3b8" fontSize={10}>Algorithm & type · Claims & data · HMAC/RSA signature</text>
      </svg>
    );
  }
  if (diagramType === "hashing") {
    const nodes = 6;
    return (
      <svg viewBox="0 0 500 220" className="diagram-svg">
        <circle cx={250} cy={110} r={75} fill="none" stroke={`${color}40`} strokeWidth={2} strokeDasharray="6,3" />
        {Array.from({ length: nodes }).map((_, i) => {
          const angle = (i / nodes) * Math.PI * 2 - Math.PI / 2;
          const x = 250 + Math.cos(angle) * 75;
          const y = 110 + Math.sin(angle) * 75;
          return (
            <g key={i}>
              <circle cx={x} cy={y} r={18} fill={`${color}22`} stroke={color} strokeWidth={1.5} />
              <text x={x} y={y + 4} textAnchor="middle" fill={color} fontSize={9} fontWeight={700}>N{i + 1}</text>
            </g>
          );
        })}
        <text x={250} y={115} textAnchor="middle" fill="#94a3b8" fontSize={10}>Hash Ring</text>
      </svg>
    );
  }
  if (diagramType === "observability") {
    return (
      <svg viewBox="0 0 500 180" className="diagram-svg">
        {[["📝 Logs", "#6366f1", 40], ["📊 Metrics", "#f59e0b", 190], ["🔍 Traces", "#10b981", 340]].map(([label, c, x]) => (
          <g key={label}>
            <rect x={x} y={40} width={120} height={60} rx={10} fill={`${c}22`} stroke={c} strokeWidth={1.5} />
            <text x={x + 60} y={75} textAnchor="middle" fill={c} fontSize={12} fontWeight={700}>{label}</text>
          </g>
        ))}
        <rect x={170} y={130} width={160} height={32} rx={6} fill="#1e293b" stroke="#475569" strokeWidth={1} />
        <text x={250} y={151} textAnchor="middle" fill="#94a3b8" fontSize={11} fontWeight={600}>Observability Platform</text>
        {[[100, 100], [250, 100], [400, 100]].map(([x], i) => (
          <line key={i} x1={x} y1={100} x2={250} y2={130} stroke="#475569" strokeWidth={1} strokeDasharray="3,2" />
        ))}
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 500 180" className="diagram-svg">
      <rect x={150} y={50} width={200} height={80} rx={12} fill={`${color}22`} stroke={color} strokeWidth={2} />
      <text x={250} y={95} textAnchor="middle" fill={color} fontSize={16} fontWeight={700}>{concept.title}</text>
      <text x={250} y={115} textAnchor="middle" fill="#94a3b8" fontSize={11}>{concept.category}</text>
    </svg>
  );
}

// ─── MODAL ───────────────────────────────────────────────────────────────────

function Modal({ concept, onClose }) {
  const overlayRef = useRef(null);
  const panelRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const handleClose = useCallback(() => {
    setVisible(false);
    setTimeout(onClose, 250);
  }, [onClose]);

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") handleClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleClose]);

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) handleClose();
  };

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "diagram", label: "How It Works" },
    { id: "tradeoffs", label: "Trade-offs" },
  ];

  return (
    <div
      ref={overlayRef}
      className="modal-overlay"
      style={{ opacity: visible ? 1 : 0, transition: "opacity 0.25s ease" }}
      onClick={handleOverlayClick}
    >
      <div
        ref={panelRef}
        className="modal-panel"
        style={{ transform: visible ? "translateY(0) scale(1)" : "translateY(24px) scale(0.97)", opacity: visible ? 1 : 0, transition: "transform 0.28s cubic-bezier(0.16,1,0.3,1), opacity 0.25s ease" }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header strip */}
        <div className="modal-header-strip" style={{ background: `linear-gradient(135deg, ${concept.color}18 0%, ${concept.color}06 100%)`, borderBottom: `1px solid ${concept.color}20` }}>
          <div className="modal-header-inner">
            <div className="modal-icon-wrap" style={{ background: `${concept.color}20`, border: `1px solid ${concept.color}30` }}>
              <span style={{ fontSize: 24 }}>{concept.emoji}</span>
            </div>
            <div>
              <span className="modal-category" style={{ color: concept.color, background: `${concept.color}18` }}>{concept.category}</span>
              <h2 className="modal-title" id="modal-title">{concept.title}</h2>
              <p className="modal-subtitle">{concept.subtitle}</p>
            </div>
          </div>
          <button className="modal-close" onClick={handleClose} aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Tab bar */}
        <div className="modal-tabs">
          {tabs.map(t => (
            <button key={t.id} className={`modal-tab ${activeTab === t.id ? "modal-tab-active" : ""}`} onClick={() => setActiveTab(t.id)}
              style={activeTab === t.id ? { color: concept.color, borderBottomColor: concept.color } : {}}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="modal-body">
          {activeTab === "overview" && (
            <div className="modal-fade-in">
              <p className="modal-desc">{concept.description}</p>
              <div className="modal-when-grid">
                <div className="modal-when-card use">
                  <h4>✔ When to Use</h4>
                  <ul>{concept.whenToUse.map((w, i) => <li key={i}>{w}</li>)}</ul>
                </div>
                <div className="modal-when-card nouse">
                  <h4>✘ When Not to Use</h4>
                  <ul>{concept.whenNotToUse.map((w, i) => <li key={i}>{w}</li>)}</ul>
                </div>
              </div>
            </div>
          )}
          {activeTab === "diagram" && (
            <div className="modal-fade-in">
              <div className="modal-diagram">
                <div className="diagram-label">Visual Architecture</div>
                <DiagramSVG concept={concept} />
              </div>
              <p className="modal-desc" style={{ marginTop: 0 }}>{concept.description}</p>
            </div>
          )}
          {activeTab === "tradeoffs" && (
            <div className="modal-fade-in">
              <div className="modal-grid">
                <div className="modal-section pros">
                  <h4>✅ Pros</h4>
                  <ul>{concept.pros.map((p, i) => <li key={i}>{p}</li>)}</ul>
                </div>
                <div className="modal-section cons">
                  <h4>❌ Cons</h4>
                  <ul>{concept.cons.map((c, i) => <li key={i}>{c}</li>)}</ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── CONCEPT CARD ─────────────────────────────────────────────────────────────

function ConceptCard({ concept, onClick, index }) {
  return (
    <div
      className="concept-card"
      onClick={() => onClick(concept)}
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <span className="card-category" style={{ color: concept.categoryColor, background: `${concept.categoryColor}15` }}>{concept.category}</span>
      <div className="card-icon-wrap" style={{ background: `${concept.color}15`, border: `1px solid ${concept.color}30` }}>
        <span className="card-icon">{concept.emoji}</span>
      </div>
      <h3 className="card-title">{concept.title}</h3>
      <p className="card-subtitle">{concept.subtitle}</p>
      <div className="card-arrow" style={{ color: concept.color }}>→</div>
    </div>
  );
}

// ─── PARALLAX HOOK ────────────────────────────────────────────────────────────

function useParallax(factor = 0.3) {
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    let raf;
    const onScroll = () => {
      raf = requestAnimationFrame(() => setOffset(window.scrollY * factor));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(raf); };
  }, [factor]);
  return offset;
}

// ─── PAGES ────────────────────────────────────────────────────────────────────

function ConceptsPage({ setSelected }) {
  const [showAll, setShowAll] = useState(false);
  const heroOffset = useParallax(0.28);
  const bgOffset = useParallax(0.12);
  const visible = showAll ? CONCEPTS : CONCEPTS.slice(0, INITIAL_VISIBLE);

  return (
    <>
      {/* HERO */}
      <section className="hero-section" style={{ overflow: "hidden", position: "relative" }}>
        {/* Parallax background layer */}
        <div className="hero-bg-parallax" style={{ transform: `translateY(${bgOffset}px)` }} />
        <div className="hero" style={{ transform: `translateY(${heroOffset * 0.4}px)` }}>
          <div>
            <div className="hero-badge">ARCHITECTURE SERIES</div>
            <h1 className="hero-title">20 System Design<br /><span>Concepts</span></h1>
            <p className="hero-desc">A masterclass in modern software architecture. Deciphering the building blocks of systems that scale to millions.</p>
            <div className="hero-actions">
              <button className="btn-primary" onClick={() => document.getElementById("library").scrollIntoView({ behavior: "smooth" })}>
                Explore Concepts →
              </button>
              
            </div>
          </div>
          <div className="hero-visual" style={{ transform: `translateY(${-heroOffset * 0.2}px)` }}>
            <div className="hero-visual-inner">
              <div className="hero-float-card hero-card-1">
                <div className="hero-card-dot" style={{ background: "#10b981" }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: "#0f172a" }}>API Gateway</span>
                <span style={{ fontSize: 10, color: "#64748b", marginLeft: "auto" }}>Active</span>
              </div>
              <div className="hero-float-card hero-card-2">
                <div className="hero-card-dot" style={{ background: "#3b82f6" }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: "#0f172a" }}>Service Mesh</span>
                <span style={{ fontSize: 10, color: "#64748b", marginLeft: "auto" }}>2 nodes</span>
              </div>
              <div className="hero-float-card hero-card-3">
                <div className="hero-card-dot" style={{ background: "#f59e0b" }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: "#0f172a" }}>Redis Cache</span>
                <span style={{ fontSize: 10, color: "#64748b", marginLeft: "auto" }}>98% hit</span>
              </div>
              <div className="hero-visual-card">
                <div className="hero-card-icon" />
                <div>
                  <div className="hero-card-text">Digital Curator</div>
                  <div className="hero-card-sub">System Intelligence v2.0</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* LIBRARY */}
      <section id="library" className="library">
        <div className="section-header">
          <div>
            <h2 className="section-title">Core Knowledge Library</h2>
            <p className="section-desc">Curated technical deep-dives across architectural domains. Select a concept to begin exploring.</p>
          </div>
          <div className="section-dots">
            <div className="dot dot-active" />
            <div className="dot dot-inactive" />
          </div>
        </div>
        <div className="concepts-grid">
          {visible.map((c, i) => (
            <ConceptCard key={c.id} concept={c} onClick={setSelected} index={i} />
          ))}
        </div>
        <div className="view-all-wrap">
          <button className="view-all-btn" onClick={() => setShowAll((v) => !v)}>
            {showAll ? "Show less ↑" : `View all 20 concepts ↓`}
          </button>
        </div>
      </section>
    </>
  );
}

function PlaybookPage() {
  const heroOffset = useParallax(0.22);
  const [expanded, setExpanded] = useState(null);

  return (
    <>
      <section className="playbook-hero" style={{ overflow: "hidden", position: "relative" }}>
        <div className="playbook-hero-bg" style={{ transform: `translateY(${heroOffset}px)` }} />
        <div className="playbook-hero-content">
          <div className="hero-badge" style={{ background: "#fef3c7", color: "#92400e" }}>PLAYBOOK</div>
          <h1 className="hero-title">The Editorial<br /><span style={{ color: "#f59e0b" }}>Intelligence Playbook</span></h1>
          <p className="hero-desc" style={{ maxWidth: 520 }}>Structured frameworks for architectural decision-making. How ACR teams can leverage curated knowledge to ship faster, review smarter, and build with greater confidence.</p>
          <div className="playbook-meta-strip">
            <span className="playbook-meta-item">📖 6 Chapters</span>
            <span className="playbook-meta-item">⏱ 22 min read</span>
            <span className="playbook-meta-item">🔄 Updated Mar 2025</span>
          </div>
        </div>
      </section>

      <section className="playbook-body">
        <div className="playbook-toc">
          <div className="toc-label">CHAPTERS</div>
          {PLAYBOOK_CHAPTERS.map(ch => (
            <button
              key={ch.id}
              className={`toc-item ${expanded === ch.id ? "toc-item-active" : ""}`}
              onClick={() => setExpanded(expanded === ch.id ? null : ch.id)}
            >
              <span className="toc-num">0{ch.id}</span>
              <span className="toc-title">{ch.title}</span>
            </button>
          ))}
        </div>

        <div className="playbook-chapters">
          {PLAYBOOK_CHAPTERS.map((ch) => (
            <div key={ch.id} className={`playbook-chapter ${expanded === ch.id ? "chapter-open" : ""}`}>
              <div className="chapter-header" onClick={() => setExpanded(expanded === ch.id ? null : ch.id)}>
                <div className="chapter-left">
                  <span className="chapter-num">0{ch.id}</span>
                  <div>
                    <span className="chapter-tag">{ch.tag}</span>
                    <h3 className="chapter-title">{ch.title}</h3>
                  </div>
                </div>
                <div className="chapter-icon-wrap">
                  <span style={{ fontSize: 22 }}>{ch.icon}</span>
                  <span className="chapter-toggle">{expanded === ch.id ? "−" : "+"}</span>
                </div>
              </div>
              {expanded === ch.id && (
                <div className="chapter-body">
                  {ch.body.split("\n\n").map((para, i) => (
                    <p key={i} style={{ marginBottom: 16, lineHeight: 1.75, color: "#334155", fontSize: 14 }}>{para}</p>
                  ))}
                  <div className="chapter-acr-box">
                    <div className="acr-box-label">
                      <span className="acr-badge">ACR USE CASE</span>
                    </div>
                    <p style={{ fontSize: 13, lineHeight: 1.7, color: "#1e40af", margin: 0 }}>{ch.acr}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function NewsletterPage() {
  const heroOffset = useParallax(0.2);
  const [subscribed, setSubscribed] = useState(false);
  const [email, setEmail] = useState("");
  const [filter, setFilter] = useState("ALL");

  const tags = ["ALL", "DEEP DIVE", "PATTERNS", "SECURITY", "ARCHITECTURE", "PERFORMANCE", "OPS"];
  const filtered = filter === "ALL" ? NEWSLETTER_ISSUES : NEWSLETTER_ISSUES.filter(i => i.tag === filter);

  return (
    <>
      <section className="newsletter-hero" style={{ overflow: "hidden", position: "relative" }}>
        <div className="newsletter-hero-bg" style={{ transform: `translateY(${heroOffset}px)` }} />
        <div className="newsletter-hero-content">
          <div className="hero-badge" style={{ background: "#ecfdf5", color: "#065f46" }}>NEWSLETTER</div>
          <h1 className="hero-title">Weekly Architecture<br /><span style={{ color: "#10b981" }}>Intelligence</span></h1>
          <p className="hero-desc" style={{ maxWidth: 500 }}>Deep-dives into the decisions behind systems that scale. Practitioner-authored. Editorially rigorous. No fluff.</p>
          <div className="nl-hero-stats">
            <div className="nl-stat"><span className="nl-stat-num">50k+</span><span className="nl-stat-label">Subscribers</span></div>
            <div className="nl-stat-div" />
            <div className="nl-stat"><span className="nl-stat-num">047</span><span className="nl-stat-label">Issues</span></div>
            <div className="nl-stat-div" />
            <div className="nl-stat"><span className="nl-stat-num">4.9★</span><span className="nl-stat-label">Avg Rating</span></div>
          </div>
        </div>
        {/* Subscribe strip */}
        <div className="nl-hero-subscribe">
          {subscribed ? (
            <div className="nl-success">🎉 You're on the list. Expect the next issue in your inbox Tuesday.</div>
          ) : (
            <div className="nl-subscribe-row">
              <div className="nl-input-wrap-hero">
                <span className="nl-input-icon">✉</span>
                <input className="nl-input-hero" type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <button className="nl-btn-hero" onClick={() => email && setSubscribed(true)}>Subscribe Free →</button>
            </div>
          )}
          <p className="nl-note-hero">Join 50,000+ engineers. Unsubscribe anytime.</p>
        </div>
      </section>

      {/* Issues archive */}
      <section className="nl-archive">
        <div className="nl-archive-header">
          <h2 className="section-title">Recent Issues</h2>
          <div className="nl-filter-row">
            {tags.map(t => (
              <button key={t} className={`nl-filter-btn ${filter === t ? "nl-filter-active" : ""}`} onClick={() => setFilter(t)}>{t}</button>
            ))}
          </div>
        </div>
        <div className="nl-issues-grid">
          {filtered.map((issue) => (
            <div key={issue.id} className="nl-issue-card">
              <div className="nl-issue-top">
                <span className="nl-issue-num">{issue.issue}</span>
                <span className="nl-issue-date">{issue.date}</span>
              </div>
              <span className="nl-issue-tag" style={{ color: issue.tagColor, background: `${issue.tagColor}15` }}>{issue.tag}</span>
              <h3 className="nl-issue-title">{issue.title}</h3>
              <p className="nl-issue-preview">{issue.preview}</p>
              <div className="nl-issue-footer">
                <span className="nl-issue-meta">⏱ {issue.readTime}</span>
                <span className="nl-issue-meta">👁 {issue.views} views</span>
                <button className="nl-read-btn">Read →</button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
 function App() {
  const [page, setPage] = useState("concepts");
  const [selected, setSelected] = useState(null);
  const [subscribed, setSubscribed] = useState(false);

  const navItems = [
    { id: "concepts", label: "Concepts" },
    { id: "apiflow", label: "API Flow" },
    { id: "playbook", label: "Playbook" },
    { id: "newsletter", label: "Newsletter" },
    { id: "about", label: "About" },
  ];

  return (
    <>
      {/* NAV */}
      <nav>
        <div className="nav-logo" onClick={() => setPage("concepts")}>
          <div className="nav-logo-icon" />
          Editorial Intelligence
        </div>
        <div className="nav-links">
          {navItems.map(item => (
            <button key={item.id} className={`nav-link ${page === item.id ? "active" : ""}`} onClick={() => setPage(item.id)}>
              {item.label}
            </button>
          ))}
        </div>
        <button className="nav-cta">Get Started</button>
      </nav>

      {/* PAGE CONTENT */}
      {page === "concepts" && <ConceptsPage setSelected={setSelected} />}
      {page === "apiflow" && <Api />}
      {page === "playbook" && <PlaybookPage />}
      {page === "newsletter" && <NewsletterPage />}
      {page === "about" && (
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "64px 32px" }}>
          <div className="hero-badge">ABOUT</div>
          <h1 className="hero-title" style={{ marginBottom: 20 }}>About <span>Editorial Intelligence</span></h1>
          <p style={{ fontSize: 15, color: "#64748b", lineHeight: 1.75, maxWidth: 580 }}>
            Editorial Intelligence is a practitioner-first knowledge platform designed for engineers who build systems at scale. Our mission: distil the hard-won wisdom of senior engineers into concise, actionable, and editorially rigorous content.
          </p>
        </div>
      )}

      {/* Newsletter inline section (only on concepts page) */}
      {page === "concepts" && (
        <div className="newsletter-section">
          <div className="newsletter-card">
            <div>
              <h2 className="nl-title">Deepen Your Architecture Skills</h2>
              <p className="nl-desc">Join 50,000+ engineers receiving our weekly deep-dives into modern system design patterns and editorialized tech insights.</p>
            </div>
            <div className="nl-form">
              {subscribed ? (
                <div style={{ color: "#fff", fontSize: 15, fontWeight: 700, textAlign: "center", padding: "20px 0" }}>🎉 Welcome aboard!</div>
              ) : (
                <>
                  <div className="nl-input-wrap">
                    <span className="nl-input-icon">✉</span>
                    <input className="nl-input" type="email" placeholder="Enter your work email" />
                  </div>
                  <button className="nl-btn" onClick={() => setSubscribed(true)}>Join Newsletter Playbook</button>
                  <p className="nl-note">Join the elite 1% of architectural thinkers. Unsubscribe anytime.</p>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer>
        <div>
          <div className="footer-logo">Editorial Intelligence</div>
          <div className="footer-copy">© 2025 Editorial Intelligence. All rights reserved.<br />
            <p className='copy_smruti'>© All copyright reserved by Smruti Ranjan Behera ||
            Principal Enterprise Architect – UI/UX  ·  Enterprise Frontend Platforms  ·  React Ecosystem</p>
          </div>
        </div>
        <div className="footer-links">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
          <a href="#">Contact</a>
          <a href="#">RSS Feed</a>
        </div>
      </footer>

      {/* MODAL */}
      {selected && <Modal concept={selected} onClose={() => setSelected(null)} />}
    </>
  );
}

export default App
