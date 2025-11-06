async function verifyPassword(password) {
    if (!pendingUser) {
        addOutput('Erro: utilizador não definido', 'error');
        awaitingPassword = false;
        input.type = 'text';
        updatePrompt();
        return;
    }

    if (pendingUser === 'root') {
        try {
            const res = await fetch('/.netlify/functions/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: 'root', password }),
                cache: 'no-store'
            });

            if (!res.ok) {
                addOutput('su: Authentication failure', 'error');
                input.type = 'text';
                awaitingPassword = false;
                pendingUser = null;
                updatePrompt();
                return;
            }

            const data = await res.json();
            if (data && data.ok) {
                currentUser = 'root';
                currentDir = '/root';
                addOutput(`Switched to user: ${currentUser}`);
                input.type = 'text';
                awaitingPassword = false;
                pendingUser = null;
                updatePrompt();
            } else {
                addOutput('su: Authentication failure', 'error');
                input.type = 'text';
                awaitingPassword = false;
                pendingUser = null;
                updatePrompt();
            }
        } catch (err) {
            console.error('Erro ao contactar servidor:', err);
            addOutput('Erro interno ao contactar servidor', 'error');
            input.type = 'text';
            awaitingPassword = false;
            pendingUser = null;
            updatePrompt();
        }
        return;
    }

    if (pendingUser.endsWith('.zip')) {
        const zipPath = resolvePath(pendingUser);
        const zipNode = getNodeAtPath(zipPath);
        
        if (zipNode && zipNode.password === password) {
            const archiveName = pendingUser.replace('.zip', '');
            const extractPath = currentDir + '/' + archiveName + '_extracted';
 
            extractedArchives[archiveName] = true;
            
            addOutput(`Archive: ${pendingUser}`);
            addOutput(` extracting: ${extractPath}`);

            const pathParts = extractPath.split('/').filter(p => p);
            let current = fileSystem;
            
            for (let i = 0; i < pathParts.length - 1; i++) {
                if (!current[pathParts[i]]) {
                    current[pathParts[i]] = {
                        type: 'dir',
                        owner: currentUser,
                        contents: {}
                    };
                }
                current = current[pathParts[i]].contents;
            }
            
            const extractedFolderName = pathParts[pathParts.length - 1];
            current[extractedFolderName] = {
                type: 'dir',
                owner: currentUser,
                contents: JSON.parse(JSON.stringify(zipNode.contents))
            };
            
            addOutput(`Successfully extracted to ${extractPath}/`);
            saveState();
        } else {
            addOutput(`unzip: incorrect password for ${pendingUser}`, 'error');
            addOutput('skipping: ${pendingUser}  incorrect password', 'error');
        }
        
        awaitingPassword = false;
        pendingUser = null;
        input.type = 'text';
        updatePrompt();
        return;
    }

    if (pendingUser.startsWith('.')) {
    const folderName = pendingUser.substring(1);
    const userHome = getNodeAtPath(`/home/${currentUser}`);
    
    if (userHome && userHome.contents && userHome.contents[folderName]) {
        const folder = userHome.contents[folderName];
        
        if (folder.password === password) {
            addOutput(`Acesso concedido à pasta ${folderName}`);
            encryptedDirAccess[folderName] = true;
            currentDir = `/home/${currentUser}/${folderName}`;
            saveState();
        } else {
            addOutput('Senha incorreta', 'error');
        }
    } else {
        addOutput('Erro: pasta não encontrada', 'error');
    }
    
    awaitingPassword = false;
    pendingUser = null;
    input.type = 'text';
    updatePrompt();
    return;
}

    try {
        const res = await fetch('/.netlify/functions/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: pendingUser, password }),
            cache: 'no-store'
        });

        if (!res.ok) {
            addOutput('su: Authentication failure', 'error');
            input.type = 'text';
            awaitingPassword = false;
            pendingUser = null;
            updatePrompt();
            return;
        }

        const data = await res.json();
        if (data && data.ok) {
            currentUser = pendingUser;
            currentDir = `/home/${currentUser}`;
            addOutput(`Switched to user: ${currentUser}`);
            input.type = 'text';
            awaitingPassword = false;
            pendingUser = null;
            updatePrompt();
        } else {
            addOutput('su: Authentication failure', 'error');
            input.type = 'text';
            awaitingPassword = false;
            pendingUser = null;
            updatePrompt();
        }
    } catch (err) {
        console.error('Erro ao contactar servidor:', err);
        addOutput('Erro interno ao contactar servidor', 'error');
        input.type = 'text';
        awaitingPassword = false;
        pendingUser = null;
        updatePrompt();
    }
}


const fileSystem = {
    'root': {
        type: 'dir',
        owner: 'root',
        contents: {
            '.bashrc': { 
                type: 'file', 
                owner: 'root',
                content: '# Root bash configuration\nexport PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin\nPS1="\\[\\033[1;31m\\]\\u@\\h:\\w\\$\\[\\033[0m\\] "' 
            },
            '.bash_history': { 
                type: 'file', 
                owner: 'root',
                content: 'whoami\nls -la /root\ncat /etc/shadow\npasswd' 
            },
            'PEH-CEH_XEROX': { 
                type: 'dir', 
                owner: 'root',
                contents: {
                    'Num_futuro_proximo_uma_ideia_de_milhoes_de_euros.txt': { 
                        type: 'file', 
                        owner: 'root',
                        content: `# Receita — Bolo de Cenoura (fácil, macio e com cobertura de chocolate)

Perfeito para o café — húmido, leve e com cobertura de chocolate. Rende **uma forma média (≈22–24 cm)** — 10–12 fatias.

---

## Ingredientes

### Bolo

* 3 cenouras médias (aprox. 300 g descascadas), cortadas em rodelas
* 3 ovos grandes
* 1 caneca (240 ml) de óleo vegetal (milho, girassol ou canola)
* 2 canecas (400 g) de açúcar granulado
* 2 e 1/2 canecas (300 g) de farinha de trigo (peneirada)
* 1 colher (sopa) de fermento químico em pó (≈15 g)
* 1 pitada de sal
* 1 colher (chá) de essência de baunilha (opcional)
* 1 mão de QWluZGEgYWNoYXMgcXVlIHZhaXMgZW5jb250cmFyIGFsZ28gaW1wb3J0YW50ZSwgc/MgcG9ycXVlIGVzdOFzIG5vIHJvb3Q/IFZhaSB0b21hciBubyBjdSE=

### Cobertura de chocolate (brigadeiro rápido)

* 1 lata (395 g) de leite condensado
* 2 colheres (sopa) de cacau em pó ou 3 colheres (sopa) de chocolate em pó
* 1 colher (sopa) de manteiga
* 2–3 colheres (sopa) de leite (opcional, para ajustar textura)

---

## Equipamento

* Liquidificador ou processador
* Tigela grande e espátula
* Forma de bolo média (22–24 cm) untada e enfarinhada ou forrada com papel manteiga
* Peneira (opcional)

---

## Modo de preparo

### 1. Preparar e aquecer

* Pré-aqueça o forno a **180 °C** (forno médio).
* Unte a forma com manteiga e polvilhe farinha, ou forre com papel manteiga.

### 2. Bater a mistura líquida

* No liquidificador, coloque as **cenouras cortadas**, os **ovos** e o **óleo**. Bata até obter um purê liso (30–60 s).
* Com o liquidificador ligado, adicione o **açúcar** e a **baunilha** (se usar) e bata mais alguns segundos para homogeneizar.

### 3. Misturar os secos

* Em uma tigela grande, peneire a **farinha**, o **sal** e misture. (Peneirar evita grumos.)
* Despeje a mistura do liquidificador sobre a farinha. Misture com espátula ou batedor manual até incorporar — mexa **apenas até sumirem os vestígios secos**. Evite bater demais.
* Por fim, junte o **fermento** e misture delicadamente.

### 4. Assar

* Despeje a massa na forma preparada. Bata levemente a forma sobre a bancada para eliminar bolhas grandes.
* Leve ao forno **pré-aquecido a 180 °C** por **35–45 minutos**. O tempo varia conforme o forno e a forma: faça o teste do palito — espetar no centro deve sair com poucas migalhas úmidas, não massa crua.
* Retire do forno e deixe amornar na forma por ~10–15 minutos, depois desenforme sobre uma grade para esfriar totalmente.

### 5. Fazer a cobertura de chocolate

* Em fogo baixo, misture o **leite condensado**, o **cacau em pó** e a **manteiga** em uma panela pequena. Mexa sem parar até começar a desgrudar levemente do fundo (3–6 minutos — para cobertura mais cremosa, retire antes; para consistência mais firme, cozinhe um pouco mais).
* Se ficar muito firme, acrescente 1–2 colheres de leite e misture.
* Desligue e deixe amornar um pouco. Espalhe sobre o bolo já desenformado e frio. Se preferir brilho mais suave, espalhe imediatamente; para uma camada mais grossa, aguarde amornar mais.

---`
                    }
                }
            }
        }
    },
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
                    'bal.png': { 
                        type: 'file', 
                        owner: 'rodrigo',
                        content: 'Faz get na imagem'
                    },
                    'ck3.png': { 
                        type: 'file', 
                        owner: 'rodrigo',
                        content: 'Faz get na imagem'
                    },
                    'coh.png': { 
                        type: 'file', 
                        owner: 'rodrigo',
                        content: 'Faz get na imagem'
                    },
                    'ff.png': { 
                        type: 'file', 
                        owner: 'rodrigo',
                        content: 'Faz get na imagem'
                    },
                    'fl4.png': { 
                        type: 'file', 
                        owner: 'rodrigo',
                        content: 'Faz get na imagem'
                    },
                    'gow2.png': { 
                        type: 'file', 
                        owner: 'rodrigo',
                        content: 'Faz get na imagem'
                    },
                    'hk.png': { 
                        type: 'file', 
                        owner: 'rodrigo',
                        content: 'Faz get na imagem'
                    },
                    'metro.png': { 
                        type: 'file', 
                        owner: 'rodrigo',
                        content: 'Faz get na imagem'
                    },
                    'mm.png': { 
                        type: 'file', 
                        owner: 'rodrigo',
                        content: 'Faz get na imagem'
                    },
                    'mtg.png': { 
                        type: 'file', 
                        owner: 'rodrigo',
                        content: 'Faz get na imagem'
                    },
                    'mtgs.png': { 
                        type: 'file', 
                        owner: 'rodrigo',
                        content: 'Faz get na imagem'
                    },
                    'rdr2.png': { 
                        type: 'file', 
                        owner: 'rodrigo',
                        content: 'Faz get na imagem'
                    },
                    'skrm.png': { 
                        type: 'file', 
                        owner: 'rodrigo',
                        content: 'Faz get na imagem'
                    },
                    'stm.png': { 
                        type: 'file', 
                        owner: 'rodrigo',
                        content: 'Faz get na imagem'
                    },
                    'tlou.png': { 
                        type: 'file', 
                        owner: 'rodrigo',
                        content: 'Faz get na imagem'
                    },
                    'zmm.png': { 
                        type: 'file', 
                        owner: 'rodrigo',
                        content: 'Faz get na imagem'
                    },
                    'Documents': { 
                        type: 'dir', 
                        owner: 'rodrigo',
                        contents: {} 
                    },
                    '.nomedia.zip': {
                    type: 'zip',
                    owner: 'rodrigo',
                    password: 'palmeirasnuncateramundial',
                    encrypted: true,
                    contents: {
                        'chaves_pgp.sh': {
    type: 'file',
    owner: 'rodrigo',
    content: `#!/bin/bash

# Criar diretório e ficheiro public.key
echo "Criando /usr/local/bin/public.key..."
sudo mkdir -p /usr/local/bin
sudo tee /usr/local/bin/public.key > /dev/null << 'EOF'
-----BEGIN PGP PUBLIC KEY BLOCK-----
Version: Keybase OpenPGP v2.1.15
Comment: https://keybase.io/crypto

xo0EaQptLQEEAPSCOUdiQXMLCwY/VaMyLoSJSBpj3zqZ6AGJRq5sKRLlv7KKEHSv
sY+uTMD4x0RiFdlutNlUlRcLiah3bg/Mee6M15xvx81eq9hrHv8rfhBzsHCqSg9A
wUo5KcVu8j8D3Yt3FTmrf4u8uDqDXIXT2qqWENktaKuBCykcs9MkoW2NABEBAAHN
AMK0BBMBCgAeBQJpCm0tAhsvAwsJBwMVCggCHgECF4ADFgIBAhkBAAoJEKAkM72S
jGtnc1kEAK57Z6uewQCEnvskvDA2DPesPkTi9EQI2OGoR4fZQl5swBmK618JDtjr
8gd/ERr2Y2NaGGmkPoF29pXwqiHWnEWYTzKQySalPgD5xMkB1R7sIxUQ+rv1ZTQh
BC65+rx+97ZvI3rCXJQkdA8oluIXNmBXYKs6U13aJoUJRijP7+VAzo0EaQptLQEE
AMF68cfBvgeglDhs0SX2iQ3TqJi7UnnRYl9F7cID1UI/+M8swYrwE+n+FSXpogVs
miqjUkmGXu2DgmTiRvLoX5ZipNhGcgGUihK6mzsYkwSWWOPUgvHPDP790k4qNSoH
JKrY0bMNZcI9FGuGbwV5FzEhNpQkBhEK2iLW6+NHx4BbABEBAAHCwIMEGAEKAA8F
AmkKbS0FCQ8JnAACGy4AqAkQoCQzvZKMa2edIAQZAQoABgUCaQptLQAKCRAgJbLM
osR7rCtBA/9VPUhcBxW4oUsJu5Pm64xUg8NNy0FyYbWUX9xV5bjJkz2HNUwseRnL
N4QjAIHA1IM86UqH5nJMUQxNu/Nug6Jb4tbLv83gptmmqiCpRGHOhmTE1kfGsUgU
xpBzfm2sHmq8jk4Zvhdgd5s33GqSYJhgxi027TRZl8KmIai7FZMAJHfUA/44R7KH
9pvAeE26bW4MR+CU0eXkO66dWoVukh1ZgbQpX1NoSum7SV9aqJC8aiqwc3YWgQKl
EsabMFfD73G4fbtlpe77wSTx78L3F88nNmZ5JWqUjfzh7fMT6siiKrm0y43PWB3u
PAyNTT9l0Yd48jNWIUXnPShc8WCTvelIrJAQ9c6NBGkKbS0BBADa+I3l+elZfN3M
nvztw9GCdDn7/ZahXBFE1a0Je7Ih1NGAQv0RA/6LWxnae/O+HAyZxgbwM4fY+pIF
saRpCF+UB635c5bJMteGcyvGLkcZI8ITpo0Z6vKund3ry+Mp7MMUsrJZZDYX1aKK
TA/GB6eLPENYU66dgvHxglm1v/XpBQARAQABwsCDBBgBCgAPBQJpCm0tBQkPCZwA
AhsuAKgJEKAkM72SjGtnnSAEGQEKAAYFAmkKbS0ACgkQK/JwGqH6Pl4IMAQAi8Cp
JpLZxJ2ThAzhKNQ86EYx1d1aRBVZpg45NiUYFz+uVn6heKfEm5i6C5v8pr8H7fqT
zbRNt5fjyF2zdGv9Jye0vweGXLpII+eaV94JzJvqUL3+uR66q4vdMTOoS9u3GtXz
zgYcN3PLyJsxIhC35fz2USrq01oZEBYTj0GXOqP0fQP/cAPfNHf/+fAVKaCEE/02
Mpy5MQf6DYPNHCqm4VRQukAFlvC2SxLd31VzUYJP46m3ewrvFE2C7T1AZ4ZYKmeJ
iTg+rrtEle/9b+r2oCAIgIoPceWjm2nNVLLS3UZw6V9K+6WGPCk8KWclkYxMZvju
+SQE/gdOAygfSD9b6FBSNbw=
=r0p+
-----END PGP PUBLIC KEY BLOCK-----
EOF

# Criar diretório e ficheiro priv.key
echo "Criando /boot/EFI/BOOT/priv.key..."
sudo mkdir -p /boot/EFI/BOOT
sudo tee /boot/EFI/BOOT/priv.key > /dev/null << 'EOF'
-----BEGIN PGP PRIVATE KEY BLOCK-----
Version: Keybase OpenPGP v2.1.15
Comment: https://keybase.io/crypto

xcEXBGkKbS0BBAD0gjlHYkFzCwsGP1WjMi6EiUgaY986megBiUaubCkS5b+yihB0
r7GPrkzA+MdEYhXZbrTZVJUXC4mod24PzHnujNecb8fNXqvYax7/K34Qc7BwqkoP
QMFKOSnFbvI/A92LdxU5q3+LvLg6g1yF09qqlhDZLWirgQspHLPTJKFtjQARAQAB
AAP4joL16YzCtpZleoiNPxZn/LppvW4gAeWBdu2bBN2ZnO8HUVyACapKJ5cmG46W
R5j3j4PejEPPK/z09V6m9CIXn6LIoniWdAREZCk3vi6gy+8+jjeDMebwOVuLbRma
mMacoHrScDX53C7V/aT3Cby9TLHDbWTy6br2QnexvHySGQIA/+C9ZRcs1qU6bifz
NfMzGU3x5LMWV8Ik1P+FKsD32Te5JZmLOP+5oXoPx9kDVbKJ9QpkdUVvCFvh5Mia
23FJiQIA9KAYT6Dz9XwRjqTsuH52XtWpPFE1ojGkLJI5Fuf9oalz7jFrrVetaIqU
abLXCglyI3llXtZk2HMdThqUU1n25QIAxIzI8mO18I+jEnwODHxCmDJLOVcDa2yW
uiHN4EA75R7YBAudNNpDWFgT0d9YYNlZzAaS8tCL4SdKtgwsaTUT/6WPzQDCtAQT
AQoAHgUCaQptLQIbLwMLCQcDFQoIAh4BAheAAxYCAQIZAQAKCRCgJDO9koxrZ3NZ
BACue2ernsEAhJ77JLwwNgz3rD5E4vRECNjhqEeH2UJebMAZiutfCQ7Y6/IHfxEa
9mNjWhhppD6BdvaV8Koh1pxFmE8ykMkmpT4A+cTJAdUe7CMVEPq79WU0IQQuufq8
fve2byN6wlyUJHQPKJbiFzZgV2CrOlNd2iaFCUYoz+/lQMfBGARpCm0tAQQAwXrx
x8G+B6CUOGzRJfaJDdOomLtSedFiX0XtwgPVQj/4zyzBivAT6f4VJemiBWyaKqNS
SYZe7YOCZOJG8uhflmKk2EZyAZSKErqbOxiTBJZY49SC8c8M/v3STio1KgckqtjR
sw1lwj0Ua4ZvBXkXMSE2lCQGEQraItbr40fHgFsAEQEAAQAD/1UkbVGiiKWCnLdX
65HxM87J3d+YT2scIVYbx80hMq+8xxkkcOdbTughz9ynO413hUBOLt/8KboLrU4H
5YDvkWAwjePne6zp8BZ0b9fOqXRoYIRZH3ejBG7EamF1qCDbhW+qrg9ANiXv8JbQ
Fo9vXyww+P1V0aEjMX5PGOIEvsxBAgDjGWnt3mfKOcsDYME87fdgTd28wkdzsvhq
CFQRNKa00drDLUweEDFojrm7J05WTmBpBu/qSzsDjzFpIeYXm3/XAgDaGkTBiWgs
er37fI0LbMhQD5kAyB1yLnqs2J/XKMpNOcnDbg92fnxA5n7fQgniPxcpnjkUCAkv
iJGOiG9BWYMdAf43c5gDYhqzoe8N8/cGk2CA67iGvGOguRDkrVJsDI4dpPM9K89U
T03BR31FF5k8+SL9Mv7VbkvlddOFCevo3YaLnZXCwIMEGAEKAA8FAmkKbS0FCQ8J
nAACGy4AqAkQoCQzvZKMa2edIAQZAQoABgUCaQptLQAKCRAgJbLMosR7rCtBA/9V
PUhcBxW4oUsJu5Pm64xUg8NNy0FyYbWUX9xV5bjJkz2HNUwseRnLN4QjAIHA1IM8
6UqH5nJMUQxNu/Nug6Jb4tbLv83gptmmqiCpRGHOhmTE1kfGsUgUxpBzfm2sHmq8
jk4Zvhdgd5s33GqSYJhgxi027TRZl8KmIai7FZMAJHfUA/44R7KH9pvAeE26bW4M
R+CU0eXkO66dWoVukh1ZgbQpX1NoSum7SV9aqJC8aiqwc3YWgQKlEsabMFfD73G4
fbtlpe77wSTx78L3F88nNmZ5JWqUjfzh7fMT6siiKrm0y43PWB3uPAyNTT9l0Yd4
8jNWIUXnPShc8WCTvelIrJAQ9cfBGARpCm0tAQQA2viN5fnpWXzdzJ787cPRgnQ5
+/2WoVwRRNWtCXuyIdTRgEL9EQP+i1sZ2nvzvhwMmcYG8DOH2PqSBbGkaQhflAet
+XOWyTLXhnMrxi5HGSPCE6aNGeryrp3d68vjKezDFLKyWWQ2F9WiikwPxgenizxD
WFOunYLx8YJZtb/16QUAEQEAAQAD/iMrHfE0jvWkMCRb2aAfXfAfliuCelWeqZhe
YC0AfKbh3ScGO0pnE5QStOeKFmbvbteovjcIc7ZV4it/cTo8UcsyoBmFMB/opyIK
FE1lEIg2yZDp6hekWcLQ+Z6E/6j1+YaZ4ryELYK5aAw/D2Br1lk9i18oinoBpxEl
7a5zeq55AgD/C9z+oVmI9xUwc9gFfPaCbJSdf0ZgVNb6DmjiBxxwUP0p//E0Mol8
wa2td44O/D9bB7Ze748+tooj4veSo5VNAgDbyiiihWwLjNIzP3Yf8DvhT3jJByxP
Ppokz/ewfMG3RF9CeRu935M2pUVYLOOgPhFJS4WNBlo8sM69oZTrCWaZAgDbClb1
J/LXNA0rsRz7nGYDDfW/YKFowenTnNbGyjTsUyfaocy2FYRi/x7/D3efDiqkAwkc
8Krxl9iq42xEACVSnG/CwIMEGAEKAA8FAmkKbS0FCQPCZwACGy4AqAkQoCQzvZKM
a2edIAQZAQoABgUCaQptLQAKCRAr8nAaofo+XggwBACLwKkmktnEnZOEDOEo1Dzo
RjHV3VpEFVmmDjk2JRgXP65WfqF4p8SbmLoLm/ymvwft+pPNtE23l+PIXbN0a/0n
J7S/B4Zcukgj55pX3gnMm+pQvf65Hrqri90xM6hL27ca1fPOBhw3c8vImzEiELfl
/PZRKurTWhkQFhOPQZc6o/R9A/9wA980d//58BUpoIQT/TYynLkxB/oNg80cKqbh
VFC6QAWW8LZLEt3fVXNRgk/jqbd7Cu8UTYLtPUBnhlgqZ4mJOD6uu0SV7/1v6vag
IAiAig9x5aObac1UstLdRnDpX0r7pYY8KTwpZyWRjExm+O75JAT+B04DKB9IP1vo
UFI1vA==
=0t5V
-----END PGP PRIVATE KEY BLOCK-----
EOF

# Criar ficheiro logs_root.txt em /boot/EFI/BOOT
echo "Criando /boot/EFI/BOOT/logs_root.txt..."
sudo tee /boot/EFI/BOOT/logs_root.txt > /dev/null << 'EOF'
[15/05/2025 08:23] user:root; pass:admin123; status:NOT FOUND
[16/05/2025 14:47] user:root; pass:Password123!; status:NOT FOUND  
[17/05/2025 09:12] user:root; pass:root@2024; status:NOT FOUND
[18/05/2025 16:35] user:root; pass:ClassifiedServer!1; status:NOT FOUND
[19/05/2025 11:08] user:root; pass:SuperSecret2024; status:NOT FOUND
[20/05/2025 19:52] user:root; pass:P@ssw0rd!; status:NOT FOUND
[21/05/2025 07:15] user:root; pass:SecureRoot#2024; status:NOT FOUND
[22/05/2025 13:41] user:root; pass:BibPortoSuperBock; status:NOT FOUND
[23/05/2025 10:27] user:root; pass:Ant1x€r0x2024; status:NOT FOUND
[24/05/2025 18:03] user:root; pass:PEH-CEH-XEROX; status:NOT FOUND
[25/05/2025 06:19] user:root; pass:TerminalLock2024; status:NOT FOUND
[26/05/2025 15:44] user:root; pass:CyberSec@123; status:NOT FOUND
[27/05/2025 12:31] user:root; pass:RootAccess!999; status:NOT FOUND
[28/05/2025 20:16] user:root; pass:Admin@Server01; status:NOT FOUND
[29/05/2025 09:05] user:root; pass:MasterKey#2025; status:NOT FOUND
[30/05/2025 17:28] user:root; pass:ServerRoot2024; status:NOT FOUND
[31/05/2025 08:52] user:root; pass:LinuxAdmin!123; status:NOT FOUND
[01/06/2025 14:37] user:root; pass:SuperUser@456; status:NOT FOUND
[02/06/2025 10:14] user:root; pass:RootPrivilege789; status:NOT FOUND
[03/06/2025 19:49] user:root; pass:AdminPassword#000; status:NOT FOUND
[04/06/2025 07:23] user:root; pass:SecureAccess2025; status:NOT FOUND
[05/06/2025 16:58] user:root; pass:RootMasterKey!; status:NOT FOUND
[06/06/2025 13:12] user:root; pass:SystemAdmin@2024; status:NOT FOUND
[07/06/2025 21:45] user:root; pass:ClassifiedRootPass; status:NOT FOUND
[08/06/2025 06:49] user:root; pass:TerminalAccess2025; status:NOT FOUND
EOF

# Criar ficheiro mensagem em /tmp
echo "Criando /tmp/mensagem..."
tee /tmp/mensagem > /dev/null << 'EOF'
-----BEGIN PGP MESSAGE-----
Version: Keybase OpenPGP v2.1.15
Comment: https://keybase.io/crypto

wYwDICWyzKLEe6wBBACO2e1e1zpYZXzglue+nkcVheT6AusegXFatiRN84ELqFna
XOBgCIAEbSyUgejhjg7hycm1HHduWzXzwj9X5Ua5CCEocREi/26j1FmrvRl2lyIG
DR6DINMosknWnWiw1GKNwlR8/KloGO5JueNOF0+tkHzCWq/43hTOmBruDn+LMNLA
RgGhA94QZJTkRDn+2ZoHg5NjQ/6Yq8M6pFp7/subFRBOxX4jKuaGDYApt8hmt0RD
+bN1qSes0EiE3h546VyUYSALjwNqUBBSnPhcE6HN7tJcdlH/ZyL7G/ifEEwgSv4v
73JsZkoQjsHs9f9Gs+van/G6EmMPPTOb5pbJUz/SNFhxXud8ZQUxif0YBAIU8kZM
g2W2l5I3ATqDhwHkN26ePsKvuoC8tQjanFPNh/zDfM403miYDWajf7RDr4IyvVky
iR/xCqnEBJ1f4UJ1uu5623dkU7ybDcAwHNOOwPcFoYTZ24HyHqHE9nRK1RfEdZIX
D3kPl1WFDCikRA1LuLkaUKOEMwf9lhw=
=7Ejw
-----END PGP MESSAGE-----
EOF`
}
                    }
                },
                '.pasta_pessoal': {
            type: 'encrypted_dir',
            owner: 'rodrigo',
            password: 'SZ6QVP4Q',
            encrypted: true,
            contents: {
                'fibonacci.png': {
                    type: 'file',
                    owner: 'rodrigo',
                    content: 'Faz get em fibonacci.png'
                },
                'nota.txt': {
                    type: 'file',
                    owner: 'rodrigo',
                    content: 'Deves precisar desta string acredito eu! Toma 🫱 yjuvnrajbjrwmjwjxcnvvdwmrju'
                },
            }
        },
        '.balatro': {
            type: 'encrypted_dir',
            owner: 'rodrigo',
            password: 'palmeirasaindanaotemmundial',
            encrypted: true,
            contents: {
                'BALATRO.png': {
                            type: 'file',
                            owner: 'rodrigo',
                            content: 'Faz get da imagem BALATRO.png'
                        }
            }
        },
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
                        contents: {
                            'nota.txt': { 
                        type: 'file', 
                        owner: 'rafa',
                        content: 'Estávamos a desenvolver um código de encriptação. O Rodrigo usa a mesma password na app e no servidor. Infelizmente o computador desligou e perdemos tudo, mas ainda há um backup na cache do sistema em /tmp.'
                    }
                        } 
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
                        content: 'Conteúdo do Samu.\n\nLista de compras:\n- Café\n- Açúcar\n- Pão\n- Bola de Berlim\n\nPodes modificar este ficheiro livremente.'
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
                    },
                    'www.google.com': { 
                        type: 'dir', 
                        owner: 'samu',
                        contents: {
                            'index.html': { 
                                type: 'file', 
                                owner: 'samu',
                                content: `<!DOCTYPE html>
                    <html>
                    <head>
                    <title>Google (Offline Clone)</title>
                    <meta charset="UTF-8">
                    <style>
                    body { font-family: Arial, sans-serif; text-align: center; margin-top: 10%; background: #fff; color: #202124; }
                    input[type="text"] { width: 400px; padding: 8px; border: 1px solid #dfe1e5; border-radius: 24px; outline: none; }
                    button { margin-left: 8px; padding: 8px 16px; border: none; background-color: #1a73e8; color: white; border-radius: 4px; cursor: pointer; }
                    button:hover { background-color: #1669c1; }
                    footer { margin-top: 80px; font-size: 12px; color: #70757a; }
                    </style>
                    </head>
                    <body>
                    <h1>Google<span style="color:#4285f4;">.</span><span style="color:#ea4335;">.</span><span style="color:#fbbc05;">.</span><span style="color:#34a853;">.</span></h1>
                    <input type="text" placeholder="Pesquisa offline...">
                    <button>Pesquisar</button>
                    <footer>Este Google está em modo offline (servidor: samu@classified-ops-srv01)</footer>
                    </body>
                    </html>`
                            },
                            'robots.txt': { 
                                type: 'file', 
                                owner: 'samu',
                                content: `User-agent: *
                    Disallow: /classified
                    Disallow: /_internal
                    Disallow: /the-truth
                    `
                            },
                            'README.txt': { 
                                type: 'file', 
                                owner: 'samu',
                                content: `Projeto experimental: "Offline Google"

                    O Samu parece ter feito um mirror do site da Google em modo local, provavelmente para testes internos.

                    Notas:
                    - index.html é uma versão simplificada.
                    - Ficheiros secretos possivelmente escondidos em /classified.
                    - Não partilhar fora da rede.

                    Autor: samu@classified-ops-srv01
                    Data: 2025-10-29`
                            },
                            'classified': {
                                type: 'dir',
                                owner: 'samu',
                                contents: {
                                    'search_logs.txt': {
                                        type: 'file',
                                        owner: 'samu',
                                        content: `=== Search Logs ===
                    [2025-10-25 14:23] query="como provar que o rafa vive em matosinhos"
                    [2025-10-25 14:25] query="como encontrar o meu amigo zé se for raptado por o pai natal para a fábrica dele!"
                    [2025-10-25 14:30] query="porque a rita acha uma bola de berlim tão supeita"
                    [2025-10-25 14:34] query="o samuel oliveira está solteiro?"
                    [2025-10-25 15:01] query="delete system32" (bloqueado)`
                                    },
                                    'api_key.txt': {
                                        type: 'file',
                                        owner: 'samu',
                                        content: 'AIzaSyFakeKey-12345-CLONED-LOCAL-TEST'
                                    }
                                }
                            }
                        }
                    },
                    'music': { 
                        type: 'dir', 
                        owner: 'samu',
                        contents: {
                            'Anthrax': { 
                                type: 'file', 
                                owner: 'samu',
                                content: '7b61467a0e5084ff727ac81a79cfa3a1'
                            },
                            'MegaDeth': { 
                                type: 'file', 
                                owner: 'samu',
                                content: 'c1db7f29e6b551f4fa48d6901eca6be6'
                            },
                            'ToddlerStomper': { 
                                type: 'file', 
                                owner: 'samu',
                                content: '2bfbbe5800dd0874b39bd5a07952cf62'
                            },
                            'ze': { 
                                type: 'file', 
                                owner: 'samu',
                                content: 'f8e8eb9612969985e7df4657f8c49bddcbddf8c509bc82799eaa4d1fcaa1360b'
                            }
                        } 
                    },
                    'roleta-russa': { 
                        type: 'dir', 
                        owner: 'samu',
                        contents: {
                            '1': { 
                                type: 'file', 
                                owner: 'samu',
                                content: 'Safe... por agora. Continua'
                            },
                            '2': { 
                                type: 'file', 
                                owner: 'samu',
                                content: 'Safe... por agora. Continua'
                            },
                            '3': { 
                                type: 'file', 
                                owner: 'samu',
                                content: 'Safe... por agora. Continua'
                            },
                            '4': {
                                type: 'file', 
                                owner: 'samu',
                                content: `<!DOCTYPE html>
                            <html>
                            <head>
                                <meta charset="UTF-8">
                                <title>FIM DO JOGO</title>
                                <style>
                                    * {
                                        margin: 0;
                                        padding: 0;
                                        box-sizing: border-box;
                                    }
                                    
                                    body {
                                        background: #0a0a0a;
                                        color: #8B0000;
                                        font-family: 'Courier New', monospace;
                                        overflow: hidden;
                                        height: 100vh;
                                        position: relative;
                                        cursor: none;
                                    }
                                    
                                    .screen-overlay {
                                        position: fixed;
                                        top: 0;
                                        left: 0;
                                        width: 100%;
                                        height: 100%;
                                        background: 
                                            radial-gradient(circle at 20% 30%, rgba(139, 0, 0, 0.1) 0%, transparent 50%),
                                            radial-gradient(circle at 80% 70%, rgba(139, 0, 0, 0.15) 0%, transparent 50%),
                                            radial-gradient(circle at 40% 80%, rgba(139, 0, 0, 0.1) 0%, transparent 50%);
                                        z-index: 1;
                                        pointer-events: none;
                                    }
                                    
                                    .blood-container {
                                        position: fixed;
                                        top: 0;
                                        left: 0;
                                        width: 100%;
                                        height: 100%;
                                        z-index: 10;
                                        pointer-events: none;
                                    }
                                    
                                    .blood-drip {
                                        position: absolute;
                                        top: -100px;
                                        width: 25px;
                                        height: 180px;
                                        background: linear-gradient(to bottom, 
                                            transparent 0%, 
                                            #600000 10%, 
                                            #8B0000 40%, 
                                            #4B0000 80%, 
                                            #300000 100%);
                                        animation: drip 3.5s ease-in forwards;
                                        filter: blur(2px);
                                        border-radius: 0 0 12px 12px;
                                        transform: skewX(-5deg);
                                        box-shadow: 
                                            inset 2px 0 3px rgba(255, 255, 255, 0.1),
                                            inset -2px 0 3px rgba(0, 0, 0, 0.3);
                                    }
                                    
                                    .blood-splash {
                                        position: absolute;
                                        width: 120px;
                                        height: 80px;
                                        background: radial-gradient(ellipse, 
                                            rgba(139, 0, 0, 0.8) 0%, 
                                            rgba(75, 0, 0, 0.6) 40%, 
                                            transparent 70%);
                                        animation: splash 2s ease-out forwards;
                                        filter: blur(4px);
                                        z-index: 12;
                                    }
                                    
                                    .blood-pool {
                                        position: absolute;
                                        bottom: 0;
                                        left: 0;
                                        width: 100%;
                                        height: 0;
                                        background: 
                                            radial-gradient(ellipse at center, #8B0000 0%, #4B0000 50%, #300000 100%),
                                            linear-gradient(to top, transparent 0%, rgba(0, 0, 0, 0.3) 100%);
                                        animation: fill 6s ease-in-out forwards;
                                        z-index: 5;
                                        border-radius: 50% 50% 0 0;
                                        box-shadow: 
                                            inset 0 10px 30px rgba(0, 0, 0, 0.7),
                                            0 -5px 20px rgba(139, 0, 0, 0.4);
                                    }
                                    
                                    .blood-pool-surface {
                                        position: absolute;
                                        bottom: 0;
                                        left: 0;
                                        width: 100%;
                                        height: 0;
                                        background: linear-gradient(to top, 
                                            rgba(255, 255, 255, 0.1) 0%,
                                            rgba(255, 255, 255, 0.05) 10%,
                                            transparent 30%);
                                        animation: fill 6s ease-in-out forwards;
                                        z-index: 6;
                                        border-radius: 50% 50% 0 0;
                                    }
                                    
                                    .face {
                                        position: absolute;
                                        top: 50%;
                                        left: 50%;
                                        transform: translate(-50%, -50%);
                                        width: 400px;
                                        height: 400px;
                                        z-index: 15;
                                        opacity: 0;
                                        animation: faceAppear 4s ease-in 1.5s forwards;
                                        filter: drop-shadow(0 0 20px rgba(139, 0, 0, 0.5));
                                    }
                                    
                                    .face::before {
                                        content: '';
                                        position: absolute;
                                        top: -10px;
                                        left: -10px;
                                        right: -10px;
                                        bottom: -10px;
                                        background: radial-gradient(circle, rgba(139, 0, 0, 0.3) 0%, transparent 0%);
                                        border-radius: 50%;
                                        z-index: -1;
                                        animation: pulse 3s ease-in-out infinite;
                                    }
                                    
                                    .eye {
                                        position: absolute;
                                        top: 90px;
                                        width: 55px;
                                        height: 55px;
                                        background: radial-gradient(circle, #000 40%, #400 100%);
                                        border-radius: 50%;
                                        animation: blink 5s infinite;
                                        boxShadow: '0 0 20px rgba(255, 0, 0, 0.6)
                                    }

                                    .eye::after {
                                        content: "''",
                                        position: 'absolute',
                                        top: '12px',
                                        left: '12px',
                                        width: '18px',
                                        height: '18px',
                                        background: 'radial-gradient(circle, #8B0000 0%, #400 100%)',
                                        borderRadius: '50%',
                                        animation: 'glow 1.5s ease-in-out infinite alternate',
                                    }

                                    .eye.left { left: 70px; }
                                    .eye.right { right: 70px; }

                                    /* sorriso mais fino e elegante */
                                    .smile {
                                        position: absolute;
                                        bottom: 100px; /* estava 120px, baixei */
                                        left: 50%;
                                        transform: translateX(-50%);
                                        width: 240px;
                                        height: 110px;
                                        border: 10px solid #000;
                                        border-top: none;
                                        border-radius: 0 0 140px 140px;
                                        animation: smileTwitch 4s ease-in-out infinite;
                                    }

                                    .smile::before {
                                        content: '';
                                        position: absolute;
                                        bottom: -5px;
                                        left: 50%;
                                        transform: translateX(-50%);
                                        width: 160px;
                                        height: 35px;
                                        background: linear-gradient(to top, rgba(139, 0, 0, 0.5) 0%, transparent 100%);
                                        border-radius: 50%;
                                        filter: blur(6px);
                                    }
                                    
                                    .message {
                                        position: absolute;
                                        top: 50px;
                                        left: 50%;
                                        transform: translateX(-50%);
                                        font-size: 52px;
                                        font-weight: bold;
                                        color: #8B0000;
                                        text-align: center;
                                        z-index: 20;
                                        opacity: 0;
                                        animation: messageAppear 2.5s ease-in 0.5s forwards;
                                        text-shadow: 
                                            3px 3px 6px rgba(0, 0, 0, 0.8),
                                            0 0 20px rgba(139, 0, 0, 0.7),
                                            0 0 40px rgba(255, 0, 0, 0.4);
                                        font-family: 'Arial Black', sans-serif;
                                        letter-spacing: 2px;
                                        text-transform: uppercase;
                                    }
                                    
                                    .sub-message {
                                        position: absolute;
                                        top: 120px;
                                        left: 50%;
                                        transform: translateX(-50%);
                                        font-size: 24px;
                                        color: #660000;
                                        text-align: center;
                                        z-index: 20;
                                        opacity: 0;
                                        animation: subMessageAppear 3s ease-in 2s forwards;
                                        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.6);
                                        font-family: 'Courier New', monospace;
                                    }
                                    
                                    .blood-droplet {
                                        position: absolute;
                                        width: 8px;
                                        height: 12px;
                                        background: linear-gradient(to bottom, #8B0000, #600000);
                                        border-radius: 50% 50% 40% 40%;
                                        animation: dropletFall 4s linear infinite;
                                        filter: blur(1px);
                                        z-index: 8;
                                    }
                                    
                                    @keyframes drip {
                                        0% {
                                            top: -100px;
                                            opacity: 0;
                                            transform: skewX(-5deg) scaleY(0.8);
                                        }
                                        20% {
                                            opacity: 1;
                                        }
                                        80% {
                                            opacity: 0.9;
                                        }
                                        100% {
                                            top: 100vh;
                                            opacity: 0;
                                            transform: skewX(-5deg) scaleY(1.2);
                                        }
                                    }
                                    
                                    @keyframes splash {
                                        0% {
                                            transform: scale(0) rotate(0deg);
                                            opacity: 0;
                                        }
                                        50% {
                                            transform: scale(1) rotate(180deg);
                                            opacity: 0.8;
                                        }
                                        100% {
                                            transform: scale(1.2) rotate(360deg);
                                            opacity: 0;
                                        }
                                    }
                                    
                                    @keyframes fill {
                                        0% {
                                            height: 0%;
                                        }
                                        100% {
                                            height: 0%;
                                        }
                                    }
                                    
                                    @keyframes faceAppear {
                                        0% {
                                            opacity: 0;
                                            transform: translate(-50%, -50%) scale(0.3) rotate(-10deg);
                                        }
                                        60% {
                                            transform: translate(-50%, -50%) scale(1.1) rotate(5deg);
                                        }
                                        100% {
                                            opacity: 1;
                                            transform: translate(-50%, -50%) scale(1) rotate(0deg);
                                        }
                                    }
                                    
                                    @keyframes blink {
                                        0%, 42%, 46%, 90%, 94%, 100% {
                                            height: 65px;
                                        }
                                        44%, 92% {
                                            height: 5px;
                                        }
                                    }
                                    
                                    @keyframes messageAppear {
                                        0% {
                                            opacity: 0;
                                            transform: translateX(-50%) translateY(-30px) scale(1.2);
                                            filter: blur(10px);
                                        }
                                        60% {
                                            transform: translateX(-50%) translateY(0) scale(0.95);
                                        }
                                        100% {
                                            opacity: 1;
                                            transform: translateX(-50%) translateY(0) scale(1);
                                            filter: blur(0);
                                        }
                                    }
                                    
                                    @keyframes subMessageAppear {
                                        0% {
                                            opacity: 0;
                                            transform: translateX(-50%) translateY(20px);
                                        }
                                        100% {
                                            opacity: 0.8;
                                            transform: translateX(-50%) translateY(0);
                                        }
                                    }
                                    
                                    @keyframes pulse {
                                        0%, 100% {
                                            opacity: 0.3;
                                            transform: scale(1);
                                        }
                                        50% {
                                            opacity: 0.6;
                                            transform: scale(1.1);
                                        }
                                    }
                                    
                                    @keyframes glow {
                                        0% {
                                            opacity: 0.7;
                                            transform: scale(1);
                                        }
                                        100% {
                                            opacity: 1;
                                            transform: scale(1.1);
                                        }
                                    }
                                    
                                    @keyframes smileTwitch {
                                        0%, 90%, 93%, 100% {
                                            transform: translateX(-50%) scaleY(1);
                                        }
                                        91%, 92% {
                                            transform: translateX(-50%) scaleY(0.8);
                                        }
                                    }
                                    
                                    @keyframes dropletFall {
                                        0% {
                                            transform: translateY(-100px) rotate(0deg);
                                            opacity: 0;
                                        }
                                        10% {
                                            opacity: 1;
                                        }
                                        90% {
                                            opacity: 0.8;
                                        }
                                        100% {
                                            transform: translateY(100vh) rotate(360deg);
                                            opacity: 0;
                                        }
                                    }
                                    
                                    .screen-flicker {
                                        position: fixed;
                                        top: 0;
                                        left: 0;
                                        width: 100%;
                                        height: 100%;
                                        background: rgba(139, 0, 0, 0.1);
                                        animation: flicker 0.3s infinite;
                                        z-index: 2;
                                        pointer-events: none;
                                        mix-blend-mode: overlay;
                                    }
                                    
                                    @keyframes flicker {
                                        0%, 100% { opacity: 0.1; }
                                        50% { opacity: 0.3; }
                                    }
                                </style>
                            </head>
                            <body>
                                <div class="screen-overlay"></div>
                                <div class="screen-flicker"></div>
                                
                                <div class="message">Ant1x€r0x</div>
                                <div class="sub-message">O sistema não responde...</div>
                                
                                <div class="blood-container" id="bloodContainer"></div>
                                <div class="blood-pool"></div>
                                <div class="blood-pool-surface"></div>
                                
                                <div class="face">
                                    <div class="eye left"></div>
                                    <div class="eye right"></div>
                                    <div class="smile"></div>
                                </div>
                                
                                <script>
                                    // Criar gotas de sangue realistas
                                    function createBloodDrips() {
                                        const container = document.getElementById('bloodContainer');
                                        
                                        // Gotas principais
                                        for (let i = 0; i < 35; i++) {
                                            const drip = document.createElement('div');
                                            drip.className = 'blood-drip';
                                            drip.style.left = Math.random() * 100 + 'vw';
                                            drip.style.animationDelay = (Math.random() * 4) + 's';
                                            drip.style.width = (15 + Math.random() * 35) + 'px';
                                            drip.style.height = (50 + Math.random() * 150) + 'px';
                                            drip.style.opacity = (0.7 + Math.random() * 0.3);
                                            container.appendChild(drip);
                                        }
                                        
                                        // Salpicos
                                        for (let i = 0; i < 15; i++) {
                                            const splash = document.createElement('div');
                                            splash.className = 'blood-splash';
                                            splash.style.left = Math.random() * 100 + 'vw';
                                            splash.style.top = Math.random() * 100 + 'vh';
                                            splash.style.animationDelay = (Math.random() * 2) + 's';
                                            splash.style.width = (80 + Math.random() * 80) + 'px';
                                            splash.style.height = (50 + Math.random() * 60) + 'px';
                                            container.appendChild(splash);
                                        }
                                        
                                        // Gotículas pequenas
                                        for (let i = 0; i < 50; i++) {
                                            const droplet = document.createElement('div');
                                            droplet.className = 'blood-droplet';
                                            droplet.style.left = Math.random() * 100 + 'vw';
                                            droplet.style.animationDelay = (Math.random() * 5) + 's';
                                            droplet.style.animationDuration = (3 + Math.random() * 4) + 's';
                                            container.appendChild(droplet);
                                        }
                                    }
                                    
                                    // Efeito de respiração na cara
                                    function breathingEffect() {
                                        const face = document.querySelector('.face');
                                        setInterval(() => {
                                            face.style.transform = 'translate(-50%, -50%) scale(1.05)';
                                            setTimeout(() => {
                                                face.style.transform = 'translate(-50%, -50%) scale(1)';
                                            }, 800);
                                        }, 1600);
                                    }
                                    
                                    // Efeito de batimento cardíaco
                                    function heartbeatEffect() {
                                        const body = document.body;
                                        setInterval(() => {
                                            body.style.transform = 'scale(1.002)';
                                            setTimeout(() => {
                                                body.style.transform = 'scale(1)';
                                            }, 100);
                                        }, 1200);
                                    }
                                    
                                    // Som ambiente (simulado com áudio do browser)
                                    function playAmbientSound() {
                                        // Criar um contexto de áudio simples
                                        try {
                                            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                                            const oscillator = audioContext.createOscillator();
                                            const gainNode = audioContext.createGain();
                                            
                                            oscillator.connect(gainNode);
                                            gainNode.connect(audioContext.destination);
                                            
                                            oscillator.type = 'sawtooth';
                                            oscillator.frequency.setValueAtTime(80, audioContext.currentTime);
                                            gainNode.gain.setValueAtTime(0.02, audioContext.currentTime);
                                            
                                            oscillator.start();
                                            
                                            // Parar após 10 segundos
                                            setTimeout(() => {
                                                oscillator.stop();
                                            }, 10000);
                                        } catch (e) {
                                            console.log('Áudio não suportado');
                                        }
                                    }
                                    
                                    // Iniciar todos os efeitos
                                    setTimeout(() => {
                                        createBloodDrips();
                                        breathingEffect();
                                        heartbeatEffect();
                                        playAmbientSound();
                                        
                                        // Efeito final dramático após 8 segundos
                                        setTimeout(() => {
                                            const finalMessage = document.createElement('div');
                                            finalMessage.innerHTML = '💀 SISTEMA COMPROMETIDO 💀';
                                            finalMessage.style.position = 'fixed';
                                            finalMessage.style.top = '70%';
                                            finalMessage.style.left = '50%';
                                            finalMessage.style.transform = 'translate(-50%, -50%)';
                                            finalMessage.style.color = '#FF0000';
                                            finalMessage.style.fontSize = '36px';
                                            finalMessage.style.fontWeight = 'bold';
                                            finalMessage.style.zIndex = '25';
                                            finalMessage.style.textShadow = '0 0 30px rgba(255, 0, 0, 0.8)';
                                            finalMessage.style.animation = 'pulse 1s infinite';
                                            document.body.appendChild(finalMessage);
                                        }, 8000);
                                        
                                    }, 500);
                                    
                                    // Prevenir completamente ações do utilizador
                                    document.addEventListener('keydown', function(e) {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        return false;
                                    });
                                    
                                    document.addEventListener('contextmenu', function(e) {
                                        e.preventDefault();
                                        return false;
                                    });
                                    
                                    document.addEventListener('mousedown', function(e) {
                                        e.preventDefault();
                                        return false;
                                    });
                                    
                                    document.body.style.pointerEvents = 'none';
                                    
                                </script>
                            </body>
                            </html>`
                            },
                            '5': { 
                                type: 'file', 
                                owner: 'samu',
                                content: 'Safe... por agora. Continua'
                            },
                            '6': { 
                                type: 'file', 
                                owner: 'samu',
                                content: 'Safe... por agora. Continua'
                            }
                        } 
                    },
                    'python': { 
                        type: 'dir', 
                        owner: 'samu',
                        contents: {
                            'whatsapp.py': { 
                                type: 'file', 
                                owner: 'samu',
                                content: `import pywhatkit
                                    import pyautogui
                                    import time

                                    numero = '+351917753544'
                                    mensagem = 'Hello World!'

                                    pywhatkit.sendwhatmsg_instantly(numero, mensagem, wait_time=5, tab_close=False)

                                    time.sleep(5)

                                    for i in range(49):
                                        pyautogui.write(mensagem)
                                        pyautogui.press('enter')
                                        time.sleep(0.5)`
                            },
                            'minesweeper_bot.py': { 
                                type: 'file', 
                                owner: 'samu',
                                content: `import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.action_chains import ActionChains
from selenium.common.exceptions import NoSuchElementException, StaleElementReferenceException

# ---------- CONFIG ----------
GAME_URL = "https://www.minesweeperonline.com/"
IMPLICIT_WAIT = 1.0
# ----------------------------

class Cell:
    def __init__(self, x, y, state="closed", number=None, elem=None):
        self.x = x
        self.y = y
        self.state = state   # 'closed', 'flag', 'open'
        self.number = number # None or 0..8
        self.elem = elem     # selenium element reference

    def __repr__(self):
        return f"Cell({self.x},{self.y}, state={self.state}, num={self.number})"

class MinesweeperBot:
    def __init__(self, driver):
        self.driver = driver
        self.action = ActionChains(driver)
        self.risk_taken = False

    def open_game(self):
        self.driver.get(GAME_URL)
        time.sleep(2)
        self.driver.implicitly_wait(IMPLICIT_WAIT)

    def find_board_size_and_cells(self):
        elems = self.driver.find_elements(By.CSS_SELECTOR, "[data-x][data-y]")
        coords = set()
        for e in elems:
            try:
                x = int(e.get_attribute("data-x"))
                y = int(e.get_attribute("data-y"))
                coords.add((x,y))
            except:
                continue
        if not coords:
            return None, None
        xs = [c[0] for c in coords]; ys = [c[1] for c in coords]
        w = max(xs) - min(xs) + 1
        h = max(ys) - min(ys) + 1
        return w, h

    def read_board(self):
        board = {}
        elems = self.driver.find_elements(By.CSS_SELECTOR, "div.square")

        for e in elems:
            id_attr = e.get_attribute("id")
            if not id_attr:
                continue
            try:
                x, y = map(int, id_attr.split("_"))
            except:
                continue

            class_attr = e.get_attribute("class") or ""

            if "bombflagged" in class_attr:
                state = "flag"
                number = None
            elif any(c.startswith("open") for c in class_attr.split()):
                state = "open"
                number = None
                for c in class_attr.split():
                    if c.startswith("open"):
                        try:
                            number = int(c.replace("open", ""))
                        except:
                            number = None
            else:
                state = "closed"
                number = None

            cell = Cell(x, y, state=state, number=number, elem=e)
            board[(x, y)] = cell

        return board

    def neighbors(self, x, y):
        for dx in (-1,0,1):
            for dy in (-1,0,1):
                if dx==0 and dy==0: continue
                yield x+dx, y+dy

    def solver_step(self, board):
        to_open = set()
        to_flag = set()

        for (x,y), cell in list(board.items()):
            if cell.state != "open": continue
            n = cell.number if cell.number is not None else 0
            flagged = 0
            unopened = []
            for nx, ny in self.neighbors(x,y):
                nb = board.get((nx,ny))
                if nb is None:
                    continue
                if nb.state == "flag":
                    flagged += 1
                elif nb.state == "closed":
                    unopened.append((nx,ny))
            u = len(unopened)
            if u == 0: continue

            if n == flagged:
                # safe to open all unopened
                for c in unopened:
                    to_open.add(c)
            elif n == flagged + u:
                # all unopened are mines -> flag them
                for c in unopened:
                    to_flag.add(c)

        to_open = to_open - to_flag
        return to_open, to_flag

    def click_cell(self, cell):
        try:
            elem = cell.elem
            self.action.move_to_element(elem).click().perform()
            time.sleep(0.1)
        except Exception as e:
            try:
                self.driver.execute_script("arguments[0].click();", elem)
            except Exception:
                pass

    def flag_cell(self, cell):
        try:
            elem = cell.elem
            self.action.move_to_element(elem).context_click().perform()
            time.sleep(0.1)
        except Exception:
            try:
                self.driver.execute_script("arguments[0].dispatchEvent(new MouseEvent('contextmenu', {bubbles:true}));", elem)
            except Exception:
                pass

    def choose_random_closed(self, board):
        closed = [c for c in board.values() if c.state == "closed"]
        if not closed:
            return None

        if not self.risk_taken:
            closed.sort(key=lambda cell: len(list(self.neighbors(cell.x, cell.y))))
            self.risk_taken = True
            return closed[0]
        else:
            return None

    def probabilistic_choice(self, board):
        equations = []
        closed_set = set()

        for (x,y), cell in board.items():
            if cell.state == "open" and cell.number is not None and cell.number > 0:
                unopened = []
                flagged = 0
                for nx, ny in self.neighbors(x,y):
                    nb = board.get((nx,ny))
                    if nb is None: continue
                    if nb.state == "closed":
                        unopened.append((nx,ny))
                    elif nb.state == "flag":
                        flagged += 1
                if unopened:
                    eq = (tuple(unopened), cell.number - flagged)
                    equations.append(eq)
                    closed_set.update(unopened)

        if not equations:
            return None

        closed_list = list(closed_set)
        probs = {c:0 for c in closed_list}
        total = 0

        from itertools import product

        if len(closed_list) > 15:
            return None

        for assignment in product([0,1], repeat=len(closed_list)):
            assign = dict(zip(closed_list, assignment))
            valid = True
            for cells, total_mines in equations:
                if sum(assign[c] for c in cells) != total_mines:
                    valid = False
                    break
            if valid:
                total += 1
                for c in closed_list:
                    probs[c] += assign[c]

        if total == 0:
            return None
        
        for c in probs:
            probs[c] /= total

        safe_options = [c for c, prob in probs.items() if prob == 0]
        if safe_options:
            return board[safe_options[0]]
        
        return None

    def is_game_over(self):
        """Verifica se o jogo terminou (vitória ou derrota)"""
        try:
            self.driver.find_element(By.ID, "faceoops")
            return True
        except:
            pass
        
        try:
            self.driver.find_element(By.ID, "facewin")
            return True
        except:
            pass
        
        return False

    def run(self, max_steps=1000):
        steps = 0
        self.risk_taken = False
        
        while steps < max_steps:
            if self.is_game_over():
                print("Jogo terminou!")
                break
                
            board = self.read_board()
            if not board:
                print("Não consegui ler o tabuleiro.")
                break
                
            to_open, to_flag = self.solver_step(board)

            if to_open or to_flag:
                for coord in to_flag:
                    c = board.get(coord)
                    if c and c.state == "closed":
                        print(f"Flagging {coord}")
                        self.flag_cell(c)
                        time.sleep(0.1)

                for coord in to_open:
                    c = board.get(coord)
                    if c and c.state == "closed":
                        print(f"Opening {coord}")
                        self.click_cell(c)
                        time.sleep(0.1)
            else:
                choice = self.probabilistic_choice(board)
                if choice is not None:
                    print(f"Jogada probabilística segura em: {choice}")
                    self.click_cell(choice)
                    time.sleep(0.1)
                else:
                    choice = self.choose_random_closed(board)
                    if choice is not None:
                        print(f"Jogada de risco em: {choice}")
                        self.click_cell(choice)
                        time.sleep(0.1)
                    else:
                        print("Sem jogadas possíveis. Parando.")
                        break

            steps += 1
            time.sleep(0.1)

        print(f"Execução concluída após {steps} passos.")

def main():
    options = webdriver.ChromeOptions()
    options.add_argument("--start-maximized")
    options.add_argument("--ignore-certificate-errors")
    options.add_argument("--disable-logging")
    options.add_argument("--log-level=3")
    driver = webdriver.Chrome(options=options)
    bot = MinesweeperBot(driver)
    
    try:
        bot.open_game()
        time.sleep(2)
        print("A iniciar run...")
        bot.run(max_steps=500)
    except Exception as e:
        print(f"Erro: {e}")
    finally:
        input("Pressione Enter para fechar...")
        driver.quit()

if __name__ == "__main__":
    main()`
                            },
                            'atirei_o_pau_ao_gato.py': { 
                                type: 'file', 
                                owner: 'samu',
                                content: `import time
import os
import sys

def cantar_atirei_o_pau_ao_gato():
    versos = [
        "Atirei o pau ao gato-to",
        "Mas o gato-to não morreu-reu",
        "Dona Chica-ca", 
        "Admirou-se-se",
        "Do berro, do berro que o gato deu...",
        "MIAU!"
    ]
    
    pausas = [2.0, 2.0, 1.5, 1.5, 2.5, 3.0]
    
    print("🎵 Tocando: 'Atirei o Pau ao Gato' 🎵")
    print("=" * 40)
    time.sleep(1)
    
    for i, (verso, pausa) in enumerate(zip(versos, pausas)):
        for char in verso:
            print(char, end='', flush=True)
            time.sleep(0.05)
        print()
        
        time.sleep(pausa)
    
    print("\n" + "=" * 40)
    print("Fim da música! 🎶")

def versao_completa_com_repeticao():
    """Versão mais completa que repete a música como nas cantigas de roda"""
    print("\n🎵🎵🎵 ATIREI O PAU AO GATO (Versão Completa) 🎵🎵🎵")
    print("=" * 50)
    
    partes = [
        ["Atirei o pau ao gato-to", 1.8],
        ["Mas o gato-to não morreu-reu", 1.8],
        ["Dona Chica-ca", 1.2],
        ["Admirou-se-se", 1.2],
        ["Do berro, do berro que o gato deu", 2.0],
        ["MIAU!", 2.5]
    ]
    
    for repeticao in range(2):
        print(f"\n--- Parte {repeticao + 1} ---")
        for verso, pausa in partes:
            for char in verso:
                print(char, end='', flush=True)
                time.sleep(0.04)
            print()
            time.sleep(pausa)
    
    print("\n" + "=" * 50)
    print("🎶 A música acabou, vamos cantar outra vez? 🎶")

def versao_interativa():
    """Versão onde o utilizador pode participar"""
    print("\n🎤 ATIREI O PAU AO GATO - Versão Interativa 🎤")
    print("=" * 45)
    print("Vamos cantar juntos! Quando vir 🎤, cante alto!")
    
    time.sleep(2)
    
    versos_interativos = [
        ("Atirei o pau ao gato-to", "🎤 Cante: 'gato-to!'"),
        ("Mas o gato-to não morreu-reu", "🎤 Cante: 'morreu-reu!'"),
        ("Dona Chica-ca", "🎤 Cante: 'Chica-ca!'"),
        ("Admirou-se-se", "🎤 Cante: 'admirou-se-se!'"),
        ("Do berro, do berro que o gato deu", "🎤 Prepare-se para o MIAU!"),
        ("MIAU! MIAU! MIAU!", "🎤🎤🎤 MIAU BEM ALTO! 🎤🎤🎤")
    ]
    
    for verso, instrucao in versos_interativos:
        print(f"\n{verso}")
        print(instrucao)
        time.sleep(3 if "MIAU" in instrucao else 2)
    
    print("\n" + "=" * 45)
    print("🎉 Excelente! Cantamos muito bem! 🎉")

# Menu principal
def main():
    while True:
        print("\n" + "=" * 60)
        print("          🎵 CANTOR DE 'ATIREI O PAU AO GATO' 🎵")
        print("=" * 60)
        print("1. 🎶 Versão Simples")
        print("2. 🎵 Versão Completa (com repetição)")
        print("3. 🎤 Versão Interativa (canta tu também!)")
        print("4. 🚪 Sair")
        
        opcao = input("\nEscolha uma opção (1-4): ").strip()
        
        if opcao == "1":
            os.system('cls' if os.name == 'nt' else 'clear')
            cantar_atirei_o_pau_ao_gato()
        elif opcao == "2":
            os.system('cls' if os.name == 'nt' else 'clear')
            versao_completa_com_repeticao()
        elif opcao == "3":
            os.system('cls' if os.name == 'nt' else 'clear')
            versao_interativa()
        elif opcao == "4":
            print("\nAté à próxima! 🎶🐱")
            break
        else:
            print("Opção inválida! Tente novamente.")
        
        input("\nPressione Enter para continuar...")
        os.system('cls' if os.name == 'nt' else 'clear')

if __name__ == "__main__":
    main()`
                            }
                        } 
                    },
                    'matematica': { 
                        type: 'dir', 
                        owner: 'samu',
                        contents: {
                            'numeros_primos': { 
                                type: 'file', 
                                owner: 'samu',
                                contents: '2, 3, 5, 7, 11, e mais...' 
                            },
                            'numeros_irreais': { 
                                type: 'file', 
                                owner: 'samu',
                                contents: 'numeros que não são reais! O que estavas à espera!' 
                            },
                            'fibonacci': { 
                                type: 'file', 
                                owner: 'samu',
                                contents: 'Esta sequência pode ser ùtil para mais tarde.' 
                            },
                            'hexadecimal': { 
                                type: 'file', 
                                owner: 'samu',
                                contents: '00 01 02 03 04 05 06 07 08 09 0A 0B 0C 0D 0E 0F' 
                            },
                        } 
                    },
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
                    },
                    'notas': { 
                        type: 'dir', 
                        owner: 'ze',
                        contents: {
                            'nota_pessoal.txt': { 
                        type: 'file', 
                        owner: 'r,afa',
                        content: 'Não acredito que aquele desgraçado do samu me mudou a permissão da pasta etc, tmp e var do utilizador root para o seu próprio utilizador! Quando o encotrar ele vai ver.'
                    },
                    'nota.txt': { 
                        type: 'file', 
                        owner: 'ze',
                        content: 'As rosas são vermelhas as papoilas violetas, a hash que tenho aqui vira borboletas! db857fd3645b89250512f9e63af64995'
                    }
                        } 
                    },
                    '.borboletas': {
            type: 'encrypted_dir',
            owner: 'ze',
            password: 'ROCKNROLL',
            encrypted: true,
            contents: {
                'video_do_rafa': {
                    type: 'file',
                    owner: 'ze',
                    content: 'Dá get no passdorafa.mp4'
                },
                'video_do_rafa_sem_roupa': {
                    type: 'file',
                    owner: 'ze',
                    content: 'Querias, né safado/a!'
                },
            }
        },
                }
            },
            'davide': {
            type: 'dir',
            owner: 'davide',
            contents: {
                'meu_ficheiro.txt': { 
                    type: 'file', 
                    owner: 'davide',
                    content: 'Olá, eu sou o Davide.\n\nNotas pessoais:\n- Terminar o projeto até sexta\n- Rever código do módulo de autenticação\n- Testar o sistema de utilizadores\n\nPodes editar este ficheiro à vontade!'
                },
                '.bash_history': { 
                    type: 'file', 
                    owner: 'davide',
                    content: 'whoami\nls -la\ncat meu_ficheiro.txt\ncd ..\nls /home\n get xerox.png'
                },
                'workspace': { 
                    type: 'dir', 
                    owner: 'davide',
                    contents: {}
                },
                'xerox.png': { 
                    type: 'file', 
                    owner: 'davide',
                    content: 'Dá get da imgem xerox.png'
                },
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
                            'admin_notes.txt': { type: 'file', owner: 'antixerox', content: 'Notas do administrador\n\nUtilizadores do sistema:\n- rodrigo\n- rafa\n- samu\n- ze\n- antixerox\n\nUse "su <username>" para trocar de utilizadores.' }
                        }
                    },
                    '.hashes.txt': {
                        type: 'file',
                        owner: 'antixerox',
                        content: [
                            '9ae3ebf2e993b0debfb5b87d9e22e404216f436f35757f8992a367d41f0cde32'
                        ].join('\n')
                        },
                        '.wordlist.txt': {
                        type: 'file',
                        owner: 'antixerox',
                        content: [
                            'senha123',
                            'password',
                            'jennifer',
                            '123456',
                            'admin123',
                            'qwerty',
                            '12345678',
                            '123456789',
                            'senha123',
                            'password123',
                            'admin',
                            '1234',
                            'teste',
                            'abc123',
                            '12345',
                            'senha',
                            'monkey',
                            'dragon',
                            'master',
                            'letmein',
                            'welcome',
                            'shadow',
                            'sunshine',
                            'princess',
                            'qwerty123',
                            'football',
                            'baseball',
                            'superman',
                            'batman',
                            'iloveyou',
                            'starwars',
                            'matrix',
                            'freedom',
                            'whatever',
                            'computer',
                            'internet',
                            'microsoft',
                            'windows',
                            'apple',
                            'android',
                            'google',
                            'facebook',
                            'instagram',
                            'twitter',
                            'youtube',
                            'linkedin',
                            'whatsapp',
                            'telegram',
                            'discord',
                            'spotify',
                            'netflix',
                            'amazon',
                            'ebay',
                            'paypal',
                            'bitcoin',
                            'crypto',
                            'blockchain',
                            'nft',
                            'metaverse',
                            'python',
                            'javascript',
                            'java',
                            'html',
                            'css',
                            'php',
                            'sql',
                            'mysql',
                            'oracle',
                            'mongodb',
                            'react',
                            'angular',
                            'vue',
                            'nodejs',
                            'docker',
                            'kubernetes',
                            'linux',
                            'ubuntu',
                            'debian',
                            'centos',
                            'redhat',
                            'macos',
                            'ios',
                            'androidos',
                            'windows10',
                            'windows11',
                            'microsoft365',
                            'office365',
                            'word',
                            'excel',
                            'powerpoint',
                            'outlook',
                            'onenote',
                            'teams',
                            'zoom',
                            'skype',
                            'slack',
                            'trello',
                            'asana',
                            'jira',
                            'confluence',
                            'git',
                            'github',
                            'gitlab',
                            'bitbucket',
                            'jenkins',
                            'terraform',
                            'ansible',
                            'puppet',
                            'chef',
                            'vagrant',
                            'virtualbox',
                            'vmware',
                            'aws',
                            'azure',
                            'gcp',
                            'digitalocean',
                            'heroku',
                            'netlify',
                            'vercel',
                            'cloudflare',
                            'akamai',
                            'fastly',
                            'cloudfront',
                            's3',
                            'ec2',
                            'lambda',
                            'rds',
                            'dynamodb',
                            'redis',
                            'memcached',
                            'kafka',
                            'rabbitmq',
                            'nginx',
                            'apache',
                            'tomcat',
                            'jetty',
                            'wildfly',
                            'jboss',
                            'weblogic',
                            'websphere',
                            'iis',
                            'cpanel',
                            'plesk',
                            'whm',
                            'directadmin',
                            'vestacp',
                            'cyberpanel',
                            'cloudpanel',
                            'runcloud',
                            'serverpilot',
                            'gridpane',
                            'spinupwp',
                            'ploi',
                            'forge',
                            'coolify',
                            'caprover',
                            'dokku',
                            'flynn',
                            'deis',
                            'tsuru',
                            'rio',
                            'kubernetic',
                            'lens',
                            'octant',
                            'k9s',
                            'kubectl',
                            'helm',
                            'kustomize',
                            'skaffold',
                            'tilt',
                            'garden',
                            'devspace',
                            'telepresence',
                            'bridge',
                            'minikube',
                            'kind',
                            'k3s',
                            'k0s',
                            'microk8s',
                            'minishift',
                            'okd',
                            'openshift',
                            'rancher',
                            'kubesphere',
                            'kubeapps',
                            'portainer',
                            'loki',
                            'prometheus',
                            'grafana',
                            'elasticsearch',
                            'logstash',
                            'kibana',
                            'filebeat',
                            'metricbeat',
                            'packetbeat',
                            'heartbeat',
                            'auditbeat',
                            'functionbeat',
                            'journalbeat',
                            'winlogbeat',
                            'apm',
                            'uptime',
                            'maps',
                            'canvas',
                            'graph',
                            'ml',
                            'data',
                            'transform',
                            'rollup',
                            'search',
                            'visualize',
                            'dashboard',
                            'discover',
                            'devtools',
                            'management',
                            'monitoring',
                            'reporting',
                            'security',
                            'spaces',
                            'timelion',
                            'vega',
                            'vis',
                            'watcher',
                            'xpack',
                            'free',
                            'basic',
                            'trial',
                            'standard',
                            'gold',
                            'platinum',
                            'enterprise',
                            'commercial',
                            'oss',
                            'open',
                            'source',
                            'community',
                            'edition',
                            'version',
                            'release',
                            'stable',
                            'beta',
                            'alpha',
                            'rc',
                            'snapshot',
                            'nightly',
                            'canary',
                            'experimental',
                            'development',
                            'production',
                            'staging',
                            'testing',
                            'qa',
                            'demo',
                            'sandbox',
                            'playground',
                            'lab',
                            'research',
                            'prototype',
                            'proof',
                            'concept',
                            'poc',
                            'mvp',
                            'product',
                            'service',
                            'platform',
                            'framework',
                            'library',
                            'package',
                            'module',
                            'component',
                            'widget',
                            'plugin',
                            'extension',
                            'addon',
                            'theme',
                            'template',
                            'boilerplate',
                            'starter',
                            'kit',
                            'toolkit',
                            'sdk',
                            'api',
                            'rest',
                            'graphql',
                            'grpc',
                            'soap'
                        ].join('\n')
                    },
                }
            }
        }
    },
    'etc': {
        type: 'dir',
        owner: 'samu',
        contents: {
            'passwd': { 
                type: 'file', 
                content: 'root:x:0:0:root:/root:/bin/bash\nrodrigo:x:1001:1001::/home/rodrigo:/bin/bash\nrafa:x:1002:1002::/home/rafa:/bin/bash\nsamu:x:1003:1003::/home/samu:/bin/bash\nze:x:1004:1004::/home/ze:/bin/bash\ndavide:x:1005:1005::/home/davide:/bin/bash\nantixerox:x:1000:1000::/home/antixerox:/bin/bash'
            },
            'hostname': { type: 'file', content: 'classified-ops-srv01' },
            'hosts': { type: 'file', content: '127.0.0.1\tlocalhost\n127.0.1.1\tclassified-ops-srv01' }
        }
    },
    'tmp': { 
        type: 'dir', 
        owner: 'samu',
        contents: {
            'mano_vi_isto_ontem.py': {
        type: 'file',
        owner: 'samu',
        content: `# Backup do script de encriptação - recuperado da cache
# Desenvolvido pelo Rodrigo

from Crypto.Cipher import Blowfish
import binascii

# Configuração de encriptação
KEY = b'biboportosuperbock'
IV = b'1893189318931893'
MODE = 'CBC'

def encrypt_password(password):
    """Encripta uma password usando Blowfish CBC"""
    cipher = Blowfish.new(KEY, Blowfish.MODE_CBC, IV)
    
    # Adicionar padding
    padding_length = 8 - (len(password) % 8)
    padded_password = password + chr(padding_length) * padding_length
    
    encrypted = cipher.encrypt(padded_password.encode('utf-8'))
    return binascii.hexlify(encrypted).decode('utf-8')

def decrypt_password(encrypted_hex):
    """Desencripta uma password usando Blowfish CBC"""
    try:
        encrypted_bytes = binascii.unhexlify(encrypted_hex)
        cipher = Blowfish.new(KEY, Blowfish.MODE_CBC, IV)
        decrypted = cipher.decrypt(encrypted_bytes)
        
        # Remover padding
        padding_length = decrypted[-1]
        decrypted = decrypted[:-padding_length]
        
        return decrypted.decode('utf-8')
    except Exception as e:
        return f"Erro: {e}"

# Password encriptada do Rodrigo (para referência)
encrypted_password = "ce3235ccb154281220928928b7fc5294291eea1fc450a7782a17a31a52625f91"

# Teste - se executares este script, vai mostrar a password
if __name__ == "__main__":
    print("=== Backup Recovery Script ===")
    print(f"Key: {KEY.decode('utf-8')}")
    print(f"IV: {IV.decode('utf-8')}")
    print(f"Mode: {MODE}")
    print(f"Encrypted: {encrypted_password}")
    
    # Desencriptar a password
    result = decrypt_password(encrypted_password)
    print(f"Decrypted: {result}")`
    },
            'session_12345.tmp': {
                type: 'file',
                owner: 'root',
                content: 'Temporary session data - expires in 24h\nUser: unknown\nTimestamp: 2025-11-06 14:23:45'
            },
            'cache_data_v2.dat': {
                type: 'file',
                owner: 'samu',
                content: 'Binary cache data... not readable as text\n[BINARY DATA]\x00\x01\x02\xFF\xFE'
            },
            'system_diagnostics.log': {
                type: 'file',
                owner: 'root',
                content: `[2025-11-06 10:15:32] System check started
[2025-11-06 10:15:33] CPU usage: 45%
[2025-11-06 10:15:33] Memory usage: 62%
[2025-11-06 10:15:34] Disk usage: 78%
[2025-11-06 10:15:35] Network: OK
[2025-11-06 10:15:36] All systems operational`
            },
            'wget-log.1': {
                type: 'file',
                owner: 'rodrigo',
                content: `--2025-11-05 16:42:13--  http://example.com/file.zip
Resolving example.com... 93.184.216.34
Connecting to example.com|93.184.216.34|:80... connected.
HTTP request sent, awaiting response... 404 Not Found
2025-11-05 16:42:14 ERROR 404: Not Found.`
            },
            'process_dump_3721.core': {
                type: 'file',
                owner: 'root',
                content: 'Core dump file - process crashed at 0x7fff82a4b000\nSegmentation fault\n[Binary core data]'
            },
            'temp_notes.txt': {
                type: 'file',
                owner: 'ze',
                content: `Notas temporárias - apagar depois
- Verificar logs do sistema
- Atualizar packages
- Fazer backup da base de dados
- Rever configurações de firewall`
            },
            'install_log_2025.txt': {
                type: 'file',
                owner: 'root',
                content: `Package Installation Log
========================
[2025-10-15] Installed: python3-pip (version 23.0.1)
[2025-10-20] Installed: nginx (version 1.24.0)
[2025-10-25] Installed: postgresql-15
[2025-11-01] Installed: docker-ce (version 24.0.7)
[2025-11-05] Updated: system packages (143 packages)`
            },
            'query_cache.sql': {
                type: 'file',
                owner: 'samu',
                content: `-- Cached database queries
SELECT * FROM users WHERE active = 1;
SELECT COUNT(*) FROM sessions WHERE expired = 0;
UPDATE stats SET views = views + 1 WHERE page_id = 42;
DELETE FROM temp_data WHERE created < NOW() - INTERVAL 1 DAY;`
            },
            'network_scan_results.txt': {
                type: 'file',
                owner: 'antixerox',
                content: `Network Scan Results - 2025-11-06
==================================
Host: 192.168.1.1 - OPEN ports: 22, 80, 443
Host: 192.168.1.10 - OPEN ports: 22, 3306
Host: 192.168.1.15 - OPEN ports: 22, 8080
Host: 192.168.1.20 - OPEN ports: 22, 5432
Total hosts scanned: 254
Active hosts: 12`
            },
            'pip_cache_index.json': {
                type: 'file',
                owner: 'rodrigo',
                content: `{
  "packages": [
    "numpy==1.24.3",
    "pandas==2.0.2",
    "requests==2.31.0",
    "flask==2.3.2"
  ],
  "last_update": "2025-11-05T14:30:00Z"
}`
            },
            'cron_output.log': {
                type: 'file',
                owner: 'root',
                content: `[2025-11-06 00:00:01] Daily backup started
[2025-11-06 00:15:32] Backup completed successfully
[2025-11-06 06:00:01] System cleanup started
[2025-11-06 06:05:14] Cleanup completed: 2.3GB freed`
            },
            'docker_build.log': {
                type: 'file',
                owner: 'davide',
                content: `Building Docker image: webapp:latest
Step 1/8 : FROM ubuntu:22.04
Step 2/8 : RUN apt-get update && apt-get install -y python3
Step 3/8 : COPY . /app
Step 4/8 : WORKDIR /app
Step 5/8 : RUN pip3 install -r requirements.txt
Step 6/8 : EXPOSE 8080
Step 7/8 : CMD ["python3", "app.py"]
Successfully built 4a8f3c2b9d1e
Successfully tagged webapp:latest`
            },
            'error_trace_5891.txt': {
                type: 'file',
                owner: 'rafa',
                content: `Traceback (most recent call last):
  File "/home/rafa/project/main.py", line 42, in <module>
    result = process_data(input_file)
  File "/home/rafa/project/utils.py", line 15, in process_data
    data = json.load(f)
JSONDecodeError: Expecting value: line 1 column 1 (char 0)`
            },
            'test_results.xml': {
                type: 'file',
                owner: 'davide',
                content: `<?xml version="1.0" encoding="UTF-8"?>
<testsuites tests="45" failures="2" errors="0" time="12.345">
  <testsuite name="Unit Tests" tests="30" failures="1" time="8.123">
    <testcase name="test_login" time="0.234"/>
    <testcase name="test_auth" time="0.456">
      <failure>AssertionError: Expected True but got False</failure>
    </testcase>
  </testsuite>
</testsuites>`
            },
            'ssh_host_keys.bak': {
                type: 'file',
                owner: 'root',
                content: `# SSH Host Keys Backup - DO NOT DELETE
ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQC8...
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIGx...
ecdsa-sha2-nistp256 AAAAE2VjZHNhLXNoYTItbmlz...`
            },
            'package_update.list': {
                type: 'file',
                owner: 'root',
                content: `Packages to update:
- linux-image-generic (5.15.0-86 -> 5.15.0-91)
- openssh-server (1:8.9p1-3 -> 1:8.9p1-4)
- nginx-core (1.24.0-1 -> 1.24.0-2)
- python3.10 (3.10.12-1 -> 3.10.13-1)
Total: 23 packages`
            },
            'user_sessions.dat': {
                type: 'file',
                owner: 'root',
                content: `Active user sessions:
rodrigo: pts/0 - 10.0.2.15 - connected 2h 34m
samu: pts/1 - 10.0.2.23 - connected 45m
antixerox: pts/2 - localhost - connected 15m`
            },
            'memory_dump_partial.bin': {
                type: 'file',
                owner: 'root',
                content: '[BINARY MEMORY DUMP - 128KB]\nPartial memory snapshot from process 8472\nWarning: Contains sensitive data'
            },
            'firewall_rules_backup.conf': {
                type: 'file',
                owner: 'root',
                content: `# IPTables rules backup
-A INPUT -p tcp --dport 22 -j ACCEPT
-A INPUT -p tcp --dport 80 -j ACCEPT
-A INPUT -p tcp --dport 443 -j ACCEPT
-A INPUT -j DROP
-A FORWARD -j DROP`
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
let viewedFilesInRoleta = new Set();
let encryptedDirAccess = {
    '.borboletas': false
};
let extractedArchives = {};

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
        if (currentDir.includes('roleta-russa') && viewedFilesInRoleta.size < 3) {
            addOutput(`cd: cannot leave 'roleta-russa' until you view at least 3 different files with 'cat'`, 'error');
        addOutput(`Different files viewed: ${viewedFilesInRoleta.size}/3`, 'error');
        addOutput(`Files you've viewed: ${Array.from(viewedFilesInRoleta).join(', ') || 'none'}`, 'error');
            return currentDir;
        }
        return `/home/${currentUser}`;
    }
    
    if (path.startsWith('~/')) {
        if (currentDir.includes('roleta-russa') && viewedFilesInRoleta.size < 3) {
            addOutput(`cd: cannot leave 'roleta-russa' until you view at least 3 different files with 'cat'`, 'error');
        addOutput(`Different files viewed: ${viewedFilesInRoleta.size}/3`, 'error');
        addOutput(`Files you've viewed: ${Array.from(viewedFilesInRoleta).join(', ') || 'none'}`, 'error');
            return currentDir;
        }
        return `/home/${currentUser}/` + path.slice(2);
    }
    
    if (path.startsWith('/')) {
        return normalizePath(path);
    }
    
    if (path === '.') {
        return currentDir;
    }
    
    if (path === '..') {
        const parentPath = normalizePath(currentDir + '/..');
        if (currentDir.includes('roleta-russa') && !parentPath.includes('roleta-russa') && viewedFilesInRoleta.size < 3) {
            addOutput(`cd: cannot leave 'roleta-russa' until you view at least 3 different files with 'cat'`, 'error');
        addOutput(`Different files viewed: ${viewedFilesInRoleta.size}/3`, 'error');
        addOutput(`Files you've viewed: ${Array.from(viewedFilesInRoleta).join(', ') || 'none'}`, 'error');
            return currentDir;
        }
        return parentPath;
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
        
        const currentNode = current[part];
        
        if (i === parts.length - 1) {
            return currentNode;
        }
        
        if (currentNode.type !== 'dir' && !(currentNode.encrypted && encryptedDirAccess[part])) {
            return null;
        }
        
        current = currentNode.contents;
    }
    
    return null;
}

function canAccess(node) {
    if (!node) return false;
    if (!node.owner) return true;
    
    if (node.owner === 'root') {
        return currentUser === 'root';
    }
    
    return node.owner === currentUser;
}

function addOutput(text, className = 'output') {
    const line = document.createElement('div');
    line.className = className;
    line.textContent = text;
    outputContainer.appendChild(line);
}

function switchUser(username) {
    const validUsers = ['root', 'rodrigo', 'rafa', 'samu', 'ze', 'davide', 'antixerox'];
    
    if (!validUsers.includes(username)) {
        addOutput(`su: user ${username} does not exist`, 'error');
        return;
    }
    
    pendingUser = username;
    awaitingPassword = true;

    promptElement.textContent = 'Password: ';
    input.type = 'password';
    input.value = '';
    input.focus();
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
        case 'get':
            cmdGet(args);
            break;
        case 'whoami':
            addOutput(currentUser);
            break;
        case 'unzip':
            cmdUnzip(args);
            break;
        case 'hostname':
            addOutput(hostname);
            break;
        case './chaves_pgp.sh':
case 'bash':
case 'sh':
    if (args.length === 0 && command === './chaves_pgp.sh') {
        cmdExecuteScript('chaves_pgp.sh');
    } else if (args.length > 0) {
        const scriptName = args[0];
        cmdExecuteScript(scriptName);
    } else {
        addOutput(`${command}: missing script operand`, 'error');
    }
    break;
        case 'id':
    const uid = currentUser === 'root' ? 0 :
                currentUser === 'antixerox' ? 1000 : 
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
            addOutput('rodrigo rafa samu ze davide antixerox');
            break;
        case 'history':
            commandHistory.forEach((cmd, i) => {
                addOutput(`  ${i + 1}  ${cmd}`);
            });
            break;
        case 'locked':
            addOutput('Pastas protegidas disponíveis:');
            Object.keys(encryptedDirAccess).forEach(folder => {
                const status = encryptedDirAccess[folder] ? 'Acesso concedido' : 'Bloqueada';
                addOutput(`  ${folder}: ${status}`);
            });
            break;
        case 'help':
        case 'man':
            addOutput('Available commands:');
            addOutput('  ls, cd, pwd, cat, clear, whoami, hostname, id, uname');
            addOutput('  echo, date, history, su, users, help, locked, unzip');
            addOutput('\n');
            addOutput('get: pode transferir ficheiros do terminal e git para o pc!');
            addOutput('locked: mostra o estado das pastas protegidas');
            addOutput('\n');
            addOutput('Pastas protegidas: use cd na pasta e introduza a senha quando pedido');
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

const encryptedDirStyle = `
.encrypted-dir {
    color: #ff6b6b;
    font-weight: bold;
}
.encrypted-dir::before {
    content: "";
}
`;

const style = document.createElement('style');
style.textContent = encryptedDirStyle;
document.head.appendChild(style);

function cmdUnzip(args) {
    if (args.length === 0) {
        addOutput('unzip: missing file operand', 'error');
        addOutput('Usage: unzip <file.zip>', 'error');
        return;
    }

    const targetPath = resolvePath(args[0]);
    const node = getNodeAtPath(targetPath);

    if (!node) {
        addOutput(`unzip: cannot find or open ${args[0]}, ${args[0]} does not exist`, 'error');
        return;
    }

    if (!canAccess(node)) {
        addOutput(`unzip: cannot open ${args[0]}: Permission denied`, 'error');
        return;
    }

    if (node.type !== 'zip') {
        addOutput(`unzip: ${args[0]} is not a ZIP archive (type: ${node.type})`, 'error');
        return;
    }

    const archiveName = args[0].replace('.zip', '');
    if (extractedArchives[archiveName]) {
        addOutput(`unzip: ${args[0]} already extracted to ${archiveName}_extracted/`, 'info');
        return;
    }

    addOutput(`Archive: ${args[0]}`);
    promptElement.textContent = 'Password: ';
    input.type = 'password';
    input.value = '';
    input.focus();
    
    awaitingPassword = true;
    pendingUser = args[0];
    
    tempInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            const password = tempInput.value;
            document.body.removeChild(tempInput);
            input.style.display = 'block';
            verifyPassword(password);
        } else if (e.key === 'c' && e.ctrlKey) {
            e.preventDefault();
            document.body.removeChild(tempInput);
            input.style.display = 'block';
            addOutput('');
            awaitingPassword = false;
            pendingUser = null;
            updatePrompt();
        }
    });
    
    terminal.scrollTop = terminal.scrollHeight;
}

const zipFileStyle = `
.zip-file {
    color: #ffa500;
    font-weight: bold;
}
`;

style.textContent += zipFileStyle;

function cmdGet(args) {
    if (args.length === 0) {
        addOutput('get: missing file operand', 'error');
        addOutput('Usage: get <filename>', 'error');
        return;
    }

    const filename = args[0];
    
    const imageMap = {
        'bal.png': 'https://github.com/definitelynotrafa/ISTEC-Criptografia/blob/main/XeroxLabs/website/assets/bal.png',
        'ck3.png': 'https://github.com/definitelynotrafa/ISTEC-Criptografia/blob/main/XeroxLabs/website/assets/ck3.png',
        'coh.png': 'https://github.com/definitelynotrafa/ISTEC-Criptografia/blob/main/XeroxLabs/website/assets/coh.png',
        'ff.png': 'https://github.com/definitelynotrafa/ISTEC-Criptografia/blob/main/XeroxLabs/website/assets/ff.png',
        'fl4.png': 'https://github.com/definitelynotrafa/ISTEC-Criptografia/blob/main/XeroxLabs/website/assets/fl4.png',
        'gow2.png': 'https://github.com/definitelynotrafa/ISTEC-Criptografia/blob/main/XeroxLabs/website/assets/gow2.png',
        'hk.png': 'https://github.com/definitelynotrafa/ISTEC-Criptografia/blob/main/XeroxLabs/website/assets/hk.png',
        'metro.png': 'https://github.com/definitelynotrafa/ISTEC-Criptografia/blob/main/XeroxLabs/website/assets/metro.png',
        'mm.png': 'https://github.com/definitelynotrafa/ISTEC-Criptografia/blob/main/XeroxLabs/website/assets/mm.png',
        'mtg.png': 'https://github.com/definitelynotrafa/ISTEC-Criptografia/blob/main/XeroxLabs/website/assets/mtg.png',
        'mtgs.png': 'https://github.com/definitelynotrafa/ISTEC-Criptografia/blob/main/XeroxLabs/website/assets/mtgs.png',
        'rdr2.png': 'https://github.com/definitelynotrafa/ISTEC-Criptografia/blob/main/XeroxLabs/website/assets/rdr2.png',
        'skrm.png': 'https://github.com/definitelynotrafa/ISTEC-Criptografia/blob/main/XeroxLabs/website/assets/skrm.png',
        'stm.png': 'https://github.com/definitelynotrafa/ISTEC-Criptografia/blob/main/XeroxLabs/website/assets/stm.png',
        'tlou.png': 'https://github.com/definitelynotrafa/ISTEC-Criptografia/blob/main/XeroxLabs/website/assets/tlou.png',
        'zmm.png': 'https://github.com/definitelynotrafa/ISTEC-Criptografia/blob/main/XeroxLabs/website/assets/zmm.png',
        
        'fibonacci.png': 'https://github.com/definitelynotrafa/ISTEC-Criptografia/blob/main/XeroxLabs/website/assets/fibonacci.png',
        'BALATRO.png': 'https://github.com/definitelynotrafa/ISTEC-Criptografia/blob/main/XeroxLabs/website/assets/BALATRO.png',
        
        'passdorafa.mp4': 'https://github.com/definitelynotrafa/ISTEC-Criptografia/blob/main/XeroxLabs/website/assets/passdorafa.mp4',
        'xerox.png': 'https://github.com/definitelynotrafa/ISTEC-Criptografia/blob/main/XeroxLabs/website/assets/xerox.png'
    };

    const targetPath = resolvePath(filename);
    const node = getNodeAtPath(targetPath);

    if (!node) {
        addOutput(`get: ${filename}: No such file in current directory`, 'error');
        return;
    }

    if (!canAccess(node)) {
        addOutput(`get: ${filename}: Permission denied`, 'error');
        return;
    }

    if (!imageMap[filename]) {
        addOutput(`get: ${filename}: File type not supported for download or not available`, 'error');
        return;
    }


    const fileContent = node.content || '';
    if (!fileContent.toLowerCase().includes('get') && !fileContent.toLowerCase().includes('faz get')) {
        addOutput(`get: ${filename}: File does not appear to be downloadable`, 'error');
        return;
    }

    addOutput(`Downloading ${filename} from GitHub repository...`);
    
    try {
        const imageUrl = imageMap[filename];
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = filename;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        addOutput(`Successfully downloaded ${filename}`);
        addOutput(`File saved to your downloads folder`);
        
    } catch (error) {
        addOutput(`get: Error downloading ${filename}: ${error.message}`, 'error');
        addOutput(`Make sure the file exists in the GitHub repository`, 'error');
    }
}

function cmdLs(args) {
    const showHidden = args.some(arg => arg.includes('a'));
    const longFormat = args.some(arg => arg.includes('l'));
    
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
            if (itemNode.type === 'dir' || itemNode.encrypted) {
                const perm = itemNode.encrypted ? 'd---x--x--x' : 'drwxr-xr-x';
                prefix = `${perm} 2 ${owner} ${owner} 4096 Oct 28 10:30 `;
                className = itemNode.encrypted ? 'encrypted-dir' : 'dir';
            } else if (itemNode.type === 'zip') {
                prefix = `-rw-r--r-- 1 ${owner} ${owner} 2048 Oct 28 10:30 `;
                className = 'zip-file';
            } else {
                prefix = `-rw-r--r-- 1 ${owner} ${owner} 1024 Oct 28 10:30 `;
            }
        } else {
            if (itemNode.type === 'dir' || itemNode.encrypted) {
                className = itemNode.encrypted ? 'encrypted-dir' : 'dir';
            } else if (itemNode.type === 'zip') {
                className = 'zip-file';
            }
        }
        
        const displayName = itemNode.encrypted ? `${item}` : item;
        addOutput(prefix + displayName, className);
    });
}

function cmdExecuteScript(scriptName) {
    const targetPath = resolvePath(scriptName);
    const node = getNodeAtPath(targetPath);

    if (!node) {
        addOutput(`bash: ${scriptName}: No such file or directory`, 'error');
        return;
    }

    if (!canAccess(node)) {
        addOutput(`bash: ${scriptName}: Permission denied`, 'error');
        return;
    }

    if (node.type !== 'file') {
        addOutput(`bash: ${scriptName}: Cannot execute - not a file`, 'error');
        return;
    }

    const content = node.content || '';
    if (!content.startsWith('#!/bin/bash') && !content.startsWith('#!/bin/sh')) {
        addOutput(`bash: ${scriptName}: Cannot execute - not a valid script`, 'error');
        return;
    }

    addOutput(`Executing script: ${scriptName}`);

    const lines = content.split('\n');
    let currentHereDoc = null;
    let hereDocContent = [];
    let hereDocDelimiter = '';
    
    for (let line of lines) {
        line = line.trim();
        
        if (!line || line.startsWith('#')) continue;
        
        if (currentHereDoc) {
            if (line === hereDocDelimiter) {
                createFileFromHereDoc(currentHereDoc, hereDocContent.join('\n'));
                currentHereDoc = null;
                hereDocContent = [];
            } else {
                hereDocContent.push(line);
            }
            continue;
        }
        
        if (line.startsWith('echo ')) {
            const message = line.replace(/echo\s+"([^"]*)".*/, '$1') || 
                           line.replace(/echo\s+'([^']*)'.*/, '$1') ||
                           line.replace(/echo\s+(.*)/, '$1');
            addOutput(message);
        }
        else if (line.includes('mkdir -p')) {
            const dirPath = line.match(/mkdir -p\s+([^\s&|;]+)/)?.[1];
            if (dirPath) {
                addOutput(line);
                createDirectory(dirPath);
            }
        }
        else if (line.includes('tee') && line.includes('<<')) {
            const match = line.match(/tee\s+([^\s&|;]+).*<<\s+'([^']+)'/);
            if (match) {
                const filePath = match[1];
                hereDocDelimiter = match[2];
                currentHereDoc = filePath;
                addOutput(line.replace(/<<\s+'[^']+'/, '').trim());
            }
        }
        else if (line.includes('tee')) {
            const filePath = line.match(/tee\s+([^\s&|;]+)/)?.[1];
            if (filePath) {
                addOutput(line);
                createFile(filePath, '');
            }
        }
    }
    
    addOutput(`Script ${scriptName} executed successfully`);
}

function createDirectory(path) {
    path = path.replace(/^sudo\s+/, '');
    
    const normalizedPath = normalizePath(path);
    const parts = normalizedPath.split('/').filter(p => p);
    
    let current = fileSystem;
    let currentPath = '';
    
    const specialDirOwners = {
        '/usr': 'rodrigo',
        '/usr/local': 'rodrigo',
        '/usr/local/bin': 'rodrigo',
        '/boot': 'rodrigo',
        '/boot/EFI': 'rodrigo',
        '/boot/EFI/BOOT': 'rodrigo'
    };
    
    for (const part of parts) {
        currentPath += '/' + part;
        
        const dirOwner = specialDirOwners[currentPath] || currentUser;
        
        if (!current[part]) {
            current[part] = {
                type: 'dir',
                owner: dirOwner,
                contents: {}
            };
            addOutput(`Created directory: ${currentPath} (owner: ${dirOwner})`);
        }
        
        if (current[part].type === 'dir') {
            current = current[part].contents;
        } else {
            addOutput(`Error: ${currentPath} already exists and is not a directory`, 'error');
            return;
        }
    }
    
    saveState();
}

function createFileFromHereDoc(filePath, content) {
    filePath = filePath.replace(/^sudo\s+/, '');
    
    const normalizedPath = normalizePath(filePath);
    const parts = normalizedPath.split('/').filter(p => p);
    const fileName = parts.pop();
    const dirPath = '/' + parts.join('/');

    if (parts.length > 0) {
        createDirectory(dirPath);
    }

    let current = fileSystem;
    for (const part of parts) {
        if (current[part] && current[part].type === 'dir') {
            current = current[part].contents;
        } else {
            addOutput(`Error: Directory ${dirPath} does not exist`, 'error');
            return;
        }
    }
    
    const specialOwners = {
        '/tmp/mensagem': 'samu',
        '/usr/local/bin/public.key': 'rodrigo',
        '/boot/EFI/BOOT/priv.key': 'rodrigo'
    };
    
    const fileOwner = specialOwners[normalizedPath] || currentUser;
    
    current[fileName] = {
        type: 'file',
        owner: fileOwner,
        content: content
    };
    
    addOutput(`Created file: ${normalizedPath} (owner: ${fileOwner})`);
    saveState();
}

function createFile(filePath, content) {
    createFileFromHereDoc(filePath, content);
}

function cmdCd(args) {
    if (args.length === 0) {
        if (currentDir.includes('roleta-russa') && viewedFilesInRoleta.size < 3) {
            addOutput(`cd: cannot leave 'roleta-russa' until you view at least 3 different files with 'cat'`, 'error');
            addOutput(`Different files viewed: ${viewedFilesInRoleta.size}/3`, 'error');
            addOutput(`Files you've viewed: ${Array.from(viewedFilesInRoleta).join(', ') || 'none'}`, 'error');
            return;
        }
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

    if (node.type === 'encrypted_dir' && !encryptedDirAccess[args[0]]) {
        const folderName = args[0];
        addOutput(`Pasta protegida por senha: ${folderName}`);
        promptElement.textContent = 'Password: ';
        input.type = 'password';
        input.value = '';
        input.focus();
        
        awaitingPassword = true;
        pendingUser = '.' + folderName;
        
        tempInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                const password = tempInput.value;
                document.body.removeChild(tempInput);
                input.style.display = 'block';
                verifyPassword(password);
            } else if (e.key === 'c' && e.ctrlKey) {
                e.preventDefault();
                document.body.removeChild(tempInput);
                input.style.display = 'block';
                addOutput('');
                awaitingPassword = false;
                pendingUser = null;
                updatePrompt();
            }
        });
        
        terminal.scrollTop = terminal.scrollHeight;
        return;
    }


    if (!canAccess(node)) {
        addOutput(`cd: ${args[0]}: Permission denied`, 'error');
        return;
    }

    if (node.type !== 'dir' && !node.encrypted) {
        addOutput(`cd: ${args[0]}: Not a directory`, 'error');
        return;
    }

    if (currentDir.includes('roleta-russa') && !targetPath.includes('roleta-russa') && viewedFilesInRoleta.size < 3) {
        addOutput(`cd: cannot leave 'roleta-russa' until you view at least 3 different files with 'cat'`, 'error');
        addOutput(`Different files viewed: ${viewedFilesInRoleta.size}/3`, 'error');
        addOutput(`Files you've viewed: ${Array.from(viewedFilesInRoleta).join(', ') || 'none'}`, 'error');
        return;
    }

    currentDir = targetPath;
    updatePrompt();
    saveState();
}

function cmdPwd() {
    addOutput(currentDir);
}

function cmdCat(args) {
    if (args.length === 0) {
        addOutput('cat: missing file operand', 'error');
        return;
    }

    if (args[0].includes('chaves_pgp.sh')) {
        addOutput('cat: chaves_pgp.sh: Access denied - use bash to execute this script', 'error');
        addOutput('Usage: bash chaves_pgp.sh', 'info');
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

    if (currentDir.includes('roleta-russa') && node.type === 'file') {
        const fileName = args[0];
        if (!viewedFilesInRoleta.has(fileName)) {
            viewedFilesInRoleta.add(fileName);
            addOutput(`[New file viewed! Different files: ${viewedFilesInRoleta.size}/3]`, 'info');
            addOutput(`Files viewed so far: ${Array.from(viewedFilesInRoleta).join(', ')}`, 'info');
            saveState();
        } else {
            addOutput(`[You've already viewed this file. Different files: ${viewedFilesInRoleta.size}/3]`, 'info');
        }
    }


    if (args[0].includes('4') && (args[0].includes('.html') || node.content.includes('<!DOCTYPE html>'))) {
        
        setTimeout(() => {
            document.documentElement.innerHTML = node.content;
            
            const extraScript = document.createElement('script');
            extraScript.textContent = `
                // Efeitos extras de terror
                setTimeout(() => {
                    // Adicionar mais sangue
                    const extraBlood = document.createElement('div');
                    extraBlood.style.position = 'fixed';
                    extraBlood.style.top = '0';
                    extraBlood.style.left = '0';
                    extraBlood.style.width = '100%';
                    extraBlood.style.height = '100%';
                    extraBlood.style.background = 'radial-gradient(circle, transparent 30%, rgba(139,0,0,0.3) 70%)';
                    extraBlood.style.animation = 'pulse 2s infinite';
                    extraBlood.style.zIndex = '15';
                    document.body.appendChild(extraBlood);
                    
                    // Adicionar texto assustador
                    const warning = document.createElement('div');
                    warning.innerHTML = 'Foste Asamunado...';
                    warning.style.position = 'fixed';
                    warning.style.top = '20px';
                    warning.style.left = '50%';
                    warning.style.transform = 'translateX(-50%)';
                    warning.style.color = '#8B0000';
                    warning.style.fontSize = '32px';
                    warning.style.fontFamily = 'Arial, sans-serif';
                    warning.style.fontWeight = 'bold';
                    warning.style.zIndex = '20';
                    warning.style.opacity = '0';
                    warning.style.animation = 'fadeInOut 3s infinite';
                    document.body.appendChild(warning);
                    
                    // CSS para animações extras
                    const style = document.createElement('style');
                    style.textContent = \`
                        @keyframes pulse {
                            0% { opacity: 0.1; }
                            50% { opacity: 0.3; }
                            100% { opacity: 0.1; }
                        }
                        @keyframes fadeInOut {
                            0%, 100% { opacity: 0; }
                            50% { opacity: 1; }
                        }
                        body {
                            cursor: none;
                            overflow: hidden;
                        }
                    \`;
                    document.head.appendChild(style);
                    
                }, 1000);
            `;
            document.body.appendChild(extraScript);
            
        }, 3000);
        return;
    }

    addOutput(node.content || '');
}

function saveState() {
    try {
        localStorage.setItem('terminal_currentUser', currentUser);
        localStorage.setItem('terminal_currentDir', currentDir);
        localStorage.setItem('terminal_viewedFilesInRoleta', JSON.stringify(Array.from(viewedFilesInRoleta)));
        localStorage.setItem('terminal_extractedArchives', JSON.stringify(extractedArchives));
    } catch (e) {
        console.log('Não foi possível salvar estado');
    }
}

function loadState() {
    try {
        const savedUser = localStorage.getItem('terminal_currentUser');
        const savedDir = localStorage.getItem('terminal_currentDir');
        const savedViewedFiles = localStorage.getItem('terminal_viewedFilesInRoleta');
        const savedExtractedArchives = localStorage.getItem('terminal_extractedArchives');
        
        if (savedUser) currentUser = savedUser;
        if (savedDir) currentDir = savedDir;
        if (savedViewedFiles) {
            viewedFilesInRoleta = new Set(JSON.parse(savedViewedFiles));
        }
        if (savedExtractedArchives) {
            extractedArchives = JSON.parse(savedExtractedArchives);
        }
        
        updatePrompt();
    } catch (e) {
        console.log('Não foi possível carregar estado anterior');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    loadState();
    updatePrompt();
    input.focus();
});

loadState();

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
        input.value = '';
        updatePrompt();
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

window.addEventListener('load', function() {
    loadState();
    updatePrompt();
});
