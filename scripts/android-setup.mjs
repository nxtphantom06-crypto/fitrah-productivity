// Applies Fitrah's Android settings to the generated `android/` project. Safe to run more than once.
// Run after `npx cap add android` (the GitHub workflow does this automatically).
import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = 'android/app/src/main';
const manifestPath = join(root, 'AndroidManifest.xml');
const stylesPath = join(root, 'res/values/styles.xml');
if (!existsSync(manifestPath)) { console.error('android/ project not found. Run `npx cap add android` first.'); process.exit(1); }

// 1. Deep link that brings Google sign-in back into the app, plus reminder and location permissions.
let manifest = readFileSync(manifestPath, 'utf8');
if (!manifest.includes('android:host="auth-callback"')) {
  const filter = `
            <intent-filter android:autoVerify="false">
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="com.fitrah.app" android:host="auth-callback" />
            </intent-filter>`;
  manifest = manifest.replace(/(<category android:name="android\.intent\.category\.LAUNCHER"\s*\/>\s*<\/intent-filter>)/, `$1${filter}`);
  if (!manifest.includes('android:host="auth-callback"')) { console.error('Could not add the sign-in link to AndroidManifest.xml'); process.exit(1); }
}
const permissions = ['android.permission.POST_NOTIFICATIONS', 'android.permission.SCHEDULE_EXACT_ALARM', 'android.permission.RECEIVE_BOOT_COMPLETED', 'android.permission.ACCESS_COARSE_LOCATION', 'android.permission.ACCESS_FINE_LOCATION'];
for (const p of permissions) {
  if (!manifest.includes(`"${p}"`)) manifest = manifest.replace('</manifest>', `    <uses-permission android:name="${p}" />\n</manifest>`);
}
if (!manifest.includes('android.hardware.location.gps')) manifest = manifest.replace('</manifest>', '    <uses-feature android:name="android.hardware.location.gps" android:required="false" />\n</manifest>');
writeFileSync(manifestPath, manifest);

// 2. Android 12+ splash screen: teal background with the app icon, then the normal app theme.
let styles = readFileSync(stylesPath, 'utf8');
if (!styles.includes('windowSplashScreenBackground')) {
  styles = styles.replace(/(<style name="AppTheme\.NoActionBarLaunch"[^>]*>)/, `$1
        <item name="windowSplashScreenBackground">#0F766E</item>
        <item name="windowSplashScreenAnimatedIcon">@mipmap/ic_launcher_foreground</item>
        <item name="postSplashScreenTheme">@style/AppTheme.NoActionBar</item>`);
  if (!styles.includes('windowSplashScreenBackground')) { console.error('Could not add the splash screen colour to styles.xml'); process.exit(1); }
  writeFileSync(stylesPath, styles);
}

// 3. White status-bar icon for reminders.
const source = 'assets/android';
for (const dir of readdirSync(source)) {
  const target = join(root, 'res', dir);
  mkdirSync(target, { recursive: true });
  copyFileSync(join(source, dir, 'ic_stat_fitrah.png'), join(target, 'ic_stat_fitrah.png'));
}
console.log('Fitrah Android settings applied.');
