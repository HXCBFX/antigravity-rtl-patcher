const fs = require('fs');
const path = require('path');
const https = require('https');

function githubRequest(method, endpoint, token, body = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(endpoint.startsWith('http') ? endpoint : `https://api.github.com${endpoint}`);
        const options = {
            hostname: url.hostname,
            path: url.pathname + url.search,
            method,
            headers: {
                'User-Agent': 'Antigravity-RTL-Patcher',
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github.v3+json',
            }
        };

        if (body) {
            options.headers['Content-Type'] = 'application/json';
        }

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                let parsed = null;
                try {
                    parsed = JSON.parse(data);
                } catch (e) {
                    parsed = data;
                }
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve(parsed);
                } else {
                    reject({ status: res.statusCode, body: parsed });
                }
            });
        });

        req.on('error', reject);

        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

function getAllFiles(dirPath, arrayOfFiles = []) {
    const files = fs.readdirSync(dirPath);

    for (const file of files) {
        if (file === 'node_modules' || file === '.git' || file === '.system_generated' || file === '.package-lock.json') {
            continue;
        }
        const fullPath = path.join(dirPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
            getAllFiles(fullPath, arrayOfFiles);
        } else {
            arrayOfFiles.push(fullPath);
        }
    }

    return arrayOfFiles;
}

async function uploadProjectToPrivateRepo(token, repoName = 'antigravity-rtl-patcher') {
    console.log(`🔍 Checking or creating private repository: ${repoName}...`);

    let repoInfo;
    try {
        repoInfo = await githubRequest('POST', '/user/repos', token, {
            name: repoName,
            private: true,
            description: 'Antigravity RTL Patcher (Persian, Arabic, Hebrew) with UI Widget and Vazirmatn Font'
        });
        console.log(`✅ Private repository created: ${repoInfo.html_url}`);
    } catch (err) {
        if (err.status === 422) {
            console.log(`ℹ️ Repository '${repoName}' already exists. Updating contents...`);
            // Fetch repo info
            const user = await githubRequest('GET', '/user', token);
            repoInfo = await githubRequest('GET', `/repos/${user.login}/${repoName}`, token);
        } else {
            throw new Error(`Failed to create repository: ${JSON.stringify(err.body)}`);
        }
    }

    const owner = repoInfo.owner.login;
    const projectRoot = __dirname;
    const filesToUpload = getAllFiles(projectRoot);

    console.log(`📦 Found ${filesToUpload.length} files to upload.`);

    for (const filePath of filesToUpload) {
        const relativePath = path.relative(projectRoot, filePath).replace(/\\/g, '/');
        const content = fs.readFileSync(filePath).toString('base64');

        // Check if file already exists on repo to get sha for update
        let sha = null;
        try {
            const existing = await githubRequest('GET', `/repos/${owner}/${repoName}/contents/${encodeURIComponent(relativePath)}`, token);
            sha = existing.sha;
        } catch (e) {}

        const body = {
            message: `Add ${relativePath}`,
            content
        };
        if (sha) {
            body.sha = sha;
            body.message = `Update ${relativePath}`;
        }

        try {
            await githubRequest('PUT', `/repos/${owner}/${repoName}/contents/${encodeURIComponent(relativePath)}`, token, body);
            console.log(`  ✅ Uploaded: ${relativePath}`);
        } catch (e) {
            console.error(`  ❌ Failed to upload: ${relativePath}`, e.body?.message || e);
        }
    }

    console.log(`\n🎉 All files successfully uploaded to: ${repoInfo.html_url}`);
    return repoInfo;
}

module.exports = {
    uploadProjectToPrivateRepo
};

if (require.main === module) {
    const token = process.argv[2] || process.env.GITHUB_TOKEN;
    if (!token) {
        console.error('Usage: node github-uploader.js <GITHUB_PERSONAL_ACCESS_TOKEN>');
        process.exit(1);
    }
    uploadProjectToPrivateRepo(token).catch(err => {
        console.error('Upload failed:', err);
        process.exit(1);
    });
}
