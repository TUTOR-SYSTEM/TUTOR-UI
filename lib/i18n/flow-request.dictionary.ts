import type { Language } from "@/types";

/**
 * UI copy cho trang Request Flow (vi + en).
 *
 * Chú ý: node name/kind/description, nhãn kết nối, badge trạng thái, mô tả luồng
 * là text hiển thị → đặt ở đây. Các giá trị kỹ thuật (topic name, port,
 * framework, domains...) là dữ liệu miền → giữ trong `flow-request.data.ts`.
 */
export type FlowRequestDictionary = {
  page: {
    title: string;
    description: string;
  };
  map: {
    title: string;
    subtitle: string;
  };
  filters: {
    legend: string;
    all: string;
    user: string;
    tutor: string;
    third: string;
    allHint: string;
    userHint: string;
    tutorHint: string;
    thirdHint: string;
  };
  columns: {
    client: string;
    gateway: string;
    transport: string;
    service: string;
    data: string;
  };
  nodes: {
    uiWeb: { name: string; kind: string; description: string };
    apiGateway: { name: string; kind: string; description: string };
    gatewayOauth: { name: string; kind: string; description: string };
    kafka: { name: string; kind: string; description: string };
    userService: { name: string; kind: string; description: string };
    tutorService: { name: string; kind: string; description: string };
    thirdService: { name: string; kind: string; description: string };
    postgres: { name: string; kind: string; description: string };
    redis: { name: string; kind: string; description: string };
    cloudflareR2: { name: string; kind: string; description: string };
  };
  metadata: {
    port: string;
    topics: string;
    domains: string;
    db: string;
    orm: string;
    schema: string;
    validation: string;
    guard: string;
    framework: string;
    http: string;
    baseUrl: string;
    flow: string;
    token: string;
    transport: string;
    buckets: string;
  };
  edges: {
    http: string;
    produce: string;
    consumeUser: string;
    consumeTutor: string;
    consumeThird: string;
    sql: string;
    cache: string;
    storage: string;
  };
  badges: {
    active: string;
    healthy: string;
    secondary: string;
  };
  summary: {
    heading: string;
    stepTitle: string;
    detailTitle: string;
    backToFlow: string;
    hint: string;
    allDescription: string;
    userDescription: string;
    tutorDescription: string;
    thirdDescription: string;
  };
  requests: {
    heading: string;
    hint: string;
    colMethod: string;
    colEndpoint: string;
    colFlow: string;
    empty: string;
    unroutedHeading: string;
    unroutedHint: string;
  };
  clientRequests: {
    title: string;
    hint: string;
    more: string;
  };
  serviceTopics: {
    title: string;
    hint: string;
    store: string;
    emits: string;
    inMemory: string;
    more: string;
  };
};

const vi: FlowRequestDictionary = {
  page: {
    title: "Sơ đồ Luồng Yêu cầu",
    description:
      "Hành trình một request từ FE qua API Gateway, publish topic lên Apache Kafka, rồi chia tới các service backend (user, tutor, third) xử lý theo mô hình request-reply.",
  },
  map: {
    title: "REQUEST FLOW ARCHITECTURE MAP",
    subtitle: "UI → Gateway → Kafka → Service (user · tutor · third)",
  },
  filters: {
    legend: "Luồng",
    all: "Toàn bộ cụm",
    user: "User / Auth",
    tutor: "Tutor / Học tập",
    third: "Third / Thông báo",
    allHint: "Hiện toàn bộ topology, mọi kết nối dạng cấu trúc.",
    userHint: "Highlight luồng tới user-service (auth, user, admin, student).",
    tutorHint: "Highlight luồng tới tutor-service (domaine lớp học/gia sư).",
    thirdHint: "Highlight luồng tới third-service (email, thông báo, upload).",
  },
  columns: {
    client: "1. CLIENT / UI",
    gateway: "2. GATEWAY / API",
    transport: "3. TRANSPORT",
    service: "4. SERVICES (RPC)",
    data: "5. DATA & INFRA",
  },
  nodes: {
    uiWeb: {
      name: "Web UI",
      kind: "Frontend · Next.js 16",
      description:
        "Giao diện người dùng — mọi request HTTP đều xuất phát từ đây, gắn JWT Bearer qua Axios interceptor.",
    },
    apiGateway: {
      name: "API Gateway",
      kind: "API Gateway · NestJS 11",
      description:
        "Cổng HTTP duy nhất client gọi được — kiểm tra JWT, validate Zod rồi publish topic request-reply lên Kafka (KafkaProducer.send).",
    },
    gatewayOauth: {
      name: "OAuth Google / Facebook",
      kind: "Passport strategy",
      description:
        "Chiến lược OAuth nằm ở gateway — chỉ bước cấp token cuối cùng được publish qua Kafka tới user service.",
    },
    kafka: {
      name: "Apache Kafka",
      kind: "Message Broker · Kafka",
      description:
        "Vận chuyển request/reply giữa gateway và các service qua topic theo domain — mỗi topic có cặp `.reply` cho kết quả.",
    },
    userService: {
      name: "User Service",
      kind: "NestJS microservice",
      description:
        "Danh tính & admin — auth, user, student. Consume topic `auth.*`, `user.*`. Sở hữu PostgreSQL riêng (users, grades).",
    },
    tutorService: {
      name: "Tutor Service",
      kind: "NestJS microservice",
      description:
        "Domaine học tập — class, schedule, session, curriculum, tuition, exercise, attendance, report, ai-chat (topic `class.*`, `lesson.*`...).",
    },
    thirdService: {
      name: "Third Service",
      kind: "NestJS microservice",
      description:
        "Hạ tầng phụ trợ — email, notification, redis, upload (topic `notification.*`, `upload.*`). Notification lưu PostgreSQL riêng; upload ghi Cloudflare R2; redis.set/del theo kiểu fire-and-forget.",
    },
    postgres: {
      name: "PostgreSQL 16",
      kind: "Database · Drizzle ORM",
      description:
        "Dữ liệu lõi — user/tutor-service sở hữu dữ liệu người dùng & giáo dục; third-service sở hữu bảng notifications.",
    },
    redis: {
      name: "Redis 7",
      kind: "Cache",
      description:
        "Cache/session + token JWT — redis.get/set/del do RedisService đảm nhiệm (auth → set session, logout → del).",
    },
    cloudflareR2: {
      name: "Cloudflare R2",
      kind: "Object Storage · S3",
      description:
        "Bộ nhớ đối tượng S3-compatible — file upload của third-service (avatar, tài liệu lớp, bài tập) được xử lý bằng sharp rồi đẩy lên bucket.",
    },
  },
  metadata: {
    port: "Port",
    topics: "Topics",
    domains: "Domains",
    db: "Database",
    orm: "ORM",
    schema: "Schema",
    validation: "Validation",
    guard: "Guard",
    framework: "Framework",
    http: "HTTP",
    baseUrl: "Base URL",
    flow: "Flow",
    token: "Token",
    transport: "Transport",
    buckets: "Buckets",
  },
  edges: {
    http: "HTTP /api/*",
    produce: "produce()",
    consumeUser: "consume · auth.* user.*",
    consumeTutor: "consume · class.* lesson.*",
    consumeThird: "consume · notification.* upload.*",
    sql: "SQL",
    cache: "CACHE",
    storage: "STORAGE · S3",
  },
  badges: {
    active: "ACTIVE",
    healthy: "HEALTHY",
    secondary: "SECONDARY",
  },
  summary: {
    heading: "FLOW REQUEST",
    stepTitle: "Đường đi",
    detailTitle: "Chi tiết node",
    backToFlow: "Xem luồng tổng thể",
    hint: "Chọn luồng bằng nút lọc phía trên, hoặc bấm vào một node để xem chi tiết kết nối.",
    allDescription:
      "Toàn bộ cụm: UI gọi gateway qua HTTP, gateway publish topic lên Kafka và chia tới user, tutor và third service. Mỗi service consume topic nhóm của mình, dùng database/cache riêng; gateway không sở hữu dữ liệu hay logic nghiệp vụ.",
    userDescription:
      "User / Auth: đăng nhập, quản lý user, admin, student. UI → Gateway → Kafka topic `auth.*` / `user.*` → user-service → PostgreSQL.",
    tutorDescription:
      "Tutor / Học tập: lớp học, lịch, buổi học, giáo trình, học phí, bài tập... UI → Gateway → Kafka topic `class.*`, `lesson.*` → tutor-service → PostgreSQL.",
    thirdDescription:
      "Third / Thông báo: email, thông báo, upload. UI → Gateway → Kafka topic `notification.*`, `upload.*` → third-service → PostgreSQL (notifications) / Cloudflare R2 (uploads) / Redis (redis.get/set/del).",
  },
  requests: {
    heading: "Request FE → Gateway → Kafka → Service",
    hint: "Danh sách các request thực tế UI gửi đi, topic Kafka gateway phân phối, và service đảm nhận xử lý.",
    colMethod: "METHOD",
    colEndpoint: "ENDPOINT (FE)",
    colFlow: "LUỒNG XỬ LÝ",
    empty: "Không có request khớp.",
    unroutedHeading: "Request FE chưa định tuyến qua gateway (legacy)",
    unroutedHint:
      "Các endpoint này tồn tại trong code FE nhưng gateway chưa có controller — chưa trải qua Kafka/service.",
  },
  clientRequests: {
    title: "REQUEST FE →",
    hint: "Các API khởi phát từ UI. Bấm vào một request để highlight luồng đi qua gateway → service.",
    more: "+{n} khác · xem bảng bên dưới",
  },
  serviceTopics: {
    title: "TOPICS →",
    hint: "Topic Kafka service consume — action hiển thị nơi lưu trữ + side-effect phát đi.",
    store: "→",
    emits: "↷",
    inMemory: "in-memory",
    more: "+{n} topics khác · xem bảng bên dưới",
  },
};

const en: FlowRequestDictionary = {
  page: {
    title: "Request Flow Diagram",
    description:
      "The journey of a request from the FE through the API Gateway, published onto Apache Kafka, then fanned out to the backend services (user, tutor, third) over request-reply topics.",
  },
  map: {
    title: "REQUEST FLOW ARCHITECTURE MAP",
    subtitle: "UI → Gateway → Kafka → Service (user · tutor · third)",
  },
  filters: {
    legend: "Flow",
    all: "Full cluster",
    user: "User / Auth",
    tutor: "Tutor / Learning",
    third: "Third / Notification",
    allHint: "Show the whole topology with plain structural connections.",
    userHint: "Highlight the flow to user-service (auth, user, admin, student).",
    tutorHint: "Highlight the flow to tutor-service (tutoring domain).",
    thirdHint: "Highlight the flow to third-service (email, notification, upload).",
  },
  columns: {
    client: "1. CLIENT / UI",
    gateway: "2. GATEWAY / API",
    transport: "3. TRANSPORT",
    service: "4. SERVICES (RPC)",
    data: "5. DATA & INFRA",
  },
  nodes: {
    uiWeb: {
      name: "Web UI",
      kind: "Frontend · Next.js 16",
      description:
        "The user interface — every HTTP request starts here, attaching a JWT Bearer token via the Axios interceptor.",
    },
    apiGateway: {
      name: "API Gateway",
      kind: "API Gateway · NestJS 11",
      description:
        "The only HTTP entry point clients can call — verifies JWT, validates with Zod, then publishes a request-reply topic onto Kafka (KafkaProducer.send).",
    },
    gatewayOauth: {
      name: "OAuth Google / Facebook",
      kind: "Passport strategy",
      description:
        "OAuth strategies live in the gateway — only the final token-issuance step is published over Kafka to the user service.",
    },
    kafka: {
      name: "Apache Kafka",
      kind: "Message Broker · Kafka",
      description:
        "Request/reply transport between the gateway and the services over domain topics — each topic has a matching `.reply` topic for the result.",
    },
    userService: {
      name: "User Service",
      kind: "NestJS microservice",
      description:
        "Identity & admin — auth, user, student. Consumes `auth.*`, `user.*` topics. Owns its own PostgreSQL (users, grades).",
    },
    tutorService: {
      name: "Tutor Service",
      kind: "NestJS microservice",
      description:
        "Tutoring domain — class, schedule, session, curriculum, tuition, exercise, attendance, report, ai-chat (topics `class.*`, `lesson.*`...).",
    },
    thirdService: {
      name: "Third Service",
      kind: "NestJS microservice",
      description:
        "Supporting infrastructure — email, notification, redis, upload (topics `notification.*`, `upload.*`). Notifications go to its own PostgreSQL; uploads go to Cloudflare R2; redis.set/del are fire-and-forget.",
    },
    postgres: {
      name: "PostgreSQL 16",
      kind: "Database · Drizzle ORM",
      description:
        "Core data — the user/tutor services own user & education data; the third service owns the notifications table.",
    },
    redis: {
      name: "Redis 7",
      kind: "Cache",
      description:
        "Cache/session + JWT tokens — redis.get/set/del handled by RedisService (auth sets the session, logout deletes it).",
    },
    cloudflareR2: {
      name: "Cloudflare R2",
      kind: "Object Storage · S3",
      description:
        "S3-compatible object storage — the third service's file uploads (avatars, class materials, exercises) are processed with sharp then pushed to a bucket.",
    },
  },
  metadata: {
    port: "Port",
    topics: "Topics",
    domains: "Domains",
    db: "Database",
    orm: "ORM",
    schema: "Schema",
    validation: "Validation",
    guard: "Guard",
    framework: "Framework",
    http: "HTTP",
    baseUrl: "Base URL",
    flow: "Flow",
    token: "Token",
    transport: "Transport",
    buckets: "Buckets",
  },
  edges: {
    http: "HTTP /api/*",
    produce: "produce()",
    consumeUser: "consume · auth.* user.*",
    consumeTutor: "consume · class.* lesson.*",
    consumeThird: "consume · notification.* upload.*",
    sql: "SQL",
    cache: "CACHE",
    storage: "STORAGE · S3",
  },
  badges: {
    active: "ACTIVE",
    healthy: "HEALTHY",
    secondary: "SECONDARY",
  },
  summary: {
    heading: "FLOW REQUEST",
    stepTitle: "Path",
    detailTitle: "Node detail",
    backToFlow: "View whole flow",
    hint: "Pick a flow with the filter buttons above, or click a node to inspect its connections.",
    allDescription:
      "Full cluster: UI calls the gateway over HTTP, the gateway publishes topics onto Kafka fanning out to the user, tutor and third services. Each service consumes its own topic group and owns its own database/cache; the gateway holds no data and no business logic.",
    userDescription:
      "User / Auth: login, user management, admin, student requests. UI → Gateway → Kafka topic `auth.*` / `user.*` → user-service → PostgreSQL.",
    tutorDescription:
      "Tutor / Learning: class, schedule, session, curriculum, tuition, exercise requests... UI → Gateway → Kafka topics `class.*`, `lesson.*` → tutor-service → PostgreSQL.",
    thirdDescription:
      "Third / Notification: email, notification, upload requests. UI → Gateway → Kafka topics `notification.*`, `upload.*` → third-service → PostgreSQL (notifications) / Cloudflare R2 (uploads) / Redis (redis.get/set/del).",
  },
  requests: {
    heading: "Request FE → Gateway → Kafka → Service",
    hint: "Real requests sent by the UI, the Kafka topics the gateway publishes, and the handling service.",
    colMethod: "METHOD",
    colEndpoint: "ENDPOINT (FE)",
    colFlow: "HANDLING FLOW",
    empty: "No matching requests.",
    unroutedHeading: "FE requests not routed through the gateway (legacy)",
    unroutedHint:
      "Endpoints present in the FE codebase but with no gateway controller yet — no Kafka/service hop.",
  },
  clientRequests: {
    title: "FE REQUESTS →",
    hint: "API calls originating from the UI. Click a request to highlight the path through gateway → service.",
    more: "+{n} more · see table below",
  },
  serviceTopics: {
    title: "TOPICS →",
    hint: "Kafka topics each service consumes — action shows the store target + side-effects emitted.",
    store: "→",
    emits: "↷",
    inMemory: "in-memory",
    more: "+{n} more topics · see table below",
  },
};

export const flowRequestDictionary: Record<Language, FlowRequestDictionary> = {
  vi,
  en,
};