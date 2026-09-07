# Export compliance (Brain Kit iOS)

Brain Kit uses only standard **HTTPS / system TLS** (Capacitor WKWebView → bundled `www/` by default, or optional `REMOTE_URL` HTTPS later). No proprietary or non-exempt crypto.

## Info.plist / Codemagic

Set:

```text
ITSAppUsesNonExemptEncryption = false
```

`codemagic.yaml` already applies this with PlistBuddy after `cap sync` on the generated `ios/App/App/Info.plist`.

## ASC / TestFlight

Answer export-compliance questions consistently with **exempt / HTTPS only**. Do not flip to `true` unless you add custom encryption — then revisit French ANSSI and ASC crypto docs before distributing in France.

See also: `ios-wrap/README.md` → ITSAppUsesNonExemptEncryption.
