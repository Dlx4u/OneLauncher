# OneLauncher

Rust-based Minecraft launcher utilizing Tauri, SolidJS, and Tailwind

## Project Structure

* [`apps/desktop`](./apps/desktop/) - Rust-based Minecraft launcher utilizing Tauri, SolidJS, and Tailwind.
* [`crates/core`](./crates/core/) - The core for our Minecraft launcher (platform agnostic), along with Rust-based utilities for other Polyfrost projects and interactions.
* [`testing`](./crates/testing/) - Testing playground for our Rust core, independant of Tauri.
* [`distribution`](./packages/distribution/) - Distribution utilties and meta files for the [`apps/desktop`](./apps/desktop/) app.

## Aurora Launcher development fork

This fork is being rebranded as Aurora Launcher while retaining OneLauncher's
GPL-3.0 license and attribution. The rebrand is in progress; existing internal
package names, data paths, and some upstream branding remain unchanged.

Aurora uses local offline profiles rather than Microsoft account sign-in.
Offline profiles cannot authenticate with servers that require Microsoft
accounts. Downloading game files requires an internet connection and access to
the required Minecraft files. In-game HUD modules are deferred.

The **Windows build (development)** GitHub Actions workflow is configured to
run on pushes to this development branch (when Actions is enabled). On success,
its artifact should contain the executable and NSIS installer. The workflow and
Rust changes are not yet verified on Windows, and no executable has been built.
