/**
 * Windows Auto-Patch Setup
 * Enables or disables automatic RTL patching at Windows logon after Antigravity updates.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const TASK_NAME = 'AntigravityRTLAutoPatch';

function getStartupScriptPath() {
    const appData = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
    const startupDir = path.join(appData, 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup');
    return path.join(startupDir, 'antigravity-rtl-autopatch.vbs');
}

function enableAutoPatch() {
    const projectDir = __dirname;
    const scriptPath = path.join(projectDir, 'auto-patch.js');
    let methodUsed = '';

    // Method 1: Windows Scheduled Task
    let scheduledTaskOk = false;
    try {
        const psCommand = `
            $action = New-ScheduledTaskAction -Execute 'node.exe' -Argument '"${scriptPath.replace(/"/g, '`"')}"' -WorkingDirectory '"${projectDir.replace(/"/g, '`"')}"'
            $trigger = New-ScheduledTaskTrigger -AtLogOn
            $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
            Register-ScheduledTask -TaskName "${TASK_NAME}" -Action $action -Trigger $trigger -Settings $settings -Description "Auto-reapplies RTL patch after Antigravity updates" -Force
        `.replace(/\n\s+/g, ' ');
        execSync(`powershell -NoProfile -Command "${psCommand}"`, { stdio: 'ignore' });
        scheduledTaskOk = true;
        methodUsed = 'Scheduled Task';
    } catch (e) {
        // Scheduled task may fail if non-elevated
    }

    // Method 2: Windows Startup folder (100% reliable, zero admin privileges needed)
    try {
        const vbsPath = getStartupScriptPath();
        const vbsContent = `Set WshShell = CreateObject("WScript.Shell")\r\nWshShell.CurrentDirectory = "${projectDir.replace(/"/g, '""')}"\r\nWshShell.Run "node """ & "${scriptPath.replace(/"/g, '""')}" & """", 0, False\r\n`;
        fs.writeFileSync(vbsPath, vbsContent, 'utf8');
        if (!methodUsed) methodUsed = 'Windows Startup Folder';
        else methodUsed += ' + Startup Folder (Fail-safe)';
    } catch (e) {
        if (!scheduledTaskOk) {
            throw new Error(`Failed to configure auto-patch: ${e.message}`);
        }
    }

    return {
        success: true,
        method: methodUsed,
        message: 'Auto-patch on Windows logon successfully enabled!'
    };
}

function disableAutoPatch() {
    let removed = [];

    // Remove Scheduled Task
    try {
        execSync(`schtasks /delete /tn "${TASK_NAME}" /f`, { stdio: 'ignore' });
        removed.push('Scheduled Task');
    } catch (e) {}

    // Remove Startup Script
    try {
        const vbsPath = getStartupScriptPath();
        if (fs.existsSync(vbsPath)) {
            fs.unlinkSync(vbsPath);
            removed.push('Startup Script');
        }
    } catch (e) {}

    return {
        success: true,
        removed,
        message: removed.length > 0 
            ? 'Auto-patch has been disabled successfully.' 
            : 'Auto-patch was not active.'
    };
}

function isAutoPatchEnabled() {
    const vbsPath = getStartupScriptPath();
    if (fs.existsSync(vbsPath)) return true;

    try {
        const out = execSync(`schtasks /query /tn "${TASK_NAME}"`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
        return out.includes(TASK_NAME);
    } catch (e) {
        return false;
    }
}

if (require.main === module) {
    const arg = (process.argv[2] || '').toLowerCase();
    if (arg === '--disable' || arg === '-d') {
        const res = disableAutoPatch();
        console.log(`✅ ${res.message}`);
    } else if (arg === '--status' || arg === '-s') {
        const active = isAutoPatchEnabled();
        console.log(`Auto-Patch status: ${active ? 'ACTIVE' : 'INACTIVE'}`);
    } else {
        const res = enableAutoPatch();
        console.log(`✅ ${res.message} (${res.method})`);
    }
}

module.exports = {
    enableAutoPatch,
    disableAutoPatch,
    isAutoPatchEnabled
};
