# SeedLab: AntiXerox!

Este laboratório explica, passo a passo, como usar o CyberChef para descriptografar dados e como combinar ferramentas Linux (e *hash-identifier*) para analisar e identificar tipos de hash. O formato é um walkthrough prático onde tens acesso a uma máquina online: recebes artefatos, executas comandos no Linux e usas CyberChef para extrair informações.

O objetivo final é escalar para root. 

Em cada passo há uma riddle que funciona como dica, podes clicar por cima da palavra e usar se achares necessário.

---

## Objetivos

1. Aprender os princípios básicos do CyberChef (receitas, encadeamento de operações, pré-visualização).
2. Identificar formatos com ferramentas Linux (`file`, `xxd`, `hexdump`, `strings`) e confirmar com CyberChef.
3. Usar `hash-identifier` para identificar tipos de hash e explorar opções de cracking/validação básicas.
4. Integrar comandos Linux com CyberChef para construir um processo de análise com criptografia simples.

---

## Pré-requisitos

* Máquina Linux (ou WSL). Distribuições baseadas em Debian/Ubuntu são recomendadas se o utilizador não usar Linux regularmente. A máquina disponibilizada online não permite instalações.
* CyberChef disponível (opções: usar a versão web oficial, ou instalar localmente via Docker / download do HTML). Recomenda-se dar download o HTML e abrir localmente para praticar.
* Ferramentas: `hash-identifier`, `xxd`, `hexdump`, `file`, `strings`, `base64`, `openssl`, `md5sum`, `sha1sum`, `cut`, `tr`, `grep`.

> Instalação rápida (Ubuntu/Debian):
>
> ```bash
> sudo apt update
> sudo apt install -y python3-pip xxd bsdmainutils coreutils binutils file strings
> pip3 install hash-identifier
> # opcional: sudo apt install john hashcat
> ```

---

## Contexto fornecido:

> Neste fim de semana existiu uma pequena zeroday e um dos servidores da empresa Antixerox ficou vulnerável, tu, hacker mafarrico, tens o objetivo de tomar o controlo do servidor! Acede ao website para começar:

> -> https://antixeroxcryptolab.netlify.app/
---

## Passo 1:

- Recon time! Identifica os ficheiros da pasta em que te encontras no momento, cuidado com os ficheiros ocultos!
  
> Encontraste alguma coisa? Se sim, sabes o que fazer. Descriptografa o conteúdo do que encontraste e passa para o próximo passo!

<details>
<summary>Riddle</summary>
Transformo bytes em letras que se entendem,
  
Uso 64 símbolos e às vezes deixo um = no final.

Ainda tens dúvidas de quem eu sou?
</details>

<details>
<summary>Hint</summary>
Have you ever used hashcat?
</details>

<details>
<summary>Answer</summary>

Usa ```ls -la``` para listar todos os ficheiros que estão na pasta em que logaste, incluíndo os ocultos. De seguida, cracka a hash com o hashcat.
  
```hashcat -m 1400 -a 0 hashes.txt /path/to/wordlist.txt -o found.txt -w 3```

  > ```-m 1400 = SHA‑256 (raw)```
> 
  > ```-a 0 = ataque por dicionário (dictionary attack)```
>
  > ```-w 3 = perfil de workload agressivo```
</details>


## Passo 2:

- Se ainda não trocaste de utilizador com a password que encontraste, agora é a hora.
- Explora a pasta deste novo utilizador, há ficheiros que apenas podes visualizar na tua máquina, usa o ```get [ficheiro]``` para o transferires para a tua máquina.
- Verifica o ficheiro com o comando ```strings``` e ```xxd```. A que conclusões chegaste?
- Com a informação que obtiveste, utiliza o cyberchef para desencriptar a string, cria uma receita para facilitar o processo.

<details>
<summary>Riddle</summary>
Xerox mostra pixels, mas guarda papel.

Troca a extensão e encontras a pass do Samuel.
</details>

<details>
<summary>Hint</summary>
Vamos da base mais baixa até à mais alta!
</details>

<details>
<summary>Answer</summary>
  
Muda de utilizador e verifica os ficheiros do utilizador novamente, é aconselhavel transferires este ficheiro png para a tua máquina com o comando ```get xerox.png```.
De seguida, muda a extensão da imagem para pdf e verifica o conteúdo, depois desencripta com uma receita no cyberchef do base mais baixo para o mais alto.

</details>

## Passo 3:

- Talvez já tenhas percebido que cada task requer mudar de utilizador para avançar, troca para o novo user que descobriste.
- Explora a pasta deste novo utilizador, há alguma coisa que te chame a atenção?

<details>
<summary>Riddle</summary>
Três métodos antigos guardam o Zé,
Quem souber o trio verá abrir‑se o céu.
</details>

<details>
<summary>Hint</summary>
Experimenta usar Hash-Identifier
</details>

<details>
<summary>Answer</summary>
  
Troca novamente de utilizador e verifica o conteúdo do mesmo.
Usa o Hash-Identifier para confirmar que aquelas hashes afinal não eram um SHA, mas sim MD's. De seguida experimenta usar novamente o hashcat ou o [CrackStation](https://crackstation.net).<p>&nbsp;</p>

> Anthrax:7b61467a0e5084ff727ac81a79cfa3a1 - gnillaF - MD5

> MegaDeth:c1db7f29e6b551f4fa48d6901eca6be6 - nI - MD2

> ToddlerStomper:2bfbbe5800dd0874b39bd5a07952cf62 - esreveR - MD4

> ze:f8e8eb9612969985e7df4657f8c49bddcbddf8c509bc82799eaa4d1fcaa1360b - SHA256 - esreveRnIgnillaF - **NOTA:** Esta password não deve tentar ser crackada, mas caso consigas fazê-lo, dás skip aos passos anteriores.

Junta as passwords e troca de utilizador novamente.
  
</details>

## Passo 4:

- Parabéns, descobriste a password do Zé, explora o novo utilizador e descobre como saltar para o próximo.

<details>
<summary>Riddle</summary>
Mete aqui uma riddle Rafa
</details>

<details>
<summary>Hint</summary>
Mete aqui uma hint Rafa
</details>

<details>
<summary>Answer</summary>
  
Verifica o conteúdo da nota do Zé, vais encontrar uma hash em NTLM, volta a usar o hashcat para crackar a pass (código NTLM 1000) e entra na pasta que pedia uma password. 

> db857fd3645b89250512f9e63af64995 - ROCKNROLL  

```get passdorafa.mp4```

Vê o vídeo e encontra a password do Rafa.

</details>


## Passo 5:

- Parece que esta foi fácil, não?
- Lê o conteúdo da nota do Rafa e escala para o próximo utilizador.


<details>
<summary>Answer</summary>
  
Verifica o conteúdo da pasta do Rafa, vais encontrar uma nota, lê o conteúdo e percebes que eles estavam a desenvolver um código, porém a aplicação tem um sistema de logins e a password que o Rodrigo usa na app e no servidor são as mesmas. 
No entanto, o código não foi guardado, pois o computador desligou abruptamente. Porém, ainda existe um backup guardado na cache do sistema. 
Navega até à pasta /tmp e lê o conteúdo de um script em python. Vais encontrar a key, o IV e o modo e perceber que a encriptação usada foi blowfish. Pega na password do Rodrigo e desencripta.

> Key - biboportosuperbock
> IV - 1893189318931893
> Mode - CBC
> ce3235ccb154281220928928b7fc5294291eea1fc450a7782a17a31a52625f91 - Palmeirasnaotemmundial123!

</details>


## Passo 6.1:

- Há várias formas de alguém guardar uma key. Algumas formas mais tradicionais, outras mais modestas. Outras violam o RGPD.
- Com o stress de ser pai, a memória do Rodrigo já não é o que era. Ele usa outros métodos para se recordar das suas keys.
- Encontraste ficheiros peculiares dentro da pasta do Rodrigo, será algum deles importante? Ou só recordações irrelevantes?
- Explora a pasta do Rodrigo, a partir daqui, talvez consigas chegar a root.

<details>
<summary>Answer</summary>

6.1
Verifica o conteúdo da pasta do Rodrigo, vais achar algumas fotos de jogos que ele usa para passar o tempo.
Alguns detalhes das fotos são as chaves para a sua pasta pessoal. 

> Key -

</details>


## Passo 6.2:

- ola

<details>
<summary>Answer</summary>

6.2
- Após descobrires as credenciais para desbloquear a pasta pessoal do Rodrigo encontraste um ficheiro com uma pequena nota. 
- A nota fala da rotação dourada, também conhecida como proporção áurea. Segue a imagem da sequencia de Fibonnaci (usa ```get fibonnaci.png```) encontrada na mesma pasta e aplica-a do maior para o menor com rot na pequena string que tem na nota.
- Esta string da nota é uma password para uma pasta com uma imagem para o utilizador usar novamente ```get importante.png```.
Receita cyberchef:
```
[
  {"op":"ROT13","args":[true,true,false,-987]},
  {"op":"ROT13","args":[true,true,false,-610]},
  {"op":"ROT13","args":[true,true,false,-377]},
  {"op":"ROT13","args":[true,true,false,-233]},
  {"op":"ROT13","args":[true,true,false,-144]},
  {"op":"ROT13","args":[true,true,false,-89]},
  {"op":"ROT13","args":[true,true,false,-55]},
  {"op":"ROT13","args":[true,true,false,-34]},
  {"op":"ROT13","args":[true,true,false,-21]},
  {"op":"ROT13","args":[true,true,false,-13]},
  {"op":"ROT13","args":[true,true,false,-8]},
  {"op":"ROT13","args":[true,true,false,-5]},
  {"op":"ROT13","args":[true,true,false,-3]},
  {"op":"ROT13","args":[true,true,false,-2]},
  {"op":"ROT13","args":[true,true,false,-1]},
  {"op":"ROT13","args":[true,true,false,-1]}
]
```

- O utilizador deve verificar os metadados desta imagem para recuperar uma password para descompactar o ficheiro nomedia.zip.
- ```exiftool BALATRO.PNG``` > ```cGFsbWVpcmFzbnVuY2F0ZXJhbXVuZGlhbA== - palmeirasnuncateramundial```
- O ficheiro possui um script que contem a única forma de estabelecer e recriar caminhos na máquina. Executa e lê o script e segue o caminho que ele fez. Aí estará as verdadeiras instruções para subires a root.


</details>


## Passo 6.3:

<details>
<summary>Answer</summary>

6.3
- Caminho da public key: ```/usr/local/bin/public.key```
- Public key:

```
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
TA/GB6eLPENYU66dgvHxglm1v/XpBQARAQABwsCDBBgBCgAPBQJpCm0tBQkDwmcA
AhsuAKgJEKAkM72SjGtnnSAEGQEKAAYFAmkKbS0ACgkQK/JwGqH6Pl4IMAQAi8Cp
JpLZxJ2ThAzhKNQ86EYx1d1aRBVZpg45NiUYFz+uVn6heKfEm5i6C5v8pr8H7fqT
zbRNt5fjyF2zdGv9Jye0vweGXLpII+eaV94JzJvqUL3+uR66q4vdMTOoS9u3GtXz
zgYcN3PLyJsxIhC35fz2USrq01oZEBYTj0GXOqP0fQP/cAPfNHf/+fAVKaCEE/02
Mpy5MQf6DYPNHCqm4VRQukAFlvC2SxLd31VzUYJP46m3ewrvFE2C7T1AZ4ZYKmeJ
iTg+rrtEle/9b+r2oCAIgIoPceWjm2nNVLLS3UZw6V9K+6WGPCk8KWclkYxMZvju
+SQE/gdOAygfSD9b6FBSNbw=
=r0p+
-----END PGP PUBLIC KEY BLOCK-----
```

- Caminho da private key: ```/boot/EFI/BOOT/priv.key```
- Private key:

```
-----BEGIN PGP PRIVATE KEY BLOCK-----
Version: Keybase OpenPGP v2.1.15
Comment: https://keybase.io/crypto

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
UFI1vA==
=0t5V
-----END PGP PRIVATE KEY BLOCK-----
```

- Mensagem:
```
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
```

Mensagem desencriptada:

```
Hello I'm gROOT! And my password is...nah! Assim tão fácil não, pega uma dica.
I'm hiding in plain sight. I'm actually dateORtime! I've been looking at you for the past hours, time to root this machine.
I'm only 4 characters long, don't bruteforce me pls, don't be mean.
```

- Navega até ao diretórios que descobriste no passo anterior e descriptografa o conteúdo através da private key.
- Vês que o conteúdo são algumas dicas, essas dicas servem para escalares finalmente para root. A password é o time que aparece como último login entras na máquina, sem os ":".
- Password: ```0359```
</details>
