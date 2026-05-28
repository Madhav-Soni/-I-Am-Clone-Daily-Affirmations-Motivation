## Prompt
I tried running `npm run dev` in the backend folder, and nodemon crashed with this error:

```txt
node:internal/modules/cjs/loader:1210
  throw err;
  ^

Error: Cannot find module '../../models/User'
Require stack:
- /Users/madhav/Desktop/I AM WELL/src/middleware/auth.js
- /Users/madhav/Desktop/I AM WELL/src/controllers/authController.js
- /Users/madhav/Desktop/I AM WELL/src/routes/v1/authRoutes.js
- /Users/madhav/Desktop/I AM WELL/src/routes/index.js
- /Users/madhav/Desktop/I AM WELL/src/app.js
- /Users/madhav/Desktop/I AM WELL/src/server.js
    at Module._resolveFilename (node:internal/modules/cjs/loader:1207:15)
    ...
```

Why is the app crashing here?

## Response
The error indicates that Node.js cannot resolve the relative import path `../../models/User` from `src/middleware/auth.js`.

### Most Probable Causes:
1. **Directory/File Location Inconsistency**: The `models` directory is situated differently in the folder structure than the relative reference assumes (e.g. if the middleware folder is nested deeper, or models is placed at a different level).
2. **Naming Casings**: In macOS (which has a case-insensitive file system by default), importing a file with incorrect casing (e.g., `user.js` vs `User.js`) might compile locally but crash in a case-sensitive environment or depending on configuration.

### Fix:
Verify the exact folder location of your Mongoose models. Adjust the import in `/Users/madhav/Desktop/I AM WELL/src/middleware/auth.js` to match the exact relative path of the `User` schema definition file.

---

## Prompt
I am trying to run the mobile app on a physical device, but adb commands are failing and I get `zsh: command not found: adb`.

```bash
madhav@Madhavs-MacBook-Air I AM WELL % cd mobile
adb reverse tcp:8081 tcp:8081
adb reverse tcp:5000 tcp:5000
npx expo start --dev-client --clear
zsh: command not found: adb
zsh: command not found: adb
```

## Response
The `adb` (Android Debug Bridge) command is not configured in your shell environment path (`PATH`), meaning the terminal shell cannot locate the executable.

### Fix Steps:
1. **Set Environment variables**: Add Android SDK tool paths to your `.zshrc` profile:
   ```bash
   export ANDROID_HOME=$HOME/Library/Android/sdk
   export PATH=$PATH:$ANDROID_HOME/emulator
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   ```
2. **Reload Shell**: Reload with `source ~/.zshrc`.
3. **Tunnel Ports**: Once `adb` is recognized, run the `adb reverse` commands to proxy Metro server (`8081`) and API server (`5000`) ports from your MacBook to your connected physical Android phone.
