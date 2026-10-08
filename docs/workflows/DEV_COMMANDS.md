# Lenh chay dev

Chay trong thu muc goc du an:

```powershell
cd "C:\Users\PC\Downloads\bot game"
```

## Chay app desktop Tauri

Lenh nen dung khi sua UI/logic:

```powershell
npm run dev:desktop
```

Alias tuong duong:

```powershell
npm run dev:tauri
npm run dev:app
```

Lenh nay tu dong giai phong port `5173`, mo Vite va chay cua so desktop Tauri.

## Chay web Vite rieng

Chi dung de xem frontend thuan, khong test duoc Tauri command `invoke`:

```powershell
npm run dev:web
```

Alias:

```powershell
npm run dev
```

## Xu ly port 5173 bi chiem

```powershell
npm run clean:dev-port
```

## Kiem tra truoc khi build

```powershell
npm run check
```

Alias:

```powershell
npm run check:all
```

Kiem tra layout contract khong can browser/dependency ngoai:

```powershell
npm run test:layout
```

## Build installer

```powershell
npm run build:installer
```

Build release day du, gom test + build + Rust check + audit + installer:

```powershell
npm run build:release
```

## Tao dev launcher

```powershell
npm run build:dev-launcher
```

Sau do chay file:

```text
CampusAssistantLocal-Dev.exe
```

File nay chay `npm run dev:desktop` an terminal va ghi log vao `dev-launcher.log`.
