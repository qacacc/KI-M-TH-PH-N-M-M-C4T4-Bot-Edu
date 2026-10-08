# Dev Workflow

## File dev launcher

Dung file nay khi dang sua UI/logic:

```text
CampusAssistantLocal-Dev.exe
```

Launcher se chay lenh sau trong nen va mo Tauri desktop app, khong mo website:

```powershell
npm run dev:tauri
```

Lenh nay se tu dong giai phong port `5173` neu co dev server cu bi ket.

Neu chay truc tiep:

```powershell
npm run tauri dev
```

Tauri config van se goi `npm run free:dev-port` truoc khi mo Vite, nen khong con loi port `5173 is already in use` trong truong hop thong thuong.

Trong che do nay:

- Sua React/CSS se cap nhat truc tiep trong app qua Vite HMR.
- Khong can go cai dat ban cu.
- Khong can build installer moi sau moi lan sua UI.
- Neu sua Rust trong `src-tauri`, Tauri dev se rebuild/restart phan backend khi can.
- Log launcher nam o `dev-launcher.log`.

Neu can xem terminal de debug, dung file du phong:

```text
CampusAssistantLocal-Dev.cmd
```

File `.cmd` se giu cua so terminal va hien loi truc tiep neu dev server khong chay duoc.

## Khi nao moi build installer

Chi build installer khi muon tao ban phat hanh:

```powershell
npm run tauri build
```

Installer nam tai:

```text
src-tauri/target/release/bundle/nsis/Campus Assistant Local_1.0.1_x64-setup.exe
src-tauri/target/release/bundle/msi/Campus Assistant Local_1.0.1_x64_en-US.msi
```
