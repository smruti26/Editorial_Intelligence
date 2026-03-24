import { useState, useEffect, useRef, useCallback } from "react";

// ─── API FLOW DATA ────────────────────────────────────────────────────────────

const API_FLOW_STEPS = [
  {
    id: 1, title: "Client Request Entry", emoji: "🖥️", color: "#2563eb", category: "ENTRY",
    subtitle: "Web, mobile, or service clients send requests into a single gateway endpoint.",
    description: "Every API journey begins at the client — a web browser, mobile app, or service — sending an HTTP/HTTPS request to the gateway's single public endpoint. The gateway is the front door to your entire backend, absorbing all inbound traffic and providing a unified surface for all consumers.",
    tools: ["NGINX", "Kong", "AWS API Gateway"],
    pros: ["Single public entry point simplifies DNS and SSL", "Decouples clients from backend topology", "Enables traffic shaping at the edge", "Unified endpoint for all client types"],
    cons: ["Single point of failure if not HA", "Can become a bottleneck under extreme load", "Requires robust infrastructure management"],
    whenToUse: ["All production APIs with external consumers", "Multi-platform products (web + mobile + IoT)", "Any system needing traffic control at the edge"],
    whenNotToUse: ["Internal scripts with no external traffic", "Direct service-to-service calls in a private mesh"],
    diagramType: "clientEntry",
  },
  {
    id: 2, title: "Request Authentication", emoji: "🔐", color: "#7c3aed", category: "SECURITY",
    subtitle: "Gateway validates identity via tokens, API keys, or OAuth before anything moves forward.",
    description: "Before a request touches any business logic, the gateway verifies identity. This can be a JWT bearer token, an API key in headers, or a full OAuth 2.0 flow. Invalid requests are rejected immediately — protecting backend services from ever seeing unauthenticated traffic.",
    tools: ["OAuth2", "JWT", "Okta"],
    pros: ["Centralised auth logic — services stay clean", "Blocks unauthenticated traffic at the perimeter", "Supports multiple auth schemes simultaneously", "Audit trail at the gateway level"],
    cons: ["JWT cannot be revoked before expiry", "Key management complexity at scale", "Auth service becomes a critical dependency"],
    whenToUse: ["All public-facing APIs", "Multi-tenant SaaS platforms", "Any API carrying user or sensitive data"],
    whenNotToUse: ["Fully internal trusted networks", "When latency from auth overhead is unacceptable"],
    diagramType: "auth",
  },
  {
    id: 3, title: "Rate Limiting", emoji: "⏱️", color: "#dc2626", category: "RELIABILITY",
    subtitle: "Controls traffic volume to prevent overload and ensure fair resource usage.",
    description: "Rate limiting enforces per-client or global caps on request frequency. The gateway tracks request counts against a window (fixed, sliding, or token bucket) and returns 429 Too Many Requests when limits are exceeded. This protects backend services from abuse, DDoS, and runaway clients.",
    tools: ["Redis", "Envoy", "Kong"],
    pros: ["Protects backends from traffic spikes", "Enables fair usage across tenants", "Reduces infrastructure costs", "Prevents DDoS amplification"],
    cons: ["Requires distributed state (Redis) for accuracy", "False positives can block legitimate bursts", "Complex to tune per-tier limits"],
    whenToUse: ["Public APIs with anonymous or authenticated consumers", "Free-tier vs paid-tier traffic differentiation", "Protecting expensive downstream operations"],
    whenNotToUse: ["Fully trusted internal systems", "Real-time streaming where every event counts"],
    diagramType: "rateLimit",
  },
  {
    id: 4, title: "Request Validation", emoji: "✅", color: "#059669", category: "QUALITY",
    subtitle: "Checks headers, parameters, and payload format before routing downstream.",
    description: "The gateway validates the structure and content of each request against a schema (OpenAPI, JSON Schema) before forwarding. Malformed payloads, missing required headers, or invalid parameter types are rejected with a 400 Bad Request — keeping backend services clean and reducing defensive coding in every service.",
    tools: ["OpenAPI", "JSON Schema"],
    pros: ["Catches bad data before it reaches services", "Reduces defensive coding in each service", "Self-documents the API contract", "Enables clear, consistent error messages"],
    cons: ["Schema maintenance overhead", "Complex nested validations can be slow", "Schema drift between gateway and service"],
    whenToUse: ["REST APIs with structured payloads", "Public APIs where input quality is unpredictable", "Teams practicing API-first design"],
    whenNotToUse: ["Streaming or binary protocols", "High-frequency internal calls where schema is trusted"],
    diagramType: "validation",
  },
  {
    id: 5, title: "Routing Logic", emoji: "🗺️", color: "#d97706", category: "ROUTING",
    subtitle: "Directs requests to the correct backend service based on paths, rules, or load strategy.",
    description: "Once validated, the gateway evaluates routing rules to determine which upstream service should handle the request. Rules are based on URL path prefixes, HTTP methods, headers, query params, or canary weights. This is where monolithic path space is split across microservices.",
    tools: ["Traefik", "NGINX", "Envoy"],
    pros: ["Decouples URL space from service topology", "Enables canary and blue-green deployments", "Dynamic routing without client changes", "Supports A/B testing at the infrastructure level"],
    cons: ["Routing table complexity grows with services", "Misconfiguration causes hard-to-debug 404s", "Dynamic routing adds latency"],
    whenToUse: ["Microservices architectures", "Canary releases and feature flags", "Gradually migrating from monolith to services"],
    whenNotToUse: ["Tiny systems with one backend service", "When routing logic belongs in the application layer"],
    diagramType: "routing",
  },
  {
    id: 6, title: "Load Balancing", emoji: "⚖️", color: "#0891b2", category: "RELIABILITY",
    subtitle: "Distributes traffic across service instances for scalability and reliability.",
    description: "The gateway distributes requests across multiple healthy instances of a backend service using algorithms like round-robin, least-connections, or consistent hashing. It performs health checks and removes unhealthy instances from rotation, ensuring no single node is overwhelmed.",
    tools: ["HAProxy", "Envoy", "AWS ELB"],
    pros: ["Horizontal scalability", "Automatic failover on instance failure", "Even resource utilisation", "Supports zero-downtime deployments"],
    cons: ["Session affinity conflicts with stateless design", "Health check tuning is critical", "Consistent hashing complexity for stateful services"],
    whenToUse: ["Any service running multiple instances", "High-availability production systems", "Deployments with rolling updates"],
    whenNotToUse: ["Single-instance dev/test environments", "Stateful services without sticky session support"],
    diagramType: "loadBalance",
  },
  {
    id: 7, title: "Protocol Translation", emoji: "🔄", color: "#7c3aed", category: "INTEROP",
    subtitle: "Converts between REST, gRPC, SOAP, or WebSockets when systems speak different languages.",
    description: "Not every service speaks the same protocol. The gateway can translate inbound REST/HTTP calls to gRPC for high-performance internal services, wrap legacy SOAP APIs in a modern REST interface, or upgrade HTTP to WebSocket for real-time channels. This allows the public interface to evolve independently of internal implementation.",
    tools: ["Envoy", "Apigee"],
    pros: ["Modernises legacy APIs without rewriting them", "Lets clients use REST while backends use gRPC", "Enables gradual protocol migration", "Hides internal complexity from consumers"],
    cons: ["Translation overhead adds latency", "Data model mismatches between protocols", "Debugging cross-protocol issues is complex"],
    whenToUse: ["Exposing legacy SOAP services as REST", "gRPC backends with REST-only clients", "Real-time apps needing WebSocket upgrade"],
    whenNotToUse: ["All services already use the same protocol", "When translation latency is unacceptable"],
    diagramType: "protocol",
  },
  {
    id: 8, title: "Request Transformation", emoji: "✏️", color: "#be185d", category: "TRANSFORM",
    subtitle: "Modifies headers or payloads to match backend service expectations.",
    description: "Before forwarding, the gateway can reshape the request — adding/removing headers, renaming fields, injecting auth context from the validated token, or restructuring the payload. This decouples the public API contract from internal service contracts, allowing both to evolve independently.",
    tools: ["Kong plugins", "Apigee"],
    pros: ["Decouples public API from internal contracts", "Inject auth context without client involvement", "Enables API versioning at the gateway", "Reduces changes needed in backend services"],
    cons: ["Transformation logic can become complex", "Hard to test gateway-level transformations", "Latency overhead for heavy transformations"],
    whenToUse: ["API versioning without changing backends", "Multi-tenant payload enrichment", "Normalising inconsistent upstream formats"],
    whenNotToUse: ["Simple pass-through proxying", "When transformation belongs in the service"],
    diagramType: "reqTransform",
  },
  {
    id: 9, title: "Backend Service Call", emoji: "📡", color: "#1d4ed8", category: "EXECUTION",
    subtitle: "Gateway forwards the validated request to internal microservices or external APIs.",
    description: "The gateway makes the upstream call to the target service — either internal microservices over a private network or external third-party APIs. This call includes the transformed request, injected headers, and any service-mesh mTLS context. Timeouts, retries, and circuit-breaking live here.",
    tools: ["Kubernetes", "Docker"],
    pros: ["Centralised retry and timeout policy", "Circuit breaker prevents cascade failures", "mTLS enforced consistently", "Upstream health observable at the gateway"],
    cons: ["Adds network hop vs direct service call", "Gateway becomes aware of service topology", "Complex retry logic can cause duplicate calls"],
    whenToUse: ["All microservice architectures", "Integrating third-party APIs through a unified interface", "When circuit-breaking and retries are needed"],
    whenNotToUse: ["Ultra-low latency paths where every hop matters", "Service-to-service calls in a trusted mesh"],
    diagramType: "backendCall",
  },
  {
    id: 10, title: "Response Aggregation", emoji: "🧩", color: "#0f766e", category: "COMPOSITION",
    subtitle: "Combines responses from multiple services into a single unified result.",
    description: "The gateway can fan out a single client request to multiple upstream services, then aggregate the responses into one payload. This is the Backend-for-Frontend (BFF) pattern — reducing client round-trips, hiding service decomposition, and enabling mobile-optimised response shapes.",
    tools: ["GraphQL", "Kong"],
    pros: ["Reduces client round-trips dramatically", "Hides internal service decomposition", "Enables client-specific response shapes", "Simplifies frontend data fetching"],
    cons: ["Increases gateway complexity", "Partial failure handling is hard", "Aggregation latency equals slowest upstream"],
    whenToUse: ["Mobile clients needing composite data", "BFF pattern for web and mobile", "Migrating from monolith where data was co-located"],
    whenNotToUse: ["Simple single-service responses", "When clients can handle multiple calls"],
    diagramType: "aggregation",
  },
  {
    id: 11, title: "Response Transformation", emoji: "📦", color: "#b45309", category: "TRANSFORM",
    subtitle: "Formats the response structure, headers, or data for client compatibility.",
    description: "On the way back, the gateway transforms the upstream response to match the client contract — removing internal fields, renaming properties, converting formats (XML to JSON), setting cache headers, or enriching with computed fields. This protects clients from internal changes.",
    tools: ["Apigee", "NGINX"],
    pros: ["Shields clients from backend response changes", "Enables response caching at the gateway", "Format conversion without client updates", "Adds security headers consistently"],
    cons: ["Transformation bugs are hard to trace", "Adds latency on the response path", "Risk of accidentally leaking internal fields"],
    whenToUse: ["Wrapping legacy backends with modern response shapes", "Adding consistent security headers", "Response caching for expensive operations"],
    whenNotToUse: ["Simple JSON pass-through", "When response transformation belongs in the service"],
    diagramType: "resTransform",
  },
  {
    id: 12, title: "Monitoring & Logging", emoji: "📊", color: "#7c3aed", category: "OBSERVABILITY",
    subtitle: "Every request tracked — latency, errors, usage patterns. The observability layer.",
    description: "The gateway emits structured logs, metrics, and traces for every request. Latency histograms, error rates, request counts per route, per-consumer usage — all captured here. This is the observability layer that makes production debugging possible and SLOs measurable.",
    tools: ["Prometheus", "Grafana", "Datadog"],
    pros: ["Central observability for all traffic", "SLO tracking per route and consumer", "Anomaly detection without touching services", "Audit trail for security and compliance"],
    cons: ["High cardinality metrics can be expensive", "Log volume management at scale", "Distributed tracing requires service cooperation"],
    whenToUse: ["All production systems", "Regulated industries requiring audit trails", "Teams operating SLOs and SLAs"],
    whenNotToUse: ["Dev/test environments where cost matters", "When observability is fully handled in the mesh"],
    diagramType: "monitoring",
  },
  {
    id: 13, title: "Response Delivery", emoji: "🚀", color: "#16a34a", category: "DELIVERY",
    subtitle: "Final response securely returned to the client through the optimised gateway path.",
    description: "The final response travels back through the gateway to the client — with TLS encryption, optimised via CDN edge caching where applicable, and with all security headers applied. The connection is closed or kept alive per HTTP/2 multiplexing rules. The client receives a clean, consistent, secure response.",
    tools: ["CDN", "TLS"],
    pros: ["TLS termination centralised", "CDN caching reduces latency globally", "Consistent security headers on all responses", "HTTP/2 multiplexing efficiency"],
    cons: ["CDN cache invalidation complexity", "TLS overhead on every response", "Edge caching conflicts with dynamic content"],
    whenToUse: ["All production public APIs", "Globally distributed user bases", "Any API delivering cacheable content"],
    whenNotToUse: ["Internal-only APIs with no external exposure", "Real-time WebSocket streams"],
    diagramType: "delivery",
  },
];

// ─── CANVAS DIAGRAM ───────────────────────────────────────────────────────────

function CanvasDiagram({ step }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const tRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    const color = step.color;

    function hex(c, a) {
      const r = parseInt(c.slice(1,3),16), g = parseInt(c.slice(3,5),16), b = parseInt(c.slice(5,7),16);
      return `rgba(${r},${g},${b},${a})`;
    }
    function box(x,y,w,h,label,sub,active,accent) {
      ctx.save();
      ctx.shadowColor = active ? hex(accent||color,0.35) : "transparent";
      ctx.shadowBlur = active ? 16 : 0;
      ctx.fillStyle = active ? hex(accent||color,0.18) : "#f8fafc";
      ctx.strokeStyle = active ? (accent||color) : "#cbd5e1";
      ctx.lineWidth = active ? 2 : 1.5;
      roundRect(ctx,x,y,w,h,10);
      ctx.fill(); ctx.stroke();
      ctx.restore();
      ctx.fillStyle = active ? (accent||color) : "#334155";
      ctx.font = `700 12px 'Sora',sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(label, x+w/2, y+h/2-(sub?6:0));
      if(sub){ ctx.fillStyle="#94a3b8"; ctx.font=`500 10px 'Sora',sans-serif`; ctx.fillText(sub,x+w/2,y+h/2+10); }
    }
    function roundRect(ctx,x,y,w,h,r){
      ctx.beginPath(); ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.arcTo(x+w,y,x+w,y+r,r); ctx.lineTo(x+w,y+h-r); ctx.arcTo(x+w,y+h,x+w-r,y+h,r); ctx.lineTo(x+r,y+h); ctx.arcTo(x,y+h,x,y+h-r,r); ctx.lineTo(x,y+r); ctx.arcTo(x,y,x+r,y,r); ctx.closePath();
    }
    function arrow(x1,y1,x2,y2,label,progress,accent){
      const t = Math.min(1,Math.max(0,progress));
      const ex = x1+(x2-x1)*t, ey = y1+(y2-y1)*t;
      ctx.save();
      ctx.strokeStyle = hex(accent||color,0.6); ctx.lineWidth=2;
      ctx.setLineDash([5,3]);
      ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(ex,ey); ctx.stroke();
      ctx.setLineDash([]);
      if(t>0.85){ 
        const ang = Math.atan2(y2-y1,x2-x1);
        ctx.fillStyle = accent||color;
        ctx.beginPath(); ctx.moveTo(ex,ey); ctx.lineTo(ex-10*Math.cos(ang-0.4),ey-10*Math.sin(ang-0.4)); ctx.lineTo(ex-10*Math.cos(ang+0.4),ey-10*Math.sin(ang+0.4)); ctx.closePath(); ctx.fill();
      }
      if(label&&t>0.4){
        const mx=(x1+ex)/2, my=(y1+ey)/2;
        ctx.fillStyle="#fff"; roundRect(ctx,mx-22,my-9,44,16,4); ctx.fill();
        ctx.strokeStyle=hex(accent||color,0.4); ctx.lineWidth=1; ctx.stroke();
        ctx.fillStyle=accent||color; ctx.font=`600 9px 'Sora',sans-serif`; ctx.textAlign="center"; ctx.fillText(label,mx,my+4);
      }
      ctx.restore();
    }
    function dot(x,y,r,a,c){ ctx.save(); ctx.fillStyle=hex(c||color,a); ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill(); ctx.restore(); }
    function pulse(x,y,t,c){ const s=(Math.sin(t*2)*0.5+0.5); dot(x,y,6+s*8,0.15,c||color); dot(x,y,4+s*2,0.5,c||color); }

    function draw(t) {
      ctx.clearRect(0,0,W,H);
      const cyc = (t%4)/4; // 0→1 cycle over 4s
      const p1=(cyc<0.33)?cyc/0.33:1;
      const p2=(cyc<0.33)?0:(cyc<0.66)?(cyc-0.33)/0.33:1;
      const p3=(cyc<0.66)?0:(cyc-0.66)/0.34;

      const d = step.diagramType;

      if(d==="clientEntry"){
        box(20,80,120,50,"Client","Web/Mobile",cyc<0.33,color);
        box(190,80,130,50,"API Gateway","Entry Point",cyc>=0.33&&cyc<0.66,color);
        box(380,40,110,40,"Service A","",cyc>=0.66,color);
        box(380,110,110,40,"Service B","",cyc>=0.66,color);
        arrow(140,105,190,105,"Request",p1,color);
        arrow(320,95,380,65,"Route",p2,color);
        arrow(320,110,380,125,"Route",p3,color);
        pulse(165,105,t,color); pulse(355,80,t,color);
      }
      else if(d==="auth"){
        box(10,90,100,44,"Client","",p1>0,color);
        box(160,90,110,44,"Gateway","Auth Check",p2>0,color);
        box(330,40,110,40,"Auth Service","JWT/OAuth",p2>0.5,"#7c3aed");
        box(330,115,110,40,"Backend","Protected",p3>0,color);
        arrow(110,112,160,112,"Token",p1,color);
        arrow(270,100,330,65,"Validate",p2,"#7c3aed");
        arrow(270,112,330,130,"✓ Forward",p3,color);
        dot(445,65,5,p2>0.8?0.9:0,"#7c3aed");
        if(p2>0.8){ ctx.fillStyle="#7c3aed"; ctx.font="bold 12px sans-serif"; ctx.textAlign="center"; ctx.fillText("✓",445,70); }
      }
      else if(d==="rateLimit"){
        box(10,90,100,44,"Client","",true,color);
        box(160,55,110,44,"Rate Limiter","Window Check",true,color);
        box(160,125,110,44,"Redis","Counter Store",cyc>0.3,"#dc2626");
        box(340,90,110,44,"Backend","",p3>0,color);
        arrow(110,112,160,77,"Req",p1,color);
        arrow(270,77,160,147,"Check",p2,"#dc2626");
        arrow(270,90,340,112,"Allow",p3,color);
        const filled = Math.floor(cyc*5);
        for(let i=0;i<5;i++){ dot(180+i*14,30,5,i<filled?0.9:0.15,i<filled?color:"#94a3b8"); }
        ctx.fillStyle="#64748b"; ctx.font="10px sans-serif"; ctx.textAlign="center"; ctx.fillText(`${filled}/5 req`,215,20);
      }
      else if(d==="validation"){
        box(10,90,100,44,"Client","Payload",true,color);
        box(165,40,115,38,"Schema","OpenAPI/JSON",cyc>0.2,color);
        box(165,105,115,44,"Validator","",true,color);
        box(355,90,100,44,"Backend","Clean Data",p3>0.5,color);
        arrow(110,112,165,120,"Raw",p1,color);
        arrow(165,60,165,105,"Schema",p2,color);
        arrow(280,120,355,112,"✓ Valid",p3,color);
        const ok=p3>0.5;
        ctx.save(); ctx.fillStyle=ok?"#10b981":"#f59e0b"; ctx.font="bold 20px sans-serif"; ctx.textAlign="center"; ctx.fillText(ok?"✓":"?",405,86); ctx.restore();
      }
      else if(d==="routing"){
        box(10,90,100,44,"Request","",true,color);
        box(160,90,120,44,"Router","Rule Engine",true,color);
        box(350,30,100,36,"/api/users","Svc A",p1>0.5,color);
        box(350,80,100,36,"/api/orders","Svc B",p2>0.5,color);
        box(350,130,100,36,"/api/pay","Svc C",p3>0.5,color);
        arrow(110,112,160,112,"",p1,color);
        arrow(280,100,350,50,"",p1,color);
        arrow(280,105,350,100,"",p2,color);
        arrow(280,112,350,148,"",p3,color);
        ctx.fillStyle="#64748b"; ctx.font="600 10px sans-serif"; ctx.textAlign="left";
        ["PATH","HOST","METHOD"].forEach((r,i)=>{ ctx.fillStyle=hex(color,0.8); ctx.fillText(r,170,75+i*10); });
      }
      else if(d==="loadBalance"){
        box(10,90,100,44,"Gateway","",true,color);
        const instances=[{y:30,l:"Instance 1"},{y:85,l:"Instance 2"},{y:140,l:"Instance 3"}];
        instances.forEach(({y,l},i)=>{
          const active=Math.floor(cyc*3)%3===i;
          box(330,y,110,40,l,active?"● Active":"○ Idle",active,color);
          arrow(110,112,330,y+20,"",active?p1+i*0.1:0.3,color);
        });
        const alg=["Round Robin","Least Conn","Weighted"][Math.floor(cyc*3)%3];
        ctx.fillStyle=color; ctx.font="700 11px sans-serif"; ctx.textAlign="center"; ctx.fillText(alg,215,180);
      }
      else if(d==="protocol"){
        box(10,80,100,50,"REST\nClient","HTTP/JSON",true,color);
        box(185,80,110,50,"Gateway","Translator",true,color);
        box(370,40,100,40,"gRPC Svc","Protobuf",p2>0,color);
        box(370,115,100,40,"SOAP Svc","XML",p3>0,color);
        arrow(110,105,185,105,"REST",p1,color);
        arrow(295,95,370,65,"gRPC",p2,color);
        arrow(295,110,370,130,"SOAP",p3,"#7c3aed");
        ctx.fillStyle="#94a3b8"; ctx.font="10px sans-serif"; ctx.textAlign="center"; ctx.fillText("⇄ translate",240,75);
      }
      else if(d==="reqTransform"){
        box(10,90,105,50,"Client\nRequest","Raw Payload",true,"#be185d");
        box(175,90,115,50,"Transformer","Header Inject",true,"#be185d");
        box(360,90,105,50,"Backend","Clean Payload",p2>0.3,"#be185d");
        arrow(115,115,175,115,"Raw",p1,"#be185d");
        arrow(290,115,360,115,"Transformed",p2,"#be185d");
        const fields=[["X-User-ID","injected"],["Content-Type","normalized"],["Auth","stripped"]];
        fields.forEach(([k,v],i)=>{
          const show = cyc>(i*0.25);
          ctx.fillStyle=show?"#be185d":"#cbd5e1"; ctx.font=`${show?700:400} 9px monospace`; ctx.textAlign="left"; ctx.fillText(`${k}: ${v}`,15,55+i*14);
        });
      }
      else if(d==="backendCall"){
        box(10,90,100,44,"Gateway","",true,color);
        box(175,55,105,38,"Svc A","Internal",p1>0.3,color);
        box(175,120,105,38,"Ext API","3rd Party",p2>0.4,color);
        box(355,55,100,38,"DB","",p1>0.7,color);
        box(355,120,100,38,"Cache","Redis",p2>0.7,"#f59e0b");
        arrow(110,105,175,75,"mTLS",p1,color);
        arrow(110,112,175,135,"HTTPS",p2,color);
        arrow(280,75,355,75,"Query",p1>0.5?p1:0,color);
        arrow(280,135,355,135,"Get",p2>0.5?p2:0,"#f59e0b");
        const retry = Math.floor(cyc*3)%3;
        ctx.fillStyle="#64748b"; ctx.font="10px sans-serif"; ctx.textAlign="center"; ctx.fillText(`Retry: ${retry}/3 • Timeout: 5s`,245,185);
      }
      else if(d==="aggregation"){
        box(10,90,95,44,"Client","1 Request",true,color);
        box(175,90,105,44,"Aggregator","Fan Out",true,color);
        box(355,30,100,34,"User Svc","",p1>0,color);
        box(355,80,100,34,"Order Svc","",p2>0,color);
        box(355,130,100,34,"Pay Svc","",p3>0,color);
        arrow(105,112,175,112,"→",p1,color);
        arrow(280,100,355,50,"",p1,color);
        arrow(280,105,355,97,"",p2,color);
        arrow(280,112,355,147,"",p3,color);
        if(p3>0.8){
          box(10,160,460,30,"{ user, orders, payments } ← merged response","",true,color);
        }
      }
      else if(d==="monitoring"){
        const metrics=[["Latency","42ms","#10b981"],["Errors","0.2%","#f59e0b"],["RPS","1.2k","#2563eb"],["P99","210ms","#7c3aed"]];
        metrics.forEach(([l,v,c],i)=>{
          const x=20+i*115, show=cyc>(i*0.2);
          box(x,20,105,50,l,show?v:"---",show,c);
          if(show){ const barH=Math.floor(Math.random()*50+20); ctx.fillStyle=hex(c,0.3); ctx.fillRect(x+10,90,85,60); ctx.fillStyle=hex(c,0.8); ctx.fillRect(x+10,90+(60-barH*cyc),85,barH*cyc); }
        });
        ctx.fillStyle="#94a3b8"; ctx.font="10px sans-serif"; ctx.textAlign="center"; ctx.fillText("Real-time metrics dashboard",240,175);
      }
      else if(d==="resTransform"){
        box(10,90,110,50,"Upstream\nResponse","Raw",true,color);
        box(185,90,110,50,"Transformer","Strip/Rename",true,color);
        box(360,90,105,50,"Client\nResponse","Clean",p2>0.3,color);
        arrow(120,115,185,115,"Raw JSON",p1,color);
        arrow(295,115,360,115,"Formatted",p2,color);
        const transforms=[["internal_id","→ removed"],["user_name","→ username"],["__v","→ removed"]];
        transforms.forEach(([k,v],i)=>{
          ctx.fillStyle=hex(color,cyc>i*0.25?0.9:0.2); ctx.font="9px monospace"; ctx.textAlign="left"; ctx.fillText(`${k} ${v}`,15,55+i*14);
        });
      }
      else if(d==="delivery"){
        box(10,90,100,44,"Gateway","",true,color);
        box(175,55,105,38,"CDN Edge","Cache Hit",p1>0.3,color);
        box(175,120,105,38,"TLS","Encrypt",p2>0.2,"#16a34a");
        box(360,90,100,44,"Client","✓ Secure",p3>0.5,color);
        arrow(110,105,175,75,"Response",p1,color);
        arrow(110,112,175,135,"Encrypt",p2,"#16a34a");
        arrow(280,80,360,105,"HTTPS",p3,color);
        const shield = p3>0.5;
        ctx.fillStyle=shield?"#16a34a":"#94a3b8"; ctx.font=`bold ${shield?22:16}px sans-serif`; ctx.textAlign="center"; ctx.fillText("🔒",410,88);
      }
      else {
        box(150,80,180,60,step.title,"",true,color);
      }
    }

    function loop(ts) {
      tRef.current = ts/1000;
      draw(tRef.current);
      animRef.current = requestAnimationFrame(loop);
    }
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [step]);

  return <canvas ref={canvasRef} width={490} height={200} style={{ width:"100%", height:"auto", borderRadius:12, background:"#f8fafc", display:"block" }} />;
}

// ─── API FLOW MODAL ───────────────────────────────────────────────────────────

function APIFlowModal({ step, onClose }) {
  const overlayRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const [tab, setTab] = useState("overview");

  useEffect(() => { requestAnimationFrame(()=>setVisible(true)); document.body.style.overflow="hidden"; return ()=>{ document.body.style.overflow=""; }; }, []);
  const close = useCallback(()=>{ setVisible(false); setTimeout(onClose,250); },[onClose]);
  useEffect(()=>{ const h=(e)=>{ if(e.key==="Escape") close(); }; window.addEventListener("keydown",h); return ()=>window.removeEventListener("keydown",h); },[close]);

  const c = step.color;
  const tabs=[{id:"overview",label:"Overview"},{id:"diagram",label:"How It Works"},{id:"tradeoffs",label:"Trade-offs"}];

  return (
    <div ref={overlayRef} className="modal-overlay" style={{opacity:visible?1:0,transition:"opacity 0.25s ease"}} onClick={e=>{ if(e.target===overlayRef.current) close(); }}>
      <div className="modal-panel" style={{transform:visible?"translateY(0) scale(1)":"translateY(24px) scale(0.97)",opacity:visible?1:0,transition:"transform 0.28s cubic-bezier(0.16,1,0.3,1), opacity 0.25s ease"}} role="dialog" aria-modal="true">
        <div className="modal-header-strip" style={{background:`linear-gradient(135deg,${c}18 0%,${c}06 100%)`,borderBottom:`1px solid ${c}20`}}>
          <div className="modal-header-inner">
            <div className="modal-icon-wrap" style={{background:`${c}20`,border:`1px solid ${c}30`}}>
              <span style={{fontSize:24}}>{step.emoji}</span>
            </div>
            <div>
              <span className="modal-category" style={{color:c,background:`${c}18`}}>STEP {step.id} · {step.category}</span>
              <h2 className="modal-title">{step.title}</h2>
              <p className="modal-subtitle">{step.subtitle}</p>
            </div>
          </div>
          <button className="modal-close" onClick={close} aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          </button>
        </div>
        <div className="modal-tabs">
          {tabs.map(t=>(
            <button key={t.id} className={`modal-tab ${tab===t.id?"modal-tab-active":""}`} onClick={()=>setTab(t.id)} style={tab===t.id?{color:c,borderBottomColor:c}:{}}>{t.label}</button>
          ))}
        </div>
        <div className="modal-body">
          {tab==="overview" && (
            <div className="modal-fade-in">
              <p className="modal-desc">{step.description}</p>
              <div style={{marginTop:16,display:"flex",gap:8,flexWrap:"wrap"}}>
                {step.tools.map(tool=>(
                  <span key={tool} style={{background:`${c}12`,color:c,border:`1px solid ${c}30`,borderRadius:6,padding:"3px 10px",fontSize:11,fontWeight:700,fontFamily:"var(--mono)"}}>{tool}</span>
                ))}
              </div>
              <div className="modal-when-grid" style={{marginTop:20}}>
                <div className="modal-when-card use">
                  <h4>✔ When to Use</h4>
                  <ul>{step.whenToUse.map((w,i)=><li key={i}>{w}</li>)}</ul>
                </div>
                <div className="modal-when-card nouse">
                  <h4>✘ When Not to Use</h4>
                  <ul>{step.whenNotToUse.map((w,i)=><li key={i}>{w}</li>)}</ul>
                </div>
              </div>
            </div>
          )}
          {tab==="diagram" && (
            <div className="modal-fade-in">
              <div className="modal-diagram">
                <div className="diagram-label">Live Animation · {step.title}</div>
                <CanvasDiagram step={step} />
              </div>
              <p className="modal-desc" style={{marginTop:12}}>{step.description}</p>
            </div>
          )}
          {tab==="tradeoffs" && (
            <div className="modal-fade-in">
              <div className="modal-grid">
                <div className="modal-section pros">
                  <h4>✅ Pros</h4>
                  <ul>{step.pros.map((p,i)=><li key={i}>{p}</li>)}</ul>
                </div>
                <div className="modal-section cons">
                  <h4>❌ Cons</h4>
                  <ul>{step.cons.map((p,i)=><li key={i}>{p}</li>)}</ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── API FLOW PAGE ────────────────────────────────────────────────────────────

function Api() {
  const [selected, setSelected] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);

  return (
    <>
      <div className="af-page">
        {/* Hero */}
        <div className="af-hero-wrap">
          <div className="af-hero-inner">
            <div>
              <div className="af-hero-badge">API GATEWAY SERIES</div>
              <h1 className="af-hero-title">How API Gateways<br /><span>Actually Work</span></h1>
              <p className="af-hero-desc">13 practical steps — from the first client request to the final encrypted response. Click any step for an animated diagram, real trade-offs, and when to apply each layer.</p>
              <div className="af-hero-stats">
                <div className="af-stat"><span className="af-stat-num">13</span><span className="af-stat-label">Steps</span></div>
                <div className="af-stat"><span className="af-stat-num">8</span><span className="af-stat-label">Tools Covered</span></div>
                <div className="af-stat"><span className="af-stat-num">∞</span><span className="af-stat-label">Scale</span></div>
              </div>
            </div>
            <div className="af-hero-visual">
              <div className="af-vis-label">Gateway Status</div>
              {[
                { dot:"#10b981", text:"Auth Layer", badge:"Active", badgeBg:"rgba(16,185,129,0.15)", badgeColor:"#10b981" },
                { dot:"#f59e0b", text:"Rate Limiter", badge:"1.2k/s", badgeBg:"rgba(245,158,11,0.15)", badgeColor:"#d97706" },
                { dot:"#6366f1", text:"Router", badge:"23 rules", badgeBg:"rgba(99,102,241,0.15)", badgeColor:"#6366f1" },
                { dot:"#3b82f6", text:"Load Balancer", badge:"3 nodes", badgeBg:"rgba(59,130,246,0.15)", badgeColor:"#3b82f6" },
              ].map(({dot,text,badge,badgeBg,badgeColor})=>(
                <div key={text} className="af-vis-row">
                  <div className="af-vis-dot" style={{background:dot}} />
                  <span className="af-vis-text">{text}</span>
                  <span className="af-vis-badge" style={{background:badgeBg,color:badgeColor}}>{badge}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tools strip */}
        <div className="af-tools-strip">
          <div className="af-tools-inner">
            <span className="af-tools-label">Tools</span>
            {["Kong","Envoy","NGINX","Apigee","AWS API Gateway","Traefik","Redis","Prometheus","Grafana","Datadog"].map(t=>(
              <span key={t} className="af-tool-chip">{t}</span>
            ))}
          </div>
        </div>

        {/* Cards grid */}
        <div className="af-grid-wrap">
          <div className="af-grid-header">
            <div>
              <div className="af-grid-title">The 13-Step Flow</div>
              <div className="af-grid-subtitle">Click any card to explore its animated diagram and trade-offs</div>
            </div>
            <div className="af-progress">
              <div className="af-progress-bar"><div className="af-progress-fill" /></div>
              <span className="af-progress-label">13 / 13</span>
            </div>
          </div>

          <div className="af-cards-grid">
            {API_FLOW_STEPS.map(step => (
              <div
                key={step.id}
                className="af-card"
                onClick={() => setSelected(step)}
                onMouseEnter={() => setHoveredId(step.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{
                  "--step-color": step.color,
                  "--step-bg": `${step.color}10`,
                  "--step-border": `${step.color}25`,
                  "--step-shadow": `${step.color}40`,
                }}
              >
                <div className="af-card-accent" />
                <div className="af-card-top">
                  <div className="af-card-left">
                    <div className="af-card-icon-wrap">{step.emoji}</div>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:5}}>
                    <div className="af-step-badge">{step.id}</div>
                    <span className="af-card-category-pill">{step.category}</span>
                  </div>
                </div>
                <div className="af-card-title">{step.title}</div>
                <div className="af-card-desc">{step.subtitle}</div>
                <div className="af-card-footer">
                  <div className="af-card-tools-row">
                    {step.tools.slice(0,2).map(t=>(
                      <span key={t} className="af-card-tool">{t}</span>
                    ))}
                    {step.tools.length > 2 && <span className="af-card-tool">+{step.tools.length-2}</span>}
                  </div>
                  <span className="af-card-cta">Explore →</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {selected && <APIFlowModal step={selected} onClose={() => setSelected(null)} />}
    </>
  );
}

export default Api