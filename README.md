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