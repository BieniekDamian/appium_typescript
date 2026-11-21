---
name: emulator-doctor
description: Diagnose and fix Android emulator problems on this Windows machine. Covers slowness and input lag, "app isn't responding" (ANR) dialogs, apps crashing (incl. Play Store), the emulator being offline or missing from adb, and boot problems. Use when the user says the emulator is slow, laggy, frozen, crashing, offline, won't start, or shows "isn't responding".
---

# Emulator doctor

Machine: Windows 11, Ryzen 5 3550H (4C/8T), ~14 GB RAM, NVIDIA GTX 1650 + AMD Vega 8. AVD `Pixel_9` (API 36, Google Play) at `%USERPROFILE%\.android\avd\Pixel_9.avd\`.

The user prefers to change system and AVD settings themselves. Diagnose with read-only commands, then give exact steps. Only run fixes that touch the emulator's own app data (e.g. `pm clear`, `pm grant`) without asking.

## 1. Gather facts (read-only)

```bash
export MSYS_NO_PATHCONV=1
adb devices
adb shell dumpsys SurfaceFlinger | grep -m1 "GLES:"
adb shell cat /proc/meminfo | head -3
grep -iE "hw.ramSize|hw.gpu.mode|hw.cpu.ncore" "$USERPROFILE/.android/avd/Pixel_9.avd/config.ini"
adb logcat -b crash -d -t 100
adb logcat -d | grep -E "ANR in|Reason:" | tail -6
```
Host side (PowerShell):
```powershell
$os = Get-CimInstance Win32_OperatingSystem; "Free RAM: {0:N1} GB" -f ($os.FreePhysicalMemory/1MB)
Get-Process | Sort-Object WorkingSet64 -Descending | Select-Object -First 8 Name, @{n='MB';e={[int]($_.WorkingSet64/1MB)}}
```

## 2. Match the symptom

| Finding | Meaning | Fix (steps for the user) |
|---|---|---|
| `GLES:` says **SwiftShader** | CPU rendering, the main cause of 1–2 s input lag | Set `hw.gpu.mode=host` in `config.ini` (or start with `-gpu host`); in Windows Settings → Display → Graphics set `emulator.exe` and `qemu\windows-x86_64\qemu-system-x86_64.exe` to High performance (NVIDIA). Expected after: `NVIDIA GeForce GTX 1650` |
| `hw.ramSize=2048` / guest MemTotal ~2.5 GB | Too little RAM for API 36 + WebView, causing ANRs | `hw.ramSize=4096` (emulator stopped first) |
| Host free RAM < ~2 GB | Host swapping | Close Android Studio (not needed to run the emulator), browser tabs; laptop plugged in, Best performance mode |
| `ANR in <package> (...onesignal...PermissionsActivity)` | OneSignal permission screen froze, usually from low resources | Fix RAM/GPU as above; make sure `POST_NOTIFICATIONS` is granted |
| `com.android.vending` crashes with `SQLITE_CORRUPT` or `screenForNeedFopAndAuthCase` | Corrupted Play Store data; crash on the payment-method screen | `adb shell pm clear com.android.vending` (safe, emulator only), reopen the store, Skip payment method |
| `adb devices` empty | Emulator not running | User starts `emulator -avd Pixel_9` (its terminal stays busy; that's normal) |
| `offline` | Still booting, or adb lost the connection | Wait ~30 s; then `adb reconnect offline`; last resort `adb kill-server && adb start-server` |
| Log: `Failed to load snapshot ... different renderer configured` | One-off cold boot after a GPU mode change | Nothing to do; next start is fast |
| Log: `Failed to create process resource for puid N`, `UpdateLayeredWindowIndirect failed` | Harmless emulator noise | Nothing to do |

## 3. Useful emulator commands

```bash
emulator -list-avds
emulator -avd Pixel_9
emulator -avd Pixel_9 -no-snapshot-load               # clean cold boot
adb emu kill                                           # stop it
adb emu avd snapshot save <logged-in-snapshot>           # save logged-in state
adb emu avd snapshot load <logged-in-snapshot>           # restore it
```

## 4. Verify

After the user applies a fix, rerun the relevant fact-gathering command (e.g. the `GLES:` line or MemTotal) to confirm, then `npm run test:smoke`.
