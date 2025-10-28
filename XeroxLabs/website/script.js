// Configuração de usuários e senhas (simula arquivo .env)
const ENV_CONFIG = {
    RODRIGO_PASSWORD: 'senha123',
    RAFA_PASSWORD: 'senha456',
    SAMU_PASSWORD: 'senha789',
    ZE_PASSWORD: 'senha012',
    ANTIXEROX_PASSWORD: 'admin123'
};

const fileSystem = {
    'home': {
        type: 'dir',
        contents: {
            'rodrigo': {
                type: 'dir',
                owner: 'rodrigo',
                contents: {
                    'meu_ficheiro.txt': { 
                        type: 'file', 
                        owner: 'rodrigo',
                        content: 'Este é o ficheiro do Rodrigo.\nPodes editar este conteúdo como quiseres.\n\nNotas pessoais:\n- Projeto em andamento\n- Reunião na sexta\n- Não esquecer o relatório'
                    },
                    '.bash_history': { 
                        type: 'file', 
                        owner: 'rodrigo',
                        content: 'ls -la\ncd Documents\npwd\ncat meu_ficheiro.txt'
                    },
                    'Documents': { 
                        type: 'dir', 
                        owner: 'rodrigo',
                        contents: {} 
                    }
                }
            },
            'rafa': {
                type: 'dir',
                owner: 'rafa',
                contents: {
                    'meu_ficheiro.txt': { 
                        type: 'file', 
                        owner: 'rafa',
                        content: 'Ficheiro do Rafa aqui.\n\nTarefas:\n1. Revisar código\n2. Fazer backup\n3. Atualizar documentação\n\nEdita à vontade!'
                    },
                    '.bash_history': { 
                        type: 'file', 
                        owner: 'rafa',
                        content: 'whoami\nls\ncat meu_ficheiro.txt\nhistory'
                    },
                    'projects': { 
                        type: 'dir', 
                        owner: 'rafa',
                        contents: {} 
                    }
                }
            },
            'samu': {
                type: 'dir',
                owner: 'samu',
                contents: {
                    'meu_ficheiro.txt': { 
                        type: 'file', 
                        owner: 'samu',
                        content: 'Conteúdo do Samu.\n\nLista de compras:\n- Café\n- Açúcar\n- Pão\n\nPodes modificar este ficheiro livremente.'
                    },
                    '.bash_history': { 
                        type: 'file', 
                        owner: 'samu',
                        content: 'pwd\nls -l\ncd ..\nfind . -name "*.txt"'
                    },
                    'downloads': { 
                        type: 'dir', 
                        owner: 'samu',
                        contents: {} 
                    }
                }
            },
            'ze': {
                type: 'dir',
                owner: 'ze',
                contents: {
                    'meu_ficheiro.txt': { 
                        type: 'file', 
                        owner: 'ze',
                        content: 'Ficheiro do Zé.\n\nIdeias:\n- Melhorar o sistema\n- Adicionar novas funcionalidades\n- Testar tudo\n\nSente-te livre para editar!'
                    },
                    '.bash_history': { 
                        type: 'file', 
                        owner: 'ze',
                        content: 'uname -a\ndate\necho "Hello World"\ncat meu_ficheiro.txt'
                    },
                    'scripts': { 
                        type: 'dir', 
                        owner: 'ze',
                        contents: {} 
                    }
                }
            },
            'antixerox': {
                type: 'dir',
                owner: 'antixerox',
                contents: {
                    '.bash_history': { type: 'file', owner: 'antixerox', content: 'su rodrigo\nsu rafa\nsu samu\nsu ze\nls -la /home' },
                    '.bashrc': { type: 'file', owner: 'antixerox', content: '# ~/.bashrc\nexport PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin\nPS1="\\u@\\h:\\w\\$ "' },
                    'Documents': {
                        type: 'dir',
                        owner: 'antixerox',
                        contents: {
                            'admin_notes.txt': { type: 'file', owner: 'antixerox', content: 'Notas do administrador\n\nUsuários do sistema:\n- rodrigo\n- rafa\n- samu\n- ze\n- antixerox\n\nUse "su <username>" para trocar de usuário.' }
                        }
                    }
                }
            }
        }
    },
    'etc': {
        type: 'dir',
        contents: {
            'passwd': { 
                type: 'file', 
                content: 'root:x:0:0:root:/root:/bin/bash\nrodrigo:x:1001:1001::/home/rodrigo:/bin/bash\nrafa:x:1002:1002::/home/rafa:/bin/bash\nsamu:x:1003:1003::/home/samu:/bin/bash\nze:x:1004:1004::/home/ze:/bin/bash\nantixerox:x:1000:1000::/home/antixerox:/bin/bash'
            },
            'hostname': { type: 'file', content: 'classified-ops-srv01' },
            'hosts': { type: 'file', content: '127.0.0.1\tlocalhost\n127.0.1.1\tclassified-ops-srv01' }
        }
    },
    'tmp': { 
        type: 'dir', 
        contents: {}
    },
    'var': {
        type: 'dir',
        contents: {
            'log': {
                type: 'dir',
                contents: {
                    'auth.log': { type: 'file', content: 'Oct 28 10:15:23 classified-ops-srv01 login: User rodrigo logged in\nOct 28 10:20:45 classified-ops-srv01 login: User rafa logged in\nOct 28 10:25:12 classified-ops-srv01 su: Successful su for antixerox by rodrigo' }
                }
            }
        }
    }
};

let currentUser = 'antixerox';
let currentDir = '/home/antixerox';
let commandHistory = [];
let historyIndex = -1;
const hostname = 'classified-ops-srv01';
let awaitingPassword = false;
let pendingUser = null;

const input = document.getElementById('command-input');
const outputContainer = document.getElementById('output-container');
const promptElement = document.getElementById('prompt');
const terminal = document.getElementById('terminal');

function updatePrompt() {
    const displayDir = currentDir.replace(`/home/${currentUser}`, '~');
    promptElement.textContent = `${currentUser}@${hostname}:${displayDir}$ `;
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
        return `/home/${currentUser}`;
    }
    
    if (path.startsWith('~/')) {
        return `/home/${currentUser}/` + path.slice(2);
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

function canAccess(node) {
    if (!node) return false;
    if (!node.owner) return true;
    if (currentUser === 'antixerox') return true; // admin pode tudo
    return node.owner === currentUser;
}

function addOutput(text, className = 'output') {
    const line = document.createElement('div');
    line.className = className;
    line.textContent = text;
    outputContainer.appendChild(line);
}

function switchUser(username) {
    const validUsers = ['rodrigo', 'rafa', 'samu', 'ze', 'antixerox'];
    
    if (!validUsers.includes(username)) {
        addOutput(`su: user ${username} does not exist`, 'error');
        return;
    }
    
    pendingUser = username;
    awaitingPassword = true;
    input.type = 'password';
    addOutput(`Password: `);
}

function verifyPassword(password) {
    const passwordMap = {
        'rodrigo': ENV_CONFIG.RODRIGO_PASSWORD,
        'rafa': ENV_CONFIG.RAFA_PASSWORD,
        'samu': ENV_CONFIG.SAMU_PASSWORD,
        'ze': ENV_CONFIG.ZE_PASSWORD,
        'antixerox': ENV_CONFIG.ANTIXEROX_PASSWORD
    };
    
    if (passwordMap[pendingUser] === password) {
        currentUser = pendingUser;
        currentDir = `/home/${currentUser}`;
        addOutput(`Switched to user: ${currentUser}`);
        updatePrompt();
    } else {
        addOutput('su: Authentication failure', 'error');
    }
    
    awaitingPassword = false;
    pendingUser = null;
    input.type = 'text';
}

function executeCommand(cmd) {
    const trimmed = cmd.trim();
    
    if (awaitingPassword) {
        verifyPassword(trimmed);
        input.value = '';
        terminal.scrollTop = terminal.scrollHeight;
        return;
    }
    
    if (!trimmed) return;

    addOutput(`${currentUser}@${hostname}:${currentDir.replace(`/home/${currentUser}`, '~')}$ ${cmd}`);
    commandHistory.push(cmd);
    historyIndex = commandHistory.length;

    const parts = trimmed.split(/\s+/);
    const command = parts[0];
    const args = parts.slice(1);

    switch (command) {
        case 'su':
            if (args.length === 0) {
                addOutput('su: missing username', 'error');
            } else {
                switchUser(args[0]);
            }
            break;
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
            addOutput(currentUser);
            break;
        case 'hostname':
            addOutput(hostname);
            break;
        case 'id':
            const uid = currentUser === 'antixerox' ? 1000 : 
                        currentUser === 'rodrigo' ? 1001 :
                        currentUser === 'rafa' ? 1002 :
                        currentUser === 'samu' ? 1003 : 1004;
            addOutput(`uid=${uid}(${currentUser}) gid=${uid}(${currentUser}) groups=${uid}(${currentUser})`);
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
        case 'users':
            addOutput('rodrigo rafa samu ze antixerox');
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
            addOutput('  echo, date, history, su, users, help');
            addOutput('');
            addOutput('To switch user: su <username>');
            addOutput('Available users: rodrigo, rafa, samu, ze, antixerox');
            break;
        case 'env':
            addOutput('PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin');
            addOutput(`HOME=/home/${currentUser}`);
            addOutput(`USER=${currentUser}`);
            addOutput(`SHELL=/bin/bash`);
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

    if (!canAccess(node)) {
        addOutput(`ls: cannot open directory '${pathArg || targetPath}': Permission denied`, 'error');
        return;
    }

    if (node.type === 'file') {
        if (longFormat) {
            const owner = node.owner || currentUser;
            addOutput(`-rw-r--r-- 1 ${owner} ${owner} 1024 Oct 28 10:30 ${pathArg}`, 'file');
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
        const owner = itemNode.owner || currentUser;
        
        if (longFormat) {
            if (itemNode.type === 'dir') {
                prefix = `drwxr-xr-x 2 ${owner} ${owner} 4096 Oct 28 10:30 `;
                className = 'dir';
            } else {
                prefix = `-rw-r--r-- 1 ${owner} ${owner} 1024 Oct 28 10:30 `;
            }
        } else {
            if (itemNode.type === 'dir') {
                className = 'dir';
            }
        }
        
        addOutput(prefix + item, className);
    });
}

function cmdCd(args) {
    if (args.length === 0) {
        currentDir = `/home/${currentUser}`;
        updatePrompt();
        return;
    }

    const targetPath = resolvePath(args[0]);
    const node = getNodeAtPath(targetPath);

    if (!node) {
        addOutput(`cd: ${args[0]}: No such file or directory`, 'error');
        return;
    }

    if (!canAccess(node)) {
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

    if (!canAccess(node)) {
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

input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        executeCommand(input.value);
        input.value = '';
        terminal.scrollTop = terminal.scrollHeight;
    } else if (e.key === 'ArrowUp' && !awaitingPassword) {
        e.preventDefault();
        if (historyIndex > 0) {
            historyIndex--;
            input.value = commandHistory[historyIndex];
        }
    } else if (e.key === 'ArrowDown' && !awaitingPassword) {
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
        if (awaitingPassword) {
            addOutput('');
            awaitingPassword = false;
            pendingUser = null;
            input.type = 'text';
        } else {
            addOutput('^C');
        }
        input.value = '';
    } else if (e.key === 'l' && e.ctrlKey && !awaitingPassword) {
        e.preventDefault();
        cmdClear();
    }
});

document.addEventListener('click', () => {
    input.focus();
});

updatePrompt();
