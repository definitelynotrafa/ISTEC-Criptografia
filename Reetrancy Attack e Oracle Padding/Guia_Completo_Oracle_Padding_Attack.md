# Laboratório de Ataque Padding Oracle

**Data de Execução:** 2 de novembro de 2025

Este laboratório foi baseado no Padding Oracle Attack Lab dos SEED Labs, com o intuito de proporcionar uma melhor compreensão de um ataque interessante em sistemas criptográficos.

# Introdução

Neste laboratório, exploramos um ataque denominado *padding oracle attack*. Foi originalmente publicado em 2002 por Serge Vaudenay e afetou muitos sistemas conhecidos, incluindo Ruby on Rails, ASP.NET e OpenSSL.

# Tarefas

## Tarefa 1

Na primeira tarefa, o objetivo é familiarizar-nos com o padding em cifras de bloco que utilizam PKCS#5. Neste caso, o modo Cipher Block Chaining (CBC).

Primeiro, criamos três ficheiros contendo 5 bytes, 10 bytes e 16 bytes, respetivamente. Podemos fazer isto com o seguinte comando:

```
seed@VM:~/seed-labs/category-crypto/Crypto_Padding_Oracle/Labsetup/task1$ echo -n "12345" > f1.txt
seed@VM:~/seed-labs/category-crypto/Crypto_Padding_Oracle/Labsetup/task1$ echo -n "1234512345" > f2.txt
seed@VM:~/seed-labs/category-crypto/Crypto_Padding_Oracle/Labsetup/task1$ echo -n "1234512345123456" > f3.txt
```

Depois, usando o modo CBC, primeiro ciframos o ficheiro de 5 bytes e depois verificamos o tamanho do ficheiro cifrado, que é de 16 bytes, o que significa que 11 bytes foram adicionados no processo de cifragem. Note-se que, como utilizamos AES CBC com chaves de 128 bits, o tamanho do bloco é sempre 16 bytes. É por isso que o tamanho dos ficheiros após o padding é um múltiplo de 16.

```
seed@VM:~/seed-labs/category-crypto/Crypto_Padding_Oracle/Labsetup/task1$ openssl enc -aes-128-cbc -e -p -in f1.txt -out f1_enc.txt \
-K 00112233445566778889aabbccddeeff
-iv 0102030405060708
hex string is too short, padding with zero bytes to length
salt=4A923758317F0000
key=00112233445566778889AABBCCDDEEFF
iv =01020304050607080000000000000000

seed@VM:~/seed-labs/category-crypto/Crypto_Padding_Oracle/Labsetup/task1$ ll
total 16
-rw-r--r-- 1 seed seed 16 Apr  8 13:32 f1_enc.txt
-rw-r--r-- 1 seed seed  5 Apr  8 13:30 f1.txt
-rw-r--r-- 1 seed seed 10 Apr  8 13:30 f2.txt
-rw-r--r-- 1 seed seed 16 Apr  8 13:31 f3.txt
```

Depois, ao decifrar o ficheiro com a opção `-nopad`, que faz com que a decifragem não remova os dados de padding, podemos observar que o ficheiro decifrado tem, de facto, novamente 16 bytes.

```
seed@VM:~/seed-labs/category-crypto/Crypto_Padding_Oracle/Labsetup/task1$ openssl enc -aes-128-cbc -d -nopad -p -in f1_enc.txt -out f1_dec.txt \
-K 00112233445566778889aabbccddeeff
hex string is too short, padding with zero bytes to length
salt=4A52B536EE7F0000
key=00112233445566778889AABBCCDDEEFF
iv =01020304050607080000000000000000

seed@VM:~/seed-labs/category-crypto/Crypto_Padding_Oracle/Labsetup/task1$ ll
total 20
-rw-r--r-- 1 seed seed 16 Apr  8 13:39 f1_dec.txt
-rw-r--r-- 1 seed seed 16 Apr  8 13:32 f1_enc.txt
-rw-r--r-- 1 seed seed  5 Apr  8 13:30 f1.txt
-rw-r--r-- 1 seed seed 10 Apr  8 13:30 f2.txt
-rw-r--r-- 1 seed seed 16 Apr  8 13:31 f3.txt
```

Finalmente, ao inspecionar o conteúdo do ficheiro decifrado, vemos que 11 bytes `0x0b` (que representa 11) são adicionados como padding.

```
seed@VM:~/seed-labs/category-crypto/Crypto_Padding_Oracle/Labsetup/task1$ hexdump -C f1_dec.txt
00000000  31 32 33 34 35 0b 0b 0b  0b 0b 0b 0b 0b 0b 0b 0b  |12345...........|
00000010
```

Portanto, podemos concluir que o modo CBC utiliza padding.

No caso do ficheiro de 10 bytes, também existe padding de 6 bytes `0x06` (que representa 6). Basicamente, no PKCS#5, se o tamanho do bloco for B e o último bloco tiver K bytes, então `B - K` bytes com o valor `B - K` serão adicionados como padding. Finalmente, no caso do ficheiro de 16 bytes, que já é um múltiplo do tamanho do bloco, obtemos um texto cifrado de 32 bytes, ou seja, um bloco completo é adicionado como padding. Quando deciframos o texto cifrado usando a opção `-nopad`, podemos ver que o bloco adicionado continha 16 bytes de `0x10` (que representa 16). Se não usarmos a opção `-nopad`, o programa de decifragem reconhece que estes 16 bytes são dados de padding. Portanto, no PKCS#5, se o comprimento da entrada já for um múltiplo exato do tamanho do bloco B, então B bytes com o valor B serão adicionados como padding.

Note-se que com o modo CBC, precisamos fornecer ao modo de cifragem o Vetor de Inicialização (IV) para garantir que mesmo que dois textos simples sejam idênticos, os seus textos cifrados continuem diferentes, assumindo que IVs diferentes serão usados. Como mencionado, o CBC é um método de cifra de bloco, o que significa que um bloco sempre tem de ser cifrado. E quando a mensagem a cifrar é menor que o tamanho do bloco, é adicionado padding para preenchê-la até atingir o tamanho do bloco.

## Tarefa 2

Nesta tarefa, é-nos fornecido um oráculo de padding que tem uma mensagem secreta dentro e imprime o texto cifrado desta mensagem secreta. O oráculo decifrará o texto cifrado usando a sua própria chave secreta `K` e o `IV` fornecido por nós. Não nos diz o texto simples, mas diz-nos se o padding é válido ou não. A nossa tarefa é usar a informação fornecida pelo oráculo para descobrir o conteúdo real da mensagem secreta. Para isso, usamos uma abordagem chamada *Padding Oracle Attack* que nos permite obter o texto simples do último bloco.

É mais fácil explicar com uma imagem:

![](images/img1.png)

A imagem anterior mostra uma iteração na decifragem de um bloco de texto cifrado no modo CBC. Também vemos que `C15 = E7 ⊕ I15`. As caixas "encrypted" são blocos de texto cifrado. O "intermediate" é a saída da decifragem da cifra de bloco usando o último bloco de texto cifrado como entrada. Finalmente, a operação XOR entre o bloco de texto cifrado anterior e o último bloco de texto cifrado dá-nos o último bloco de texto simples.

Para a primeira fase do nosso ataque, vamos assumir que `C15` tem o valor `0x01`. Se modificarmos `E7` e continuarmos a alterar o seu valor de modo a que `E7 ⊕ I15 = 0x01`, continuaremos a obter padding inválido. No entanto, como estamos a trabalhar byte a byte, precisamos apenas de um máximo de 256 tentativas para obter o valor correto para `E7` de modo a que o oráculo de padding nos dê uma saída válida dizendo que o padding está correto. Seja este valor `E'7`. E como sabemos que obtemos padding válido, sabemos que `E'7 ⊕ I15 = 0x01`. Então, `0x01 = I15 ⊕ E'7`. E isto dá-nos: `I15 = 0x01 ⊕ E'7`. Até agora, descobrimos o primeiro byte da caixa "intermediate", que é o nosso `D2` no exemplo dos SEED Labs. Também sabemos o primeiro byte do texto simples (`C15`), que é dado por `C15 = E7 ⊕ I15`. Agora o processo repete-se para padding de `0x02`, `0x03` e assim por diante.

Para o exemplo de `0x02`, ao forçar brutalmente `C14`, primeiro precisamos calcular outro `E7` (vamos chamá-lo `E''7`) que nos dá `C15 = 0x02`. De acordo com a especificação PKCS#5, precisamos fazer isso porque queremos que o padding seja agora `\x02\x02`. Então, substituindo `C15` por `0x02`, sabemos que `E''7 = 0x02 ⊕ I15`. Depois passamos à força bruta de `E6` para encontrar o valor que nos dá padding válido, `E'6`. Podemos reutilizar a fórmula `I14 = 0x02 ⊕ E'6` e `C14 = E6 ⊕ I14`. Usando este método, podemos continuar até que todo o texto cifrado seja decifrado.

Como solicitado, fazer isto manualmente para os primeiros 6 bytes é dado pelo seguinte (para um bloco de 16 bytes):

- **Texto Cifrado**
  - `C1 = a9b2554b0944118061212098f2f238cd`
  - `C2 = 779ea0aae3d9d020f3677bfcb3cda9ce`
  - `CC1 = 00000000000000000000000000000000`
- **1º byte**
  - `E'16 = 0xcf`
  - `I16 = 0x01 ⊕ E'16 = 0xce` 
  - `P16 = C16 ⊕ I16 = 0x03` (Note que `C16` pertence a `C1` e não a `C2`)
  - `CC1 = 000000000000000000000000000000cf`
- **2º byte**
  - `E'15 = 0x39`
  - `I15 = 0x02 ⊕ E'15 = 0x3b` 
  - `P15 = C15 ⊕ I15 = 0x03` (Note que `C16` pertence a `C1` e não a `C2`)
  - `CC1 = 000000000000000000000000000039cc`
- **3º byte**
  - `E'14 = 0xf2`
  - `I14 = 0x03 ⊕ E'14 = 0xf1` 
  - `P14 = C14 ⊕ I14 = 0x03` (Note que `C16` pertence a `C1` e não a `C2`)
  - `CC1 = 00000000000000000000000000f238cd`
- **4º byte**
  - `E'13 = 0x18`
  - `I13 = 0x04 ⊕ E'13 = 0x1c` 
  - `P13 = C13 ⊕ I13 = 0xee` (Note que `C16` pertence a `C1` e não a `C2`)
  - `CC1 = 00000000000000000000000018f53fca`
- **5º byte**
  - `E'12 = 0x40`
  - `I12 = 0x05 ⊕ E'12 = 0x45` 
  - `P12 = C12 ⊕ I12 = 0xdd` (Note que `C16` pertence a `C1` e não a `C2`)
  - `CC1 = 00000000000000000000004019f43ecb`
- **6º byte**
  - `E'11 = 0xea`
  - `I11 = 0x06 ⊕ E'11 = 0xec` 
  - `P11 = C11 ⊕ I11 = 0xcc` (Note que `C16` pertence a `C1` e não a `C2`)
  - `CC1 = 00000000000000000000ea431af73dc8`

Em cada byte do texto simples (`P11-P16`) estamos a começar a obter a mensagem secreta: `0xccddee030303`. Note que os últimos 3 bytes representam padding.

Para fazer isto de forma automatizada, podemos usar o seguinte script Python:

```python
#!/usr/bin/python3
import socket
from binascii import hexlify, unhexlify

# XOR two bytearrays
def xor(first, second):
   return bytearray(x^y for x,y in zip(first, second))

class PaddingOracle:

    def __init__(self, host, port) -> None:
        self.s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.s.connect((host, port))

        ciphertext = self.s.recv(4096).decode().strip()
        self.ctext = unhexlify(ciphertext)

    def decrypt(self, ctext: bytes) -> None:
        self._send(hexlify(ctext))
        return self._recv()

    def _recv(self):
        resp = self.s.recv(4096).decode().strip()
        return resp 

    def _send(self, hexstr: bytes):
        self.s.send(hexstr + b'\n')

    def __del__(self):
        self.s.close()

def decryptBlock(K, current_padding, CC1, D2, C2):
    if K > 16:
        return CC1, D2

    for i in range(256):
        CC1[16 - K] = i
        status = oracle.decrypt(IV + CC1 + C2)
        CC1_cp = CC1.copy()
        D2_cp = D2.copy()

        if status == "Valid":
            auxI = hex(i)[2:].zfill(2)
            D2[16 - K] = int(xor(bytearray.fromhex(current_padding), bytearray.fromhex(auxI)).hex(), base=16)
            current_padding = hex(int(current_padding, base=16) + 1)[2:].zfill(2)
            for x in range(1, K + 1):
                auxD2 = hex(D2[16 - x])[2:].zfill(2)
                CC1[16 - x] = int(xor(bytearray.fromhex(current_padding), bytearray.fromhex(auxD2)).hex(), base=16)

            print("Valid: i = 0x{:02x}".format(i))
            print("CC1: " + CC1.hex())

            CC1, D2 = decryptBlock(K + 1, current_padding, CC1, D2, C2)
            if CC1 != [] and D2 != []:
                return CC1, D2

        CC1 = CC1_cp
        D2 = D2_cp

    return [], []

if __name__ == "__main__":
    oracle = PaddingOracle('10.9.0.80', 5000)

    # Get the IV + Ciphertext from the oracle
    iv_and_ctext = bytearray(oracle.ctext)
    IV    = iv_and_ctext[00:16]
    C1    = iv_and_ctext[16:32]  # 1st block of ciphertext
    C2    = iv_and_ctext[32:48]  # 2nd block of ciphertext
    print("C1:  " + C1.hex())
    print("C2:  " + C2.hex())

    ###############################################################
    # Here, we initialize D2 with C1, so when they are XOR-ed,
    # The result is 0. This is not required for the attack.
    # Its sole purpose is to make the printout look neat.
    # In the experiment, we will iteratively replace these values.
    D2 = bytearray(16)

    D2[0]  = C1[0]
    D2[1]  = C1[1]
    D2[2]  = C1[2]
    D2[3]  = C1[3]
    D2[4]  = C1[4]
    D2[5]  = C1[5]
    D2[6]  = C1[6]
    D2[7]  = C1[7]
    D2[8]  = C1[8]
    D2[9]  = C1[9]
    D2[10] = C1[10]
    D2[11] = C1[11]
    D2[12] = C1[12]
    D2[13] = C1[13]
    D2[14] = C1[14]
    D2[15] = C1[15]

    ###############################################################
    # In the experiment, we need to iteratively modify CC1
    # We will send this CC1 to the oracle, and see its response.
    CC1 = bytearray(16)

    CC1[0]  = 0x00
    CC1[1]  = 0x00
    CC1[2]  = 0x00
    CC1[3]  = 0x00
    CC1[4]  = 0x00
    CC1[5]  = 0x00
    CC1[6]  = 0x00
    CC1[7]  = 0x00
    CC1[8]  = 0x00
    CC1[9]  = 0x00
    CC1[10] = 0x00
    CC1[11] = 0x00
    CC1[12] = 0x00
    CC1[13] = 0x00
    CC1[14] = 0x00
    CC1[15] = 0x00

    ###############################################################
    # In each iteration, we focus on one byte of CC1.  
    # We will try all 256 possible values, and send the constructed
    # ciphertext CC1 + C2 (plus the IV) to the oracle, and see 
    # which value makes the padding valid. 
    # As long as our construction is correct, there will be 
    # one valid value. This value helps us get one byte of D2. 
    # Repeating the method for 16 times, we get all the 16 bytes of D2.

    current_padding = "01"
    CC1, D2 = decryptBlock(1, current_padding, CC1, D2, C2)

    ###############################################################

    # Once you get all the 16 bytes of D2, you can easily get P2
    P2 = xor(C1, D2)
    print("P2:  " + P2.hex())
```

Ao executá-lo, mostra-nos as várias iterações do ataque:

```
seed@VM:~/seed-labs/category-crypto/Crypto_Padding_Oracle/Labsetup$ python3 manual_attack.py
C1:  a9b2554b0944118061212098f2f238cd
C2:  779ea0aae3d9d020f3677bfcb3cda9ce
Valid: i = 0xcf
CC1: 000000000000000000000000000000cc
Valid: i = 0x39
CC1: 000000000000000000000000000038cd
Valid: i = 0xf2
CC1: 00000000000000000000000000f53fca
Valid: i = 0x18
CC1: 00000000000000000000000019f43ecb
Valid: i = 0x40
CC1: 0000000000000000000000431af73dc8
Valid: i = 0xea
CC1: 00000000000000000000eb421bf63cc9
Valid: i = 0x9d
CC1: 00000000000000000092e44d14f933c6
Valid: i = 0xc3
CC1: 0000000000000000c293e54c15f832c7
Valid: i = 0x01
CC1: 0000000000000002c190e64f16fb31c4
Valid: i = 0x6c
CC1: 0000000000006d03c091e74e17fa30c5
Valid: i = 0x29
CC1: 00000000002e6a04c796e04910fd37c2
Valid: i = 0x50
CC1: 00000000512f6b05c697e14811fc36c3
Valid: i = 0x02
CC1: 00000001522c6806c594e24b12ff35c0
Valid: i = 0x68
CC1: 00006900532d6907c495e34a13fe34c1
Valid: i = 0x9f
CC1: 0080761f4c327618db8afc550ce12bde
Valid: i = 0xa8
CC1: a981771e4d337719da8bfd540de02adf
P2:  1122334455667788aabbccddee030303
```

Finalmente obtemos o último bloco de texto simples na última linha (`P2:  1122334455667788aabbccddee030303`).

Este script segue a mesma lógica explicada anteriormente. Há um caso especial a que ainda temos de prestar atenção. Existem casos em que mais de um padding é aceite pelo oráculo, por exemplo:

- Um bloco como `0xAAAAAAAAAAAAAAAAAA07070707070707` onde o último byte é `0x07`.
- Um bloco como `0xAAAAAAAAAAAAAAAAAA07070707070701` onde o último byte é `0x01`.

Para ultrapassar isto, criamos a função `decryptBlock` que decifra cada bloco recursivamente iterando um máximo de 256 vezes por byte. Se acontecer encontrar o byte correto para a operação, avança para o próximo byte. Mas se um caso especial como o mencionado acontecer, pode retroceder para escolher o byte correto para cada iteração.

## Tarefa 3

Na última tarefa, é-nos pedido para decifrar o bloco de forma automatizada. É um pouco como o que fizemos na tarefa anterior. Mas, em vez disso, desta vez conectamo-nos à porta 6000 do oráculo, que produz um total de 64 bytes. Ou seja, 16 bytes para o IV e 3 blocos de 16 bytes cada de texto cifrado. Além disso, desta vez queremos decifrar não apenas o último bloco, mas todos os blocos.

Foi utilizado o seguinte script Python:

```python
#!/usr/bin/python3
import socket
from binascii import hexlify, unhexlify

from numpy import block
from tables import Complex128Col

# XOR two bytearrays
def xor(first, second):
   return bytearray(x^y for x,y in zip(first, second))

class PaddingOracle:

    def __init__(self, host, port) -> None:
        self.s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.s.connect((host, port))

        ciphertext = self.s.recv(4096).decode().strip()
        self.ctext = unhexlify(ciphertext)

    def decrypt(self, ctext: bytes) -> None:
        self._send(hexlify(ctext))
        return self._recv()

    def _recv(self):
        resp = self.s.recv(4096).decode().strip()
        return resp 

    def _send(self, hexstr: bytes):
        self.s.send(hexstr + b'\n')

    def __del__(self):
        self.s.close()

def decryptBlock(K, current_padding, CC1, D2, C2):
    if K > 16:
        return CC1, D2

    for i in range(256):
        CC1[16 - K] = i
        status = oracle.decrypt(IV + CC1 + C2)
        CC1_cp = CC1.copy()
        D2_cp = D2.copy()

        if status == "Valid":
            auxI = hex(i)[2:].zfill(2)
            D2[16 - K] = int(xor(bytearray.fromhex(current_padding), bytearray.fromhex(auxI)).hex(), base=16)
            current_padding = hex(int(current_padding, base=16) + 1)[2:].zfill(2)
            for x in range(1, K + 1):
                auxD2 = hex(D2[16 - x])[2:].zfill(2)
                CC1[16 - x] = int(xor(bytearray.fromhex(current_padding), bytearray.fromhex(auxD2)).hex(), base=16)

            print("Valid: i = 0x{:02x}".format(i))
            print("CC1: " + CC1.hex())

            CC1, D2 = decryptBlock(K + 1, current_padding, CC1, D2, C2)
            if CC1 != [] and D2 != []:
                return CC1, D2

        CC1 = CC1_cp
        D2 = D2_cp

    return [], []

if __name__ == "__main__":
    oracle = PaddingOracle('10.9.0.80', 6000)
    BLOCK_SIZE = 16

    # Get the IV + Ciphertext from the oracle
    iv_and_ctext = bytearray(oracle.ctext)
    num_blocks = int((len(iv_and_ctext) - BLOCK_SIZE) / BLOCK_SIZE)
    block_1_ciphertxt_idx = (num_blocks - 1) * BLOCK_SIZE
    block_2_ciphertxt_idx = num_blocks * BLOCK_SIZE
    IV    = iv_and_ctext[00:BLOCK_SIZE]

    decipheredText = ""
    current_block = num_blocks
    for i in range(num_blocks - 1):
        C1    = iv_and_ctext[block_1_ciphertxt_idx:(block_1_ciphertxt_idx + BLOCK_SIZE)]  # 1st block of ciphertext
        C2    = iv_and_ctext[block_2_ciphertxt_idx:(block_2_ciphertxt_idx + BLOCK_SIZE)]  # 2nd block of ciphertext
        print("C1:  " + C1.hex())
        print("C2:  " + C2.hex())

        D2 = bytearray(16)

        D2[0]  = C1[0]
        D2[1]  = C1[1]
        D2[2]  = C1[2]
        D2[3]  = C1[3]
        D2[4]  = C1[4]
        D2[5]  = C1[5]
        D2[6]  = C1[6]
        D2[7]  = C1[7]
        D2[8]  = C1[8]
        D2[9]  = C1[9]
        D2[10] = C1[10]
        D2[11] = C1[11]
        D2[12] = C1[12]
        D2[13] = C1[13]
        D2[14] = C1[14]
        D2[15] = C1[15]

        CC1 = bytearray(16)

        CC1[0]  = 0x00
        CC1[1]  = 0x00
        CC1[2]  = 0x00
        CC1[3]  = 0x00
        CC1[4]  = 0x00
        CC1[5]  = 0x00
        CC1[6]  = 0x00
        CC1[7]  = 0x00
        CC1[8]  = 0x00
        CC1[9]  = 0x00
        CC1[10] = 0x00
        CC1[11] = 0x00
        CC1[12] = 0x00
        CC1[13] = 0x00
        CC1[14] = 0x00
        CC1[15] = 0x00

        current_padding = "01"
        CC1, D2 = decryptBlock(1, current_padding, CC1, D2, C2)

        P = xor(C1, D2)
        print("\n\n###############################################################")
        print("Current Block: %d" % current_block)
        print("P:  " + P.hex())
        decipheredText = P.hex() + decipheredText
        print("###############################################################\n\n")

        block_1_ciphertxt_idx -= BLOCK_SIZE
        block_2_ciphertxt_idx -= BLOCK_SIZE
        current_block -= 1
    
    # First block (Special Case)
    current_padding = "01"
    CC1, D2 = decryptBlock(1, current_padding, CC1, D2, iv_and_ctext[16:32])
    P = xor(D2, IV)
    print("\n\n###############################################################")
    print("Current Block: %d" % current_block)
    print("P:  " + P.hex())
    decipheredText = P.hex() + decipheredText
    print("###############################################################\n\n")

    print("Plaintext (HEX): " + decipheredText)
    print("Plaintext (ASCII): " + bytes.fromhex(decipheredText).decode("unicode_escape"))
```

Usando a mesma abordagem da tarefa anterior, usamos a função `decryptBlock` para decifrar cada bloco e usamos uma abordagem do penúltimo byte, o que significa que para cada iteração do processo de decifragem, o último bloco será um bloco do texto cifrado. A exceção é o primeiro bloco. Aqui, como conhecemos o `IV`, precisamos apenas descobrir a saída da cifra de bloco e fazer XOR com o `IV` para obter o primeiro bloco do texto simples. Ao executar o script, obtemos o seguinte output:

```
seed@VM:~/seed-labs/category-crypto/Crypto_Padding_Oracle/Labsetup$ python3 allblocks_attack.py
C1:  d6fd1ea0b3a77814c65a28bac175a57a
C2:  f01ebd43c751d4ec0d4a95e3d46f7b13
Valid: i = 0x79
CC1: 0000000000000000000000000000007a
Valid: i = 0xa5
CC1: 0000000000000000000000000000a47b
Valid: i = 0x5f
CC1: 0000000000000000000000000058a37c
Valid: i = 0x9b
CC1: 0000000000000000000000009a59a27d
Valid: i = 0xe0
CC1: 0000000000000000000000e3995aa17e
Valid: i = 0x70
CC1: 0000000000000000000071e2985ba07f
Valid: i = 0x75
CC1: 0000000000000000007a7eed9754af70
Valid: i = 0xe7
CC1: 0000000000000000e67b7fec9655ae71
Valid: i = 0x43
CC1: 0000000000000040e5787cef9556ad72
Valid: i = 0x2d
CC1: 0000000000002c41e4797dee9457ac73
Valid: i = 0xf2
CC1: 0000000000f52b46e37e7ae99350ab74
Valid: i = 0x97
CC1: 0000000096f42a47e27f7be89251aa75
Valid: i = 0x8d
CC1: 0000008e95f72944e17c78eb9152a976
Valid: i = 0x31
CC1: 0000308f94f62845e07d79ea9053a877
Valid: i = 0x86
CC1: 00992f908be9375aff6266f58f4cb768
Valid: i = 0xa7
CC1: a6982e918ae8365bfe6367f48e4db669


###############################################################
Current Block: 3
P:  61742120285e5f5e29285e5f5e290202
###############################################################


C1:  fb4ae090144112e5a455805639701e9a
C2:  d6fd1ea0b3a77814c65a28bac175a57a
Valid: i = 0xfe
CC1: 000000000000000000000000000000fd
Valid: i = 0x6e
CC1: 00000000000000000000000000006ffc
Valid: i = 0x14
CC1: 000000000000000000000000001368fb
Valid: i = 0x1d
CC1: 0000000000000000000000001c1269fa
Valid: i = 0x36
CC1: 0000000000000000000000351f116af9
Valid: i = 0xf4
CC1: 00000000000000000000f5341e106bf8
Valid: i = 0x33
CC1: 0000000000000000003cfa3b111f64f7
Valid: i = 0x8c
CC1: 00000000000000008d3dfb3a101e65f6
Valid: i = 0x9f
CC1: 000000000000009c8e3ef839131d66f5
Valid: i = 0x7a
CC1: 0000000000007b9d8f3ff938121c67f4
Valid: i = 0x2b
CC1: 00000000002c7c9a8838fe3f151b60f3
Valid: i = 0x54
CC1: 00000000552d7d9b8939ff3e141a61f2
Valid: i = 0xbd
CC1: 000000be562e7e988a3afc3d171962f1
Valid: i = 0xaa
CC1: 0000abbf572f7f998b3bfd3c161863f0
Valid: i = 0x00
CC1: 001fb4a0483060869424e22309077cef
Valid: i = 0xae
CC1: af1eb5a1493161879525e32208067dee


###############################################################
Current Block: 2
P:  454544204c6162732061726520677265
###############################################################


Valid: i = 0xb4
CC1: af1eb5a1493161879525e32208067db7
Valid: i = 0xbe
CC1: af1eb5a1493161879525e3220806bfb6
Valid: i = 0xb1
CC1: af1eb5a1493161879525e32208b6b8b1
Valid: i = 0xa6
CC1: af1eb5a1493161879525e322a7b7b9b0
Valid: i = 0x08
CC1: af1eb5a1493161879525e30ba4b4bab3
Valid: i = 0x4f
CC1: af1eb5a14931618795254e0aa5b5bbb2
Valid: i = 0x26
CC1: af1eb5a14931618795294105aabab4bd
Valid: i = 0x52
CC1: af1eb5a14931618753284004abbbb5bc
Valid: i = 0x7c
CC1: af1eb5a14931617f502b4307a8b8b6bf
Valid: i = 0xda
CC1: af1eb5a14931db7e512a4206a9b9b7be
Valid: i = 0x97
CC1: af1eb5a14990dc79562d4501aebeb0b9
Valid: i = 0xef
CC1: af1eb5a1ee91dd78572c4400afbfb1b8
Valid: i = 0x86
CC1: af1eb585ed92de7b542f4703acbcb2bb
Valid: i = 0x68
CC1: af1e6984ec93df7a552e4602adbdb3ba
Valid: i = 0x22
CC1: af3d769bf38cc0654a31591db2a2aca5
Valid: i = 0xc1
CC1: c03c779af28dc1644b30581cb3a3ada4


###############################################################
Current Block: 1
P:  285e5f5e29285e5f5e29205468652053
###############################################################


Plaintext (HEX): 285e5f5e29285e5f5e29205468652053454544204c616273206172652067726561742120285e5f5e29285e5f5e290202
Plaintext (ASCII): (^_^)(^_^) The SEED Labs are great! (^_^)(^_^)
```

Como se pode ver, a mensagem final é `(^_^)(^_^) The SEED Labs are great! (^_^)(^_^)`.
