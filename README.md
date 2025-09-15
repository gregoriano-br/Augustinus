# Augustinus

**Augustinus** é uma ferramenta poderosa para gerar notação de canto gregoriano no formato `.gabc`. Ele recebe texto e um modelo como entrada e produz um arquivo GABC contendo a partitura gregoriana completa.

Este projeto é um monorepo que contém a lógica principal, uma interface de linha de comando (CLI), um frontend baseado na web e uma API REST.

## Funcionalidades

*   **Geração de GABC:** Converte texto em notação GABC com base em modelos predefinidos ou personalizados.
*   **Separação de Sílabas:** Posiciona corretamente as notas nas sílabas usando a biblioteca `separador-silabas`.
*   **Múltiplas Interfaces:** Use-o através da web, CLI ou API.
*   **Modelos Personalizáveis:** Defina seus próprios modelos musicais em formato JSON.
*   **API Dockerizada:** Implante facilmente a API usando o Docker.

## Pacotes

Este monorepo está organizado nos seguintes pacotes:

### `@augustinus/core`

O coração do projeto, este pacote contém a lógica principal para gerar GABC. É responsável por analisar o texto, aplicar modelos e produzir a saída final do GABC.

### `@augustinus/cli`

Uma interface de linha de comando para usar a funcionalidade de geração de GABC. É perfeito para processamento em lote ou integração com scripts.

### `@augustinus/frontend`

Uma interface web amigável para o Augustinus. Permite que você insira texto, selecione um modelo e veja o GABC gerado e sua renderização SVG em tempo real.

### `@augustinus/api`

Uma API RESTful construída com Express que expõe a funcionalidade de geração de GABC por HTTP.

## Começando

Para começar a usar o Augustinus, você precisará ter o [Bun](https://bun.sh/) instalado.

1.  **Clone o repositório:**

    ```bash
    git clone https://github.com/gigiodelchiaro/Augustinus.git
    cd Augustinus
    ```

2.  **Instale as dependências:**

    ```bash
    bun install
    ```

## Uso

### Frontend

Para iniciar o servidor de desenvolvimento do frontend:

```bash
bun run start:frontend
```

Isso abrirá a interface da web em seu navegador, onde você pode começar a gerar GABC.

### CLI

A CLI fornece uma maneira poderosa de usar o Augustinus a partir do seu terminal.

**Uso Básico:**

```bash
bun run start:cli -- -t "Seu texto aqui" -m "Oração tom solene"
```

**Opções:**

*   `-t, --text`: Texto de entrada para converter em GABC.
*   `-i, --input`: Caminho do arquivo de entrada.
*   `-o, --output`: Caminho do arquivo de saída.
*   `-m, --model`: Nome do modelo a ser usado.
*   `--addOptionalStart`: Adicionar início opcional.
*   `--addOptionalEnd`: Adicionar final opcional.
*   `--removeNumbers`: Remover números da entrada.
*   `--removeParenthesis`: Remover parênteses e seu conteúdo da entrada.
*   `--separator`: Separador entre frases.
*   `--removeSeparator`: Se for falso, o caractere separador será usado para unir as linhas GABC.

### API

A API permite que você integre o Augustinus com seus próprios aplicativos.

**Inicie o servidor da API:**

```bash
bun run start:api
```

O servidor será iniciado em `http://localhost:3000`.

**Gerar GABC via API:**

```bash
curl -X POST -H "Content-Type: application/json" -d '{
  "text": "Seu texto aqui",
  "modelName": "Oração tom solene"
}' http://localhost:3000/generate
```

## Docker

O pacote da API inclui um `Dockerfile` para fácil conteinerização.

**Construa a imagem do Docker:**

Na raiz do projeto, execute:

```bash
docker build -f packages/api/Dockerfile . -t augustinus-api
```

**Execute o container do Docker:**

```bash
docker run -p 3000:3000 augustinus-api
```

A API estará acessível em `http://localhost:3000`.

## Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para enviar um pull request ou abrir uma issue.

## Agradecimentos

*   **[Danillo Del Chiaro](https://www.instagram.com/danillodelchiaro)**: por patrocinar o projeto.
*   **[Prof. Dr. Clayton Dias](https://claytondias.com)**: pela revisão e direcionamento intelectual do projeto.

Um agradecimento especial à **[Neumz](https://neumz.com/)** e às pessoas que tornaram o **Scribio** (nosso renderizador de SVG) possível:

*   **[Andrew Hinkley](https://github.com/ahinkley)**, **Dominique Crochu** e **John Anderson** do time Neumz.

*   **[Joshua Guenther](https://github.com/joshuaguenther)**: desenvolvedor do Scrib.io.
*   **Matthias Bry**: por escrever a especificação e depurar o Scrib.io.

E, claro, a todos os contribuidores do projeto **[Gregorio](http.gregorio-project.github.io/)**.

## Licença

Este projeto está licenciado sob a Licença MIT. Veja o arquivo [LICENSE](LICENSE) para detalhes.
