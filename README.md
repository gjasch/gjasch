# Godot VR Tech Demo (vr-test-1)

A basic VR tech demo created with Godot Engine 4.4, designed to run on Windows 11 or natively on Meta Quest 3.
This project provides a rudimentary 3D outdoor environment with room-scale VR capabilities.

## Prerequisites

*   **Godot Engine:** Version 4.4.x. You can download it from the [official Godot Engine website](https://godotengine.org/download/).
*   **VR Headset:**
    *   For Windows: A PC VR headset compatible with OpenXR (e.g., Meta Quest via Link, Valve Index, Windows Mixed Reality). Ensure your headset's PC software (e.g., Oculus App, SteamVR) is running.
    *   For Meta Quest (standalone): Meta Quest 2, 3, or Pro.
*   **Android SDK (for Meta Quest export):** If you plan to export for Meta Quest devices, you will need the Android SDK Platform Tools. Godot's export window will guide you, but typically you'll need `adb` and other tools. Refer to the [Godot documentation for Android export](https://docs.godotengine.org/en/stable/tutorials/export/exporting_for_android.html).

## Getting Started

1.  **Clone the Repository:**
    ```bash
    git clone <your-repo-url>
    cd <your-repo-folder>
    git checkout vr-test-1
    ```

2.  **Open in Godot:**
    *   Launch Godot Engine 4.4.
    *   In the Project Manager, click "Import".
    *   Browse to the cloned project folder and select the `project.godot` file.
    *   Click "Import & Edit".

3.  **Install Godot OpenXR Loaders (Crucial for Meta Quest):**
    *   This project is configured for OpenXR. For Meta Quest devices (and some other Android XR devices), you need the appropriate loader.
    *   **Using Godot's AssetLib:**
        1.  In Godot, open the "AssetLib" tab (usually at the top, next to "Scene", "Import", etc.).
        2.  Search for "OpenXR" or "Meta Quest".
        3.  Find the "Godot OpenXR Loaders" (or similar, specifically for Meta Quest / Android). It might be named "Meta OpenXR Loader" or "Godot OpenXR Meta Loader".
        4.  Download and install it. This should place files into an `addons/` directory in your project (e.g., `addons/meta_openxr_loader`).
    *   **Manual Install (if needed):**
        1.  Go to the [Godot XR Tools GitHub page](https://github.com/GodotVR/godot-xr-tools/releases) or the [Godot OpenXR Loaders repository](https://github.com/GodotVR/godot_openxr_loaders/releases) (check the Godot documentation for the most current official source).
        2.  Download the latest release of the Meta OpenXR loader (`.zip` file).
        3.  Extract the contents into your project's `addons/` folder. You should have a path like `addons/meta_openxr_loader/...`.
    *   **Enable the Plugin:**
        1.  Go to `Project > Project Settings > Plugins`.
        2.  Find the "Meta OpenXR" (or similarly named) plugin and check "Enable".

4.  **Running the Demo (PC VR):**
    *   Ensure your PC VR headset is connected and its runtime (Oculus App, SteamVR) is active.
    *   In Godot, press the "Play" button (or F5).
    *   The VR view should activate in your headset.

## Exporting the Project

### For Windows:

1.  Go to `Project > Export...`.
2.  Click "Add..." and select "Windows Desktop".
3.  Configure options as needed (e.g., export path).
    *   Ensure "Runnable" is checked.
    *   Under the "XR Mode" tab (or similar, depending on exact Godot version/UI), ensure "OpenXR" is selected.
4.  Click "Export Project", choose a location, and save.
5.  Run the exported `.exe` file.

### For Meta Quest (Android):

1.  **Setup Android SDK:**
    *   Ensure you have the Android SDK installed and configured in Godot:
        *   Go to `Editor > Editor Settings > Export > Android`.
        *   Fill in the paths for `Adb` (Android Debug Bridge) and `JarSigner`. Godot can often auto-detect these if they are in your system PATH.
        *   You may need to install specific Android SDK components (Platform Tools, Build Tools, and an API level like 30 or higher).
2.  **Connect Meta Quest:**
    *   Enable Developer Mode on your Meta Quest.
    *   Connect it to your PC via USB. Allow USB debugging when prompted in the headset.
3.  **Export:**
    *   Go to `Project > Export...`.
    *   Click "Add..." and select "Android".
    *   In the export options on the right:
        *   **XR Mode:** Set to "OpenXR".
        *   **Architectures:** Ensure `Arm64-v8a` is checked. You can uncheck `Armeabi-v7a` for modern Quest devices.
        *   **Package > Unique Name:** Should be `com.example.vrtechdemo` (as set in `project.godot`).
        *   **Permissions:** The OpenXR mode should handle necessary permissions. If you add hand tracking later, you might need `com.oculus.permission.HAND_TRACKING`.
        *   **Use Gradle Build:** Recommended.
4.  **Export or Deploy:**
    *   **To create an APK:** Click "Export Project", choose a location, and save the `.apk` file. You can then install this APK on your Quest using SideQuest or `adb install your_project.apk`.
    *   **To deploy directly (One-Click Deploy):** If your Quest is connected and recognized (`adb devices` in your terminal should list it), you might see a small Android icon next to the "Play" button in the Godot editor. Clicking this can attempt to build and run directly on the Quest. This uses the `openxr/android_export_one_click_deploy=true` setting from `project.godot`.

## Troubleshooting

*   **VR Not Activating:**
    *   Ensure your VR runtime (Oculus, SteamVR) is running *before* launching the Godot project.
    *   Check Godot's output console for OpenXR errors.
    *   Verify the OpenXR loader addon is installed and enabled correctly.
*   **Meta Quest Issues:**
    *   Ensure Developer Mode is enabled on the Quest.
    *   Accept USB debugging prompts in the headset.
    *   Verify `adb devices` shows your Quest.
    *   Ensure the correct OpenXR loader for Meta Quest is installed and enabled in Godot Project Settings.

This `README.md` provides a good starting point.
