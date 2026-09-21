const { execSync, spawn } = require('child_process');

function isAntigravityRunning() {
    const platform = process.platform;
    try {
        if (platform === 'win32') {
            const out = execSync('tasklist /FI "IMAGENAME eq Antigravity.exe" /NH', { encoding: 'utf8' });
            return out.toLowerCase().includes('antigravity.exe');
        } else {
            const out = execSync('pgrep -i antigravity', { encoding: 'utf8' });
            return out.trim().length > 0;
        }
    } catch (e) {
        return false;
    }
}

function killAntigravity() {
    const platform = process.platform;
    try {
        if (platform === 'win32') {
            execSync('taskkill /F /IM Antigravity.exe /T', { stdio: 'ignore' });
        } else {
            execSync('pkill -9 -i antigravity', { stdio: 'ignore' });
        }
        // Small delay to ensure OS releases file locks
        const end = Date.now() + 1000;
        while (Date.now() < end) {}
        return true;
    } catch (e) {
        return false;
    }
}

function launchAntigravity(exePath) {
    if (!exePath) return false;
    try {
        const subprocess = spawn(exePath, [], {
            detached: true,
            stdio: 'ignore'
        });
        subprocess.unref();
        return true;
    } catch (e) {
        return false;
    }
}

module.exports = {
    isAntigravityRunning,
    killAntigravity,
    launchAntigravity
};
