/**
 * Antigravity RTL Auto-Patcher
 * Runs silently in the background at Windows startup/logon.
 * Checks if Antigravity was updated by Google, and if so, automatically reapplies the RTL patch.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');
const { AntigravityRtlPatcher } = require('./patcher');

const LOG_FILE = path.join(os.homedir(), '.antigravity-rtl-autopatch.log');

function log(msg) {
    const timestamp = new Date().toISOString();
    const line = `[${timestamp}] ${msg}\n`;
    try {
        fs.appendFileSync(LOG_FILE, line, 'utf8');
    } catch (e) {}
    console.log(msg);
}

function showNotification(title, message) {
    if (process.platform === 'win32') {
        const psCommand = `
            [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] > $null
            $template = [Windows.UI.Notifications.ToastNotificationManager]::GetTemplateContent([Windows.UI.Notifications.ToastTemplateType]::ToastText02)
            $textNodes = $template.GetElementsByTagName("text")
            $textNodes.Item(0).AppendChild($template.CreateTextNode("${title.replace(/"/g, '`"')}")) > $null
            $textNodes.Item(1).AppendChild($template.CreateTextNode("${message.replace(/"/g, '`"')}")) > $null
            $toast = [Windows.UI.Notifications.ToastNotification]::new($template)
            [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier("Antigravity RTL").Show($toast)
        `.replace(/\n\s+/g, ' ');
        exec(`powershell -NoProfile -Command "${psCommand}"`, () => {});
    }
}

async function runAutoPatch() {
    log('--- Antigravity RTL Auto-Patch check started ---');
    const patcher = new AntigravityRtlPatcher();
    const status = patcher.getStatus();

    if (!status.installed) {
        log('Antigravity is not installed. Exiting.');
        return;
    }

    if (status.isPatched) {
        log('Antigravity is already patched for RTL. Nothing to do.');
        return;
    }

    log('Notice: Antigravity was updated or is not patched! Reapplying RTL patch...');
    try {
        const result = await patcher.applyPatch({
            autoKill: false, // Don't disrupt if user just started
            autoRestart: false,
            updateEditor: true
        });
        log(`Success: ${result.message}`);
        showNotification('Antigravity RTL Patcher', 'پچ راست‌چین پس از بروزرسانی به‌طور خودکار مجدداً اعمال شد!');
    } catch (err) {
        log(`Error applying auto-patch: ${err.message}`);
    }
}

if (require.main === module) {
    runAutoPatch().then(() => {
        process.exit(0);
    }).catch(err => {
        log(`Fatal error: ${err.message}`);
        process.exit(1);
    });
}

module.exports = { runAutoPatch };
