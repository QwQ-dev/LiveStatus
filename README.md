# LiveStatus

**Displaying my current activity on a simple status page.**

This project features a simple **client-server setup** designed to show what I am currently doing.

* **Live Demo:** You can see the current status page in action at: [**`qwqdev.is-a.dev#now`**](https://qwqdev.is-a.dev#now)

### Features

* **Simple Backend:** Built with **Axum** for handling status updates and serving the status page.
* **Cross-Platform Client:** A client application written in Rust that monitors the active window (application name and
  title).
* **Multi-Device Support:** Run clients on multiple devices simultaneously, the frontend will display all active devices.

### Platform Support

| Platform | Client | Notes |
|----------|--------|-------|
| **Windows** | ✅ | Full support via `active-win-pos-rs` |
| **Linux (X11)** | ✅ | Full support via `active-win-pos-rs` |
| **Linux (Wayland)** | ⚠️ | Limited - app detection restricted by Wayland security |
| **macOS** | ✅ | Requires accessibility permissions |
| **Android** | ✅ | Uses Accessibility Service for app detection |

### Technology Stack

* **Backend:** Rust (Axum)
* **Client:** Rust (Tokio, Reqwest)
* **Frontend:** React + TypeScript + Vite + TailwindCSS

### Frontend Development

```bash
cd frontend
npm install
npm run dev      # Development server
npm run build    # Production build
```

### Configuration

Configuration files are located in the `config/` directory.

**Server** (`config/server-settings.yml`):

```yaml
host: 0.0.0.0:1239        # Server bind address
key: 'your-secret-key'    # Authentication key (must match client)
timeout_secs: 20          # Client timeout in seconds

filter_rule:              # Optional: filter sensitive content (server-side)
  - regex: "secret"
    replacement: "***"
```

**Client** (`config/client-settings.yml`):

```yaml
url: https://example.com/api/status  # Server endpoint (HTTPS recommended)
key: 'your-secret-key'               # Authentication key (must match server)
update_interval_secs: 5              # Status update interval
```

> **Security Note:** Content filtering is performed on the server side. It is strongly recommended to use **HTTPS** in production to protect your API key and status data during transmission.

### Pre-built Versions

You can find the latest built **Backend**, **Client** and **Android Client** executables through our Jenkins CI/CD pipeline.

* **Jenkins Build Address:**
  [https://qwqdev.jenkins.legacylands.cn/job/LiveStatus/](https://qwqdev.jenkins.legacylands.cn/job/LiveStatus/)

Please check the build artifacts for the specific **Linux**, **Windows** or **Android** versions you require.
