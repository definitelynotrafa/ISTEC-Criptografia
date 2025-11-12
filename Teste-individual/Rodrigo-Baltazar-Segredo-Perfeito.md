# Segredo Perfeito

**Segredo Perfeito** é um princípio definido pelo pai da era da informação e da criptografia moderna, o matemático **Claude Shannon**. Neste princípio, Shannon afirma que uma mensagem cifrada só é considerada um segredo perfeito se ela não revelar nenhum tipo de informação do texto original. Isso significa que mesmo com um poder computacional infinito, é impossível decifrar a mensagem, pois a probabilidade de qualquer mensagem ser o texto original é a mesma, independente do texto cifrado.

Atualmente, nenhum protocolo de criptografia atende a este critério, pois todos os protocolos atuais dependem da suposição de que o poder computacional não tem capacidade de decifrar a mensagem criptografada a tempo de causar algum dano, por exemplo levar dezenas de anos para quebrar uma única cifra.

Mas por ser um critério extremamente rigoroso, o segredo perfeito é atualmente possível em apenas uma única cifra, a **One-Time Pad (OTP)**. Nesta cifra, é gerada uma chave completamente aleatória de mesmo tamanho que o texto original, e então uma operação simples XOR é realizada. Para garantir que todos os critérios sejam cumpridos, a chave deve permanecer em segredo absoluto e só pode ser usada uma única vez.

---

## Exemplo Prático

Para exemplificar, realizaremos uma operação simples na palavra **"sim"**.

Na tabela abaixo, utilizaremos a versão binária de cada caractere segundo o padrão ASCII, e combinaremos com uma chave, no caso **"000"**. A escolha da chave deve ser aleatória, mas neste caso foi escolhida apenas para ilustrar um resultado possível em caracteres ASCII.

| Posição | Texto Original (ASCII) | Binário do Texto | Chave (ASCII) | Binário da Chave | XOR (binário) | Resultado |
|---------|------------------------|------------------|---------------|------------------|---------------|-----------|
| 1       | S (83)                 | 01010011         | 0 (48)        | 00110000         | 01100011      | c         |
| 2       | I (73)                 | 01001001         | 0 (48)        | 00110000         | 01111001      | y         |
| 3       | M (77)                 | 01001101         | 0 (48)        | 00110000         | 01111101      | }         |

### Operação XOR Detalhada

```
Posição 1: S → c
01010011  (S)
00110000  (0)
--------  XOR
01100011  (c)

Posição 2: I → y
01001001  (I)
00110000  (0)
--------  XOR
01111001  (y)

Posição 3: M → }
01001101  (M)
00110000  (0)
--------  XOR
01111101  (})
```

---

## Análise do Resultado

Como vemos, o resultado do texto cifrado é **"cy}"** e nada nele entrega alguma pista do texto original, podendo ser qualquer coisa. Mesmo com o poder computacional bruto em que palavras inexistentes são excluídas, outras palavras como **"bom, com, não, pão, etc."** têm a mesma probabilidade de serem a palavra original, tornando assim o segredo perfeito possível.

---

## Limitações do One-Time Pad

Apesar do OTP alcançar o nível de segurança máximo, a sua utilização é **impraticável nas comunicações cotidianas**, pois:

1. **Tamanho da chave**: A chave deve ter o mesmo tamanho do texto cifrado, o que as torna muito longas.

2. **Transmissão da chave**: A chave deve ser transmitida por um canal seguro.

3. **Uso único**: A chave não deve ser utilizada mais do que uma vez.

Essas limitações impedem o seu uso cotidiano, mas a existência da OTP prova que o **segredo perfeito é alcançável**.
