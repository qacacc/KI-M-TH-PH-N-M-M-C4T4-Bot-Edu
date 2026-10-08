# CA-032 - Sidebar rail polish va tooltip

## Trang thai

- Status: Done
- Owner: AI + User review
- Created: 2026-07-22
- Completed: 2026-07-22

## Muc tieu duy nhat

Lam sidebar rail collapsed de doc hon: icon can giua on dinh, co tooltip khi hover tung icon, va khong lam content chinh bi lech.

## Ly do

Sidebar da la hover rail, nhung can them polish de giong hanh vi app chat hien dai hon va tranh user mat ngu canh khi rail dang gon.

## Duoc phep lam

- Sua markup nho trong sidebar neu can tooltip.
- Them CSS tooltip/rail state.
- Kiem tra active/focus/hover state.
- Them aria-label/title neu phu hop.

## Khong duoc lam

- Khong doi routing/view.
- Khong doi layout grid chinh neu khong co bug ro.
- Khong sua Appearance Studio.
- Khong them dependency.
- Khong doi command/backend.

## File duoc phep sua

- `src/App.tsx`
- `src/styles.css`
- `tasks/TASK_INDEX.md` khi dong task

## File bat buoc doc

- `AI_PROJECT_RULES.md`
- `ARCHITECTURE.md`
- `UX_UI_GUIDELINES.md`
- `README.md`
- `tasks/CA-032-sidebar-rail-polish.md`

## Hanh vi phai giu

- Sidebar hover/focus van bung menu day du.
- Content khong bi ep vao cot hep.
- View active khong doi.
- Shortcut/chat flow khong doi.

## Tieu chi hoan thanh

- Rail collapsed hien icon deu, khong tran label.
- Hover tung icon co tooltip hoac label du de hieu.
- Focus keyboard khong mat kha nang dieu huong.
- `npm run check:all` pass.

## Ket qua

- Sidebar collapsed thanh rail icon can giua, label khong con tran khi dang gon.
- Hover/focus sidebar bung menu day du, giu ngu canh nhu app chat hien dai.
- Tooltip/label phu hien khi rail dang gon de user biet tung icon la gi.
- Content chinh khong bi ep vao cot hep khi sidebar collapse.
## Ket qua hoan thanh

- Trang thai: Done.
- Da lam: Sidebar rail gon co hover/focus bung menu, tooltip/label va khong ep content chinh.
- Ghi nhan trong: `tasks/TASK_INDEX.md` va `PROJECT_TASKS.md`.
- Kiem chung: task da duoc doi chieu trong `tasks/TASK_INDEX.md` va `PROJECT_TASKS.md`; chay `npm run check:all` truoc release tiep theo.
- Han che con lai: xem cac muc Backlog/Chua lam trong `PROJECT_TASKS.md` neu task nay co phan mo rong sau.


