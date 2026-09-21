const fs = require('fs');
const path = require('path');
const os = require('os');

function getEditorSettingsPaths() {
    const appData = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
    const home = os.homedir();

    const candidates = [
        path.join(appData, 'Antigravity IDE', 'User', 'settings.json'),
        path.join(appData, 'Antigravity', 'User', 'settings.json'),
        path.join(appData, 'Code', 'User', 'settings.json'),
        path.join(appData, 'Cursor', 'User', 'settings.json'),
        path.join(appData, 'Windsurf', 'User', 'settings.json'),
        path.join(appData, 'Trae', 'User', 'settings.json'),
        path.join(appData, 'VSCodium', 'User', 'settings.json'),
        // Linux / macOS candidates
        path.join(home, '.config', 'Antigravity IDE', 'User', 'settings.json'),
        path.join(home, '.config', 'Code', 'User', 'settings.json'),
        path.join(home, 'Library', 'Application Support', 'Antigravity IDE', 'User', 'settings.json'),
        path.join(home, 'Library', 'Application Support', 'Code', 'User', 'settings.json'),
    ];

    return candidates.filter(p => fs.existsSync(p));
}

function updateEditorSettings(fontName = 'Vazirmatn, Assistant, Consolas, monospace') {
    const paths = getEditorSettingsPaths();
    const updated = [];

    for (const filePath of paths) {
        try {
            const raw = fs.readFileSync(filePath, 'utf8');
            // Remove single line comments
            const clean = raw.replace(/\/\/.*$/gm, '');
            let settings = {};
            try {
                settings = JSON.parse(clean);
            } catch (e) {
                settings = {};
            }

            settings['editor.fontFamily'] = fontName;
            settings['editor.fontLigatures'] = true;
            settings['editor.renderWhitespace'] = 'boundary';

            fs.writeFileSync(filePath, JSON.stringify(settings, null, 4), 'utf8');
            updated.push(filePath);
        } catch (e) {
            console.error(`Could not update: ${filePath}`, e.message);
        }
    }

    return updated;
}

module.exports = {
    getEditorSettingsPaths,
    updateEditorSettings
};
