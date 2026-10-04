# Kubernetes Data Flow & Architecture Map --- Color / UI / UX Specification

> **Mục tiêu:** tái tạo visual language của diagram Kubernetes trong ảnh
> tham chiếu: dark technical dashboard, nhiều layer kiến trúc,
> card-based architecture map, màu accent theo trạng thái/flow và đường
> kết nối dạng topology.

------------------------------------------------------------------------

## 1. Design Direction

### Visual keywords

-   **Dark technical dashboard**
-   **Kubernetes / DevOps / observability**
-   **Architecture map**
-   **Card-based information architecture**
-   **High information density nhưng vẫn phân cấp rõ**
-   **Neon accent trên nền navy**
-   **Glow nhẹ cho node đang được highlight**
-   **Dashed flow line để biểu diễn data flow**
-   **Layered columns từ Client → Ingress → Service → Deployment/Pod →
    Config/Secret**

### Overall composition

Diagram nên được chia thành các vertical zones:

``` text
┌──────────────────────────────────────────────────────────────────────────────┐
│ Header / Toolbar / Flow Filters                                               │
├────────────┬──────────────┬──────────────┬────────────────┬──────────────────┤
│ 1. CLIENT  │ 2. INGRESS   │ 3. SERVICES  │ 4. DEPLOYMENT  │ 5. CONFIG/SECRET │
│            │              │              │ / PODS         │                  │
│            │              │              │                │                  │
│   Cards    │    Cards     │    Cards     │     Cards      │      Cards       │
│     ↘      │      ↘       │      ↘       │       ↘        │        ↘         │
└────────────┴──────────────┴──────────────┴────────────────┴──────────────────┘
```

------------------------------------------------------------------------

# 2. Color System

## 2.1 Base colors

  Token               Hex         Usage
  ------------------- ----------- -------------------------------
  `--bg-root`         `#080D1A`   Main canvas/background
  `--bg-deep`         `#0B1120`   Deep background / outer frame
  `--bg-panel`        `#11182A`   Main column/panel
  `--bg-card`         `#171E31`   Default card
  `--bg-card-hover`   `#1D263D`   Hover / active card
  `--bg-card-muted`   `#141A2B`   Secondary/disabled card
  `--border`          `#273149`   Card and panel borders
  `--border-soft`     `#202A40`   Low-contrast separators

### Recommended CSS

``` css
:root {
  --bg-root: #080D1A;
  --bg-deep: #0B1120;
  --bg-panel: #11182A;
  --bg-card: #171E31;
  --bg-card-hover: #1D263D;
  --bg-card-muted: #141A2B;

  --border: #273149;
  --border-soft: #202A40;
}
```

------------------------------------------------------------------------

## 2.2 Text colors

  Token                Hex         Usage
  -------------------- ----------- ----------------------------------
  `--text-primary`     `#F4F7FB`   Main headings
  `--text-secondary`   `#C2C9D6`   Card titles / important metadata
  `--text-muted`       `#8992A5`   Descriptions
  `--text-disabled`    `#596276`   Disabled / inactive content
  `--text-inverse`     `#07101D`   Text on bright accent buttons

Hierarchy:

``` text
Primary      #F4F7FB
Secondary    #C2C9D6
Muted        #8992A5
Disabled     #596276
```

Không nên dùng pure white `#FFFFFF` cho toàn bộ text vì diagram sẽ bị
quá gắt trên nền dark.

------------------------------------------------------------------------

# 3. Accent Color System

Accent colors được dùng để biểu diễn **semantic meaning**, không chỉ để
trang trí.

## 3.1 Blue / Cyan --- Primary Kubernetes / Infrastructure

``` text
Primary Blue:    #2496D2
Bright Blue:     #35B6FF
Cyan:            #63D8E8
```

Use for:

-   Kubernetes
-   Client
-   Infrastructure
-   Main navigation
-   Active tabs
-   Primary CTA
-   Selected architecture layer

Example:

``` css
--accent-blue: #2496D2;
--accent-blue-bright: #35B6FF;
--accent-cyan: #63D8E8;
```

------------------------------------------------------------------------

## 3.2 Green --- Healthy / Routing / Active

``` text
Green:           #67D8B0
Bright Green:    #8BE8C8
```

Use for:

-   Healthy service
-   Successful routing
-   Active ingress
-   Available resource
-   Valid data flow

Visual treatment:

``` css
--accent-green: #67D8B0;
--accent-green-bright: #8BE8C8;
```

Green should normally be used as a **status signal**, not as a generic
decoration.

------------------------------------------------------------------------

## 3.3 Purple --- Question / Application Service

``` text
Purple:          #956BFF
Bright Purple:   #B08BFF
```

Use for:

-   Question Service
-   Application-specific service
-   Selected service
-   Important business-domain node

Example:

``` css
--accent-purple: #956BFF;
--accent-purple-bright: #B08BFF;
```

The reference image uses purple to make `question-service` visually
prominent.

------------------------------------------------------------------------

## 3.4 Red / Coral --- Secret / Sensitive / Warning

``` text
Red:             #FF5F61
Bright Red:      #FF777A
```

Use for:

-   Kubernetes Secret
-   Sensitive configuration
-   Security boundary
-   Error / warning
-   Critical data path

Example:

``` css
--accent-red: #FF5F61;
--accent-red-bright: #FF777A;
```

Do not use red for normal UI elements.

------------------------------------------------------------------------

## 3.5 Yellow --- Security / Secret Metadata

``` text
Yellow:          #F4C95D
```

Use for:

-   Key icon
-   Security metadata
-   Credentials
-   Important warning labels

------------------------------------------------------------------------

# 4. Suggested Semantic Palette

``` text
┌───────────────────────────────────────────┐
│ BLUE      Infrastructure / Kubernetes    │
│ CYAN      Primary technical flow          │
│ GREEN     Healthy / Active               │
│ PURPLE    Business service / Question    │
│ RED       Secret / Critical              │
│ YELLOW    Security / Credential          │
│ GRAY      Secondary / Disabled           │
└───────────────────────────────────────────┘
```

### Semantic mapping

  Meaning                 Color
  ----------------------- --------
  Infrastructure          Blue
  Main flow               Cyan
  Healthy / Active        Green
  Application service     Purple
  Sensitive / Secret      Red
  Credential / Security   Yellow
  Disabled                Gray

------------------------------------------------------------------------

# 5. Typography

## Font family

Recommended:

``` css
font-family:
  Inter,
  ui-sans-serif,
  system-ui,
  -apple-system,
  BlinkMacSystemFont,
  "Segoe UI",
  sans-serif;
```

For a more technical look:

``` css
font-family:
  Inter,
  JetBrains Mono,
  ui-monospace,
  monospace;
```

Use monospace selectively for:

-   Port numbers
-   Environment variables
-   API paths
-   Kubernetes resource names
-   Database names
-   Technical metadata

------------------------------------------------------------------------

## Type scale

  Element                  Size     Weight
  ------------------ ---------- ----------
  Diagram title        18--22px        700
  Column title         13--15px        700
  Card title           13--16px   650--700
  Card description     11--13px   400--500
  Metadata             10--12px   400--500
  Badge                10--11px        600
  Flow label           10--12px        600
  Footer / helper      10--12px        400

The reference visual is information-dense, so avoid oversized
typography.

------------------------------------------------------------------------

# 6. Layout System

## 6.1 Main grid

Recommended:

``` css
.architecture-map {
  display: grid;
  grid-template-columns:
    minmax(180px, 1fr)
    minmax(220px, 1.2fr)
    minmax(220px, 1.2fr)
    minmax(230px, 1.25fr)
    minmax(220px, 1.15fr);

  gap: 14px;
}
```

For desktop architecture diagrams:

-   5 primary columns
-   12--16px column gap
-   16--20px outer padding
-   12--16px card gap

------------------------------------------------------------------------

## 6.2 Column structure

Each column should have:

``` text
Column
 ├── Column heading
 ├── Card
 ├── Card
 ├── Card
 ├── Card
 └── Card
```

Column title example:

``` text
1. CLIENTS / TRUY CẬP
2. INGRESS & ROUTING
3. SERVICES (CLUSTERIP)
4. DEPLOYMENTS & PODS
5. SECRETS & CONFIGMAPS
```

Use uppercase for architecture layer titles.

------------------------------------------------------------------------

# 7. Panel / Column UI

## Column container

``` css
.architecture-column {
  background: rgba(17, 24, 42, 0.82);
  border: 1px solid #202A40;
  border-radius: 12px;
  padding: 12px;
}
```

Visual properties:

-   Dark navy background
-   Thin border
-   10--14px radius
-   Very subtle shadow
-   No heavy gradients
-   Slight transparency is acceptable

------------------------------------------------------------------------

# 8. Card UI

## Default card

``` css
.arch-card {
  background: #171E31;
  border: 1px solid #273149;
  border-radius: 10px;
  padding: 12px;
  color: #F4F7FB;
}
```

### Card anatomy

``` text
┌─────────────────────────────────────┐
│  ICON   Service Name                │
│         Type: ClusterIP             │
│         Port: 4002                  │
│                                     │
│  Short description / metadata       │
└─────────────────────────────────────┘
```

Recommended spacing:

``` text
Card padding:       12px
Icon → title:        8px
Title → metadata:    5px
Metadata lines:      3–5px
Cards vertical gap:  10–12px
```

------------------------------------------------------------------------

# 9. Card States

## Default

``` text
background: #171E31
border:     #273149
text:       #C2C9D6
```

## Hover

``` text
background: #1D263D
border:     #3B4968
```

Optional:

``` css
box-shadow: 0 0 18px rgba(53, 182, 255, 0.08);
```

## Selected

Use accent border + subtle glow.

Example for Question Service:

``` css
border-color: #956BFF;

box-shadow:
  0 0 0 1px rgba(149, 107, 255, 0.15),
  0 0 24px rgba(149, 107, 255, 0.16);
```

## Disabled

``` css
opacity: 0.42;
filter: saturate(0.55);
```

Disabled cards should remain readable but clearly secondary.

------------------------------------------------------------------------

# 10. Highlight / Glow System

The reference diagram uses glow to direct attention.

Use **small, localized glow** rather than large neon effects.

### Blue glow

``` css
box-shadow:
  0 0 18px rgba(53, 182, 255, 0.18);
```

### Green glow

``` css
box-shadow:
  0 0 18px rgba(103, 216, 176, 0.18);
```

### Purple glow

``` css
box-shadow:
  0 0 20px rgba(149, 107, 255, 0.20);
```

### Red glow

``` css
box-shadow:
  0 0 22px rgba(255, 95, 97, 0.20);
```

### Rule

> Glow = focus / importance.\
> Không dùng glow cho tất cả card.

------------------------------------------------------------------------

# 11. Header / Toolbar UI

Header nên giống một **control bar** của technical dashboard.

``` text
┌────────────────────────────────────────────────────────────────────────────┐
│ Kubernetes Data Flow & Architecture Map          [All] [Auth] [Question] │
└────────────────────────────────────────────────────────────────────────────┘
```

## Header background

``` css
background: #0B1120;
border-bottom: 1px solid #202A40;
```

## Header title

-   18--22px
-   Bold
-   White
-   Kubernetes icon / technical icon ở bên trái

## Flow filter buttons

Default:

``` css
background: #141C30;
border: 1px solid #29344D;
color: #9DA7BA;
```

Active:

``` css
background: rgba(36, 150, 210, 0.18);
border-color: #2496D2;
color: #63D8E8;
```

------------------------------------------------------------------------

# 12. Toolbar Controls

Các control trong ảnh:

``` text
[☀ Giao diện Sáng]
[+ Phóng to]
[124%]
[- Thu nhỏ]
[↙ Căn vừa]
[△ Tải SVG]
[▣ Xuất PDF A1]
```

### Button hierarchy

**Primary**

``` text
Xuất PDF A1
```

Use bright blue background.

**Secondary**

``` text
Tải SVG
Căn vừa
Phóng to
Thu nhỏ
```

Use dark panel + border.

**State**

``` text
124%
```

Can use a compact badge / value display.

------------------------------------------------------------------------

# 13. Flow / Connection Lines

Đây là một trong những thành phần quan trọng nhất của diagram.

## Normal connection

``` css
stroke: #43516B;
stroke-width: 1.2px;
opacity: 0.45;
```

Use for structural relationships.

------------------------------------------------------------------------

## Active flow

Reference image uses **red/pink dashed lines** to show an active data
flow.

``` css
stroke: #FF626A;
stroke-width: 2px;
stroke-dasharray: 8 7;
```

Optional animation:

``` css
animation: flowDash 1.2s linear infinite;
```

``` css
@keyframes flowDash {
  to {
    stroke-dashoffset: -30;
  }
}
```

------------------------------------------------------------------------

## Semantic flow colors

  Flow                    Color
  ----------------------- -----------
  Normal infrastructure   `#43516B`
  Primary                 `#35B6FF`
  Success                 `#67D8B0`
  Question                `#956BFF`
  Critical / selected     `#FF626A`

------------------------------------------------------------------------

# 14. Flow Direction

Connections should communicate direction clearly.

Recommended:

``` text
Client
  ↓
Ingress
  ↓
Service
  ↓
Deployment
  ↓
Pod
  ↓
Database / Secret
```

Use:

-   Arrowhead
-   Dashed line for active flow
-   Solid line for structural relationship
-   Small label near the path when necessary

Avoid crossing too many lines.

------------------------------------------------------------------------

# 15. Bottom Flow Summary Panel

The reference image has a bottom-left contextual panel.

Recommended UI:

``` text
┌──────────────────────────────────────────────────────────────┐
│ QUESTION FLOW                                                │
│                                                              │
│ Luồng Quản lý & Lọc câu hỏi (Question Service)               │
│ Client gọi GET /api/questions → Ingress → Question Service  │
│ → Prisma → MySQL → JSON → Client                            │
└──────────────────────────────────────────────────────────────┘
```

### Style

``` css
background: rgba(9, 16, 30, 0.94);
border: 1px solid #293650;
border-radius: 10px;
```

Use a colored badge:

``` text
[QUESTION FLOW]
```

Badge:

``` css
background: #1D4ED8;
color: #E8F4FF;
```

------------------------------------------------------------------------

# 16. Badges

Badges should be compact and semantic.

Example:

``` text
[QUESTION FLOW]
[ACTIVE]
[HEALTHY]
[2 PODS]
[CLUSTERIP]
[SECRET]
```

Recommended:

``` css
.badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 7px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 600;
}
```

Avoid excessive pill usage. Use badges only when they add semantic
value.

------------------------------------------------------------------------

# 17. Icons

Icon style should be:

-   Simple
-   Flat
-   Monochrome or semantic accent
-   14--18px
-   Consistent stroke width

Suggested icon mapping:

  Object       Icon
  ------------ -------------------
  Kubernetes   Kubernetes logo
  Web          Monitor
  Mobile       Smartphone
  Ingress      Route / GitBranch
  Service      Network
  Deployment   Boxes
  Pod          Container
  Secret       Key
  ConfigMap    FileCode
  Database     Database
  Metrics      Activity
  Security     Shield
  Port         Plug
  Flow         ArrowRight

Avoid large decorative icons.

------------------------------------------------------------------------

# 18. Disabled / Secondary Architecture Nodes

Một số node trong ảnh bị làm mờ để tập trung vào `question-service`.

Recommended:

``` css
.secondary-node {
  opacity: 0.45;
  filter: saturate(0.5);
}
```

Important:

> Không xóa node không liên quan.\
> Làm mờ node giúp người xem vẫn hiểu topology tổng thể.

This is especially useful when showing:

-   Auth Service
-   Exam Service
-   Support Service
-   Grafana
-   Mobile
-   Admin Dashboard

while one flow is selected.

------------------------------------------------------------------------

# 19. Focus Mode / Flow Filtering

UX nên hỗ trợ các filter:

``` text
● Toàn bộ cụm
🔐 Luồng Đăng nhập (Auth)
❓ Luồng Câu hỏi (Question)
📝 Luồng Phòng thi (Exam)
```

### When selecting a flow

1.  Highlight relevant nodes.
2.  Highlight relevant connections.
3.  Dim unrelated nodes.
4.  Keep column structure unchanged.
5.  Update bottom flow summary.
6.  Preserve zoom/pan position if possible.

Example:

``` text
Selected:
    question-service
    mysql-service
    mysql-deployment
    question-service deployment

Dim:
    auth-service
    exam-service
    support-service
    grafana-service
```

------------------------------------------------------------------------

# 20. UX Interaction Model

## Hover

Hovering a node should:

-   Increase border contrast
-   Show subtle glow
-   Highlight connected lines
-   Optionally dim unrelated connections

Do not cause large movement.

------------------------------------------------------------------------

## Click

Clicking a node should:

``` text
Node selected
    ↓
Connected nodes highlighted
    ↓
Connected edges highlighted
    ↓
Detail panel updated
```

Possible detail panel:

``` text
Question Service

Type
ClusterIP

Port
4002

Selector
app=question-service

Pods
2

Database
MySQL

ORM
Prisma
```

------------------------------------------------------------------------

## Double click

Optional:

-   Zoom into node
-   Open detailed resource view

Avoid making double click mandatory for core actions.

------------------------------------------------------------------------

## Pan

Canvas should support:

``` text
Mouse drag       → Pan
Mouse wheel      → Zoom
Pinch            → Zoom
Space + drag     → Pan
```

------------------------------------------------------------------------

# 21. Zoom UX

Recommended zoom range:

``` text
25% ───────── 100% ───────── 200%
```

Default:

``` text
100% – 125%
```

Controls:

``` text
[-]  124%  [+]
[Fit]
```

`Fit` should fit the complete architecture into the available viewport.

------------------------------------------------------------------------

# 22. Accessibility

Dark diagram vẫn cần đảm bảo readability.

### Requirements

-   Primary text: strong contrast against background
-   Never communicate state using color alone
-   Add icon / label for status
-   Focus state must have visible border
-   Interactive nodes need keyboard focus
-   Tooltip should explain unfamiliar icons

Example:

``` text
🔴 SECRET
```

rather than only:

``` text
[red card]
```

------------------------------------------------------------------------

# 23. Responsive UX

## Desktop

Use full 5-column architecture.

``` text
Client | Ingress | Service | Deployment | Config
```

## Tablet

Allow horizontal scrolling:

``` text
← Client | Ingress | Service | Deployment | Config →
```

Do not collapse the architecture into a single vertical list because
relationships become difficult to understand.

## Mobile

Use:

``` text
Canvas + horizontal pan + zoom
```

or:

``` text
Layer selector
[Clients]
[Ingress]
[Services]
[Deployments]
[Secrets]
```

------------------------------------------------------------------------

# 24. Background Effects

The reference image has a very subtle technical background.

Recommended:

``` css
background:
  radial-gradient(
    circle at 50% 20%,
    rgba(37, 90, 150, 0.10),
    transparent 45%
  ),
  #080D1A;
```

Optional grid:

``` css
background-image:
  linear-gradient(rgba(255,255,255,.018) 1px, transparent 1px),
  linear-gradient(90deg, rgba(255,255,255,.018) 1px, transparent 1px);
background-size: 24px 24px;
```

Grid opacity should remain very low.

------------------------------------------------------------------------

# 25. Shadows

Use shadows sparingly.

### Card

``` css
box-shadow:
  0 8px 24px rgba(0, 0, 0, 0.18);
```

### Floating panel

``` css
box-shadow:
  0 16px 40px rgba(0, 0, 0, 0.30);
```

### Focused node

Use accent glow + normal shadow.

Avoid:

``` css
box-shadow: 0 0 50px ...
```

for every element.

------------------------------------------------------------------------

# 26. Border Radius

Recommended:

  Element            Radius
  -------------- ----------
  Main panel       12--14px
  Card              9--10px
  Button             7--9px
  Badge               999px
  Flow summary     10--12px

The diagram should feel modern but still technical.

------------------------------------------------------------------------

# 27. Spacing Scale

Use a consistent 4px-based spacing system.

``` text
4px   xs
8px   sm
12px  md
16px  lg
20px  xl
24px  2xl
32px  3xl
```

Recommended diagram values:

``` text
Column gap:       12–16px
Card gap:         10–12px
Panel padding:    12–16px
Header padding:   12–20px
Canvas padding:   16–24px
```

------------------------------------------------------------------------

# 28. Visual Priority Rules

Priority order:

``` text
1. Active flow
2. Selected service / resource
3. Main architecture structure
4. Important metadata
5. Secondary nodes
6. Decorative/background elements
```

This prevents the diagram from becoming visually noisy.

------------------------------------------------------------------------

# 29. Recommended Component Structure

For React / Next.js implementation:

``` text
ArchitectureMap
├── MapHeader
│   ├── Brand
│   ├── FlowFilters
│   └── MapActions
│
├── ArchitectureCanvas
│   ├── ArchitectureColumn
│   │   ├── ColumnHeader
│   │   └── ResourceCard
│   │
│   ├── FlowEdges
│   └── FlowLabels
│
├── FlowSummary
│
└── MapControls
    ├── ZoomOut
    ├── ZoomLevel
    ├── ZoomIn
    ├── Fit
    ├── ExportSVG
    └── ExportPDF
```

------------------------------------------------------------------------

# 30. Recommended Data Model

UI nên render từ data thay vì hard-code.

``` ts
type ResourceNode = {
  id: string;
  layer:
    | "client"
    | "ingress"
    | "service"
    | "deployment"
    | "config";

  name: string;
  type?: string;
  port?: number;
  description?: string;

  status?: "active" | "healthy" | "warning" | "disabled";
  accent?: "blue" | "cyan" | "green" | "purple" | "red" | "yellow";

  metadata?: Record<string, string>;
};

type FlowEdge = {
  id: string;
  source: string;
  target: string;

  active?: boolean;
  color?: "blue" | "cyan" | "green" | "purple" | "red";
  dashed?: boolean;
};

type ArchitectureFlow = {
  id: string;
  label: string;
  nodeIds: string[];
  edgeIds: string[];
  description: string;
};
```

------------------------------------------------------------------------

# 31. Example Theme Tokens

``` css
:root {
  /* Background */
  --color-bg-root: #080D1A;
  --color-bg-deep: #0B1120;
  --color-bg-panel: #11182A;
  --color-bg-card: #171E31;
  --color-bg-card-hover: #1D263D;

  /* Border */
  --color-border: #273149;
  --color-border-soft: #202A40;

  /* Text */
  --color-text-primary: #F4F7FB;
  --color-text-secondary: #C2C9D6;
  --color-text-muted: #8992A5;
  --color-text-disabled: #596276;

  /* Accent */
  --color-blue: #2496D2;
  --color-cyan: #63D8E8;
  --color-green: #67D8B0;
  --color-purple: #956BFF;
  --color-red: #FF5F61;
  --color-yellow: #F4C95D;

  /* Flow */
  --color-flow-default: #43516B;
  --color-flow-active: #FF626A;

  /* Radius */
  --radius-panel: 12px;
  --radius-card: 10px;
  --radius-button: 8px;
  --radius-pill: 999px;

  /* Spacing */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
}
```

------------------------------------------------------------------------

# 32. Design Rules --- Do / Don't

## Do

-   Dùng dark navy làm nền chính.
-   Dùng accent color theo semantic meaning.
-   Highlight flow bằng dashed line.
-   Dùng glow nhẹ cho node đang focus.
-   Giữ node không liên quan nhưng giảm opacity.
-   Dùng typography compact.
-   Dùng monospace cho technical metadata.
-   Giữ topology và relationship là visual priority.
-   Cho phép pan / zoom / fit.
-   Có flow filter để giảm cognitive load.

## Don't

-   Không dùng gradient quá mạnh.
-   Không dùng neon glow cho mọi card.
-   Không dùng quá nhiều màu cho cùng một semantic.
-   Không biến mọi node thành active.
-   Không làm chữ quá lớn.
-   Không đặt quá nhiều thông tin vào một card.
-   Không dùng màu đỏ cho trạng thái bình thường.
-   Không để connection line che nội dung.
-   Không thay đổi layout mạnh khi user chọn flow.
-   Không phụ thuộc hoàn toàn vào màu để biểu diễn trạng thái.

------------------------------------------------------------------------

# 33. Target Visual Result

Mục tiêu cuối cùng:

``` text
                    KUBERNETES ARCHITECTURE MAP
 ┌─────────────────────────────────────────────────────────────────────────┐
 │  Dark Navy Canvas                                                       │
 │                                                                         │
 │  ┌────────┐   ┌────────┐   ┌────────┐   ┌────────┐   ┌────────┐       │
 │  │ CLIENT │ → │INGRESS │ → │SERVICE │ → │  POD   │ → │ SECRET │       │
 │  │        │   │        │   │        │   │        │   │        │       │
 │  │  Blue  │   │ Green  │   │ Purple │   │ Cyan   │   │  Red   │       │
 │  └────────┘   └────────┘   └────────┘   └────────┘   └────────┘       │
 │       ╲            ╲            ╲            ╲            ╱             │
 │        ╲___________ Active dashed flow / glow __________╱              │
 │                                                                         │
 │  [ QUESTION FLOW ]                                                      │
 │  Client → Ingress → Question Service → MySQL → JSON → Client           │
 └─────────────────────────────────────────────────────────────────────────┘
```

**Core visual principle:** nền tối + information hierarchy rõ + accent
semantic + topology là trung tâm + glow chỉ dùng để focus.
