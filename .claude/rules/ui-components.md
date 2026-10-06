# Rule: UI components & style (FE)

- **Bắt buộc đọc file nguồn trước khi dùng**: trước khi tạo/sửa file dùng bất kỳ primitive nào từ
  `components/ui/*`, phải `Read` trực tiếp file `.ui.tsx` định nghĩa nó để lấy đúng props/API hiện
  tại — **không** suy đoán hay chỉ tin vào mô tả/ví dụ liệt kê trong rule này (rule có thể lỗi thời so
  với code). Props hay đổi mà không cập nhật rule kịp: `Checkbox` (`checkbox.ui.tsx`) dựng trên Radix
  `Checkbox`, dùng `checked`/`onCheckedChange` chứ không phải `<input>` gốc + `onChange`;
  `MenuPopover` (`menu-popover.ui.tsx`) render nội dung qua portal. Khi rule và code đang đọc mâu
  thuẫn nhau, **code là nguồn đúng** — sửa lại rule cho khớp thay vì lấy mô tả cũ trong rule làm chuẩn.
- Dùng primitives trong `components/ui/*` (shadcn/ui). Class điều kiện qua `cn()` (`@/lib/utils`,
  clsx + tailwind-merge). Dark mode theo chiến lược class (`html.dark`). Button dùng CVA (`variant`,
  `size`, `loading`, `asChild`).
- **Không dùng thẻ HTML thô** cho các control đã có primitive tương ứng:
  - `<button>` → `Button` (`@/components/ui/button.ui`) —包括所有 button: action, tab, trigger.
    Dùng `variant`, `size`, `loading`, `asChild` thay vì className thủ công.
  - `<input>` → `Input` (`@/components/ui/input.ui`, props `invalid`/`outlinedSlot`) — bao gồm
    search, text, password, number. Wrap trong `div.relative` nếu cần icon prefix (Search, Mail...).
  - `<label>` → `Label` (`@/components/ui/label.ui`, Radix LabelPrimitive) — cho tất cả label trong
    form, filter dialog, field group. Không dùng `<label>` thô.
  - `<select>` → `Select` (`@/components/ui/select.ui`, custom dropdown — API `options: {label,
    value}[]`, `value`, `onValueChange`, `placeholder?`, `invalid?`, không phải wrapper của thẻ
    `<select>` gốc)
  - `<table>/<thead>/<tbody>/<tr>/<th>/<td>` → dùng Table primitives
    (`@/components/ui/table.ui`): `Table` (wrapper có overflow-x-auto), `TableHeader`,
    `TableBody`, `TableRow`, `TableHead`, `TableCell`. Không viết `<table>` thô — kể cả khi chỉ
    cần bảng đơn giản. `TableHead` có `text-muted-foreground` và `h-10` mặc định; `TableCell` có
    `p-2` mặc định — override qua `className` + `cn()` khi cần. Xem `app/(app)/students/page.tsx`
    làm mẫu: bảng dùng `Table`/`TableHeader`/`TableBody`/`TableRow`/`TableHead`/`TableCell`,
    empty/loading/error state cũng là `TableRow` + `TableCell` có `colSpan`. Nếu bảng phức tạp
    hơn (column definition dạng config, auto colSpan cho empty/loading/error) → dùng `DataTable`
    (`@/components/ui/data-table.ui`) — xem mục DataTable bên dưới.
  - `<input type="checkbox">` → `Checkbox` (`@/components/ui/checkbox.ui` — dựng trên Radix
    `Checkbox` (`radix-ui` package, cùng nguồn với `label.ui.tsx`/`separator.ui.tsx`/`button.ui.tsx`),
    **không** phải wrapper `<input>` gốc nên style width/border-radius/checked-state tuỳ biến hoàn
    toàn qua `className` thay vì phụ thuộc appearance mặc định của trình duyệt. Props theo Radix:
    `checked` (`boolean | "indeterminate"`), `onCheckedChange: (checked: CheckedState) => void`
    (**không** phải `onChange`/`e.target.checked`), `aria-label`, `disabled` (hỗ trợ trên primitive
    nhưng hiện chưa có ví dụ dùng trong repo) — xem `components/classes/class-detail-page.tsx`
    (select-all + select-row trong bảng session) và `components/classes/session-detail-page.tsx`
    (checkbox điểm danh — cố tình **không** disable dù buổi học COMPLETED, xem
    `components/classes/session-detail-page.tsx` phần điểm danh) làm mẫu cho `checked`/
    `onCheckedChange`/`aria-label`
  - `<textarea>` → **chưa có primitive** (`components/ui/` không có `textarea.ui.tsx`) — cứ dùng
    `<textarea>` thô, style tay theo phong cách xung quanh (xem `components/classes/create-class-modal.tsx`,
    `components/classes/edit-class-dialog.tsx`) cho tới khi có primitive
  - dialog/modal → `Dialog` (`@/components/ui/dialog-form.ui`, overlay + card cố định header/footer,
    render qua portal, không đóng khi click backdrop/Escape) và `ConfirmDialog`
    (`@/components/ui/confirm-dialog.ui`, dựng trên `Dialog`) cho popup xác nhận/xoá dùng chung
  - menu/dropdown hành động (icon trigger + danh sách lựa chọn, vd action-menu trên 1 dòng bảng) →
    `MenuPopover` (`@/components/ui/menu-popover.ui`, default export) — props `trigger: ReactNode`,
    `children`, `align?: "start" | "end"` (mặc định `"end"`, neo cạnh phải content vào cạnh phải
    trigger — với trigger chiếm full-width một container hẹp, vd card user ở chân sidebar, `"end"` có
    thể đẩy content (rộng tối thiểu `min-w-[200px]`) tràn qua mép trái viewport; đổi sang `"start"` để
    neo cạnh trái content vào cạnh trái trigger thay vì đoán/vá bằng `contentClassName`),
    `side?: "top" | "bottom"` (mặc định `"bottom"`, mở xuống; đổi `"top"` khi trigger nằm sát đáy
    viewport/container cuộn — vd user menu chân sidebar — để content mở lên thay vì tràn xuống dưới
    màn hình), `open?`/`onOpenChange?` (chế độ controlled — cần khi muốn tự đóng menu ngay sau khi
    chọn 1 item, vd component `SessionStatusMenu` trong `components/classes/class-detail-page.tsx`
    giữ `useState` cục bộ, gọi `setOpen(false)` trong `onClick` mỗi item). Nội dung menu render qua
    portal (`document.body`, `position: fixed` tính từ `getBoundingClientRect()` của trigger lúc mở,
    tự đóng khi cuộn/resize) nên không bị cha có `overflow-x-auto`/`overflow-hidden` (vd bảng cuộn
    ngang) cắt hay che mất — đừng quay lại cách render tại-chỗ (`absolute` bên trong DOM cha). Vị trí
    tính hoàn toàn qua inline `style` (`top`/`bottom`/`left`/`right` theo `align`/`side`) nên
    `contentClassName` **không** dùng để dời vị trí được (vd từng có `contentClassName="bottom-full
    mb-2"` ở `components/layout/app-sidebar.tsx` định mở content lên trên — vô tác dụng vì `top` inline
    vẫn ghi đè — đã sửa đúng bằng prop `side="top"` thật) — chỉ dùng `contentClassName` cho
    width/màu/spacing bên trong, đổi vị trí neo thì dùng `align`/`side`. Trigger dùng `Button
    variant="ghost" size="icon-xs"` với icon (vd `MoreVertical` từ `lucide-react`) thay vì `<button>`
    thô; mỗi item trong menu cũng là `Button variant="ghost"` override qua `className` (`h-auto!
    w-full! justify-start! gap-2! px-2! py-1.5!`) chứ không phải `<button>` thô — xem
    `SessionStatusMenu` làm mẫu đầy đủ.
  - popup bộ lọc (nút "Bộ lọc" trên trang list mở panel nhiều field lọc — class/gender/status...) →
    **chưa có primitive riêng cho panel neo theo trigger**; hai cách dùng tuỳ mức độ "chắc chắn" muốn
    khi đóng popup:
    - Panel neo nhẹ, tự đóng khi click ra ngoài/Escape → tái dùng `MenuPopover` làm container (cùng
      lý do portal như mục trên: không bị bảng `overflow-x-auto` cắt) — đựng các `Select` bên trong +
      1 nút "Đặt lại bộ lọc"; mỗi `Select` `onValueChange` áp dụng filter ngay (không cần nút "Áp
      dụng" riêng).
    - Modal tập trung giữa màn hình, chỉ đóng khi bấm nút rõ ràng (không đóng khi click backdrop/
      Escape) → dùng `Dialog` (`@/components/ui/dialog-form.ui`, xem mục dialog/modal phía trên).
      Trigger là `Button variant="outline"` gọi `setFilterOpen(true)` (không còn bọc trong
      `MenuPopover`). Các `Select` + nút "Đặt lại bộ lọc" đặt trong `children` (body) — `Dialog` bắt
      buộc `cancelText`/`submitText` cho footer 2 nút cố định, nên cần thêm key riêng (vd
      `filterPopup.applyButton`) vào dictionary; `onCancel`/`onSubmit` đều chỉ đóng dialog
      (`setFilterOpen(false)`) vì filter đã áp dụng ngay qua `Select` `onValueChange` — submit không
      làm gì thêm ngoài đóng, đây là lựa chọn có chủ đích (không phải thiếu sót).
    Badge số filter đang bật hiển thị trên trigger ở cả 2 cách. Xem `app/(app)/students/page.tsx`
    (nút "Bộ lọc" — lọc lớp/giới tính/trạng thái) làm mẫu cho cách **Dialog** (đã đổi từ
    `MenuPopover` sang `Dialog` theo yêu cầu sản phẩm); filter dialog dùng `Label` + `Select` +
    `Button` — không dùng thẻ HTML thô. Hiện repo **chưa có** ví dụ filter panel kiểu
    `MenuPopover` nào còn dùng đúng use-case này (`MenuPopover` trong
    `components/classes/class-detail-page.tsx` là action-menu, không phải filter panel) — chọn
    `MenuPopover` cho case filter mới thì tự áp cấu trúc mô tả ở trên, không có file mẫu để soi.
  - bảng dữ liệu → xem mục **DataTable** bên dưới

  Muốn giữ style cũ (màu hex, kích thước tuỳ biến) thì override qua `className` với `cn()`, dùng hậu
  tố `!` (Tailwind important) để đè class mặc định của primitive (vd `w-auto!`, `h-9!`) — xem
  `components/tutors/tutors-page.tsx`, `components/users/users-page.tsx` làm mẫu.
- **Bảng dữ liệu (list/table page)**: ưu tiên `DataTable` (`@/components/ui/data-table.ui`) — API
  dạng `<DataTable data={items} columns={columns} rowKey={...} isLoading={...} isError={...}
  errorMessage={...} emptyMessage={...} />`. Mỗi `column` là object `{ key, header, render(row,
  index), headerClassName?, cellClassName?, width? }`; `width?: string | number` (vd `"120px"`,
  `"10%"`) set cố định độ rộng cột qua `<colgroup>` do `DataTable` tự render (chỉ render khi có ít
  nhất 1 column khai `width`) — dùng khi cần cột co giãn khớp header/body chính xác (vd cột action)
  thay vì chỉnh qua `headerClassName`/`cellClassName` (Tailwind `w-*`) vốn không đảm bảo header và
  cell cùng độ rộng nếu nội dung 2 bên khác nhau. Chiều cao header cố định `h-10` ở
  `TableHead` (`table.ui.tsx`) nhưng `DataTable` tự override về `h-auto` cho row header — không đổi
  lại thành `h-10` trừ khi có yêu cầu rõ. `DataTable` tự lo state rỗng/loading/lỗi (colspan tự tính
  theo số cột) — không tự viết `<table>/<thead>/<tbody>/<tr>` thô hay lặp lại 3 nhánh rỗng/loading/lỗi
  trong từng page. Xem `components/users/users-page.tsx` làm mẫu (DataTable + Pagination). Chỉ rơi
  xuống primitive cấp thấp `Table`/`TableHeader`/`TableBody`/`TableRow`/`TableHead`/`TableCell`
  (`@/components/ui/table.ui`, mà `DataTable` dựng bên trên) khi bố cục bảng không khớp mô hình cột
  đơn giản (vd bảng có legend/footer tuỳ biến như `components/classes/classes-page.tsx`) hoặc khi
  cần tuỳ chỉnh từng cell markup nhiều (vd avatar + link + badge trong cùng cell như
  `app/(app)/students/page.tsx`). Khi dùng Table primitives, empty/loading/error cũng phải dùng
  `TableRow` + `TableCell` (không dùng `<tr>/<td>` thô).
- **Bảng có phân trang**: dùng `Pagination` (`@/components/ui/pagination.ui`) thay vì tự viết nút
  Prev/Next/số trang bằng `<button>` thô — nhận `page`, `totalPages`, `onPageChange`.
- **UsageGuides** (`@/components/ui/usage-guide.ui`): card "Hướng dẫn sử dụng" — mọi trang list/table
  render nó làm phần tử **cuối cùng** trong container gốc của page. Props `{ title?, steps:
  {n,title,body}[], warning?: ReactNode }` — mỗi page tự khai `const USAGE_GUIDE_STEPS`/`_WARNING`
  (4 step, JSX ngắn, `<span className="font-semibold text-[#hex]">` để nhấn từ khoá) khớp tính năng
  thật của page đó, không copy nội dung từ page khác. Tự đọc/dispatch state ẩn/hiện qua Zustand
  (`useGlobalStore` — `usageGuideState` + `toggleUsageGuide`, persisted) — page không cần quản lý
  visibility, cứ render `<UsageGuides .../>` không điều kiện. Component tự `fixed` ở đáy `<main>`
  (`app/(app)/root.layout.tsx` đặt `transform-gpu` trên `<main>` để làm containing block cho
  `position: fixed` con cháu, giới hạn nó trong vùng `main` thay vì full viewport) — đè lên nội dung,
  không đẩy layout của page, không phụ thuộc padding/margin của container gốc từng page. Chỉ 4 step
  bị ẩn khi bấm nút toggle (icon `ChevronUp`/`ChevronDown`); phần `warning` luôn hiển thị. Xem
  `app/(app)/notifications/page.tsx` làm mẫu đầy đủ nhất.
- **Style**: Tailwind v4. Một PostToolUse hook chạy `eslint --fix` best-effort trên file vừa sửa — cứ
  bám phong cách xung quanh, để hook chuẩn hoá.
- **`SectionCard`/`Panel` (khung card có header icon+title cho trang "watch"/detail) không phải
  export từ `components/sessions/session-shared.tsx`** — dù trông giống các helper dùng chung khác
  trong file đó (`DownloadFileRow`, `StatusBadge`, `fmtDate`...). Đây là component **khai báo local,
  lặp lại** ở từng file dùng nó, dưới 2 tên khác nhau tuỳ file (không có ý nghĩa khác biệt, thuần do
  copy độc lập): tên `SectionCard` ở `components/sessions/student-session-detail.tsx`,
  `components/classes/page/class-detail-watch-page.tsx`,
  `components/classes/page/session-detail-watch-page.tsx`; tên `Panel` ở
  `components/sessions/session-detail-view.tsx` và `components/classes/page/exercise-submit-page.tsx`
  (đổi từ `SectionCard` sang `Panel` khi trang này được viết lại theo đúng layout "watch" của
  `session-detail-view.tsx` — hero gradient + `Mục tiêu buổi học`/`Nội dung buổi học`/sidebar). File
  mới cần khung card kiểu này thì copy đúng định nghĩa (props `title`, `icon?: React.ElementType`,
  `action?`, `children` — `icon` là optional ở bản `Panel` vì 3 card sidebar trong
  `session-detail-view.tsx`/`exercise-submit-page.tsx` không có icon tiêu đề) từ 1 trong các file
  trên vào file mới — **không** import từ `session-shared` (sẽ vỡ build, TS2305 — đã xảy ra thật ở
  `session-detail-watch-page.tsx`). Đây là nợ kỹ thuật có sẵn (chưa gom vào `session-shared` hay
  `components/ui/*`), không phải mẫu để nhân rộng thêm nếu có dịp dọn lại.
- **`components/curriculum/file-row.tsx` (`FileRow`, tài liệu lý thuyết/bài tập trong 1 bài học)
  khác hành vi với `DownloadFileRow` (`components/sessions/session-shared.tsx`, tài liệu buổi học)**
  dù trông giống nhau: click vào tên file/badge mã trong `FileRow` **không** làm gì với file
  text/code (trừ ảnh vẫn mở `ImagePreview` khi click) — tải xuống chỉ qua icon `Download` tách
  riêng cạnh nút xoá. Đây là yêu cầu sản phẩm cố ý cho riêng `FileRow`, **không** đồng bộ ngược lại
  `DownloadFileRow` (vẫn giữ click-cả-hàng-để-tải cho file non-image) trừ khi được yêu cầu rõ — hai
  component độc lập, không dùng chung, nên không cần nhất quán hành vi.
- **Tách file list và dialog/modal trong feature folder**: component feature trong `components/{name}/`
  phải tách thành nhiều file theo trách nhiệm:
  - `{name}-list.tsx` — component list/table + toolbar (search, filter tabs, pagination). Page
    `app/(app)/{name}/page.tsx` import và render nó. Component list chứa state search/filter/pagination,
    fetch data, render toolbar + table + pagination.
  - `{name}-dialog.tsx` hoặc `{name}-modal.tsx` — dialog thêm/sửa/xoá (Add/Edit/Delete). Mỗi dialog
    là component riêng, nhận props `open`/`onClose`/`onSaved` (hoặc `onAdd`/`onConfirm`). Không nhồi
    dialog logic vào file list.
  - File `{name}-data.ts` (tuỳ chọn) — hằng số domain không phải text hiển thị (enum, màu, mapping).
    Không đặt copy/text hiển thị vào file này (xem [[i18n-copy]]).
  - Barrel `{name}/index.ts` (tuỳ chọn) — re-export các component nếu cần import tập trung; **không**
    tạo barrel根 `@/components` (xem [[structure-naming]]).
  - Xem `components/students/` (add/edit/delete dialog tách riêng) và `components/users/`
    (users-page.tsx + create/edit/delete dialog + role-options.ts) làm mẫu.
- **`RequestDetailDialog` (`components/logger/request-detail-dialog.tsx`) dùng chung logger và
  test-monitor**: prop `variant?: "full" | "services"` — mặc định `"full"` (trang logger: span chọn
  + waterfall + summary + Processing + mũi tên prev/next); `"services"` (trang `/test-monitor`:
  panel Request/Response cho **từng** service, ẩn Processing/prev-next, nút luôn là "Chạy realtime").
  Sửa dialog này phải giữ nguyên hành vi `"full"` cho logger. Trang `/test-monitor` chỉ hiển thị
  field mà `/test-scenarios` + `/logs/stats` thật sự trả (không có env, chuỗi service đầy đủ, header
  request/response) — đừng bịa field khi UI mẫu có mà BE chưa có nguồn.
