# Segredo Perfeito

Segredo Perfeito é um princípio definido pelo pai da era da informação e da criptografia moderna o matemático, Claude Shannon. Neste principio, Shannon afirma que uma mensagem cifrada só é considerada um segredo perfeito se ela não revelar nenhum tipo de informação do texto original. Isso significa que mesmo com um poder computacional infinito, é impossível decifrar a mensagem, pois a probabilidade de qualquer mensagem ser o texto original é a mesma, independente do texto cifrado.

Atualmente, nenhum protocolo de criptografia atende a este critério, pois todos os protocolos atuais dependem da suposição de que o poder computacional não tem capacidade de decifrar a mensagem criptografa a tempo de causar algum dano, por exemplo levar dezenas de anos para quebrar uma única cifra.

Mas por sem um critério extremamente rigoroso, o segredo perfeito é atualmente possível em apenas uma única cifra, a One-Timed Pad (OTP). Nesta cifra, é gerada uma chave completamente aleatória de mesmo tamanho que o texto original, e então uma operação simples XOR é realizada. Para garantir que todos os critérios sejam cumpridos, a chave deve permanecer em segredo absoluto e só pode ser usada uma única vez.

Para exemplificar realizaremos uma operação simples na palavra "sim".

Na tabela abaixo, utilizarei a versão binária de cada caractere segundo o padrão ASCII, e combinaremos com uma chave, no caso 000. A escolha da chave deve ser aleatória, mas neste caso foi escolhida apenas para ilustrar um resultado possível em caracteres ASCII.

| posição | texto original (ASCII) | binário do texto | chave (ASCII) | binário da chave | XOR (binário) | resultado |
|---------|------------------------|------------------|---------------|------------------|---------------|-----------|
| 1       | S (83)                 | 01010011         | 0 (48)        | 00110000         | 01100011      | c         |
| 2       | I (73)                 | 01001001         | 0 (48)        | 00110000         | 01111001      | y         |
| 3       | M (77)                 | 01001101         | 0 (48)        | 00110000         | 01111101      | }         |

Como vemos, o resultado do texto cifrado é cy} e nada nele entrega alguma pista do texto original, podendo ser qualquer coisa. Mesmo com o poder computacional bruto em que palavras inexistentes são excluídas, outras palavras como um "bom, com, não, pão e etc." tem a mesma probabilidade de serem a palavra original, tornando assim o segredo perfeito possível.

Apesar do OTP alcançar o nível de segurança máximo, a sua utilização é impraticável nas comunicações cotidianas, pois a chave deve ter o mesmo tamanho do texto cifrado, o que os torna muito longas. Outro problema está na transmissão da chave, que deve ser transmitida por um canal seguro, e não deve ser utilizada mais do que uma vez. Essas limitações impedem o seu uso cotidiano, mas a existência da OTP prova que o segredo perfeito é alcançável.
