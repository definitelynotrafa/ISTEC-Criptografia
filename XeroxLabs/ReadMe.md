# SeedLab: AntiXerox!

Este laboratório explica, passo a passo, como usar o CyberChef para descriptografar dados e como combinar ferramentas Linux (e *hash-identifier*) para analisar e identificar tipos de hash. O formato é um walkthrough prático onde tens acesso a uma máquina online: recebes artefatos, executas comandos no Linux e usas CyberChef para extrair informações.

O objetivo final é sempre escalar para root. 

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
<details>
<summary>Riddle</summary>
Transformo bytes em letras que se entendem,
  
Uso 64 símbolos e às vezes deixo um = no final.

Ainda tens dúvidas de quem eu sou?
</details>

- Recon time! Identifica os ficheiros da pasta em que te encontras no momento, cuidado com os ficheiros ocultos!
  
> Encontraste alguma coisa? Se sim, sabes o que fazer. Descriptografa o conteúdo do que encontraste e passa para o próximo passo!


<details>
<summary>Hint</summary>
Have you ever used hashcat?
</details>

<details>
<summary>Answer</summary>
  
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
From the lowest base to the highest!
</details>

<details>
<summary>Answer</summary>
Muda a extensão da imagem para pdf e verifica o conteúdo, depois desencripta com uma receita no cyberchef do base mais baixo para o mais alto.
</details>
