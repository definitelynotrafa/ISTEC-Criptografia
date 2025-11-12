# Minha Explicação sobre:

## O Protocolo AES
### Advanced Encryption Standard

**Autor:** Davide Ferreira

---

## O que é:

O AES é um padrão global para criptografia simétrica, adotado pelo governo dos Estados Unidos para utilizar mundialmente para proteger os dados sensíveis. É um algoritmo de criptografia que divide texto em blocos de tamanho fixo para utilizar em chaves simétricas. Os blocos normalmente são de 128 bits que podem ser suportados com chaves de 10, 12 ou 14 rondas repetitivas.

## Como funciona:

Funciona baseada em uma arquitetura conhecida como Rede de Substituição-Permutação que os blocos de 128 bits são organizados em uma matriz de 4 x 4 bits.

## O que é Rede Substituição-Permutação:

É um conceito usado em várias áreas como: Educação ou tecnologia para descrever um processo que um sistema existente para substituir uma rede ou um sistema.

## Um Exemplo:

O processo do AES é composto por 4 rondas. A mensagem utilizada é **"This is a test!"**.

### Mensagem Original em Hexadecimal:
```
54 68 69 73 20 69 73 20 61 20 74 65 73 74 21 00
```

### AES-128 - Chave Inicial:
```
2B 7E 15 16 28 AE D2 A6 AB F7 15 88 09 CF 4F 3C
```

---

## Ronda 1 - SubBytes

Nesta etapa, cada byte da matriz de estado é substituído por outro byte usando uma tabela de substituição (S-Box).

**Matriz de Estado (4x4) antes do SubBytes:**
```
54 68 69 73
20 69 73 20
61 20 74 65
73 74 21 00
```

**Após aplicar SubBytes:**
```
7C FD E8 9E
B7 E8 9E B7
8D B7 52 6B
9E 52 70 27
```

---

## Ronda 2 - ShiftRows

As linhas da matriz são rotacionadas ciclicamente:

**Antes do ShiftRows:**
```
7C FD E8 9E
B7 E8 9E B7
8D B7 52 6B
9E 52 70 27
```

**Depois do ShiftRows:**
```
Linha 0: 7C FD E8 9E  (sem alteração)
Linha 1: E8 9E B7 B7  (rotação de 1 posição à esquerda)
Linha 2: 52 6B 8D B7  (rotação de 2 posições à esquerda)
Linha 3: 27 9E 52 70  (rotação de 3 posições à esquerda)
```

**Regras de rotação:**
- **Linha 0** - Os números ficam iguais.
- **Linha 1** - Roda 1 posição para a esquerda.
- **Linha 2** - Roda 2 posições.
  - Exemplo: o 6B passa para a posição do 7E
- **Linha 3** - E na última linha roda 3 posições da esquerda.
  - Exemplo: 70 passa para a posição do 27

---

## Ronda 3 - MixColumns

Cada coluna da matriz é multiplicada por uma matriz fixa de transformação usando multiplicação em GF(2⁸).

**Matriz de Estado antes:**
```
7C E8 52 27
FD 9E 6B 9E
E8 B7 8D 52
9E B7 B7 70
```

**Após MixColumns:**
```
04 66 81 E5
E0 CB 19 9A
48 F8 D3 7A
28 06 26 4C
```

**Nota:** A operação MixColumns usa multiplicação binária no campo de Galois GF(2⁸).

---

## Ronda 4 (Última) - AddRoundKey

Nesta ronda final, a chave da ronda é combinada com o estado usando a operação XOR (ou exclusivo).

**Estado antes do AddRoundKey:**
```
04 66 81 E5
E0 CB 19 9A
48 F8 D3 7A
28 06 26 4C
```

**Chave da Ronda:**
```
A0 FA FE 17
88 54 2C B1
23 A3 39 39
2A 6C 76 05
```

**Operação XOR bit a bit entre Estado e Chave**

---

## Resultado Final

Após as 4 rondas completas, obtém-se o texto cifrado final:

```
29 C3 50 5F 57 14 20 F6 40 22 99 B3 1A 02 D7 3A
```

Este resultado representa a mensagem original **"This is a test!"** completamente encriptada usando AES-128.

---

# Minha Explicação sobre:

## O Protocolo AES
### Advanced Encryption Standard

---

## O que é:

O AES é um padrão global para criptografia simétrica, adotado pelo governo dos Estados Unidos para utilizar mundialmente para proteger os dados sensíveis. É um algoritmo de criptografia que divide texto em blocos de tamanho fixo para utilizar em chaves simétricas. Os blocos normalmente são de 128 bits que podem ser suportados com chaves de 10, 12 ou 14 rondas repetitivas.

## Como funciona:

Funciona baseada em uma arquitetura conhecida como Rede de Substituição-Permutação que os blocos de 128 bits são organizados em uma matriz de 4 x 4 bits.

## O que é Rede Substituição-Permutação:

É um conceito usado em várias áreas como: Educação ou tecnologia para descrever um processo que um sistema existente para substituir uma rede ou um sistema.

## Um Exemplo:

O processo do AES é composto por 4 rondas. A mensagem utilizada é **"This is a test!"**.

### Mensagem Original em Hexadecimal:
```
54 68 69 73 20 69 73 20 61 20 74 65 73 74 21 00
```

### AES-128 - Chave Inicial:
```
2B 7E 15 16 28 AE D2 A6 AB F7 15 88 09 CF 4F 3C
```

---

## Ronda 1 - SubBytes

Nesta etapa, cada byte da matriz de estado é substituído por outro byte usando uma tabela de substituição (S-Box).

**Matriz de Estado (4x4) antes do SubBytes:**
```
54 68 69 73
20 69 73 20
61 20 74 65
73 74 21 00
```

**Após aplicar SubBytes:**
```
7C FD E8 9E
B7 E8 9E B7
8D B7 52 6B
9E 52 70 27
```

---

## Ronda 2 - ShiftRows

As linhas da matriz são rotacionadas ciclicamente:

**Antes do ShiftRows:**
```
7C FD E8 9E
B7 E8 9E B7
8D B7 52 6B
9E 52 70 27
```

**Depois do ShiftRows:**
```
Linha 0: 7C FD E8 9E  (sem alteração)
Linha 1: E8 9E B7 B7  (rotação de 1 posição à esquerda)
Linha 2: 52 6B 8D B7  (rotação de 2 posições à esquerda)
Linha 3: 27 9E 52 70  (rotação de 3 posições à esquerda)
```

**Regras de rotação:**
- **Linha 0** - Os números ficam iguais.
- **Linha 1** - Roda 1 posição para a esquerda.
- **Linha 2** - Roda 2 posições.
  - Exemplo: o 6B passa para a posição do 7E
- **Linha 3** - E na última linha roda 3 posições da esquerda.
  - Exemplo: 70 passa para a posição do 27

---

## Ronda 3 - MixColumns

Cada coluna da matriz é multiplicada por uma matriz fixa de transformação usando multiplicação em GF(2⁸).

**Matriz de Estado antes:**
```
7C E8 52 27
FD 9E 6B 9E
E8 B7 8D 52
9E B7 B7 70
```

**Após MixColumns:**
```
04 66 81 E5
E0 CB 19 9A
48 F8 D3 7A
28 06 26 4C
```

**Nota:** A operação MixColumns usa multiplicação binária no campo de Galois GF(2⁸).

---

## Ronda 4 (Última) - AddRoundKey

Nesta ronda final, a chave da ronda é combinada com o estado usando a operação XOR (ou exclusivo).

**Estado antes do AddRoundKey:**
```
04 66 81 E5
E0 CB 19 9A
48 F8 D3 7A
28 06 26 4C
```

**Chave da Ronda:**
```
A0 FA FE 17
88 54 2C B1
23 A3 39 39
2A 6C 76 05
```

**Operação XOR bit a bit entre Estado e Chave**

---

## Resultado Final

Após as 4 rondas completas, obtém-se o texto cifrado final:

```
29 C3 50 5F 57 14 20 F6 40 22 99 B3 1A 02 D7 3A
```

Este resultado representa a mensagem original **"This is a test!"** completamente encriptada usando AES-128.

---
