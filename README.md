# LiveStatus

**Displaying my current activity on a simple status page.**

This project features a simple **client-server setup** designed to show what I am currently doing.

* **Live Demo:** You can see the current status page in action at: **`qwqdev.is-a.dev`**

### Features

* **Simple Backend:** Built with **Axum** for handling status updates and serving the status page.
* **Cross-Platform Client:** A client application written in Rust that monitors the active window (application name and
  title).
    * **Windows & Linux Compatibility:** Thanks to `active-win-pos-rs`, the client works seamlessly on both operating
      systems.

### Technology Stack

* **Backend:** Rust (Axum)
* **Client:** Rust (Tokio, Reqwest)
  Understood. Here is a more concise section focusing only on the pre-built versions:

### Pre-built Versions

You can find the latest built **Backend** and **Client** executables through our Jenkins CI/CD pipeline.

* **Jenkins Build Address:**
  [https://qwqdev.jenkins.legacylands.cn/job/LiveStatus/](https://qwqdev.jenkins.legacylands.cn/job/LiveStatus/)

Please check the build artifacts for the specific **Linux** or **Windows** versions you require.
