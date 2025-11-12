# Algoritmo RSA — Cifra Assimétrica

**Autor:** Samuel Rocha | **Nº** 2024127

---

## 1. Introdução e Conceito

O algoritmo RSA (Rivest–Shamir–Adleman) é um dos métodos mais importantes de criptografia assimétrica. Ele baseia-se em propriedades matemáticas dos números primos e da aritmética modular para garantir segurança. Com o RSA, cada utilizador possui uma chave pública e uma chave privada. A encriptação usa a chave pública, enquanto a desencriptação requer a chave privada.

## 2. Etapas Matemáticas

- Escolher dois números primos grandes **p** e **q**.
- Calcular **n = p × q**.
- Calcular **φ(n) = (p−1)(q−1)**.
- Escolher um número **e** tal que **1 < e < φ(n)** e **gcd(e, φ(n)) = 1**.
- Calcular **d**, o inverso modular de **e** módulo **φ(n)**.
- A chave pública é **(n, e)** e a chave privada é **d**.

A segurança do RSA depende da dificuldade de fatorizar números grandes. Mesmo conhecendo **n** e **e**, calcular **d** é praticamente impossível sem saber **p** e **q**.

## 3. Fórmulas Fundamentais

- **Encriptação:** c ≡ m^e (mod n)
- **Desencriptação:** m ≡ c^d (mod n)

## 4. Exemplo Completo com Cálculos

Escolhemos os primos pequenos **p = 61** e **q = 53**.

- **n = p × q = 61 × 53 = 3233**
- **φ(n) = (p−1)(q−1) = 60 × 52 = 3120**
- Escolhe-se **e = 17** (coprimo de 3120)
- Calcula-se **d**, o inverso modular de 17 mod 3120 → **d = 2753**
- **Chave pública:** (n, e) = (3233, 17)
- **Chave privada:** d = 2753

## 5. Encriptação e Desencriptação

**Mensagem:** m = 65 ('A' em ASCII)

**Encriptação:**
```
c = m^e mod n = 65^17 mod 3233 = 2790
```

**Desencriptação:**
```
m = c^d mod n = 2790^2753 mod 3233 = 65
```

## 6. Cálculo do Inverso Modular (Algoritmo de Euclides Estendido)

```
3120 = 17×183 + 9
17 = 9×1 + 8
9 = 8×1 + 1
8 = 1×8 + 0
```

**Retrocedendo:**
```
1 = 9 − 8×1
  = 9 − (17 − 9×1)×1
  = 9×2 − 17
```

Substituindo **9 = 3120 − 17×183**:
```
1 = (3120 − 17×183)×2 − 17
  = 3120×2 − 17×367
⇒ d ≡ −367 ≡ 2753 (mod 3120)
```

## 7. Conclusão

O RSA é um exemplo perfeito da aplicação prática da teoria dos números. Usa exponenciação modular, inverso multiplicativo e propriedades dos números primos para criar um sistema seguro. O estilo 'clássico futurista' deste documento representa a união entre a matemática antiga e a tecnologia moderna.
