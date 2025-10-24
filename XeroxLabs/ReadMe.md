# SeedLab: CyberChef!

**Resumo:** Este laboratório explica, passo a passo, como usar o CyberChef para decodificar/transformar dados (hex, base64, XOR, etc.), e como combinar ferramentas Linux (e *hash-identifier*) para analisar e identificar tipos de hash. O formato é um walkthrough: recebes artefatos, executas comandos no Linux e usas CyberChef para extrair informações.

---

## Objetivos

1. Aprender os princípios básicos do CyberChef (receitas, encadeamento de operações, pré-visualização).
2. Identificar formatos com ferramentas Linux (`file`, `xxd`, `hexdump`, `strings`) e confirmar com CyberChef.
3. Usar `hash-identifier` para identificar tipos de hash e explorar opções de cracking/validação básicas.
4. Integrar comandos Linux com CyberChef para construir um processo de análise forense com criptografia simples.

---

## Pré-requisitos

* Máquina Linux (ou WSL). Distribuições baseadas em Debian/Ubuntu são recomendadas se o utilizador não usar Linux regularmente.
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

## Artefatos fornecidos (simulados neste walkthrough)

Vais receber três ficheiros:

* `message.bin` — ficheiro com dados binários que contêm uma mensagem codificada.
* `hash.txt` — um ficheiro com um hash.
* `note.enc` — um ficheiro com conteúdo aparentemente codificado através de XOR/hex.

> Nos passos abaixo eu indico comandos que executas localmente; forneço também as respostas/explicações para cada etapa para que o lab seja um walkthrough completo. Ao longo do texto existem pequenas questões para te orientar — tenta responder antes de olhar para a solução sugerida.

---

## Passo 1 — Inspeção inicial com ferramentas Linux

1. Verificar o tipo de ficheiro:

```bash
file message.bin
file note.enc
file hash.txt
```

**Pergunta 1:** O que te diz a saída do `file`? É texto, binário, imagem, ou algo genérico ("data")? Anota a resposta.

2. Mostrar os primeiros bytes (magic numbers):

```bash
xxd -l 64 message.bin | head -n 5
hexdump -C -n 64 message.bin | sed -n '1,5p'
```

**Pergunta 2:** Observas alguma assinatura (por exemplo `89 50 4E 47` → PNG, `25 50 44 46` → PDF)? Se sim, qual?

3. Procurar strings legíveis:

```bash
strings message.bin | head -n 50
strings note.enc | head -n 50
```

**Pergunta 3:** Vês algo que pareça Base64, hex ou texto claro? Qual é o padrão (ex.: muitas letras maiúsculas/minúsculas + `=` → base64)?

---

### Solução comentário (ver depois de responderes)

* Se `file` devolver `ASCII text` ou `UTF-8 text`, o ficheiro pode já ser texto legível.
* Se `strings` mostrar algo com `A–Z a–z 0–9 + / =` e um `=` no fim, é quase certamente Base64 (ex.: `VGhpcyBpcyBhIHRlc3Q=`).
* Se `strings` mostrar uma longa sequência de caracteres hex (0–9, a–f), então é provável que o conteúdo esteja em hex.

---

## Passo 2 — Identificação do que é (usar pistas)

Se `strings` mostrou algo como `VGhpcyBpcyBhIHRlc3Q=`:

* Isto parece Base64. Confirma com:

```bash
echo VGhpcyBpcyBhIHRlc3Q= | base64 --decode
```

**Pergunta 4:** Qual o output deste comando? O que isso te diz sobre o conteúdo do ficheiro?

---

## Passo 3 — Usando CyberChef: conceitos rápidos

* **Recipe (receita):** sequência de operações aplicadas ao input.
* **Input:** texto/bytes originais.
* **Output:** resultado da receita.
* **Operações úteis:** "From Base64", "From Hex", "XOR", "Find / Extract Strings", "Magic", "From URL Encoding", "Entropy".

Abre CyberChef e cola o conteúdo de `message.bin` no Input.

**Exemplo de receita:**

* Input: `VGhpcyBpcyBhIHRlc3Q=`
* Operação: **From Base64** → Output: `This is a test`

**Pergunta 5:** Consegues pensar noutro Encadeamento (recipe) que pode ser útil se o resultado ainda não for legível? (ex.: e se o output for hex, o que fazes a seguir?)

---

## Passo 4 — Lab prático 1: `message.bin`

1. `file message.bin`
2. `xxd -p message.bin | tr -d '\n' | sed 's/\([0-9a-f]\{2\}\)/\1 /g' | head -n 2`
3. `strings message.bin | grep -E '^[0-9a-fA-F]{16,}$' > maybe_hex.txt`

**Pergunta 6:** O ficheiro mostrou sequências hex grandes? Se sim, porque pode isso ter acontecido (ex.: ficheiro convertido para hex antes de ser enviado)?

No CyberChef:

* Cola `maybe_hex.txt` no painel Input.
* Operação: **From Hex** (All bytes).
* Se o resultado for legível — ótimo. Se o output parecer Base64, adiciona **From Base64** e depois **To UTF8**.

**Pergunta 7:** Se obtiveres uma string com o formato `FLAG{...}` ou `SEED-CHEF-2025`, como irias documentar esse achado? Que comandos usarias para provar que a tua transformação estava correcta (desde o ficheiro original até à flag)?

**Solução sugerida (exemplo):** `Flag: SEED-CHEF-2025`.

---

## Passo 5 — Lab prático 2: `note.enc` (XOR simples)

No Linux tentaes um bruteforce 1-byte XOR para verificar chaves curtas:

```bash
for k in {0..255}; do 
  xxd -p note.enc | tr -d '\n' | xxd -r -p | perl -0777 -pe "s/(.)/chr(ord(\$1)^$k)/ge" | head -n 1 | grep -E "[A-Za-z]{4}" && echo "key=$k" && break
done
```

**Pergunta 8:** Antes de executar o script, que output esperas ver se a chave estiver correcta? Como validarás que o que viste é realmente inglês legível e não ruído?

No CyberChef:

* Operação **XOR** → chave: `0xNN` (testar até legível)
* Se a chave for uma palavra repetida (ex.: `ICE`), usa a opção de chave repetida.

**Exemplo de resultado:** `Meet at 22:00, bring key.`

---

## Passo 6 — Lab prático 3: `hash.txt` + `hash-identifier`

1. `cat hash.txt`
2. `hash-identifier -m "5f4dcc3b5aa765d61d8327deb882cf99"`
3. Validar:

```bash
echo -n 'password' | md5sum
```

**Pergunta 9:** Se o `hash-identifier` der vários candidatos (por exemplo MD5, LM, NTLM), como decidir qual é o formato correcto? Que passos de validação irias usar?

**Resposta curta:** Gerar o hash do candidato e comparar com o ficheiro. Por exemplo, se suspeitares de MD5, geras `md5sum` do texto candidato e comparas.

**Opcional (educacional):** tenta cracking com `john --wordlist=/usr/share/wordlists/rockyou.txt --format=raw-md5 hash.txt` ou `hashcat -m 0`.

---

## Passo 7 — Exemplos de receitas CyberChef úteis

1. Hex dentro de Base64: **From Base64 → From Hex → To UTF8**
2. XOR de N-bytes: **From Hex → XOR → To UTF8**
3. From Hex + Magic (para reconhecer ficheiros embebidos)
4. Entropy (detectar ficheiros encriptados/compactados)
5. Find / Extract Strings (regex para flags)

**Pergunta 10:** Consegues escrever uma recipe que faça From Hex -> XOR com a chave "ICE" -> Extrair um regex `FLAG\{.*?\}`? Experimenta no CyberChef.

---

## Solução completa (exemplo)

* `message.bin` → Flag: `SEED-CHEF-2025`
* `note.enc` → `Meet at 22:00, bring key.`
* `hash.txt` → MD5 de `password`

---

## Tarefas adicionais / desafios extra

1. Combina `note.enc` e `message.bin`: por exemplo, o `message.bin` pode conter a chave para o XOR usado no `note.enc` — como procurarias por isso?
2. `hash.txt` contém um SHA1 — identifica e tenta um ataque de dicionário.
3. Cria uma recipe no CyberChef que automatize: **From Hex → XOR with key 'ICE' → Find flag regex**.

**Pergunta 11:** Qual desafio te parece mais interessante para expandir este lab? Porquê?

---

## Resumo e melhores práticas

* Sempre começa com `file`, `xxd`/`hexdump` e `strings`.
* Usa CyberChef para prototipar rapidamente encadeamentos de transformação.
* `hash-identifier` sugere formatos; valida sempre gerando o hash candidato e comparando.
* Documenta cada passo: comandos usados, hipóteses e resultados.

---

### CHECK /opt/secure/.credentials
