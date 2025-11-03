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
Após descobrires as credenciais para desbloquear a pasta pessoal do Rodrigo encontraste...
</details>
