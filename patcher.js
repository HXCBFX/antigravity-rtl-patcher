const fs = require('fs');
const path = require('path');
const os = require('os');
const asar = require('@electron/asar');

const { findAntigravityPath } = require('./src/detector');
const { isAntigravityRunning, killAntigravity, launchAntigravity } = require('./src/process');
const { generatePatchCode } = require('./src/injector');
const { updateEditorSettings } = require('./src/editor-config');

class AntigravityRtlPatcher {
    constructor() {
        this.appInfo = findAntigravityPath();
    }

    getStatus() {
        if (!this.appInfo) {
            return {
                installed: false,
                message: 'Antigravity installation not found.'
            };
        }

        const { installDir, asarPath, exePath } = this.appInfo;
        const backupPath = `${asarPath}.bak`;
        const hasBackup = fs.existsSync(backupPath);
        const isRunning = isAntigravityRunning();

        let isPatched = false;
        try {
            const utilsContent = asar.extractFile(asarPath, 'dist/utils.js').toString('utf8');
            isPatched = utilsContent.includes('/* ANTIGRAVITY RTL PATCH');
        } catch (e) {}

        return {
            installed: true,
            installDir,
            asarPath,
            exePath,
            hasBackup,
            isPatched,
            isRunning
        };
    }

    async applyPatch(options = {}) {
        const { autoKill = true, autoRestart = false, updateEditor = true } = options;

        if (!this.appInfo) {
            throw new Error('Could not detect Antigravity installation path.');
        }

        const { asarPath, exePath } = this.appInfo;
        const resourcesDir = path.dirname(asarPath);
        const backupAsar = `${asarPath}.bak`;
        const unpackedDir = path.join(resourcesDir, 'app.asar.unpacked');
        const backupUnpacked = path.join(resourcesDir, 'app.asar.bak.unpacked');

        // Check if running
        if (isAntigravityRunning()) {
            if (autoKill) {
                killAntigravity();
            } else {
                throw new Error('Antigravity is currently running. Please close it before patching.');
            }
        }

        // 1. Create backup if it does not exist
        if (!fs.existsSync(backupAsar)) {
            fs.copyFileSync(asarPath, backupAsar);
        }
        if (fs.existsSync(unpackedDir) && !fs.existsSync(backupUnpacked)) {
            try {
                fs.cpSync(unpackedDir, backupUnpacked, { recursive: true });
            } catch (e) {}
        }

        // 2. Prepare temp working directory
        const tempExtractDir = path.join(os.tmpdir(), `antigravity-rtl-${Date.now()}`);
        if (fs.existsSync(tempExtractDir)) {
            fs.rmSync(tempExtractDir, { recursive: true, force: true });
        }

        try {
            // 3. Extract ASAR
            asar.extractAll(asarPath, tempExtractDir);

            const utilsPath = path.join(tempExtractDir, 'dist', 'utils.js');
            if (!fs.existsSync(utilsPath)) {
                throw new Error(`dist/utils.js not found in ${tempExtractDir}`);
            }

            let utilsCode = fs.readFileSync(utilsPath, 'utf8');

            // Strip any previous patch
            if (utilsCode.includes('/* ANTIGRAVITY RTL PATCH')) {
                utilsCode = utilsCode.replace(/\/\* ANTIGRAVITY RTL PATCH[\s\S]*?\/\* END ANTIGRAVITY RTL PATCH \*\//g, '');
                // Also clean up old-style injections
                utilsCode = utilsCode.replace(/\/\* ANTIGRAVITY RTL PATCH[\s\S]*?void win\.loadURL\(url\);/g, 'void win.loadURL(url);');
            }

            // Generate fresh patch code
            const patchCode = generatePatchCode();

            // Inject right before "void win.loadURL(url);"
            const targetHook = 'void win.loadURL(url);';
            if (utilsCode.includes(targetHook)) {
                utilsCode = utilsCode.replace(targetHook, `${patchCode}\n    ${targetHook}`);
            } else {
                // Fallback: inject at the end of createWindow function
                utilsCode += `\n${patchCode}\n`;
            }

            fs.writeFileSync(utilsPath, utilsCode, 'utf8');

            // 4. Copy embedded font
            const fontSource = path.join(__dirname, 'fonts', 'Vazirmatn-Variable.woff2');
            const fontDest = path.join(tempExtractDir, 'dist', 'Vazirmatn-Variable.woff2');
            if (fs.existsSync(fontSource)) {
                fs.copyFileSync(fontSource, fontDest);
            }

            // 5. Repack ASAR
            const tempPackedAsar = path.join(os.tmpdir(), `antigravity-patched-${Date.now()}.asar`);
            await asar.createPackageWithOptions(tempExtractDir, tempPackedAsar, {
                unpack: '**/node_modules/chrome-devtools-mcp/**'
            });

            // 6. Overwrite app.asar
            fs.copyFileSync(tempPackedAsar, asarPath);

            // Clean temp files
            try {
                fs.rmSync(tempPackedAsar, { force: true });
                fs.rmSync(tempExtractDir, { recursive: true, force: true });
            } catch (e) {}

            // 7. Update editor settings if requested
            if (updateEditor) {
                updateEditorSettings();
            }

            // 8. Relaunch if requested
            if (autoRestart && exePath) {
                launchAntigravity(exePath);
            }

            return {
                success: true,
                message: 'Antigravity successfully patched for RTL (Persian, Arabic, Hebrew)!'
            };
        } catch (err) {
            // Clean temp
            try {
                fs.rmSync(tempExtractDir, { recursive: true, force: true });
            } catch (e) {}
            throw err;
        }
    }

    async restoreOriginal(autoRestart = false) {
        if (!this.appInfo) {
            throw new Error('Could not detect Antigravity installation path.');
        }

        const { asarPath, exePath } = this.appInfo;
        const backupAsar = `${asarPath}.bak`;

        if (!fs.existsSync(backupAsar)) {
            throw new Error('No backup file (app.asar.bak) found to restore from.');
        }

        if (isAntigravityRunning()) {
            killAntigravity();
        }

        // Restore backup file
        fs.copyFileSync(backupAsar, asarPath);

        if (autoRestart && exePath) {
            launchAntigravity(exePath);
        }

        return {
            success: true,
            message: 'Original Antigravity successfully restored.'
        };
    }
}

module.exports = {
    AntigravityRtlPatcher
};
