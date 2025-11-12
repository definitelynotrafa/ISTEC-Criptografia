## Principio de Kerckhoffs - Rafael Baptista 2024134
---

# Índice

1. [Introdução](#introducao)
2. [1 - Matematicamente indecifrável](#1---matematicamente-indecifravel)
3. [2 - Open source de 1883](#2---open-source-de-1883)
4. [3 - Aplicacao solo](#3---aplicacao-solo)
5. [Conclusão](#conclusao)

---

## Introdução

O principio de Kerckhoffs é um dos principios fundamentais da criptografia.

Este principio tem 6 pontos principais:

- O sistema deve ser materialmente, se não matemáticamente, indecifrável.

- É necessário que o sistema em si não seja secreto, mesmo que caia nas mãos do inimigo.

- Deve ser possível comunicar e lembrar da chave sem a necessidade de notas escritas, e os interlocutores devem ser capazes de modificá-las a seu critério.

- Deve ser aplicável à correspondência telegráfica.

- O sistema deve ser portátil, e não deve exigir a participação de múltiplas pessoas na sua operação ou manuseio.

- O sistema deve ser simples e não exigir conhecimentos profundos ou concentração das pessoas que os usam, nem um conjunto complexo de regras.


---

Apesar de alguns destes pontos serem irrelevantes atualmente, três destes pontos são super importantes e que devemo-los destacar para a criptografia de hoje. Estes são o primeiro, o segundo e o quinto.

---

Vamos aprofundar cada um destes 3 pontos com a ajuda do AES.

## 1 - Matemáticamente indecifrável

Se pegarmos em algumas das criptografias standard atuais, vemos que as mesmas passam por diversas formulas de encriptação, umas com várias chaves, outras com apenas uma, mas ainda assim, estes processos não são "partíveis".

Isto é, impossível matemáticamente e computacionalmente impossiveis de reverter.

Para encriptar uma mensagem, é super simples, super rápido, apenas precisamos de uma chave.

Para desencriptar é completamente o inverso, precisamos de descobrir a chave. Uma chave com 256 bits tem 64 caracteres:

```9f2a4b7c1d8e5f0a123b6c8d4e9f01ab3c7d9e2f0a1b4c5d6e7f8091a2b3c4d5```

E para testarmos todas as chaves possíveis, se um computador testar 1M de chaves por segundo precisariamos de 37(63 zeros) anos, o que quase três vezes a idade do universo (13M de anos).

Ainda assim, se um computador testasse 1T de chaves por segundo precisariamos de 37 (63 zeros).

Havendo um homem das cavernas ciberseguro e um atacante de idade infinita, acreditamos que depois de 37 (63 zeros), ele já tenha mudado a palavra-passe ou que este segredo já seja irrelevante.

## 2 - Open source de 1883

Segundo Kerckhoffs se o sistema é seguro porque é secreto, então esse sistema é fraco. O sistema de encriptação deve ser de "código aberto".

Se procurarmos online, encontramos toda a documentação de como criptografar com o AES incluíndo todos os passos. <br> Assim como também encontramos todos os passos para descriptografar, apesar de, como dito acima, matemáticamente e computacionalmente impossível de o fazer.

Isto faz com que a segurança por obscuridade (security by obscurity) seja eliminado, já que, existem imensos casos que provam que esta não é eficiente.

Se pegarmos num exemplo real, podemos olhar para uma porta e para uma fechadura:

Podem ver desde o processo da instalação da fechadura e da porta, até à fundição do ferro ou a plantação da árvore da madeira da porta e mesmo assim, a segurança da casa não deve ser comprometida.

## 3 - Aplicação solo

Até agora, todos os exemplos dados foram feitos a solo e sem dependência do segredo. <br> Eu posso gerar a minha própria chave para desencriptar um segredo que vou precisar apenas daqui a um tempo, ou até gerar uma chave para desencriptar a minha password do banco, isto tudo completamente sozinho e esta chave sem ser baseada no meu segredo.

E este é um dos pontos que Kerckhoffs considera importante, podermos criar e esconder segredos sozinhos, porque, lá está, são segredos!


---

## Pontos importantes

- A segurança deve ser feita por design e não por obscuridade.

- A transparência dos protocolos criptográficos aumenta a confiança nestes sistemas.

- Atualmente, **NÃO** seguir o terceiro ponto do principio de Kerckhoffs.

- O tamanho da chave deve ser adaptado contra a capacidade computacional atual.

---

## Conclusão

Para concluir, podemos ver que ainda hoje estes princípios são utilizados, e apesar de alguns serem "outdated", estes ainda sustentam a criptografia moderna e a boa prática da aplicação e criação da mesma.
