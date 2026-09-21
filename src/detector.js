const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

function findAntigravityPath() {
    const platform = process.platform;

    // 1. Try to find from running process on Windows
    if (platform === 'win32') {
        try {
            const stdout = execSync('powershell -NoProfile -Command "(Get-Process -Name Antigravity -ErrorAction SilentlyContinue | Select-Object -First 1).Path"', { encoding: 'utf8' }).trim();
            if (stdout && fs.existsSync(stdout)) {
                const installDir = path.dirname(stdout);
                const asar = path.join(installDir, 'resources', 'app.asar');
                if (fs.existsSync(asar)) {
                    return { installDir, asarPath: asar, exePath: stdout };
                }
            }
        } catch (e) {}

        // Standard Windows candidate directories
        const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
        const appData = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
        const programFiles = process.env.ProgramFiles || 'C:\\Program Files';
        const programFilesX86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';

        const candidates = [
            path.join(localAppData, 'Programs', 'antigravity'),
            path.join(localAppData, 'Programs', 'Antigravity'),
            path.join(programFiles, 'Antigravity'),
            path.join(programFiles, 'antigravity'),
            path.join(programFilesX86, 'Antigravity'),
            path.join(appData, 'Programs', 'antigravity'),
        ];

        for (const dir of candidates) {
            const asar = path.join(dir, 'resources', 'app.asar');
            if (fs.existsSync(asar)) {
                const exe = path.join(dir, 'Antigravity.exe');
                return {
                    installDir: dir,
                    asarPath: asar,
                    exePath: fs.existsSync(exe) ? exe : null,
                };
            }
        }
    } else if (platform === 'darwin') {
        // macOS candidates
        const candidates = [
            '/Applications/Antigravity.app',
            path.join(os.homedir(), 'Applications', 'Antigravity.app'),
        ];

        for (const appDir of candidates) {
            const asar = path.join(appDir, 'Contents', 'Resources', 'app.asar');
            if (fs.existsSync(asar)) {
                return {
                    installDir: appDir,
                    asarPath: asar,
                    exePath: path.join(appDir, 'Contents', 'MacOS', 'Antigravity'),
                };
            }
        }
    } else if (platform === 'linux') {
        // Linux candidates
        const candidates = [
            '/opt/Antigravity',
            '/opt/antigravity',
            '/usr/lib/antigravity',
            path.join(os.homedir(), '.local', 'share', 'antigravity'),
        ];

        for (const dir of candidates) {
            const asar = path.join(dir, 'resources', 'app.asar');
            if (fs.existsSync(asar)) {
                return {
                    installDir: dir,
                    asarPath: asar,
                    exePath: path.join(dir, 'antigravity'),
                };
            }
        }
    }

    return null;
}

module.exports = {
    findAntigravityPath,
};
